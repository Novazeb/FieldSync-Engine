export type SyncTaskStatus = 'PENDING' | 'PROCESSING' | 'FAILED' | 'CONFLICT';
export type SyncStatus = 'PENDING' | 'SYNCED' | 'CONFLICT' | 'FAILED';
export type TransactionType = 'INBOUND' | 'OUTBOUND';
export type SyncOperation = 'CREATE' | 'UPDATE' | 'DELETE';
export type HttpMethod = 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface SyncTask {
  task_id: string;
  idempotency_key: string;
  entity_type: string;
  entity_id: string;
  operation: SyncOperation;
  endpoint: string;
  http_method: HttpMethod;
  payload: string;
  status: SyncTaskStatus;
  retry_count: number;
  max_retries: number;
  next_retry_at: number;
  last_error: string | null;
  created_at: number;
  updated_at: number;
}

export interface InventoryTransaction {
  id: string;
  sku: string;
  item_name: string;
  type: TransactionType;
  quantity: number;
  notes: string | null;
  version: number;
  sync_status: SyncStatus;
  created_at: number;
  updated_at: number;
}

export interface CreateTransactionDTO {
  sku: string;
  itemName: string;
  type: TransactionType;
  quantity: number;
  notes?: string;
}

export interface SyncMetadata {
  id: string;
  device_id: string;
  last_synced_at: number;
  schema_version: number;
  created_at: number;
  updated_at: number;
}
