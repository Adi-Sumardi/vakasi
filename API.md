# VAKASI --- API Specification

## 1. API Principles

-   RESTful.
-   Versioned.
-   JSON request/response.
-   Authorization berbasis role dan policy.
-   Business logic berada di service layer.
-   API tidak mengakses database secara langsung.
-   Financial endpoints harus transactional dan idempotent bila
    diperlukan.

Base URL:

``` text
/api/v1
```

## 2. Authentication

**Metode: Laravel Sanctum --- SPA Authentication (cookie-based
session).**

Prasyarat: Next.js frontend dan Laravel API di-deploy pada subdomain
dari root domain yang sama (mis. `app.vakasi.sch.id` dan
`api.vakasi.sch.id`). Dengan ini, token/session **tidak pernah
tersimpan atau terbaca oleh JavaScript di browser** (httpOnly cookie),
sehingga aman dari pencurian via XSS, dan CSRF protection didapat
otomatis dari Sanctum.

Alur:

``` text
1. GET  /sanctum/csrf-cookie
      → Laravel set cookie XSRF-TOKEN + session cookie httpOnly

2. POST /api/v1/auth/login
      → validasi kredensial, set session cookie httpOnly; Secure; SameSite=Lax

3. Request berikutnya (GET/POST/dst)
      → browser otomatis kirim cookie (fetch dengan credentials: 'include')
      → non-GET request wajib sertakan header X-XSRF-TOKEN dari cookie XSRF-TOKEN

4. POST /api/v1/auth/logout
      → invalidate session di server (bukan sekadar hapus cookie di client)
```

Konfigurasi wajib di Laravel: `SANCTUM_STATEFUL_DOMAINS` diisi domain
Next.js, CORS `supports_credentials = true`.

Di Next.js (App Router): Client Component memakai
`credentials: 'include'` pada fetch; Server Component/Route Handler
harus meneruskan cookie request masuk (via `cookies()` dari
`next/headers`) ke header `Cookie` saat fetch ke Laravel, karena cookie
browser tidak otomatis ikut pada fetch sisi server.

Endpoint:

``` http
GET  /sanctum/csrf-cookie
POST /auth/login
POST /auth/logout
GET  /auth/me
POST /auth/forgot-password
POST /auth/reset-password
```

Contoh login:

``` json
{
  "email": "user@example.com",
  "password": "********"
}
```

Aturan tambahan: - rate limiting login (mis. 5x/menit per email/IP); -
login gagal dan logout dicatat di audit_logs; - RBAC/Policy tetap
ditegakkan sepenuhnya di Laravel (server-side) --- proteksi route di
Next.js middleware hanya untuk UX redirect, bukan lapisan otorisasi
utama.

## 3. Employees

``` http
GET    /employees
POST   /employees
GET    /employees/{id}
PUT    /employees/{id}
PATCH  /employees/{id}/status
```

Filter:

``` text
?status=active
?unit_id=1
?employee_type=guru
?search=budi
```

## 4. Activities

``` http
GET    /activities
POST   /activities
GET    /activities/{id}
PUT    /activities/{id}
DELETE /activities/{id}
POST   /activities/{id}/submit
POST   /activities/{id}/cancel
```

## 5. Activity Members

``` http
GET    /activities/{id}/members
POST   /activities/{id}/members
PUT    /activities/{id}/members/{memberId}
DELETE /activities/{id}/members/{memberId}
```

## 6. Honor

``` http
GET  /honor-types
POST /honor-types
GET  /honor-rates
POST /honor-rates

POST /activities/{id}/calculate-honor
GET  /activities/{id}/honors
```

Calculation request:

``` json
{
  "items": [
    {
      "employee_id": 10,
      "honor_type_id": 2,
      "volume": 8
    }
  ]
}
```

Response:

``` json
{
  "gross_amount": 200000,
  "tax_amount": 0,
  "deduction_amount": 0,
  "net_amount": 200000
}
```

## 7. Approval

``` http
GET  /approvals
GET  /activities/{id}/approvals
POST /activities/{id}/approve
POST /activities/{id}/reject
```

Reject:

``` json
{
  "notes": "Mohon koreksi volume pengawas."
}
```

## 8. Payments

``` http
GET  /payments
POST /payments
GET  /payments/{id}
POST /payments/{id}/process
POST /payments/{id}/evidence
POST /payments/{id}/complete
```

## 9. Reports

``` http
GET /reports/activities
GET /reports/honors
GET /reports/employees/{id}/honors
GET /reports/budget
GET /reports/payments
```

Parameters:

``` text
?start_date=2026-09-01
&end_date=2026-09-30
&unit_id=1
&status=completed
```

## 10. Documents

``` http
GET  /activities/{id}/documents
POST /activities/{id}/documents
GET  /documents/{id}/download
```

Document download harus melalui authorization, bukan public path.

## 11. Standard Response

Success:

``` json
{
  "success": true,
  "message": "Data berhasil diproses.",
  "data": {}
}
```

Error:

``` json
{
  "success": false,
  "message": "Data tidak valid.",
  "errors": {
    "volume": [
      "Volume harus lebih besar dari 0."
    ]
  }
}
```

## 12. HTTP Status

-   200 OK
-   201 Created
-   204 No Content
-   400 Bad Request
-   401 Unauthorized
-   403 Forbidden
-   404 Not Found
-   409 Conflict
-   422 Unprocessable Entity
-   500 Internal Server Error

## 13. Future Integration API

Untuk integrasi SendaGo:

``` text
GET /integration/employees
GET /integration/units
POST /integration/sync
```

Integrasi menggunakan external ID dan tidak menggunakan shared database.
