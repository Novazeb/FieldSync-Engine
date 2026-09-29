import { calculateBackoffDelay, BASE_DELAY_MS, MAX_DELAY_MS } from '../backoff';

describe('Exponential Backoff with Full Jitter', () => {
  it('should return delay within [0, BASE_DELAY_MS] for retry 0', () => {
    for (let i = 0; i < 100; i++) {
      const delay = calculateBackoffDelay(0);
      expect(delay).toBeGreaterThanOrEqual(0);
      expect(delay).toBeLessThanOrEqual(BASE_DELAY_MS);
    }
  });

  it('should return delay within [0, BASE_DELAY_MS * 2] for retry 1', () => {
    for (let i = 0; i < 100; i++) {
      const delay = calculateBackoffDelay(1);
      expect(delay).toBeGreaterThanOrEqual(0);
      expect(delay).toBeLessThanOrEqual(BASE_DELAY_MS * 2);
    }
  });

  it('should cap delay at MAX_DELAY_MS for high retry counts', () => {
    for (let i = 0; i < 100; i++) {
      const delay = calculateBackoffDelay(20);
      expect(delay).toBeLessThanOrEqual(MAX_DELAY_MS);
    }
  });

  it('should always return non-negative integer', () => {
    for (let retry = 0; retry < 10; retry++) {
      const delay = calculateBackoffDelay(retry);
      expect(delay).toBeGreaterThanOrEqual(0);
      expect(Number.isInteger(delay)).toBe(true);
    }
  });

  it('should produce varying delays (jitter) across calls', () => {
    const delays = Array.from({ length: 50 }, () => calculateBackoffDelay(3));
    const unique = new Set(delays);
    expect(unique.size).toBeGreaterThan(1);
  });
});
