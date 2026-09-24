# VAKASI --- System Architecture

## 1. Architectural Goal

VAKASI harus: - standalone; - mudah dikembangkan; - aman untuk data
finansial; - mudah dipelihara; - integration-ready; - tidak bergantung
pada SendaGo pada fase awal.

## 2. Recommended Architecture

Backend Laravel tetap **Modular Monolith** (bukan microservices).
Frontend Next.js adalah aplikasi terpisah (decoupled) yang hanya
berkomunikasi dengan backend melalui REST API.

``` text
                    USERS
                      |
                  Web Browser
                      |
                 HTTPS / TLS
                      |
              Next.js Frontend
              (shadcn/ui, App Router)
                      |
                 REST API (JSON)
                      |
                Reverse Proxy
                      |
              VAKASI API BACKEND
              Modular Monolith (Laravel)
                      |
       +--------------+--------------+
       |              |              |
  API Layer       Application     Domain
       |            Services        |
       |              |             |
       +--------------+-------------+
                      |
                Infrastructure
       +--------------+--------------+
       |              |              |
     MySQL          Storage        Queue
       |              |              |
       |              |           Redis*
       |              |              |
       +--------------+--------------+
                      |
             Notification Services*
```

`*` optional pada MVP dan dapat diaktifkan saat kebutuhan meningkat.

## 3. Application Modules

``` text
app/
├── Modules/
│   ├── Authentication/
│   ├── Users/
│   ├── Employees/
│   ├── Activities/
│   ├── Honor/
│   ├── Budget/
│   ├── Approval/
│   ├── Payment/
│   ├── Documents/
│   ├── Reports/
│   ├── Notifications/
│   └── Audit/
```

Pendekatan modular menjaga domain tetap terpisah walaupun deployment
masih satu aplikasi.

## 4. Technology Stack

### Backend

-   PHP 8.3+
-   Laravel 13.x, berperan sebagai REST API backend (API-only).

### Database

-   MySQL 8.x

### Frontend

-   Next.js (App Router), aplikasi terpisah yang mengonsumsi REST API
    Laravel.
-   shadcn/ui + Tailwind CSS untuk komponen UI.

Blade tidak dipakai untuk UI aplikasi utama pada MVP; hanya untuk
kebutuhan non-UI seperti template PDF (slip honor, kwitansi).

### PDF

-   DOMPDF atau library PDF yang kompatibel dengan versi Laravel yang
    dipilih.

### Excel

-   Laravel Excel / Maatwebsite Excel.

### Queue

MVP: - database queue.

Scale: - Redis + queue worker.

### Storage

MVP: - local private storage.

Production: - S3-compatible object storage.

## 5. Layer Architecture

``` text
Controller
   ↓
Form Request / Validation
   ↓
Application Service
   ↓
Domain Logic
   ↓
Repository / Eloquent
   ↓
Database
```

Controller tidak boleh melakukan perhitungan honor.

Contoh:

``` text
HonorController
      ↓
HonorCalculationService
      ↓
Honor Engine
      ↓
HonorDetail
```

## 6. Honor Engine

Honor Engine merupakan domain penting.

Input:

``` text
employee
honor_type
rate
volume
tax
deduction
```

Output:

``` text
gross
tax
deduction
net
```

Contoh:

``` text
Rate   = 25.000
Volume = 8

Gross = 25.000 × 8
      = 200.000
```

Engine harus deterministic: input yang sama menghasilkan output yang
sama.

## 7. Approval Engine

Gunakan status transition yang eksplisit.

``` text
DRAFT
  |
  v
SUBMITTED
  |
  +---- REJECTED ----> DRAFT
  |
  v
APPROVED
  |
  v
VERIFIED
  |
  v
PROCESSING
  |
  v
PAID
  |
  v
COMPLETED
```

Setiap transition: - divalidasi; - di-authorize; - dicatat di audit log.

## 8. Payment Architecture

Payment bukan sekadar update status.

