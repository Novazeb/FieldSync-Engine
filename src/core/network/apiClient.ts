import axios, { type AxiosError, type InternalAxiosRequestConfig, type AxiosResponse } from 'axios';
import * as SecureStore from 'expo-secure-store';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://api.fieldsync.example.com';
const isMockMode = !process.env.EXPO_PUBLIC_API_URL || API_BASE_URL.includes('example.com');

const mockAdapter = async (config: InternalAxiosRequestConfig): Promise<AxiosResponse> => {
  await new Promise((resolve) => setTimeout(resolve, 300));

  let dataObj: Record<string, unknown> = {};
  if (typeof config.data === 'string') {
    try {
      dataObj = JSON.parse(config.data);
    } catch {
      dataObj = {};
    }
  } else if (config.data && typeof config.data === 'object') {
    dataObj = config.data as Record<string, unknown>;
  }

  if (typeof dataObj.sku === 'string' && dataObj.sku.toUpperCase().includes('CONFLICT')) {
    const conflictError = new axios.AxiosError(
      'Conflict: Version mismatch',
      'ERR_BAD_REQUEST',
      config,
      null,
      {
        status: 409,
        statusText: 'Conflict',
        headers: {},
        config,
        data: {
          success: false,
          error: 'CONFLICT_DETECTED',
          serverVersion: 2,
          serverData: { quantity: (Number(dataObj.quantity) || 0) + 10, version: 2 },
        },
      } as AxiosResponse
    );
    return Promise.reject(conflictError);
  }

  return {
    data: {
      success: true,
      data: {
        status: 'SYNCED',
        clientTxId: dataObj.clientTxId,
        serverTimestamp: Date.now(),
      },
    },
    status: 201,
    statusText: 'Created',
    headers: { 'x-cache-lookup': 'HIT-IDEMPOTENT' },
    config,
  };
};

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
  adapter: isMockMode ? mockAdapter : undefined,
});

let isRefreshing = false;
let pendingQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

const drainQueue = (error: unknown, token: string | null) => {
  pendingQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else if (token) resolve(token);
  });
  pendingQueue = [];
};

apiClient.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const token = await SecureStore.getItemAsync('auth_access_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config;
    if (!originalRequest || error.response?.status !== 401) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise<string>((resolve, reject) => {
        pendingQueue.push({ resolve, reject });
      }).then((token) => {
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${token}`;
        }
        return apiClient(originalRequest);
      });
    }

    isRefreshing = true;
    try {
      const refreshToken = await SecureStore.getItemAsync('auth_refresh_token');
      const deviceId = await SecureStore.getItemAsync('device_id');
      const { data } = await axios.post(`${API_BASE_URL}/api/v1/auth/refresh`, {
        refreshToken,
        deviceId,
      });
      const newAccessToken: string = data.data.accessToken;
      const newRefreshToken: string = data.data.refreshToken;
      await SecureStore.setItemAsync('auth_access_token', newAccessToken);
      await SecureStore.setItemAsync('auth_refresh_token', newRefreshToken);
      drainQueue(null, newAccessToken);
      if (originalRequest.headers) {
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
      }
      return apiClient(originalRequest);
    } catch (refreshError) {
      drainQueue(refreshError, null);
      await SecureStore.deleteItemAsync('auth_access_token');
      await SecureStore.deleteItemAsync('auth_refresh_token');
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);
