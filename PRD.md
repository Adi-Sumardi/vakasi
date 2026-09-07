# VAKASI --- Product Requirements Document

## 1. Ringkasan Produk

**VAKASI** adalah aplikasi standalone untuk mengelola kegiatan sekolah
dan honor Guru, TU, Tendik, serta panitia kegiatan secara terstruktur.

Prinsip utama produk:

> Kegiatan → Penugasan → Volume → Perhitungan Honor → Verifikasi →
> Approval → Pembayaran → Pelaporan

VAKASI pada fase awal **tidak bergantung pada SendaGo, SIAKAD, PMB, SPP,
atau sistem sekolah lain**. Produk dirancang integration-ready sehingga
dapat diintegrasikan pada fase berikutnya.

## 2. Tujuan

### Tujuan bisnis

-   Mengurangi perhitungan honor manual.
-   Mengurangi kesalahan pembayaran.
-   Membuat proses approval transparan.
-   Memudahkan kontrol anggaran kegiatan.
-   Memusatkan dokumen dan bukti pembayaran.
-   Menyediakan audit trail.
-   Menjadi produk standalone yang dapat diuji di sekolah sebelum
    integrasi ekosistem.

### Tujuan pengguna

-   TU dapat membuat kegiatan dan menghasilkan honor secara cepat.
-   Kepala Sekolah dapat melakukan approval dengan jelas.
-   Keuangan dapat memverifikasi dan membayar.
-   Guru/TU dapat melihat riwayat kegiatan dan honor.
-   Manajemen dapat melihat laporan biaya kegiatan.

## 3. Sasaran Pengguna

  Role             Kebutuhan
  ---------------- -------------------------------------
  Super Admin      Konfigurasi sistem dan akses penuh
  Admin            Master data dan operasional
  TU               Kegiatan, penugasan, honor, dokumen
  Kepala Sekolah   Review dan approval
  Keuangan         Verifikasi anggaran dan pembayaran
  Guru/Tendik      Melihat penugasan dan honor
  Auditor/Viewer   Melihat laporan dan audit trail

## 4. Scope MVP

### Included

1.  Authentication dan RBAC.
2.  Master pegawai.
3.  Master unit dan jabatan.
4.  Master jenis kegiatan.
5.  Master jenis honor.
6.  Master tarif honor.
7.  Master sumber dana.
8.  Pembuatan kegiatan.
9.  Penugasan peserta.
10. Input volume/jam/hari/satuan.
11. Honor calculation engine.
12. Validasi anggaran.
13. Approval.
14. Pembayaran.
15. Bukti pembayaran.
16. Slip honor.
17. Laporan dasar.
18. Audit log.
19. Notifikasi aplikasi.

### Out of scope MVP

-   Integrasi SendaGo.
-   Integrasi payroll bank.
-   Integrasi API eksternal sekolah.
-   AI prediction.
-   Mobile native.
-   Akuntansi double-entry penuh.

## 5. Modul Produk

### Dashboard

Menampilkan: - jumlah kegiatan berdasarkan status; - total honor bulan
berjalan; - total pembayaran; - pengajuan menunggu approval; -
penggunaan anggaran; - aktivitas terbaru.

### Master Data

-   Pegawai
-   Jabatan
-   Unit
-   Jenis kegiatan
-   Jenis honor
-   Tarif honor
-   Sumber dana
-   Bank
-   Parameter pajak/potongan

### Kegiatan

Data minimal: - nomor kegiatan; - nama; - jenis; - periode; - lokasi; -
deskripsi; - unit; - sumber dana; - anggaran; - PIC; - status.

### Penugasan

Satu kegiatan dapat memiliki banyak pegawai.

Data: - pegawai; - peran; - jenis honor; - volume; - satuan; - tarif; -
subtotal; - potongan; - total.

### Honor Engine

Formula dasar:

`subtotal = volume × tarif`

`total_dibayar = subtotal - potongan`

Tarif yang sudah digunakan dalam transaksi harus disnapshot ke detail
honor sehingga perubahan master tarif tidak mengubah transaksi lama.

### Approval

Workflow default:

`DRAFT → SUBMITTED → APPROVED → VERIFIED → PROCESSING → PAID → COMPLETED`

Reject:

`SUBMITTED → REJECTED → DRAFT`

### Pembayaran

-   nomor pembayaran;
-   tanggal;
-   metode;
-   rekening sumber;
-   total;
-   bukti;
-   penerima;
-   status.

### Laporan

-   laporan kegiatan;
-   laporan honor per pegawai;
-   laporan honor per kegiatan;
-   laporan per unit;
-   laporan per sumber dana;
-   laporan bulanan/tahunan;
-   anggaran vs realisasi;
-   daftar pembayaran.

## 6. Functional Requirements

### FR-01 Authentication