Flow:

``` text
Approved Honor
      |
      v
Finance Verification
      |
      v
Create Payment
      |
      v
Create Payment Details
      |
      v
Process Payment
      |
      v
Upload Evidence
      |
      v
Mark PAID
      |
      v
Generate Slip / Report
```

Semua operasi finansial penting harus menggunakan database transaction.

## 9. Document Architecture

Dokumen tidak disimpan sebagai public URL.

``` text
Browser
   |
   v
Authorization
   |
   v
Document Controller
   |
   v
Private Storage
```

Jenis: - surat tugas; - daftar honor; - slip; - bukti transfer; -
kwitansi; - dokumen kegiatan.

## 10. API-First Design

REST API adalah satu-satunya jalur akses aplikasi utama pada MVP —
Next.js frontend mengonsumsi API ini sepenuhnya, tidak ada Blade untuk
UI aplikasi. Karena itu API harus solid sejak awal (versioned,
authorized, konsisten), bukan sekadar "disiapkan untuk nanti".

``` text
                 VAKASI
                    |
              REST API (/api/v1)
                    |
              Application
                 Services
                    |
                 Domain
                    |
                 MySQL
                    |
             Next.js Frontend
             (consumer, terpisah)
```

API tersedia sejak MVP:

``` text
/api/v1/auth
/api/v1/employees
/api/v1/activities
/api/v1/honor-types
/api/v1/honor-rates
/api/v1/honors
/api/v1/approvals
/api/v1/payments
/api/v1/reports
```

## 11. Integration Architecture --- Future

Jangan integrasikan database langsung.

Gunakan API/integration layer:

``` text
                    VAKASI
                       |
                  Integration API
                       |
             +---------+---------+---------+
             |                   |         |
          SendaGo              SIAKAD   SiHaris / Sianggar
             |                   |         |
          HR / Core           Akademik   HR & Pencairan Dana
```

Future identity mapping:

``` text
VAKASI employee_id
        |
        +-- external_system = SENDAGO
        |
        +-- external_id = xxxx
```

### 11.1 SiHaris & Sianggar --- alur pencairan honor nyata

Didokumentasikan per FLOW.md section 8. QR code approval + endpoint
verifikasi publik sudah diimplementasikan (lihat di bawah); ekspor
data ke menu "Vakasi" di SiHaris dan pengajuan pencairan di Sianggar
belum. Ini berarti VAKASI bukan hanya API-first untuk frontend
Next.js-nya sendiri (section 10), tapi ke depan juga harus menjadi
sumber data bagi sistem eksternal --- desain integrasi konkretnya
(push via webhook vs. SiHaris polling API baru vs. mekanisme lain)
belum ditentukan.

**QR code approval (✅ diimplementasikan):**

-   `activities.verification_code` (string(40), unique, nullable) ---
    diisi sekali oleh `ApprovalService::approve()`, `Str::random(40)`,
    unguessable karena membuka endpoint publik tanpa autentikasi.
-   `activities.approval_document_number` (string, unique, nullable,
    format `SK-{tahun}-{urut}`) --- nomor referensi dokumen approval,
    juga diisi sekali saat approve, terpisah dari verification_code
    (opaque) dan activity_code (dibuat saat kegiatan dibuat, sebelum
    ada approval).
-   `QrCodeService` (`app/Services/QrCodeService.php`, membungkus
    `endroid/qr-code`) meng-generate PNG dari sebuah URL, tidak pernah
    dari data mentah.
-   `PublicVerificationController` (routes/api.php, **di luar**
    grup `auth:sanctum`, dengan `throttle:30,1`):
    -   `GET /api/v1/public/verify/{code}` --- JSON berisi
        activity_code, approval_document_number, name, activity_type,
        fund_source, unit, location, status, start_date, end_date,
        approved_at, approved_by, dan members (nama + peran peserta
        saja). **Tidak pernah** honor amount, budget, atau data bank
        pegawai.
    -   `GET /api/v1/public/verify/{code}/qrcode` --- PNG QR yang
        mengarah ke `{FRONTEND_URL}/verify/{code}`.
