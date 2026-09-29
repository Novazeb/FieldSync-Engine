# Content Strategy & Microcopy Guide
## Project: FieldSync Engine

---

## 1. Tone of Voice & Prinsip Copywriting

Aplikasi **FieldSync Engine** dirancang untuk pekerja lapangan dan analis gudang di lingkungan bertekanan tinggi. Teks yang digunakan berkarakter:

* **Ultra-Clear & Utilitarian**: Bahasa langsung pada inti, ringkas, tanpa basa-basi atau kata manis (*no filler words*).
* **Deterministic & Reassuring**: Pengguna harus selalu tahu dengan pasti di mana posisi data mereka (tersimpan di HP vs sudah di server pusat).
* **Action-Oriented**: Pesan kesalahan selalu disertai solusi atau aksi perbaikan yang bisa diambil seketika.
* **Bilingual Standard**: Menggunakan Bahasa Indonesia lugas dengan terminologi teknis logistik yang sudah umum di industri (SKU, Inbound, Outbound, Sync, Outbox).

---

## 2. Microcopy Indikator Status Konektivitas & Sinkronisasi

Komponen status di header aplikasi adalah elemen paling krusial. Gunakan teks berikut:

| Status Sistem | Label Status (Badge/Pill) | Sub-teks Penjelas (Jika Diperluas) |
| :--- | :--- | :--- |
| **Tersinkronisasi Penuh** | `● Online • Synced` | "Semua data aman di server pusat." |
| **Sedang Sinkronisasi** | `◌ Syncing (3/12)` | "Menyinkronkan 3 dari 12 antrean..." |
| **Offline (Ada Antrean)** | `○ Offline • 5 Antrean` | "Tersimpan aman di perangkat. Mengirim otomatis saat ada sinyal." |
| **Offline (Kosong)** | `○ Offline • Standby` | "Mode offline aktif. Anda tetap bisa mencatat transaksi." |
| **Ada Konflik Data** | `▲ Butuh Tindakan` | "1 transaksi membutuhkan tinjauan manual versi data." |

---

## 3. Formulir Transaksi Inventaris

### 3.1 Label & Placeholder Input

* **SKU / Kode Barang**:
  * *Label*: `KODE SKU / BARCODE`
  * *Placeholder*: `Contoh: SKU-88401`
  * *Helper Text*: `Pindai barcode atau ketik kode barang.`
* **Tipe Mutasi**:
  * *Pilihan 1*: `[↓] BARANG MASUK (INBOUND)`
  * *Pilihan 2*: `[↑] BARANG KELUAR (OUTBOUND)`
* **Jumlah Kuantitas**:
  * *Label*: `KUANTITAS (UNIT)`
  * *Placeholder*: `0`
  * *Helper Text*: `Masukkan bilangan bulat positif.`
* **Catatan Lapangan**:
  * *Label*: `CATATAN (OPSIONAL)`
  * *Placeholder*: `Nomor palet, kondisi kemasan, atau catatan fisik...`
* **Tombol Aksi Utama**:
  * *Online / Offline*: `SIMPAN TRANSAKSI` (Bukan "Kirim" atau "Submit", melambangkan data pasti tersimpan di lokal seketika).

---

## 4. Status Badge Transaksi pada List

Setiap baris riwayat transaksi menampilkan status jelas:

* `[✓] TERSINKRON` : Data telah diverifikasi dan masuk database server pusat.
* `[⏱] TERTUNDA` : Data tersimpan di SQLite lokal ponsel; menanti koneksi.
* `[!] GAGAL (RETRY 2/5)` : Terjadi kendala jaringan saat pengiriman; akan dicoba ulang otomatis.
* `[?] KONFLIK` : Data di server telah diubah oleh operator lain.

---

## 5. Pesan Notifikasi Toast & Banner

### 5.1 Keberhasilan Penyimpanan
* **Kondisi Offline**:
  * *Judul*: `Transaksi Tersimpan (Offline)`
  * *Pesan*: `Tersimpan di perangkat (#TX-4921). Akan diunggah otomatis saat sinyal pulih.`
* **Kondisi Online**:
  * *Judul*: `Transaksi Sukses`
  * *Pesan*: `Data berhasil dicatat dan diverifikasi di server.`

### 5.2 Kesalahan & Penanganan
* **Gagal Validasi Input**:
  * *Pesan*: `Kuantitas harus lebih dari 0 unit.`
  * *Pesan*: `SKU belum dipilih atau tidak terdaftar di katalog lokal.`
* **Konflik Data (HTTP 409)**:
  * *Judul*: `Peringatan: Versi Data Berbeda`
  * *Pesan*: `Stok barang ini telah diperbarui oleh pengguna lain saat Anda offline. Silakan pilih versi yang dipertahankan.`
  * *Tombol Aksi*: `[Pertahankan Milik Saya]` | `[Gunakan Data Server]`

---

## 6. Layar Kosong (Empty States)

Desain minimalis tidak menggunakan ilustrasi kartun yang memakan ruang, melainkan tipografi tegas dan jelas:

### 6.1 Daftar Transaksi Kosong
```text
[ — ]
Belum Ada Transaksi Hari Ini
Semua mutasi barang masuk dan keluar yang Anda catat akan muncul di sini.

[ + Catat Transaksi Baru ]
```

### 6.2 Antrean Outbox Bersih (Zero Pending Tasks)
```text
[ ✓ ]
Antrean Sinkronisasi Bersih
Tidak ada transaksi tertunda. Seluruh data lokal selaras dengan server pusat.
```

---

## 7. Glosarium & Standar Terminologi

| Istilah Baku | Istilah yang Dihindari | Alasan |
| :--- | :--- | :--- |
| **Simpan Transaksi** | Submit / Kirim | "Simpan" memberikan kepastian bahwa data tidak lenyap meskipun sedang offline. |
| **Antrean Keluar (Outbox)** | Pending List / Antrian | "Outbox" merefleksikan arsitektur enterprise standar. |
| **Tersinkron** | Uploaded / Berhasil | "Tersinkron" mencerminkan proses konsiliasi dua arah (lokal & server). |
| **Katalog Lokal** | Cache Data | "Katalog Lokal" lebih dipahami oleh pekerja lapangan daripada istilah teknis cache. |
