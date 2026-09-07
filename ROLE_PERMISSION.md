# VAKASI --- Role & Permission Matrix

## 1. Roles

-   Super Admin
-   Admin
-   TU
-   Kepala Sekolah
-   Keuangan
-   Guru/Tendik
-   Auditor/Viewer

## 2. Permission Naming

Format:

``` text
module.action
```

Contoh:

``` text
activities.view
activities.create
activities.update
activities.submit
activities.approve
payments.process
reports.view
```

## 3. Permission Matrix

  -------------------------------------------------------------------------------------
  Permission        Super     Admin        TU    Kepala   Keuangan       Guru   Auditor
                    Admin                                                     
  ------------- --------- --------- --------- --------- ---------- ---------- ---------
  Dashboard             ✓         ✓         ✓         ✓          ✓          ✓         ✓

  Employees             ✓         ✓         ✓         ✓          ✓        Own         ✓
  View                                                                        

  Employees             ✓         ✓         ✓        \-         \-         \-        \-
  Manage                                                                      

  Activity View         ✓         ✓         ✓         ✓          ✓   Assigned         ✓

  Activity              ✓         ✓         ✓        \-         \-         \-        \-
  Create                                                                      

  Activity              ✓         ✓         ✓        \-         \-         \-        \-
  Update                                                                      

  Activity              ✓         ✓         ✓        \-         \-         \-        \-
  Submit                                                                      

  Activity              ✓        \-        \-         ✓         \-         \-        \-
  Approve                                                                     

  Honor Rate            ✓         ✓         ✓         ✓          ✓         \-         ✓
  View                                                                        

  Honor Rate            ✓         ✓         ✓        \-         \-         \-        \-
  Manage                                                                      

  Honor                 ✓         ✓         ✓        \-          ✓         \-        \-
  Calculation                                                                 

  Budget View           ✓         ✓         ✓         ✓          ✓         \-         ✓

  Budget Manage         ✓         ✓         ✓        \-          ✓         \-        \-

  Payment View          ✓         ✓         ✓         ✓          ✓        Own         ✓

  Payment               ✓        \-        \-        \-          ✓         \-        \-
  Process                                                                     

  Reports View          ✓         ✓         ✓         ✓          ✓        Own         ✓

  Documents             ✓         ✓         ✓         ✓          ✓        Own         ✓
  View                                                                        

  Documents             ✓         ✓         ✓        \-          ✓         \-        \-
  Manage                                                                      

  Audit View            ✓         ✓        \-         ✓          ✓         \-         ✓

  User Manage           ✓         ✓        \-        \-         \-         \-        \-
  -------------------------------------------------------------------------------------

## 4. Data Scope

### Super Admin

Semua data yang diizinkan organisasi.

### Admin

Semua data operasional sekolah.

### TU

Data kegiatan dan honor yang menjadi tanggung jawabnya.

### Kepala Sekolah

Read + approval.

### Keuangan

Financial verification + payment.

### Guru/Tendik

Hanya data pribadi dan kegiatan yang diikuti.

### Auditor

Read-only, termasuk audit trail.

## 5. Separation of Duties

Untuk keamanan finansial:

``` text
TU
  ≠
Approver
  ≠
Payment Processor
```

Default policy: - Pembuat pengajuan tidak boleh approve pengajuan
sendiri. - Approver tidak memproses payment yang sama jika sekolah
menerapkan segregation of duties. - Perubahan master tarif sebaiknya
dibatasi Admin.

## 6. Authorization Rules

Selain role, gunakan policy berdasarkan: - unit; - ownership; - status
transaksi; - workflow state.

Contoh:

``` text
TU boleh edit:
DRAFT

TU tidak boleh edit:
APPROVED
PAID
COMPLETED
```

## 7. Implementasi Teknis --- Sanctum Guard & Middleware

Autentikasi memakai Laravel Sanctum SPA (lihat API.md section 2).
Otorisasi berjalan berlapis di atas guard tersebut, empat lapis
berurutan sesuai AI_CODING_RULES.md section 6:

``` text
Authentication (auth:sanctum)
        ↓
Role check (middleware permission:module.action)
        ↓
Policy (ownership / unit scope / status transisi)
        ↓
Action (Controller memanggil Service)
```

### 7.1 Guard & Middleware Stack