-   Frontend: `frontend/src/app/verify/[code]/page.tsx` (Server
    Component publik, dikecualikan dari redirect-login di `proxy.ts`)
    dan kartu "Bukti Approval" di halaman detail kegiatan. QR yang
    sama juga tercetak di slip honor PDF (`HonorController::slip`).

**Push ke SiHaris (✅ diimplementasikan):**

-   `ApprovalService::approve()` men-dispatch
    `PushApprovedActivityToSiHaris` (`ShouldQueue`, `afterCommit`,
    `tries=5`, backoff 60/300/900/1800 detik).
-   `SiHarisService` menyusun payload (kegiatan + nomor SK + URL
    verifikasi + rincian honor per pegawai **termasuk data rekening**,
    karena Sianggar membayar berdasarkan itu) lalu mem-POST-nya ke
    `SIHARIS_WEBHOOK_URL`.
-   Autentikasi: HMAC-SHA256 atas raw body dengan
    `SIHARIS_WEBHOOK_SECRET`, dikirim sebagai `X-Vakasi-Signature`
    (skema yang sama dengan webhook fingerprint milik SiHaris).
    `X-Idempotency-Key` = `activity_code`.
-   Hasil disimpan di `activities.siharis_status`, `siharis_synced_at`,
    `siharis_attempts`, `siharis_last_error` dan ditampilkan di UI.
    Pemulihan manual lewat `/api/v1/integrations/siharis/*`
    (`permission:integration.manage`).
-   Bila `SIHARIS_WEBHOOK_URL` kosong, push dilewati
    (`siharis_status = skipped`) --- lingkungan lokal/test tidak pernah
    memanggil keluar secara tidak sengaja.

Pertanyaan terbuka yang masih perlu dijawab:

-   Apakah "SendaGo" pada diagram di atas adalah sistem yang sama
    dengan "SiHaris", atau dua sistem berbeda?
-   **Terjawab:** pencairan terjadi di Sianggar, bukan di VAKASI.
    Modul Payment VAKASI (section 8) dinonaktifkan di balik
    `config('vakasi.payment_module')` dan status akhir kegiatan di
    VAKASI adalah APPROVED. Bila nanti VAKASI diminta mencerminkan
    status pencairan dari Sianggar, modul itu tinggal diaktifkan
    kembali sebagai pencatatan lokal hasil sinkron --- bukan sebagai
    source of truth.
-   Autentikasi/otorisasi apa yang dipakai SiHaris untuk menarik
    data dari VAKASI (service-to-service token, API key, OAuth)?

## 12. Deployment

### MVP

``` text
Internet
   |
Cloudflare / Reverse Proxy
   |
   +--------------------+--------------------+
   |                                         |
app.vakasi.<domain>                  api.vakasi.<domain>
Next.js (Node runtime)                  Nginx
   |                                         |
   |                                     PHP-FPM
   |                                         |
   |                                     Laravel
   |                                         |
   +------------ REST API (JSON) ------- MySQL
   (cookie httpOnly, same root domain --- lihat API.md section 2)
```

Frontend (Next.js) dan backend (Laravel) adalah dua proses/deployable
terpisah pada subdomain yang sama, masing-masing dapat di-deploy dan
di-scale independen.

### Production scale

``` text
Internet
   |
Load Balancer
   |
   +----------------------+----------------------+
   |                                             |
Next.js App Server 1/2                App Server 1       App Server 2
(app.vakasi.<domain>)                 (api.vakasi.<domain>)
                                              |
                                            Redis
                                              |
                                          Queue Worker
                                              |
                                          +---+---+
                                          |       |
                                       MySQL    Object Storage
```

## 13. Security Architecture