Sistem harus menyediakan login, logout, reset password, session
management, dan role-based authorization.

### FR-02 Employee

Admin dapat membuat, mengubah, menonaktifkan, dan mencari data pegawai.

### FR-03 Honor Rate

Admin dapat membuat tarif berdasarkan jenis honor, satuan, periode
berlaku, dan optional scope unit.

### FR-04 Activity

TU dapat membuat kegiatan dalam status DRAFT.

### FR-05 Assignment

TU dapat menambahkan banyak pegawai ke sebuah kegiatan.

### FR-06 Calculation

Sistem menghitung subtotal dan total honor otomatis.

### FR-07 Validation

Sistem memvalidasi: - pegawai aktif; - tarif aktif; - volume \> 0; -
tidak ada penugasan duplikat yang tidak diperbolehkan; - total tidak
melampaui batas anggaran jika policy mengharuskan hard limit.

### FR-08 Submission

TU dapat submit kegiatan untuk approval setelah semua validasi
terpenuhi.

### FR-09 Approval

Kepala Sekolah dapat approve/reject dengan catatan.

### FR-10 Finance Verification

Keuangan dapat memverifikasi anggaran, nominal, penerima, dan dokumen.

### FR-11 Payment

Keuangan dapat mencatat pembayaran dan mengunggah bukti.

### FR-12 Slip

Sistem dapat menghasilkan slip honor PDF.

### FR-13 Audit

Perubahan penting harus tercatat: siapa, kapan, aksi, data
sebelum/sesudah jika relevan.

## 7. Business Rules

1.  Hanya pegawai aktif yang dapat diberi penugasan baru.
2.  Tarif harus berasal dari master tarif aktif atau override yang
    memiliki otorisasi.
3.  Tarif dan volume pada honor yang sudah approved menjadi financial
    snapshot.
4.  Data transaksi yang sudah paid tidak boleh dihapus secara hard
    delete.
5.  Koreksi setelah approval menggunakan adjustment/revision dan audit
    trail.
6.  Kegiatan yang memiliki pembayaran tidak boleh dihapus.
7.  Nomor kegiatan dan nomor pembayaran harus unik dalam organisasi.
8.  Semua reject wajib memiliki alasan.
9.  Perubahan tarif master tidak mengubah transaksi historis.
10. Total pembayaran harus sama dengan total detail yang dibayarkan.
11. Bukti pembayaran wajib untuk status COMPLETED jika policy sekolah
    mengharuskannya.
12. Semua nominal menggunakan integer rupiah pada database.

## 8. Non-Functional Requirements

### Performance

-   Dashboard umum \< 3 detik pada beban normal.
-   Perhitungan honor 500 detail harus selesai dalam waktu singkat tanpa
    request timeout.

### Security

-   RBAC.
-   CSRF protection.
-   Password hashing.
-   Rate limiting.
-   Validasi upload.
-   Private document storage.
-   Authorization pada setiap resource.
-   Audit trail.

### Reliability

-   Backup database.
-   Transaction database untuk proses finansial.
-   Idempotency untuk proses pembayaran.
-   Soft delete untuk master yang aman diarsipkan.

### Scalability

Arsitektur harus memungkinkan: - multi-unit; - multi-school/tenant di
fase lanjut; - API; - queue; - Redis; - object storage.

## 9. Acceptance Criteria MVP

MVP dianggap berhasil jika:

-   TU dapat membuat kegiatan.
-   TU dapat menambahkan pegawai.
-   TU dapat memilih jenis honor.
-   Sistem menghitung honor dengan benar.
-   Sistem dapat mengontrol anggaran.
-   Kepala Sekolah dapat approve/reject.
-   Keuangan dapat memproses pembayaran.
-   Bukti pembayaran dapat disimpan.
-   Slip honor dapat dibuat.
-   Laporan dapat difilter.
-   Semua perubahan finansial penting memiliki audit trail.

## 10. Roadmap

### Phase 1

Core kegiatan + honor + approval + payment.

### Phase 2

Budget control, dokumen, notifikasi, Excel import/export, reporting
lanjutan.

### Phase 3

Template kegiatan, Honor Generator, PWA, multi-unit.

### Phase 4

Integration API, SendaGo integration, SIAKAD/HR integration, AI
analytics.

## 11. KPI

-   Waktu membuat pengajuan honor.
-   Persentase pengajuan tanpa revisi.
-   Error rate perhitungan.
-   Waktu approval.
-   Waktu pembayaran.
-   Jumlah kegiatan yang diproses.
-   Total honor yang diproses.
-   Persentase pembayaran terdokumentasi.

## 12. Prinsip Produk

VAKASI harus sederhana bagi TU tetapi kuat untuk audit dan keuangan.

**Simple input. Automatic calculation. Controlled approval. Traceable
payment.**