`config/auth.php`: guard default API tetap `sanctum` (bukan `api`
token-based), karena autentikasi berbasis session cookie.

``` text
'guards' => [
    'web'     => ['driver' => 'session', 'provider' => 'users'],
    'sanctum' => ['driver' => 'sanctum', 'provider' => 'users'],
],
```

Route group `routes/api.php`:

``` text
Route::prefix('v1')
    ->middleware(['auth:sanctum'])
    ->group(function () {
        // semua route API terautentikasi didaftarkan di sini
    });
```

`EnsureFrontendRequestsAreStateful` (bawaan Sanctum) didaftarkan di
middleware group `api` agar request dari domain Next.js yang terdaftar
di `SANCTUM_STATEFUL_DOMAINS` diperlakukan sebagai request stateful
(cookie-based), bukan token.

### 7.2 Permission Middleware (module.action)

Tambahkan middleware alias `permission` yang membaca daftar permission
milik role user (dari tabel `role_permission`, lihat ERD.md) dan
membandingkan dengan nama permission yang dipasang di route:

``` text
Route::post('/activities/{id}/approve', [ActivityController::class, 'approve'])
    ->middleware('permission:activities.approve');
```

Middleware ini menolak dengan **403** (bukan 401 --- user sudah
terautentikasi, hanya tidak berwenang) jika permission tidak ada di
role user. Daftar permission per user di-eager-load sekali per request
(relasi `user->role->permissions`) untuk menghindari N+1 query, dan
dapat di-cache per role (bukan per user) karena permission melekat ke
role, bukan ke individu.

Permission ini dievaluasi **statis per route** (akses fitur), berbeda
dari Policy (7.3) yang mengevaluasi **kondisi objek** (data spesifik).

### 7.3 Policy Layer (object-level)

Middleware `permission` hanya menjawab "apakah role ini boleh
mengakses fitur ini". Aturan yang bergantung pada data spesifik ---
ownership, unit scope, status transisi, separation of duties --- wajib
ditangani Laravel Policy per model, didaftarkan di
`AuthServiceProvider`.

Contoh `ActivityPolicy`:

``` text
update(User $user, Activity $activity):
    - true jika $activity->status === DRAFT
      DAN ($user->hasRole('admin','super_admin')
           ATAU $activity->created_by === $user->id)
    - false untuk status lain (APPROVED, PAID, COMPLETED, dst.)

approve(User $user, Activity $activity):
    - true jika $user->hasPermission('activities.approve')
      DAN $activity->status === SUBMITTED
      DAN $activity->created_by !== $user->id   // separation of duties
```

Controller memanggil `$this->authorize('update', $activity)` sebelum
delegasi ke Service --- bukan mengecek `if ($user->role === 'tu')`
manual di Controller.

### 7.4 Data Scope (unit & ownership)

Untuk role dengan scope terbatas (Guru/Tendik = data pribadi, TU =
kegiatan miliknya, lihat section 4), scope diterapkan di level query,
bukan hanya di Policy tampilan detail --- gunakan Eloquent global scope
atau filter eksplisit di Service/Repository:

``` text
Guru/Tendik  -> query WHERE employee_id = $user->employee_id
TU           -> query WHERE created_by = $user->id  (atau unit_id sesuai kebijakan sekolah)
Auditor      -> tanpa filter, read-only di seluruh policy
```

Jangan mengandalkan filter di sisi frontend (Next.js) --- IDOR harus
dicegah di query backend, sesuai AI_CODING_RULES.md ("Jangan percaya
`employee_id`, `activity_id`, atau `payment_id` dari request hanya
karena user sudah login").

### 7.5 Response Status

``` text
401 Unauthorized  -> belum login / cookie sesi invalid/expired
403 Forbidden     -> sudah login, tapi permission/policy menolak
404 Not Found     -> dipakai untuk resource di luar data scope user
                     (hindari membocorkan keberadaan resource lewat 403
                     ketika seharusnya user bahkan tidak boleh tahu resource itu ada)
```

### 7.6 Testing

Selaras dengan TECHSTACK.md section 5 (Security Test): setiap
permission dan Policy baru wajib punya test untuk skenario role
bypass, IDOR (akses resource unit/employee lain), dan status transisi
yang seharusnya ditolak (mis. TU mencoba update activity yang sudah
APPROVED).
