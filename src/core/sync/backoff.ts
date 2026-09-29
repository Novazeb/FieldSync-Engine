const BASE_DELAY_MS = 1000;
const MAX_DELAY_MS = 60000;

export const calculateBackoffDelay = (retryCount: number): number => {
  const exponentialDelay = Math.min(MAX_DELAY_MS, BASE_DELAY_MS * Math.pow(2, retryCount));
  const jitter = Math.random() * exponentialDelay;
  return Math.floor(jitter);
};

export const getNextRetryTimestamp = (retryCount: number): number => {
  return Date.now() + calculateBackoffDelay(retryCount);
};

export { BASE_DELAY_MS, MAX_DELAY_MS };
