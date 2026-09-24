# VAKASI --- Business & System Flow

## 1. Core Flow

``` mermaid
flowchart TD
    A[Mulai] --> B[TU Membuat Kegiatan]
    B --> C[Pilih Jenis Kegiatan]
    C --> D[Isi Detail Kegiatan]
    D --> E[Tentukan Anggaran & Sumber Dana]
    E --> F[Tambahkan Peserta/Penugasan]
    F --> G[Pilih Jenis Honor]
    G --> H[Input Volume / Jam / Hari]
    H --> I[Honor Engine Menghitung]
    I --> J{Validasi}
    J -- Tidak Valid --> K[Perbaiki Data]
    K --> F
    J -- Valid --> L[Submit Pengajuan]
    L --> M{Approval Kepala Sekolah}
    M -- Reject --> N[Revisi oleh TU]
    N --> F
    M -- Approve --> O[Verifikasi Keuangan]
    O --> P{Valid?}
    P -- Tidak --> N
    P -- Ya --> Q[Proses Pembayaran]
    Q --> R[Upload Bukti Pembayaran]
    R --> S[Generate Slip Honor]
    S --> T[Update Status Completed]
    T --> U[Laporan & Audit Trail]
    U --> V[Selesai]
```

## 2. Swimlane

``` mermaid
flowchart LR
    subgraph TU["TU / Admin"]
        A[Create Activity]
        B[Assign Employee]
        C[Input Volume]
        D[Submit]
        E[Revise]
    end

    subgraph SYS["System"]
        F[Calculate Honor]
        G[Validate]
        H[Generate Documents]
        I[Notification]
        J[Audit Log]
    end

    subgraph HEAD["Kepala Sekolah"]
        K[Review]
        L[Approve / Reject]
    end

    subgraph FIN["Keuangan"]
        M[Verify Budget]
        N[Process Payment]
        O[Upload Evidence]
    end

    A --> B --> C --> F --> G --> D --> K
    G --> J
    K --> L
    L -- Reject --> E --> B
    L -- Approve --> M --> N --> O --> H
    O --> J
    H --> I
```

## 3. Status Lifecycle

``` text
DRAFT
  ↓
SUBMITTED
  ↓
APPROVED
  ↓
VERIFIED
  ↓
PROCESSING
  ↓
PAID
  ↓
COMPLETED
```

Reject:

``` text
SUBMITTED → REJECTED → DRAFT
```

## 4. Activity Creation Flow

1.  TU membuat kegiatan.
2.  Sistem membuat nomor kegiatan.
3.  TU memilih jenis kegiatan.
4.  TU menentukan periode.
5.  TU memilih unit dan sumber dana.
6.  TU mengisi anggaran.
7.  TU menyimpan sebagai DRAFT.

## 5. Honor Calculation Flow

``` text
Jenis Honor
    ↓
Tarif Aktif
    ↓
Volume
    ↓
Rate × Volume
    ↓
Gross Honor
    ↓
Potongan / Pajak
    ↓
Net Honor
```

## 6. Approval Flow

-   Hanya user berwenang yang dapat approve.
-   Reject wajib memiliki alasan.
-   Approval dicatat sebagai immutable log.
-   Perubahan setelah approval harus melalui revision/adjustment.

## 7. Payment Flow (DORMAN --- tidak dipakai)

> **Lingkup VAKASI berhenti di approval Kepala Sekolah.** Pencairan
> sesungguhnya terjadi di Sianggar setelah SDM mengunduh data dari menu
> "Vakasi" di SiHaris (section 8). Modul Payment di bawah ini tetap ada
> di kode tapi non-aktif di balik `config('vakasi.payment_module')`
> (default `false`), disiapkan seandainya VAKASI nanti diminta mencatat
> ulang status pencairan hasil sinkron dari Sianggar. Status akhir
> kegiatan di VAKASI adalah **APPROVED**.

``` text
APPROVED
   ↓
Finance Verification  (POST /payments)      → activity VERIFIED
   ↓
Payment Details
   ↓
Process               (POST .../process)    → activity PROCESSING
   ↓
Upload Evidence       (POST .../evidence)
   ↓
Complete              (POST .../complete)   → PAID → COMPLETED
   ↓
Slip + Report
```

Verifikasi dan pencairan adalah dua langkah terpisah: setelah
`POST /payments` belum ada uang yang berpindah, sehingga Keuangan masih
dapat memeriksa nominal dan penerima. Selama pembayaran belum PAID,
`POST /payments/{id}/cancel` (wajib menyertakan alasan) mengembalikan
kegiatan ke APPROVED dan menandai pembayaran `cancelled` --- baris
pembayaran tidak pernah dihapus (BR-04).

## 8. Downstream Integration Flow (SiHaris & Sianggar)

Alur bisnis nyata tidak berhenti di COMPLETED (section 3/7) ---
VAKASI adalah satu mata rantai dari proses pencairan honor yang
sebenarnya berlanjut ke dua aplikasi lain milik ekosistem yang sama.

