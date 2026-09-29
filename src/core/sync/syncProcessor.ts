import { type SQLiteDatabase } from 'expo-sqlite';
import { apiClient } from '../network/apiClient';
import { checkConnectivity } from '../network/networkMonitor';
import { calculateBackoffDelay } from './backoff';
import { type SyncTask } from './types';
import { type AxiosError } from 'axios';

const BATCH_SIZE = 10;

const fetchPendingTasks = async (db: SQLiteDatabase): Promise<SyncTask[]> => {
  const now = Date.now();
  const rows = await db.getAllAsync<SyncTask>(
    `SELECT * FROM sync_queue
     WHERE status IN ('PENDING', 'FAILED')
     AND next_retry_at <= ?
     ORDER BY created_at ASC
     LIMIT ?;`,
    [now, BATCH_SIZE]
  );
  return rows;
};

const markTaskProcessing = async (db: SQLiteDatabase, taskId: string): Promise<void> => {
  await db.runAsync(
    `UPDATE sync_queue SET status = 'PROCESSING', updated_at = ? WHERE task_id = ?;`,
    [Date.now(), taskId]
  );
};

const markTaskSynced = async (db: SQLiteDatabase, task: SyncTask): Promise<void> => {
  const now = Date.now();
  await db.withExclusiveTransactionAsync(async (txn) => {
    await txn.runAsync(`DELETE FROM sync_queue WHERE task_id = ?;`, [task.task_id]);
    await txn.runAsync(
      `UPDATE inventory_transactions SET sync_status = 'SYNCED', updated_at = ? WHERE id = ?;`,
      [now, task.entity_id]
    );
  });
};

const markTaskConflict = async (
  db: SQLiteDatabase,
  task: SyncTask,
  errorMsg: string
): Promise<void> => {
  const now = Date.now();
  await db.withExclusiveTransactionAsync(async (txn) => {
    await txn.runAsync(
      `UPDATE sync_queue SET status = 'CONFLICT', last_error = ?, updated_at = ? WHERE task_id = ?;`,
      [errorMsg, now, task.task_id]
    );
    await txn.runAsync(
      `UPDATE inventory_transactions SET sync_status = 'CONFLICT', updated_at = ? WHERE id = ?;`,
      [now, task.entity_id]
    );
  });
};

const markTaskFailed = async (
  db: SQLiteDatabase,
  task: SyncTask,
  errorMsg: string
): Promise<void> => {
  const now = Date.now();
  const newRetryCount = task.retry_count + 1;

  if (newRetryCount >= task.max_retries) {
    await db.withExclusiveTransactionAsync(async (txn) => {
      await txn.runAsync(
        `UPDATE sync_queue SET status = 'FAILED', retry_count = ?, last_error = ?, updated_at = ? WHERE task_id = ?;`,
        [newRetryCount, errorMsg, now, task.task_id]
      );
      await txn.runAsync(
        `UPDATE inventory_transactions SET sync_status = 'FAILED', updated_at = ? WHERE id = ?;`,
        [now, task.entity_id]
      );
    });
    return;
  }

  const nextRetry = now + calculateBackoffDelay(newRetryCount);
  await db.runAsync(
    `UPDATE sync_queue SET status = 'FAILED', retry_count = ?, next_retry_at = ?, last_error = ?, updated_at = ? WHERE task_id = ?;`,
    [newRetryCount, nextRetry, errorMsg, now, task.task_id]
  );
};

const processTask = async (db: SQLiteDatabase, task: SyncTask): Promise<void> => {
  await markTaskProcessing(db, task.task_id);

  try {
    const method = task.http_method.toLowerCase() as 'post' | 'put' | 'patch' | 'delete';
    await apiClient.request({
      method,
      url: task.endpoint,
      data: JSON.parse(task.payload),
      headers: { 'Idempotency-Key': task.idempotency_key },
    });
    await markTaskSynced(db, task);
  } catch (err) {
    const axiosErr = err as AxiosError;
    const status = axiosErr.response?.status;
    const errorMsg = axiosErr.message || 'Unknown error';

    if (status === 409) {
      await markTaskConflict(db, task, errorMsg);
    } else if (status === 400 || status === 422) {
      // Permanent failure, no retry
      await db.runAsync(
        `UPDATE sync_queue SET status = 'FAILED', last_error = ?, updated_at = ? WHERE task_id = ?;`,
        [errorMsg, Date.now(), task.task_id]
      );
    } else if (status === 401) {
      // Token refresh handled by interceptor; re-queue for immediate retry
      await db.runAsync(
        `UPDATE sync_queue SET status = 'PENDING', updated_at = ? WHERE task_id = ?;`,
        [Date.now(), task.task_id]
      );
    } else if (status === 429) {
      const retryAfter = Number(axiosErr.response?.headers?.['retry-after'] || 30) * 1000;
      await db.runAsync(
        `UPDATE sync_queue SET status = 'FAILED', next_retry_at = ?, updated_at = ? WHERE task_id = ?;`,
        [Date.now() + retryAfter, Date.now(), task.task_id]
      );
    } else {
      await markTaskFailed(db, task, errorMsg);
    }
  }
};

export const processSyncQueue = async (db: SQLiteDatabase): Promise<number> => {
  const isOnline = await checkConnectivity();
  if (!isOnline) return 0;

  const tasks = await fetchPendingTasks(db);
  let processed = 0;

  for (const task of tasks) {
    await processTask(db, task);
    processed++;
  }

  return processed;
};

export const getSyncQueueStats = async (
  db: SQLiteDatabase
): Promise<{ pending: number; failed: number; conflict: number }> => {
  const rows = await db.getAllAsync<{ status: string; count: number }>(
    `SELECT status, COUNT(*) as count FROM sync_queue GROUP BY status;`
  );
  const stats = { pending: 0, failed: 0, conflict: 0 };
  for (const row of rows) {
    if (row.status === 'PENDING' || row.status === 'PROCESSING') stats.pending += row.count;
    else if (row.status === 'FAILED') stats.failed += row.count;
    else if (row.status === 'CONFLICT') stats.conflict += row.count;
  }
  return stats;
};
