# VAKASI --- Technical Stack

## 1. Recommended Stack

VAKASI dibangun sebagai standalone modular monolith.

### Backend

-   PHP 8.3+
-   Laravel 13.x, dijalankan sebagai REST API backend (API-only, tanpa Blade untuk UI utama).

### Authentication

-   Laravel Sanctum --- SPA Authentication (cookie-based session, httpOnly + CSRF protection).
-   Prasyarat: Next.js frontend dan Laravel API di-deploy pada subdomain dari root domain yang sama. Detail alur lihat API.md section 2.

### Database

-   MySQL 8.x

### Frontend

-   Next.js (App Router), dijalankan sebagai aplikasi terpisah yang mengonsumsi REST API Laravel.
-   shadcn/ui + Tailwind CSS untuk komponen UI.

Backend dan frontend adalah dua deployable terpisah (decoupled), berkomunikasi murni via REST API (`/api/v1/*`). Blade tetap dapat dipakai secara terbatas untuk kebutuhan non-UI seperti template PDF (slip honor, kwitansi).

### PDF

-   DOMPDF-compatible Laravel package.

### Excel

-   Maatwebsite Laravel Excel.

### Queue

MVP: - database queue.

Scale: - Redis + queue worker.

### Cache

-   File/database pada MVP.
-   Redis pada production scale.

### Storage

MVP: - private local storage.

Production: - S3-compatible object storage.

## 2. Development Environment

Recommended: - Git - Composer - Node.js LTS - npm/pnpm - MySQL - PHP -
local development via Laravel Herd, Docker, atau environment PHP yang
konsisten. Next.js dijalankan sebagai project Node.js terpisah (repo
sama atau terpisah, sesuai keputusan implementasi) dengan dev server
sendiri (`next dev`), dikonfigurasi menunjuk ke base URL API Laravel
via environment variable (mis. `NEXT_PUBLIC_API_URL`).

## 3. Coding Standards

-   PSR-12.
-   Laravel conventions.
-   Thin controllers.
-   Form Request untuk validation.
-   Policy untuk authorization.
-   Service layer untuk business process.
-   Database transaction untuk financial operations.
-   Eloquent untuk persistence.
-   Migration untuk schema.
-   Seeder untuk master data.

## 4. Domain Services

``` text
ActivityService
HonorCalculationService
BudgetService
ApprovalService
PaymentService
DocumentService
ReportService
NotificationService
AuditService
```

## 5. Testing

### Unit Test

Wajib untuk: - Honor Engine. - Budget calculation. - Status
transition. - Tax/deduction calculation.

### Feature Test

-   Create activity.
-   Submit.
-   Approve.
-   Reject.
-   Verify.
-   Payment.

### Security Test

-   unauthorized access;
-   role bypass;
-   document access;
-   payment endpoint;
-   IDOR protection.

### Frontend Test (Next.js)

-   component test untuk komponen shadcn/ui yang dikustomisasi (mis.
    Honor Table, Activity Wizard);
-   test untuk state form multi-step (Activity Wizard) dan validasi
    client-side;
-   tidak menduplikasi validasi bisnis yang sudah dites di backend ---
    fokus pada interaksi UI dan pemanggilan API yang benar.

## 6. Database Rules

-   Foreign key.
-   Unique constraints.
-   Index untuk kolom pencarian.
-   Decimal/integer strategy konsisten.
-   Soft delete hanya untuk master data yang relevan.
-   Financial transactions tidak di-hard-delete.

Untuk Rupiah tanpa pecahan, gunakan integer BIGINT/INT sesuai skala.

## 7. Git Strategy

``` text
main
  |
develop
  |
feature/*
bugfix/*
hotfix/*
```

Commit:

``` text
feat: add honor calculation engine
fix: prevent duplicate activity member
refactor: extract payment service
```

## 8. Environment

Contoh:

``` text
APP_ENV
APP_KEY
APP_URL

DB_HOST
DB_DATABASE
DB_USERNAME
DB_PASSWORD

QUEUE_CONNECTION
CACHE_STORE

FILESYSTEM_DISK

MAIL_*
WHATSAPP_*
```

Secrets tidak boleh masuk repository.

## 9. Production

Backend (Laravel API): - Linux VPS; - Nginx; - PHP-FPM; - MySQL; - SSL; -
supervisor/systemd untuk worker bila queue digunakan; - scheduled
backup.

Frontend (Next.js): - Node.js runtime (server-side rendering) atau
static export bila memungkinkan; - reverse proxy/SSL yang sama atau
terpisah dari backend; - environment variable API base URL per
environment (staging/production).

## 10. Deployment

Backend (Laravel API):

``` text
Git Push
   ↓
CI/CD
   ↓
Test
   ↓
Deploy
   ↓
Migration
   ↓
Cache Config/Route
   ↓
Restart Queue
```

Frontend (Next.js), dideploy terpisah dan independen dari backend:

``` text
Git Push
   ↓
CI/CD
   ↓
Test/Lint
   ↓
Build (next build)
   ↓
Deploy
```

## 11. Versioning

Aplikasi menggunakan semantic release discipline:

``` text
MAJOR.MINOR.PATCH
```

Database migrations harus backward-aware jika deployment membutuhkan
zero/minimal downtime.

## 12. Future

REST API sudah tersedia sejak MVP (lihat Authentication di atas dan
API.md). Tanpa mengubah core: - PWA; - Redis; - object storage; -
multi-tenant; - SendaGo integration; - WhatsApp; - AI analytics.
