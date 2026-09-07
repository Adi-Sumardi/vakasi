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

## 7. Payment Flow

``` text
APPROVED
   ↓
Finance Verification
   ↓
Create Payment
   ↓
Payment Details
   ↓
Process
   ↓
Upload Evidence
   ↓
PAID
   ↓
Slip + Report
```

## 8. Error & Exception

-   Tarif tidak ditemukan → pengajuan tidak dapat disubmit.
-   Pegawai nonaktif → tidak dapat diberi penugasan baru.
-   Anggaran tidak cukup → warning atau hard block sesuai policy.
-   Duplikasi penugasan → ditolak.
-   Bukti pembayaran tidak valid → payment tetap PROCESSING.
-   Pembayaran gagal → status PAYMENT_FAILED dan dapat diproses ulang
    dengan audit trail.

## 9. Notification Flow

Trigger: - submit; - approval; - reject; - verification; - payment; -
completion.

Channel MVP: - in-app.

Channel lanjutan: - email; - WhatsApp.
