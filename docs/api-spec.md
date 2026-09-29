# API Specification & Idempotency Protocol (api-spec.md)
## Project: FieldSync Engine

---

## 1. Spesifikasi Protokol Jaringan

Semua komunikasi antara aplikasi seluler dan server backend menggunakan standar **RESTful HTTPS** dengan format data **JSON**.

### 1.1 Standar Header HTTP Klien

Setiap panggilan API dari klien ke server **wajib** menyertakan header berikut:

```http
Content-Type: application/json
Accept: application/json
Authorization: Bearer <jwt_access_token>
X-Client-Platform: android | ios
X-Client-App-Version: 1.0.0
X-Device-ID: dev_a83f9b20-...
```

### 1.2 Protokol Header Idempotensi (Wajib untuk Mutasi)

Untuk semua request mutasi data (`POST`, `PUT`, `PATCH`, `DELETE`):
```http
Idempotency-Key: <UUIDv4>
```

#### Aturan Server untuk Idempotensi:
1. Server mencatat `Idempotency-Key` di cache terdistribusi (Redis) dengan TTL 24 jam.
2. Jika server menerima request baru dengan key yang belum pernah ada:
   * Proses mutasi $\rightarrow$ Simpan respon di cache $\rightarrow$ Kembalikan status HTTP 201/200.
3. Jika server menerima request ulang dengan key yang sama (*Replay Request*):
   * Jangan jalankan mutasi kedua kali.
   * Langsung kembalikan respon yang sama persis seperti yang tersimpan di cache.
   * Sertakan header balasan: `X-Cache-Lookup: HIT-IDEMPOTENT`.

---

## 2. Definisi Endpoint API

### 2.1 Autentikasi & Sesi

#### A. Login Operator Lapangan
* **Endpoint**: `POST /api/v1/auth/login`
* **Deskripsi**: Autentikasi dengan email dan kata sandi atau kode PIN petugas.
* **Request Body**:
```json
{
  "identifier": "operator.gudang@enterprise.com",
  "pin": "881920",
  "deviceId": "dev_a83f9b20-19ef"
}
```
* **Response (HTTP 200 OK)**:
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOi...",
    "refreshToken": "eyJhbGciOi...",
    "expiresIn": 3600,
    "user": {
      "id": "usr_9901",
      "name": "Joko Susilo",
      "warehouseId": "WH-JKT-01",
      "role": "FIELD_OPERATOR"
    }
  }
}
```

#### B. Refresh Token Sesi
* **Endpoint**: `POST /api/v1/auth/refresh`
* **Request Body**:
```json
{
  "refreshToken": "eyJhbGciOi...",
  "deviceId": "dev_a83f9b20-19ef"
}
```
* **Response (HTTP 200 OK)**:
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOi...",
    "refreshToken": "eyJhbGciOi...",
    "expiresIn": 3600
  }
}
```

---

### 2.2 Mutasi Inventaris (Transaksi Lapangan)

#### A. Rekam Transaksi Mutasi Baru
* **Endpoint**: `POST /api/v1/inventory/transactions`
* **Header Wajib**: `Idempotency-Key: <UUIDv4>`
* **Request Body**:
```json
{
  "clientTxId": "8f8b654e-4b2a-4318-9710-8b1b86940a41",
  "sku": "SKU-99214",
  "type": "INBOUND",
  "quantity": 50,
  "notes": "Barang masuk palet A3 gudang barat",
  "clientVersion": 1,
  "clientTimestamp": 1727600400000
}
```

* **Response (HTTP 201 Created)**:
```json
{
  "success": true,
  "data": {
    "serverTxId": "srv_tx_7718290",
    "clientTxId": "8f8b654e-4b2a-4318-9710-8b1b86940a41",
    "sku": "SKU-99214",
    "type": "INBOUND",
    "quantity": 50,
    "serverVersion": 2,
    "syncedAt": 1727600405120,
    "currentStockLevel": 420
  }
}
```

* **Response Konflik (HTTP 409 Conflict)**:
Terjadi jika versi data lokal tertinggal dari versi master server.
```json
{
  "success": false,
  "error": {
    "code": "CONCURRENCY_CONFLICT",
    "message": "Data stok barang ini telah diperbarui oleh operator lain.",
    "conflictDetails": {
      "sku": "SKU-99214",
      "clientSubmittedVersion": 1,
      "serverCurrentVersion": 4,
      "serverCurrentStock": 310,
      "lastModifiedBy": "Operator Palet B2",
      "serverTimestamp": 1727600403000
    }
  }
}
```

---

### 2.3 Sinkronisasi Batch & Delta Sync

#### A. Unduh Katalog Master & Delta Perubahan
* **Endpoint**: `GET /api/v1/inventory/sync-stream?since={timestamp}`
* **Deskripsi**: Mengambil hanya data yang berubah sejak waktu sinkronisasi terakhir (*Delta Pull*).
* **Response (HTTP 200 OK)**:
```json
{
  "success": true,
  "data": {
    "serverWatermark": 1727601200000,
    "updatedItems": [
      {
        "sku": "SKU-88401",
        "name": "Kardus Indomie Goreng",
        "currentStock": 1500,
        "version": 7,
        "isArchived": false
      }
    ],
    "deletedSkuList": []
  }
}
```

---

## 3. Matriks Kode Respon HTTP & Tindakan Klien

| Kode HTTP | Arti | Tindakan Sync Processor di Klien |
| :--- | :--- | :--- |
| **200 / 201** | Berhasil diproses / Idempotent Hit | Hapus task dari `sync_queue`. Update `inventory_transactions` ke status `'SYNCED'`. |
| **400 / 422** | Bad Request / Validasi Gagal | Tandai task sebagai `'FAILED'`. Tulis log kesalahan di `sync_queue.last_error`. Tidak perlu retry otomatis. |
| **401** | Token Kedaluwarsa | Tunda eksekusi antrean. Panggil `/api/v1/auth/refresh`. Ulangi task setelah token baru didapat. |
| **409** | Concurrency Conflict | Ubah status task dan status transaksi lokal menjadi `'CONFLICT'`. Minta keputusan operator di UI. |
| **429** | Rate Limited | Baca header `Retry-After`. Tunda antrean sesuai instruksi server. |
| **500 / 502 / 503** | Server Down / Jaringan Terputus | Naikkan `retry_count`. Hitung jadwal eksekusi berikutnya via *Exponential Backoff*. |
