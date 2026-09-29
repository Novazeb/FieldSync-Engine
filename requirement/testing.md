# Testing Strategy & Quality Assurance Plan (testing.md)
## Project: FieldSync Engine

---

## 1. Filosofi & Piramida Pengujian Mobile

Pengujian pada aplikasi *offline-first* membutuhkan fokus tinggi pada skenario **anomali jaringan, keandalan database lokal, dan konsistensi data**. Kami membagi pengujian ke dalam 3 level piramida:

```text
       /\
      /  \     Level 3: E2E Network Simulation (Detox / Maestro)
     /----\    Skenario: Airplane Mode toggle -> Submit -> Reconnect -> Synced
    /      \
   /--------\  Level 2: Repository & DB Integration Tests (Jest + SQLite Memory)
  /          \ Skenario: Transaksi atomik, constraint violations, queue polling
 /------------\ Level 1: Unit Tests (Jest + TypeScript)
/______________\ Skenario: Reducers, Exponential Backoff math, Idempotency keys
```

---

## 2. Cakupan & Kriteria Minimum (Quality Gates)

| Layer Uji | Target Cakupan (Coverage) | Fokus Utama |
| :--- | :--- | :--- |
| **Sync Engine & Outbox** | **$\ge 90\%$** | Logika backoff, idempotensi, serialisasi antrean, HTTP 409 conflict |
| **Database Repositories** | **$\ge 85\%$** | Atomic rollback, CRUD SQLite, index query performance |
| **Redux Slices & Hooks** | **$\ge 80\%$** | State updates, optimistic updates, filter/sorting |
| **UI Components** | **$\ge 70\%$** | Render status pills, input form validation feedback |

---

## 3. Skenario Uji Kritis (Critical Test Suites)

### 3.1 Test Suite 1: Transaksi Atomik & Rollback Guard
* **Tujuan**: Memastikan data transaksi dan tiket outbox **selalu** tersimpan bersamaan atau keduanya dibatalkan (*all-or-nothing*).
* **Kode Uji Konseptual**:
```typescript
describe('InventoryLocalRepo - Atomic Guarantee', () => {
  it('should rollback transaction record if outbox queue insert fails', async () => {
    // 1. Simulasikan error pada insert ke sync_queue (misal: constraint error)
    mockSyncQueueFailNextInsert();

    // 2. Coba jalankan fungsi insert transaksi
    await expect(
      insertTransactionAtomic(db, mockTxData)
    ).rejects.toThrow();

    // 3. Verifikasi bahwa TIDAK ADA baris yang tertinggal di inventory_transactions
    const count = await getTransactionCountBySku(db, mockTxData.sku);
    expect(count).toBe(0); // Zero partial state
  });
});
```

### 3.2 Test Suite 2: Algoritma Exponential Backoff & Full Jitter
* **Tujuan**: Menghindari badai permintaan (*thundering herd*) saat ratusan perangkat serentak mendapatkan koneksi internet.
* **Kriteria Uji**:
  * Delay pada retry 0 berada di rentang $1000\text{ms} \pm \text{jitter}$.
  * Delay pada retry 1 berada di rentang $2000\text{ms} \pm \text{jitter}$.
  * Delay maksimum tidak boleh melebihi batas $60000\text{ms}$ (60 detik).
  * Task ditandai `'FAILED'` setelah melewati 5 kali percobaan gagal.

### 3.3 Test Suite 3: Deteksi Konflik Concurrency (HTTP 409)
* **Tujuan**: Memastikan antrean tidak macet saat server menolak data karena versi data yang usang.
* **Kriteria Uji**:
  * Server merespon dengan status 409 dan payload konflik.
  * Task status di `sync_queue` berubah menjadi `'CONFLICT'`.
  * Status record di `inventory_transactions` berubah menjadi `'CONFLICT'`.
  * Processor melanjutkan ke task berikutnya dalam antrean tanpa berhenti.

---

## 4. Panduan Pengujian Manual Skenario Lapangan (Field QA Protocol)

Untuk memverifikasi aplikasi secara manual sebelum demonstrasi di depan HRD / Engineering Lead:

### Skenario A: Uji Lepas Baterai / Force-Kill saat Offline
1. Buka aplikasi, aktifkan **Airplane Mode**.
2. Masukkan transaksi: SKU `SKU-88214`, Jumlah `100`, Tipe `INBOUND`.
3. Tekan **"SIMPAN TRANSAKSI"**.
4. Seketika itu juga (kurang dari 1 detik), tutup paksa (*force kill*) aplikasi dari *Recent Apps* OS.
5. Buka kembali aplikasi.
6. **Hasil yang Diharapkan**:
   * Transaksi tetap muncul di daftar teratas dengan status `[⏱ PENDING]`.
   * Layar *Sync Queue* menampilkan 1 tugas siap kirim.

### Skenario B: Simulasi Jaringan Flaky (Jitter & Packet Loss)
1. Gunakan developer option pada emulator untuk menyetel jaringan: **"Very Bad Network / EDGE (Loss 30%)"**.
2. Tambahkan 5 transaksi sekaligus.
3. Amati layar *Sync Health*:
   * Permintaan yang gagal otomatis menjadwalkan *retry* dengan waktu tunggu yang bertambah secara eksponensial.
   * Tidak ada crash pada UI (*graceful degradation*).
   * Setelah jaringan kembali ke "LTE/Wi-Fi", seluruh 5 transaksi tuntas terkirim tanpa ada yang dobel.

---

## 5. Menjalankan Uji Otomatis

```bash
# Menjalankan seluruh test suite
npm test

# Menjalankan test dengan report coverage lengkap
npm run test:coverage

# Menjalankan test spesifik sync engine dalam mode watch
npx jest src/core/sync --watch
```
