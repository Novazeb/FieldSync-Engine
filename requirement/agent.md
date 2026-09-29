# AI Agent & Engineering Operating Manual (Agent.md)
## Project: FieldSync Engine (Offline-First Logistics Mobile App)

---

## 1. Misi & Peran Agen

File ini adalah panduan operasional wajib (*operating manual*) bagi AI Coding Agent dan pengembang yang memelihara atau menambahkan fitur pada **FieldSync Engine**.

Tujuan utama dari basis kode ini adalah: **Mendemonstrasikan rekayasa perangkat lunak mobile tingkat industri (*production-grade*) dengan arsitektur Offline-First yang kebal terhadap kegagalan jaringan, bebas duplikasi data, dan memiliki performa tinggi.**

---

## 2. Inviolable Architectural Invariants (Aturan Baku yang Tidak Boleh Dilanggar)

Setiap agen yang menulis atau memodifikasi kode di proyek ini **WAJIB** mematuhi 6 aturan absolut ini:

1. **NO DIRECT REMOTE WRITES FROM UI**:
   Komponen UI **dilarang keras** memanggil `axios` atau endpoint API backend secara langsung untuk mutasi data. Semua mutasi harus melalui Repository lokal (`localRepo`) dan disimpan ke SQLite terlebih dahulu.
2. **ATOMIC OUTBOX WRITE**:
   Penyimpanan entitas bisnis lokal dan pembuatan tiket tugas antrean (`sync_queue`) **wajib** dieksekusi di dalam blok transaksi atomik SQLite tunggal (`db.withExclusiveTransactionAsync` atau `BEGIN...COMMIT`). Tidak boleh ada situasi di mana data transaksi tersimpan namun antrean outbox gagal dibuat (atau sebaliknya).
3. **MANDATORY IDEMPOTENCY KEY**:
   Setiap tugas sinkronisasi wajib menyertakan `idempotency_key` (UUID v4 unik) yang di-generate pada saat mutasi terjadi di klien. Key ini dikirim di header HTTP `Idempotency-Key` ke backend.
4. **NO BLOCKING LOADING SPINNERS ON MUTATION**:
   Mutasi pengguna harus langsung direspon dalam waktu < 50ms (*Optimistic UI*). Dilarang menampilkan *full-screen modal loading spinner* yang memblokir layar hanya untuk menunggu respon jaringan.
5. **STRICT TYPESCRIPT (ZERO `any`)**:
   Penggunaan tipe `any` dilarang keras. Semua DTO, skema database SQLite, state Redux, dan payload mutasi harus memiliki interface/type TypeScript yang lengkap dan bertipe kuat.
6. **SQL INJECTION PREVENTION**:
   Dilarang melakukan string concatenation pada query SQL (e.g. `` `SELECT * FROM items WHERE id = '${id}'` ``). Selalu gunakan *parameterized queries* dengan placeholder `?`.

---

## 3. Tech Stack Matrix & Dependensi Resmi

| Layer / Kebutuhan | Library / Modul | Catatan Penggunaan |
| :--- | :--- | :--- |
| **Framework** | Expo SDK (Prebuild / Dev Client) | Menggunakan arsitektur modern Expo |
| **Language** | TypeScript (Strict Mode) | `noImplicitAny: true`, `strict: true` |
| **Local Database** | `expo-sqlite` (Next-Gen API) | Mode WAL (`PRAGMA journal_mode = WAL;`) |
| **Secure KeyStore** | `expo-secure-store` | Menyimpan token JWT dan kunci enkripsi |
| **UI State** | `@reduxjs/toolkit` + `react-redux` | Filter, modal, session, dan UI telemetry |
| **Reactive Query** | `@tanstack/react-query` | Abstraksi sinkronisasi cache baca dari SQLite |
| **Network Client** | `axios` | Instance terpusat dengan interceptors |
| **Network Listener** | `@react-native-community/netinfo`| Deteksi transisi online/offline secara reaktif |
| **Background Sync** | `expo-task-manager` / `react-native-background-actions` | Eksekusi Outbox Queue di background |
| **ID & Cryptography**| `expo-crypto` | Pembuatan UUID v4 untuk entity ID & idempotency key |

