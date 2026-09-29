import NetInfo, { type NetInfoState } from '@react-native-community/netinfo';

export type NetworkStatus = {
  isConnected: boolean;
  type: string;
};

type NetworkListener = (status: NetworkStatus) => void;

let currentStatus: NetworkStatus = { isConnected: false, type: 'unknown' };
const listeners: Set<NetworkListener> = new Set();
let unsubscribe: (() => void) | null = null;

export const startNetworkMonitor = () => {
  if (unsubscribe) return;
  unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
    const wasConnected = currentStatus.isConnected;
    currentStatus = {
      isConnected: state.isConnected ?? false,
      type: state.type,
    };
    if (!wasConnected && currentStatus.isConnected) {
      listeners.forEach((fn) => fn(currentStatus));
    }
  });
};

export const stopNetworkMonitor = () => {
  unsubscribe?.();
  unsubscribe = null;
};

export const getNetworkStatus = (): NetworkStatus => currentStatus;

export const onReconnect = (listener: NetworkListener): (() => void) => {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
};

export const checkConnectivity = async (): Promise<boolean> => {
  const state = await NetInfo.fetch();
  return state.isConnected ?? false;
};
