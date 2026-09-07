# VAKASI --- UI/UX Specification

## 1. Design Goal

UI VAKASI harus: - sederhana; - cepat; - mudah dipahami TU; - minim
klik; - fokus pada nominal dan status; - nyaman untuk desktop; -
responsive untuk tablet/mobile.

### Color Theme

Tema warna utama: **putih + biru**, konsisten dengan identitas visual
Sianggar (ekosistem yang sama dengan VAKASI/SendaGo).

-   Base: putih/near-white untuk background dan surface (light theme
    sebagai default).
-   Primary: biru untuk elemen aksi utama (tombol primary, link aktif,
    highlight navigasi, badge status positif seperti Approved/Paid).
-   Netral: abu-abu untuk teks sekunder, border, dan surface non-aktif.
-   Warna status (semantic) tetap mengikuti konvensi umum di luar
    biru---mis. kuning/oranye untuk Pending/Submitted, merah untuk
    Rejected---agar status tidak hilang makna saat memakai palet biru
    dominan.
-   Implementasi memakai token warna shadcn/ui (`primary`,
    `background`, `muted`, `destructive`, dst.) supaya tema mudah
    dikonfigurasi terpusat lewat Tailwind config, bukan hardcode warna
    di tiap komponen.

Catatan: dokumen ini belum menetapkan kode HEX pasti agar match persis
dengan palet Sianggar. Jika tersedia design token/HEX resmi dari
Sianggar, gunakan itu sebagai sumber kebenaran dan perbarui bagian ini.

## 2. Main Navigation

``` text
Dashboard

Master Data
  Pegawai
  Jabatan
  Unit
  Jenis Kegiatan
  Jenis Honor
  Tarif Honor
  Sumber Dana

Kegiatan
  Semua Kegiatan
  Buat Kegiatan
  Menunggu Approval
  Selesai

Honor
  Rekap Honor
  Slip Honor

Keuangan
  Anggaran
  Pembayaran

Laporan

Dokumen

Audit Trail

Pengaturan
```

## 3. Dashboard TU

Cards: - Draft - Menunggu Approval - Disetujui - Selesai - Total Honor
Bulan Ini

Widgets: - kegiatan terbaru; - pengajuan membutuhkan tindakan; - honor
per bulan; - budget utilization.

## 4. Activity Wizard

Gunakan wizard:

``` text
01 Informasi
02 Anggaran
03 Peserta
04 Honor
05 Review
06 Submit
```

### Step 01

-   nama kegiatan;
-   jenis;
-   tanggal;
-   lokasi;
-   PIC.

### Step 02

-   sumber dana;
-   budget;
-   rincian budget.

### Step 03

-   pilih pegawai;
-   peran.

### Step 04

-   jenis honor;
-   volume;
-   tarif otomatis;
-   subtotal.

### Step 05

-   ringkasan;
-   warning;
-   validasi.

### Step 06

-   submit.

## 5. Honor Table

``` text
Nama | Peran | Jenis Honor | Volume | Tarif | Gross | Potongan | Net
```

Fitur: - inline volume editing saat DRAFT; - automatic calculation; -
total sticky footer; - warning budget.

## 6. Approval Screen

Tampilkan: - informasi kegiatan; - total budget; - total honor; -
peserta; - rincian honor; - dokumen; - histori approval.

Action:

``` text
[Approve] [Reject]
```

Reject harus meminta alasan.

## 7. Finance Screen

Cards:

``` text
Total Pengajuan
Total Approved
Total Pending Payment
Total Paid
```

Tabel: - nomor kegiatan; - penerima; - nominal; - approval; - status; -
action.

## 8. Payment Screen

Tampilkan: - total payment; - daftar penerima; - rekening; - metode
pembayaran; - nomor referensi; - upload bukti.

## 9. Status Badge

Gunakan semantic status:

-   Draft
-   Submitted
-   Approved
-   Verified
-   Processing
-   Paid
-   Completed
-   Rejected

Status harus konsisten di seluruh UI.

## 10. UX Rules

1.  Jangan menampilkan terlalu banyak field sekaligus.
2.  Gunakan autocomplete untuk pegawai.
3.  Tarif ditampilkan otomatis.
4.  Nominal menggunakan format Rupiah.
5.  Selalu tampilkan total.
6.  Tampilkan warning sebelum submit.
7.  Confirmation modal untuk approval/payment.
8.  Jangan gunakan destructive action tanpa konfirmasi.
9.  Semua form memiliki validation message.
10. Loading state wajib tersedia untuk proses yang membutuhkan waktu.

## 11. Responsive

Desktop adalah primary experience.

Tablet: - two-column form.

Mobile: - single column; - table berubah menjadi card; - action utama
tetap mudah dijangkau.

## 12. Accessibility

Target: - keyboard-friendly; - visible focus; - label form jelas; -
warna bukan satu-satunya indikator status; - contrast memadai; - error
message jelas.