---

## 4. Pola Implementasi Kode Baku

### 4.1 Pola Repository & Transaksi Atomik
```typescript
// CONTOH KODE RESMI: src/features/inventory/data/inventoryLocalRepo.ts
import { SQLiteDatabase } from 'expo-sqlite';
import * as Crypto from 'expo-crypto';
import { CreateTransactionDTO } from '../types';

export const insertTransactionAtomic = async (
  db: SQLiteDatabase,
  dto: CreateTransactionDTO
): Promise<{ txId: string; idempotencyKey: string }> => {
  const txId = Crypto.randomUUID();
  const idempotencyKey = Crypto.randomUUID();
  const now = Date.now();

  await db.withExclusiveTransactionAsync(async (txn) => {
    // 1. Simpan entitas transaksi lokal
    await txn.runAsync(
      `INSERT INTO inventory_transactions 
       (id, sku, item_name, type, quantity, notes, version, sync_status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, 1, 'PENDING', ?, ?);`,
      [txId, dto.sku, dto.itemName, dto.type, dto.quantity, dto.notes ?? null, now, now]
    );

    // 2. Simpan tiket antrean sinkronisasi (Outbox)
    await txn.runAsync(
      `INSERT INTO sync_queue 
       (task_id, idempotency_key, entity_type, entity_id, operation, endpoint, http_method, payload, status, created_at, updated_at)
       VALUES (?, ?, 'INVENTORY_TX', ?, 'CREATE', '/api/v1/inventory/transactions', 'POST', ?, 'PENDING', ?, ?);`,
      [
        Crypto.randomUUID(),
        idempotencyKey,
        txId,
        JSON.stringify({ ...dto, clientTxId: txId, clientTimestamp: now }),
        now,
        now,
      ]
    );
  });

  return { txId, idempotencyKey };
};
```

### 4.2 Pola Sync Processor & Error Handling
```typescript
// CONTOH KODE RESMI: src/core/sync/syncProcessor.ts
// Aturan: Jika status code >= 500 atau Network Error -> Retry dengan Exponential Backoff
// Jika status code === 409 -> Tandai CONFLICT untuk rekonsiliasi manual
// Jika status code 200..299 -> Hapus task dari antrean, update status lokal ke 'SYNCED'
```

---

## 5. Standar Pengujian (Testing Standards)

Setiap pull request atau perubahan fitur wajib lolos kriteria uji berikut:

1. **Unit Test Domain & Outbox (Jest)**:
   * Menguji fungsi atomic insert (memastikan *rollback* terjadi jika ada salah satu query SQL gagal).
   * Menguji kalkulasi *exponential backoff* dan jitter.
   * Menguji parser payload dan penanganan konflik (HTTP 409).
2. **Repository Integration Test**:
   * Menguji interaksi langsung dengan SQLite in-memory untuk memastikan skema DDL valid dan index terpasang.
3. **Simulasi Offline E2E**:
   * Mode Airplane diaktifkan -> Submit transaksi -> Periksa tabel `sync_queue` terisi -> Mode Airplane dimatikan -> Pastikan queue berkurang menjadi 0 dan status transaksi menjadi `SYNCED`.

---

## 6. Standar Commit Git & Dokumentasi

Gunakan format **Conventional Commits**:
* `feat(sync)`: Implementasi exponential backoff pada outbox processor
* `feat(inventory)`: Tambah input form pencatatan SKU barang masuk
* `fix(db)`: Perbaiki index query polling pada tabel sync_queue
* `refactor(ui)`: Terapkan gaya minimalis 1px border pada kartu transaksi
* `test(sync)`: Tambah unit test untuk simulasi HTTP 409 conflict

---

## 7. Command Cheatsheet

```bash
# Menjalankan aplikasi pada emulator Android (Development Build)
npx expo run:android

# Menjalankan aplikasi pada simulator iOS (Development Build)
npx expo run:ios

# Menjalankan unit tests
npm test

# Menjalankan linter dan pengecekan tipe TypeScript
npm run lint
npx tsc --noEmit
```
