# UI/UX Design System & Specification (Design.md)
## Style: Simple Utilitarian Minimalism
## Project: FieldSync Engine

---

## 1. Filosofi Desain: Utilitarian Minimalism

Desain FieldSync Engine mengadopsi prinsip **"Form Follows Function"** yang terinspirasi oleh *Swiss Design* dan *Dieter Rams* (Less, but better).

* **Zero Visual Clutter**: Tidak ada gradasi berlebihan, tidak ada bayangan buram (*heavy drop shadows*), dan tidak ada ilustrasi kartun yang tidak informatif.
* **High Contrast & Readability**: Mudah dibaca di bawah terik matahari lapangan maupun di dalam gudang remang-remang.
* **Information Density**: Informasi kritis (SKU, status sinkronisasi, kuantitas) dapat dipindai dalam waktu kurang dari 2 detik.
* **1-Pixel Borders & Structural Grid**: Hirarki visual dibentuk oleh garis batas tegas 1px (*flat bordered cards*) dan tata letak berbasis kelipatan 8px.

---

## 2. Design Tokens & Color Palette

Sistem warna monokromatis netral dengan aksen semantik yang sangat terarah:

### 2.1 Netral (Dark & Light Theme)

```scss
// Base Monochrome Tokens (Dark-Mode First untuk efisiensi layar OLED & baterai lapangan)
$bg-primary:       #09090B; // Deep Zinc (Latar belakang utama)
$bg-surface:       #18181B; // Elevated Card / Input Surface
$bg-subtle:        #27272A; // Hover, Pressed, Secondary Surface
$border-subtle:    #27272A; // 1px border pembatas
$border-strong:    #3F3F46; // Border aktif / fokus

$text-primary:     #FAFAFA; // Teks utama (Kontras tinggi)
$text-secondary:   #A1A1AA; // Teks sekunder / label / metadata
$text-tertiary:    #71717A; // Placeholder & disabled text
```

### 2.2 Warna Semantik Fungsional (Status & Mutasi)

```scss
// Status Sinkronisasi
$sync-online:      #10B981; // Emerald Green (Synced / All Clear)
$sync-pending:     #F59E0B; // Amber Orange (Pending in Outbox)
$sync-active:      #38BDF8; // Sky Blue (Syncing in progress)
$sync-conflict:    #F43F5E; // Rose Red (Conflict / Action Required)

// Tipe Mutasi Barang
$badge-inbound:    #064E3B; // Deep green bg dengan teks #34D399 (Barang Masuk)
$badge-outbound:   #451A03; // Deep orange bg dengan teks #FB923C (Barang Keluar)
```

---

## 3. Skala Tipografi & Spacing

Menggunakan font sistem bawaan platform (*SF Pro* di iOS, *Roboto* di Android, atau *Inter*) untuk performa rendering native instan:

| Token | Ukuran | Weight | Line Height | Penggunaan |
| :--- | :--- | :--- | :--- | :--- |
| `display-1` | 28px | 700 (Bold) | 34px | Judul layar utama, angka metrik besar |
| `heading-2` | 20px | 600 (SemiBold)| 26px | Header seksi, nama SKU |
| `body-1` | 15px | 400 (Regular) | 22px | Teks isi, nilai input form |
| `body-2` | 13px | 500 (Medium) | 18px | Metadata, catatan sekunder |
| `caption` | 11px | 600 (SemiBold)| 14px | Label uppercase, status badges, chip |

### Grid & Spacing (Kelipatan 4px & 8px)
* `space-xs`: 4px
* `space-sm`: 8px
* `space-md`: 16px (Padding standar konten)
* `space-lg`: 24px (Pemisah antar seksi)
* `space-xl`: 32px

---

## 4. Spesifikasi Komponen Utama

### 4.1 Global Sync Status Bar (Header Pill)
Terletak permanen di bagian atas layar:
* **Ukuran**: Tinggi 36px, radius 18px (pill), border 1px `$border-subtle`.
* **State**:
  * *Synced*: Titik hijau bulat (6px) + teks `"Online • Synced"`.
  * *Syncing*: Ikon panah melingkar berputar + teks `"Syncing 2/5"`.
  * *Offline Pending*: Titik oranye bulat + teks `"Offline • 3 Antrean"`.
* **Interaksi**: Mengetuk status pill akan membuka layar **Sync Queue Log**.