-   HTTPS.
-   Authentication via Laravel Sanctum SPA (cookie httpOnly, bukan token di localStorage) --- lihat API.md section 2.
-   RBAC.
-   CSRF protection.
-   Secure password hashing.
-   Session security.
-   Rate limiting.
-   File MIME/extension validation.
-   Private storage.
-   Authorization policy.
-   Audit logging.
-   Database backup.
-   Least privilege database user.
-   Secrets melalui environment variables.

## 14. Backup

Minimal: - daily database backup; - retention policy; - backup
verification; - document backup; - restore procedure.

Jangan menganggap backup berhasil hanya karena file backup tercipta.
Restore test harus dilakukan berkala.

## 15. Observability

Fase awal: - application log; - failed jobs; - audit log.

Fase scale: - centralized logs; - error tracking; - uptime monitoring; -
queue monitoring; - database metrics.

## 16. Development Principles

### Principle 1

Financial logic berada di service/domain layer.

### Principle 2

Tidak ada hard delete untuk financial transaction.

### Principle 3

Master data tidak boleh merusak historical transaction.

### Principle 4

Approval selalu memiliki audit trail.

### Principle 5

API tidak boleh langsung mengakses database tanpa business layer.

### Principle 6

VAKASI harus dapat berjalan tanpa SendaGo.

## 17. Recommended Project Structure

Backend (Laravel API-only):

``` text
app/
├── Http/
│   ├── Controllers/Api/V1/
│   ├── Requests/
│   ├── Resources/
│   └── Middleware/
├── Models/
├── Services/
│   ├── ActivityService.php
│   ├── HonorCalculationService.php
│   ├── BudgetService.php
│   ├── ApprovalService.php
│   ├── PaymentService.php
│   ├── DocumentService.php
│   └── ReportService.php
├── Policies/
├── Jobs/
└── Notifications/

database/
├── migrations/
├── seeders/
└── factories/

resources/
└── views/          (khusus template PDF, mis. slip honor)

routes/
└── api.php          (routes/web.php minimal, hanya untuk healthcheck/redirect)
```

Frontend (Next.js, project/repo terpisah):

``` text
app/                 (App Router: routes & pages)
components/
├── ui/              (shadcn/ui components)
└── ...
lib/
├── api/             (API client, fetch wrappers per module)
└── ...
hooks/
```

## 18. Architecture Decision Record

### ADR-001: Modular Monolith

Dipilih karena MVP lebih cepat dikembangkan dan dioperasikan daripada
microservices.

### ADR-002: Standalone

Dipilih agar VAKASI dapat divalidasi sebagai produk independen.

### ADR-003: Snapshot Financial Data

Dipilih untuk menjaga histori honor ketika tarif master berubah.

### ADR-004: API Later (superseded oleh ADR-006)

~~API disiapkan secara arsitektural tetapi tidak menjadi dependency
MVP.~~ Digantikan oleh ADR-006: karena frontend menggunakan Next.js
(app terpisah), REST API menjadi dependency MVP sejak hari pertama,
bukan opsi masa depan.

### ADR-005: Integration Through API

Integrasi masa depan dilakukan melalui contract/API, bukan shared
database.

### ADR-006: Decoupled Frontend (Next.js + shadcn/ui)

Dipilih agar frontend dapat berkembang independen dari backend, dengan
DX modern (React Server Components, shadcn/ui) tanpa terikat siklus
rilis Blade. Konsekuensi: Laravel backend wajib API-only sejak MVP
(lihat ADR-004), dan setiap fitur baru harus diekspos lewat
`/api/v1/*` sebelum bisa dipakai di UI.

## 19. Evolution Path

``` text
Stage 1
Standalone Modular Monolith
        |
        v
Stage 2
Pilot Schools
        |
        v
Stage 3
VAKASI SaaS / Multi Unit
        |
        v
Stage 4
Public API + Integration Layer
        |
        v
Stage 5
SendaGo Ecosystem
```

## 20. Final Architecture Principle

> Build VAKASI as an independent product today, but design its
> boundaries as if integration will happen tomorrow.