**Status implementasi (2026-09-14):** langkah 1 (QR Code approval)
sudah dibangun dan berjalan murni di sisi VAKASI. Langkah 2--4 (menu
"Vakasi" di SiHaris, unduh oleh SDM, pengajuan pencairan di Sianggar)
**belum diimplementasikan** --- didokumentasikan di sini sebagai
referensi untuk perancangan integrasi selanjutnya (lihat
AI_CODING_RULES.md 18 --- flag ambiguity daripada menebak diam-diam).

``` text
TU input data kegiatan + honor (VAKASI)
        ↓
Kepala Sekolah approve (VAKASI)
        ↓
Generate QR Code bukti approval
        ↓
Data otomatis muncul di menu "Vakasi" --- aplikasi SiHaris
        ↓
SDM mengunduh data dari SiHaris
        ↓
SDM mengajukan pencairan dana --- aplikasi Sianggar
```

Detail per langkah:

1.  **QR Code approval** (✅ selesai) --- begitu Kepala Sekolah
    approve, sistem membuat kode verifikasi unik (`verification_code`,
    40 karakter acak, di-generate sekali di `ApprovalService::approve`)
    dan QR code (`endroid/qr-code`) yang mengarah ke URL verifikasi
    publik `{FRONTEND_URL}/verify/{code}` --- tanpa login, mirip pola
    verifikasi ijazah/sertifikat online (`GET /api/v1/public/verify/{code}`
    dan `/qrcode`, di luar `auth:sanctum`, menampilkan nomor dokumen
    approval (`approval_document_number`, format `SK-{tahun}-{urut}`),
    kode/nama/jenis kegiatan, sumber dana, unit, lokasi, status,
    tanggal, approver, dan daftar nama+peran peserta --- tidak pernah
    nominal honor atau anggaran). QR yang sama juga tercetak di slip honor PDF.
    QR ini murni tanggung jawab VAKASI dan tidak bergantung pada
    SiHaris/Sianggar.
2.  **Menu "Vakasi" di SiHaris** --- data kegiatan yang sudah
    disetujui (dan idealnya sudah lengkap: honor detail, dokumen,
    QR code) harus "otomatis muncul" di sebuah menu bernama "Vakasi"
    di dalam aplikasi SiHaris. **Sudah diputuskan: webhook push.**
    `ApprovalService::approve()` men-dispatch
    `PushApprovedActivityToSiHaris` (queued, `afterCommit`) yang
    mengirim payload ke `SIHARIS_WEBHOOK_URL`. Body ditandatangani
    HMAC-SHA256 dengan `SIHARIS_WEBHOOK_SECRET` dan dikirim sebagai
    header `X-Vakasi-Signature` --- skema yang sama dengan webhook
    mesin fingerprint milik SiHaris. `X-Idempotency-Key` berisi
    `activity_code` agar pengiriman ulang tidak membuat entri ganda.

    Hasil pengiriman dicatat di kolom `activities.siharis_status`
    (`pending`/`sent`/`failed`/`skipped`), `siharis_synced_at`,
    `siharis_attempts`, dan `siharis_last_error`, ditampilkan di kartu
    "Pengiriman ke SiHaris" pada halaman detail kegiatan. Pengiriman
    yang gagal dapat diulang lewat menu Integrasi → Kirim ke SiHaris
    (`permission:integration.manage`). Job mencoba 5 kali dengan
    backoff 1/5/15/30 menit; kegagalan tidak pernah membatalkan
    approval yang sudah tercatat.
3.  **Unduh oleh SDM** --- staf SDM (HR), bukan role yang dikenal di
    ROLE_PERMISSION.md saat ini, mengunduh data dari SiHaris untuk
    diajukan ke Sianggar.
4.  **Pencairan dana via Sianggar** --- **sudah diputuskan**:
    pencairan sesungguhnya terjadi di Sianggar, bukan di VAKASI.
    Modul Payment VAKASI karena itu dinonaktifkan (section 7) dan
    status akhir kegiatan di VAKASI adalah APPROVED.

Catatan: ARSITEKTUR.md section 11 sudah menyebut integrasi masa
depan dengan "SendaGo" (HR/Core) --- belum jelas apakah SendaGo dan
SiHaris adalah sistem yang sama (rebrand) atau dua sistem berbeda;
perlu konfirmasi sebelum desain integrasi dimulai.

## 9. Error & Exception

-   Tarif tidak ditemukan → pengajuan tidak dapat disubmit.
-   Pegawai nonaktif → tidak dapat diberi penugasan baru.
-   Anggaran tidak cukup → warning atau hard block sesuai policy.
-   Duplikasi penugasan → ditolak.
-   Bukti pembayaran tidak valid → payment tetap PROCESSING.
-   Pembayaran perlu dibatalkan sebelum cair → `cancel` dengan alasan;
    kegiatan kembali ke APPROVED, pembayaran menjadi CANCELLED.
-   Pembayaran gagal → status PAYMENT_FAILED dan dapat diproses ulang
    dengan audit trail.

## 10. Notification Flow

Trigger: - submit; - approval; - reject; - verification; - payment; -
completion.

Channel MVP: - in-app.

Channel lanjutan: - email; - WhatsApp.
