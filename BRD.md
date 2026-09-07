# VAKASI --- Business Requirements Document

## 1. Business Overview

VAKASI adalah sistem digital untuk mengelola kegiatan sekolah yang
menghasilkan honor bagi Guru, TU, Tendik, dan panitia.

Masalah utama yang ingin diselesaikan adalah proses berbasis Excel,
WhatsApp, kertas, dan perhitungan manual yang menyebabkan: - data
tersebar; - sulit melacak status; - tarif tidak konsisten; - kesalahan
perhitungan; - approval tidak terdokumentasi; - pembayaran sulit
direkonsiliasi; - laporan memerlukan pekerjaan ulang.

## 2. Business Objectives

1.  Menstandarkan proses pengajuan honor.
2.  Mempercepat administrasi TU.
3.  Meningkatkan kontrol biaya.
4.  Meningkatkan transparansi approval.
5.  Menyediakan histori honor setiap pegawai.
6.  Memudahkan audit.
7.  Menyediakan fondasi integrasi di masa depan.

## 3. Current State

Contoh proses saat ini:

`Kegiatan → Excel → Hitung manual → Print → Tanda tangan → Keuangan → Bayar → Arsip`

Masalah: - formula dapat berubah tanpa kontrol; - versi file banyak; -
approval sulit dilacak; - bukti pembayaran terpisah; - laporan bulanan
dibuat ulang.

## 4. Future State

`Kegiatan → Penugasan → Honor Engine → Validasi → Approval → Verifikasi Keuangan → Pembayaran → Bukti → Laporan`

## 5. Business Actors

### TU

Pemilik proses operasional kegiatan dan pengajuan honor.

### Kepala Sekolah

Pihak pemberi approval.

### Keuangan

Pihak verifikasi dan pembayaran.

### Guru/Tendik

Penerima honor dan pihak yang dapat melihat data miliknya.

### Admin

Pengelola konfigurasi.

### Auditor

Pemeriksa histori dan laporan.

## 6. Business Process

### Perencanaan

TU membuat kegiatan dan menentukan: - periode; - unit; - PIC; -
anggaran; - sumber dana.

### Pengisian Honor

TU menentukan: - penerima; - peran; - jenis honor; - volume.

Sistem mengambil tarif dan menghitung honor.

### Approval

Pengajuan dikirim ke Kepala Sekolah.

Jika ditolak, kembali ke TU dengan alasan.

### Finance Verification

Keuangan memeriksa: - budget; - nominal; - penerima; - dokumen; -
kesesuaian approval.

### Payment

Pembayaran dicatat dan bukti disimpan.

### Reporting

Sistem menyediakan laporan kegiatan, honor, dan realisasi.

## 7. Business Requirements

  ID      Requirement                                Priority
  ------- ------------------------------------------ ----------
  BR-01   Sistem harus mengelola kegiatan            Must
  BR-02   Sistem harus mengelola penerima honor      Must
  BR-03   Sistem harus menghitung honor otomatis     Must
  BR-04   Sistem harus memiliki approval             Must
  BR-05   Sistem harus mencatat pembayaran           Must
  BR-06   Sistem harus menyimpan bukti               Must
  BR-07   Sistem harus memiliki audit trail          Must
  BR-08   Sistem harus menyediakan laporan           Must
  BR-09   Sistem harus mengontrol budget             Should
  BR-10   Sistem harus mendukung template kegiatan   Should
  BR-11   Sistem harus menyediakan API               Later
  BR-12   Sistem dapat terintegrasi dengan SendaGo   Later

## 8. Financial Control

VAKASI harus membedakan: - budget; - committed amount; - approved
amount; - paid amount; - remaining budget.

Contoh:

`Budget = Rp10.000.000`

`Approved = Rp8.000.000`

`Paid = Rp6.000.000`

`Remaining = Rp4.000.000`

Sistem dapat memberi warning ketika realisasi mendekati batas.

## 9. Approval Policy

Default:

1.  TU submit.
2.  Kepala Sekolah approve/reject.
3.  Keuangan verify.
4.  Keuangan process payment.
5.  Bukti diunggah.
6.  Transaksi completed.

Sekolah dapat mengembangkan approval bertingkat pada fase berikutnya.

## 10. Reporting Requirements

Manajemen membutuhkan: - total honor per bulan; - total honor per
unit; - total honor per jenis kegiatan; - total per pegawai; - anggaran
vs realisasi; - outstanding payment; - rejected submission; - audit
report.

## 11. Business Benefits

### Untuk TU

-   mengurangi pekerjaan manual;
-   mengurangi Excel;
-   proses lebih cepat.

### Untuk Kepala Sekolah

-   approval terpusat;
-   transparansi.

### Untuk Keuangan

-   nominal terverifikasi;
-   bukti terpusat;
-   rekonsiliasi lebih mudah.

### Untuk Guru/Tendik

-   histori honor transparan.

### Untuk Yayasan/Manajemen

-   kontrol biaya dan laporan lebih cepat.

## 12. Risks

  Risk                          Mitigation
  ----------------------------- ------------------------------
  Tarif salah                   Master tarif + approval
  Honor ganda                   Duplicate validation
  Perubahan transaksi           Immutable financial snapshot
  Bukti hilang                  Private document storage
  User salah akses              RBAC
  Data hilang                   Backup
  Perbedaan kebijakan sekolah   Configurable policy

## 13. Success Metrics

Target pilot: - \>80% kegiatan menggunakan VAKASI. - \>95% perhitungan
tanpa koreksi manual. - Pengurangan waktu administrasi minimal 50%. -
100% pembayaran memiliki histori transaksi. - 100% approval dapat
ditelusuri.

## 14. Product Strategy

VAKASI harus berdiri sendiri sampai product-market fit tercapai.

Tahapan:

`Standalone → Pilot → VAKASI 1.0 → Integration Layer → SendaGo Ecosystem`

Integrasi tidak boleh menjadi dependency MVP.
