# VAKASI --- AI Coding Rules

## 1. Mission

Dokumen ini menjadi aturan untuk AI coding agent yang mengembangkan
VAKASI.

Tujuan:

> Menghasilkan aplikasi yang stabil, aman, maintainable, dan sesuai
> domain finansial sekolah.

## 2. Golden Rules

1.  Jangan mengubah requirement bisnis tanpa persetujuan.
2.  Jangan membuat asumsi finansial tanpa dokumentasi.
3.  Jangan menaruh business logic penting di Controller.
4.  Jangan bypass authorization.
5.  Jangan menghapus financial transaction secara hard delete.
6.  Jangan mengubah historical honor karena master tarif berubah.
7.  Semua perubahan financial state harus audit-able.
8.  Jangan menggunakan shared database SendaGo.
9.  Jangan membuat dependency eksternal untuk MVP tanpa requirement.
10. Selalu buat migration untuk perubahan database.

## 3. Laravel Rules

-   Ikuti Laravel conventions.
-   Gunakan Form Request.
-   Gunakan Policy.
-   Gunakan Service.
-   Gunakan Eloquent relationship.
-   Hindari query N+1.
-   Gunakan eager loading jika diperlukan.
-   Gunakan database transaction pada financial workflow.
-   Jangan menaruh query kompleks berulang di banyak Controller.

## 4. Financial Rules

### Snapshot

Saat honor dibuat:

``` text
master rate → rate_snapshot
```

Setelah approved, rate_snapshot tidak boleh berubah melalui edit biasa.

### Formula

``` text
gross = rate_snapshot × volume
net = gross - tax - deduction
```

### Payment

Payment harus: - memiliki nomor unik; - memiliki detail; - memiliki
total; - memiliki actor; - memiliki timestamp; - memiliki bukti sesuai
policy.

## 5. Workflow Rules

Status transition hanya boleh melalui service:

``` text
DRAFT → SUBMITTED
SUBMITTED → APPROVED
SUBMITTED → REJECTED
APPROVED → VERIFIED
VERIFIED → PROCESSING
PROCESSING → PAID
PAID → COMPLETED
```

Jangan melakukan:

``` php
$activity->status = 'PAID';
```

secara langsung dari Controller.

Gunakan:

``` text
PaymentService
```

yang memvalidasi state transition dan mencatat audit.

## 6. Authorization

Selalu periksa:

``` text
Authentication
    ↓
Role
    ↓
Policy
    ↓
Ownership / Unit Scope
    ↓
Action
```

Jangan percaya `employee_id`, `activity_id`, atau `payment_id` dari
request hanya karena user sudah login.

## 7. Validation

Semua input user harus divalidasi.

Contoh: - volume numeric; - volume \> 0; - date valid; - employee
active; - honor type active; - rate active; - budget valid; - uploaded
file allowed.

## 8. Database

Setiap migration: - memiliki up; - memiliki down bila memungkinkan; -
foreign key; - index; - constraint.

Jangan menyimpan nominal sebagai string:

``` text
"Rp 25.000"
```

Simpan:

``` text
25000
```

## 9. API

API: - gunakan versioning; - gunakan Resource/Transformer; - validasi
request; - authorization; - consistent response; - jangan expose
sensitive fields.

## 10. Security

Jangan: - commit `.env`; - expose private storage; - trust client-side
validation; - disable CSRF tanpa alasan; - return stack trace
production; - log password/token.

File upload: - whitelist MIME; - size limit; - random storage name; -
private storage; - authorization saat download.

## 11. Testing Rules

Setiap business feature harus memiliki test.

Minimal untuk Honor Engine:

``` text
rate 25.000 × volume 8 = 200.000
```

Test juga: - zero volume; - negative volume; - missing rate; - changed
master rate; - tax; - deduction; - rounding.

## 12. UI Rules

-   Jangan membuat UI berbeda untuk pola yang sama.
-   Gunakan reusable component berbasis shadcn/ui, jangan reinvent
    komponen dasar (button, dialog, table, form) yang sudah tersedia.
-   Rupiah konsisten.
-   Status konsisten.
-   Confirmation untuk approval/payment.
-   Error message harus actionable.

## 13. Performance

Hindari: - N+1 query; - query di dalam API Resource/Transformer saat
serialisasi response; - load seluruh tabel tanpa pagination; - laporan
besar dalam satu memory-heavy request.

Gunakan: - pagination; - eager loading; - chunking; - queue untuk export
besar.

## 14. Change Protocol

Sebelum coding:

``` text
1. Baca PRD
2. Baca BRD
3. Baca ERD
4. Baca FLOW
5. Baca ROLE_PERMISSION
6. Baca TECHSTACK
7. Identifikasi affected modules
8. Buat plan
9. Implement
10. Test
```

## 15. Definition of Done

Feature selesai jika: - requirement terpenuhi; - validation tersedia; -
authorization tersedia; - migration tersedia; - test tersedia; - audit
tersedia jika relevan; - UI error state tersedia; - tidak ada
regression; - dokumentasi diperbarui.

## 16. Prohibited Shortcuts

Dilarang: - hardcode tarif; - hardcode role check di banyak tempat; -
bypass Policy; - direct status manipulation; - direct database edit
untuk transaksi; - menghapus data payment; - membuat shared database
integration; - menyimpan secret di source code.

## 17. Future Integration

Jika membuat field untuk integrasi:

``` text
external_system
external_id
```

Jangan: - membuat foreign key ke database SendaGo; - import seluruh
database SendaGo; - mengasumsikan SendaGo selalu tersedia.

## 18. AI Agent Output

Setiap perubahan besar harus menjelaskan: - files changed; - database
changes; - business impact; - security impact; - tests; - migration
requirement.

AI agent harus berhenti dan meminta keputusan jika requirement finansial
ambigu atau terdapat konflik antar dokumen.