### 4.2 Kartu Transaksi Inventaris (Transaction Card)
* **Visual**: Permukaan datar `$bg-surface`, radius 8px, border 1px `$border-subtle`. Tanpa efek bayangan buram.
* **Layout**:
  ```text
  +--------------------------------------------------------------+
  | [INBOUND]  SKU-88401                             +50 UNIT    |
  | Kardus Indomie Goreng (Palet A3)                             |
  | 14:05 WIB  •  Tersimpan Lokal              [● PENDING]       |
  +--------------------------------------------------------------+
  ```
* **Status Badge**:
  * `[✓ SYNCED]` : Border hijau tipis, teks hijau muda.
  * `[⏱ PENDING]` : Border oranye tipis, teks oranye muda.
  * `[▲ KONFLIK]` : Border merah, teks merah dengan tombol cepat *"Tinjau"*.

### 4.3 Input Form Minimalis
* **Field**: Background `$bg-surface`, border 1px `$border-subtle`, saat aktif border berubah menjadi `$text-primary`.
* **Label**: Teks 12px uppercase semibold dengan warna `$text-secondary`.
* **Tombol Aksi Utama**:
  * Background kontras penuh `$text-primary` (putih pekat), teks hitam tebal `$bg-primary`.
  * Tinggi tombol 48px (standar aksesibilitas sentuhan jari jempol).

---

## 5. Wireframe Tata Letak Layar Utama

### Layar 1: Daftar Transaksi & Quick Action

```text
+---------------------------------------------------+
|  FIELDSYNC                     [● Offline • 3]   |
+---------------------------------------------------+
|  RINGKASAN OPERASIONAL                            |
|  +--------------------+  +---------------------+  |
|  | TOTAL TRANSAKSI    |  | MENUNGGU SYNC       |  |
|  | 42 Unit            |  | 3 Antrean           |  |
|  +--------------------+  +---------------------+  |
+---------------------------------------------------+
|  RIWAYAT MUTASI TERBARU                           |
|                                                   |
|  +---------------------------------------------+  |
|  | [INBOUND] SKU-99214               +120 UNIT |  |
|  | Oli Mesin Shell Helix 4L                    |  |
|  | 14:02 • ID: #TX-99214        [● PENDING]    |  |
|  +---------------------------------------------+  |
|                                                   |
|  +---------------------------------------------+  |
|  | [OUTBOUND] SKU-10492              -15 UNIT  |  |
|  | Filter Udara Truk Mitsubishi               |  |
|  | 13:45 • ID: #TX-10492        [✓ SYNCED]     |  |
|  +---------------------------------------------+  |
|                                                   |
|                                                   |
|  [ + CATAT TRANSAKSI BARU (INBOUND/OUTBOUND) ]    |
+---------------------------------------------------+
```

### Layar 2: Sync Health & Queue Monitor

```text
+---------------------------------------------------+
|  < KEMBALI          SYNC HEALTH & QUEUE           |
+---------------------------------------------------+
|  STATUS SISTEM                                    |
|  Koneksi: Offline (Cellular Disconnected)         |
|  Terakhir Sinkron: 13:50:22 WIB                   |
|  Device ID: dev_pixel_8a_0912                     |
+---------------------------------------------------+
|  ANTREAN OUTBOX AKTIF (3 Item)                    |
|                                                   |
|  1. POST /api/v1/inventory/transactions           |
|     Idempotency: 9b1deb4d-...                     |
|     Status: WAITING_NETWORK                       |
|     Payload: {"sku":"SKU-99214","qty":120}        |
|                                                   |
|  2. POST /api/v1/inventory/transactions           |
|     Idempotency: 4f2c019a-...                     |
|     Status: WAITING_NETWORK                       |
|     Payload: {"sku":"SKU-77182","qty":40}         |
+---------------------------------------------------+
|  [ ⟳ PAKSA SINKRONISASI SEKARANG ]                |
+---------------------------------------------------+
```

---

## 6. Pola Aksesibilitas & Responsif

1. **Target Sentuh Minimum**: Semua tombol dan elemen interaktif memiliki area sentuh minimal **48 × 48 dp**.
2. **Haptic Feedback**:
   * *Haptic Light Impact*: Saat tombol submit ditekan dan transaksi berhasil masuk SQLite lokal.
   * *Haptic Notification Success*: Saat antrean outbox selesai tersinkronisasi ke server.
   * *Haptic Notification Warning*: Jika terjadi konflik data yang butuh resolusi manual.
3. **Contrast Ratio**: Rasio kontras teks utama dan tombol selalu memenuhi standar **WCAG AAA (> 7:1)** untuk visibilitas optimal di lapangan.
