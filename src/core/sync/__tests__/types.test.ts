import { type SyncTaskStatus, type SyncStatus, type TransactionType } from '../types';

describe('Type definitions', () => {
  it('should accept valid SyncTaskStatus values', () => {
    const statuses: SyncTaskStatus[] = ['PENDING', 'PROCESSING', 'FAILED', 'CONFLICT'];
    expect(statuses).toHaveLength(4);
  });

  it('should accept valid SyncStatus values', () => {
    const statuses: SyncStatus[] = ['PENDING', 'SYNCED', 'CONFLICT', 'FAILED'];
    expect(statuses).toHaveLength(4);
  });

  it('should accept valid TransactionType values', () => {
    const types: TransactionType[] = ['INBOUND', 'OUTBOUND'];
    expect(types).toHaveLength(2);
  });
});
