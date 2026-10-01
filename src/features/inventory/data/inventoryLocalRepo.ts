import { type SQLiteDatabase } from 'expo-sqlite';
import * as Crypto from 'expo-crypto';
import { type CreateTransactionDTO, type InventoryTransaction } from '../../../core/sync/types';

export const insertTransactionAtomic = async (
  db: SQLiteDatabase,
  dto: CreateTransactionDTO
): Promise<{ txId: string; idempotencyKey: string }> => {
  const txId = Crypto.randomUUID();
  const idempotencyKey = Crypto.randomUUID();
  const now = Date.now();

  await db.withExclusiveTransactionAsync(async (txn) => {
    await txn.runAsync(
      `INSERT INTO inventory_transactions
       (id, sku, item_name, type, quantity, notes, version, sync_status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, 1, 'PENDING', ?, ?);`,
      [txId, dto.sku, dto.itemName, dto.type, dto.quantity, dto.notes ?? null, now, now]
    );

    await txn.runAsync(
      `INSERT INTO sync_queue
       (task_id, idempotency_key, entity_type, entity_id, operation, endpoint, http_method, payload, status, created_at, updated_at)
       VALUES (?, ?, 'INVENTORY_TX', ?, 'CREATE', '/api/v1/inventory/transactions', 'POST', ?, 'PENDING', ?, ?);`,
      [
        Crypto.randomUUID(),
        idempotencyKey,
        txId,
        JSON.stringify({
          clientTxId: txId,
          sku: dto.sku,
          type: dto.type,
          quantity: dto.quantity,
          notes: dto.notes ?? null,
          clientVersion: 1,
          clientTimestamp: now,
        }),
        now,
        now,
      ]
    );
  });

  return { txId, idempotencyKey };
};

export const getAllTransactions = async (
  db: SQLiteDatabase
): Promise<InventoryTransaction[]> => {
  return db.getAllAsync<InventoryTransaction>(
    `SELECT * FROM inventory_transactions ORDER BY created_at DESC;`
  );
};

export const getTransactionById = async (
  db: SQLiteDatabase,
  id: string
): Promise<InventoryTransaction | null> => {
  const row = await db.getFirstAsync<InventoryTransaction>(
    `SELECT * FROM inventory_transactions WHERE id = ?;`,
    [id]
  );
  return row ?? null;
};

export const resolveConflictKeepLocal = async (
  db: SQLiteDatabase,
  txId: string
): Promise<void> => {
  const now = Date.now();
  const tx = await getTransactionById(db, txId);
  if (!tx) return;

  await db.withExclusiveTransactionAsync(async (txn) => {
    await txn.runAsync(
      `UPDATE inventory_transactions SET sync_status = 'PENDING', version = version + 1, updated_at = ? WHERE id = ?;`,
      [now, txId]
    );
    const newIdempotencyKey = Crypto.randomUUID();
    await txn.runAsync(
      `UPDATE sync_queue SET status = 'PENDING', retry_count = 0, next_retry_at = 0, idempotency_key = ?, updated_at = ? WHERE entity_id = ? AND status = 'CONFLICT';`,
      [newIdempotencyKey, now, txId]
    );
  });
};

export const resolveConflictAcceptServer = async (
  db: SQLiteDatabase,
  txId: string,
  serverData: { quantity: number; version: number }
): Promise<void> => {
  const now = Date.now();
  await db.withExclusiveTransactionAsync(async (txn) => {
    await txn.runAsync(
      `UPDATE inventory_transactions SET quantity = ?, version = ?, sync_status = 'SYNCED', updated_at = ? WHERE id = ?;`,
      [serverData.quantity, serverData.version, now, txId]
    );
    await txn.runAsync(
      `DELETE FROM sync_queue WHERE entity_id = ? AND status = 'CONFLICT';`,
      [txId]
    );
  });
};

export interface SkuStockSummary {
  sku: string;
  itemName: string;
  currentStock: number;
  totalInbound: number;
  totalOutbound: number;
}

export const getSkuStockSummary = async (
  db: SQLiteDatabase
): Promise<SkuStockSummary[]> => {
  return db.getAllAsync<SkuStockSummary>(
    `SELECT 
       sku,
       item_name as itemName,
       SUM(CASE WHEN type = 'INBOUND' THEN quantity ELSE -quantity END) as currentStock,
       SUM(CASE WHEN type = 'INBOUND' THEN quantity ELSE 0 END) as totalInbound,
       SUM(CASE WHEN type = 'OUTBOUND' THEN quantity ELSE 0 END) as totalOutbound
     FROM inventory_transactions
     GROUP BY sku
     ORDER BY sku ASC;`
  );
};

export const getStockBySku = async (
  db: SQLiteDatabase,
  sku: string
): Promise<number> => {
  const row = await db.getFirstAsync<{ currentStock: number | null }>(
    `SELECT 
       SUM(CASE WHEN type = 'INBOUND' THEN quantity ELSE -quantity END) as currentStock
     FROM inventory_transactions
     WHERE sku = ?;`,
    [sku]
  );
  return row?.currentStock ?? 0;
};
