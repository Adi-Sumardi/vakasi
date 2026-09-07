# VAKASI --- Entity Relationship Diagram

## 1. Database Principles

1.  Financial transaction menggunakan snapshot tarif.
2.  Data historis tidak boleh berubah karena master data berubah.
3.  Transaction menggunakan foreign key.
4.  Financial records tidak di-hard-delete.
5.  Semua tabel transaksi memiliki timestamp.
6.  Audit log bersifat append-only.

## 2. Core Entities

``` text
users
roles
permissions
role_permission
employees
positions
units
activity_types
activities
activity_members
honor_types
honor_rates
honor_details
fund_sources
budgets
budget_details
approvals
approval_logs
payments
payment_details
documents
notifications
audit_logs
```

## 3. Mermaid ERD

``` mermaid
erDiagram
    roles ||--o{ users : assigns
    roles ||--o{ role_permission : has
    permissions ||--o{ role_permission : grants

    units ||--o{ employees : contains
    positions ||--o{ employees : has

    activity_types ||--o{ activities : categorizes
    units ||--o{ activities : owns
    fund_sources ||--o{ activities : funds

    activities ||--o{ activity_members : has
    employees ||--o{ activity_members : assigned

    honor_types ||--o{ honor_rates : defines
    activity_members ||--o{ honor_details : generates
    honor_types ||--o{ honor_details : uses

    budgets ||--o{ budget_details : contains
    activities ||--o| budgets : controls

    activities ||--o{ approvals : requires
    approvals ||--o{ approval_logs : records

    activities ||--o{ payments : receives
    payments ||--o{ payment_details : contains
    employees ||--o{ payment_details : receives

    activities ||--o{ documents : attaches
    payments ||--o{ documents : attaches

    users ||--o{ audit_logs : creates
```

## 4. Table Definitions

### users

``` text
id PK
role_id FK
name
email UNIQUE
password
status
last_login_at
created_at
updated_at
```

### roles

``` text
id PK
name UNIQUE
description
created_at
updated_at
```

### permissions

``` text
id PK
name UNIQUE
module
action
description
created_at
updated_at
```

`name` mengikuti format `module.action` (lihat ROLE_PERMISSION.md
section 2), mis. `activities.approve`, `payments.process`.

### role_permission

``` text
id PK
role_id FK
permission_id FK
created_at
```

`UNIQUE(role_id, permission_id)`. Tabel pivot ini yang menjadi sumber
data Permission Matrix di ROLE_PERMISSION.md, di-seed saat instalasi
dan dapat diubah Super Admin melalui menu Pengaturan tanpa perlu
deploy ulang kode.

### employees

``` text
id PK
unit_id FK
position_id FK
employee_code
nip NULL
nuptk NULL
name
employee_type
bank_name NULL
bank_account_name NULL
bank_account_number NULL
status
created_at
updated_at
deleted_at
```

### units

``` text
id PK
code UNIQUE
name
status
created_at
updated_at
```

### positions

``` text
id PK
code UNIQUE
name
status
created_at
updated_at
```

### activity_types

``` text
id PK
code UNIQUE
name
description
status
created_at
updated_at
```

### activities

``` text
id PK
activity_code UNIQUE
activity_type_id FK
unit_id FK
fund_source_id FK
name
description
start_date
end_date
location
budget_amount
pic_employee_id FK NULL
status
submitted_at NULL
approved_at NULL
completed_at NULL
created_by FK
created_at
updated_at
deleted_at
```

### activity_members

``` text
id PK
activity_id FK
employee_id FK
role_name
notes NULL
created_at
updated_at
```

Recommended unique constraint:

`UNIQUE(activity_id, employee_id, role_name)`

### honor_types

``` text
id PK
code UNIQUE
name
unit
description
status
created_at
updated_at
```

Contoh unit: `JAM`, `HARI`, `SISWA`, `PAKET`, `KEGIATAN`.

### honor_rates

``` text
id PK
honor_type_id FK
unit_id FK NULL
rate
effective_from
effective_to NULL
status
created_at
updated_at
```

### honor_details

``` text
id PK
activity_id FK
activity_member_id FK
employee_id FK
honor_type_id FK
rate_snapshot
volume
unit_snapshot
gross_amount
tax_amount
deduction_amount
net_amount
notes NULL
created_at
updated_at
```

Formula:

``` text
gross_amount = rate_snapshot × volume
net_amount = gross_amount - tax_amount - deduction_amount
```

### fund_sources

``` text
id PK
code UNIQUE
name
description
status
created_at
updated_at
```

### budgets

``` text
id PK
activity_id FK
budget_code
budget_amount
committed_amount
approved_amount
paid_amount
remaining_amount
status
created_at
updated_at
```

### budget_details

``` text
id PK
budget_id FK
category
description
planned_amount
approved_amount
realized_amount
created_at
updated_at
```

### approvals

``` text
id PK
activity_id FK
approval_type
sequence
approver_user_id FK
status
decision_at NULL
notes NULL
created_at
updated_at
```

### approval_logs

``` text
id PK
approval_id FK
action
from_status
to_status
notes NULL
acted_by FK
acted_at
```

### payments

``` text
id PK
payment_number UNIQUE
activity_id FK
payment_date
payment_method
source_account NULL
total_amount
reference_number NULL
status
processed_by FK
created_at
updated_at
```

### payment_details

``` text
id PK
payment_id FK
employee_id FK
honor_detail_id FK
amount
status
paid_at NULL
```

### documents

``` text
id PK
activity_id FK NULL
payment_id FK NULL
document_type
file_name
file_path
mime_type
file_size
uploaded_by FK
created_at
```

### notifications

``` text
id PK
user_id FK
type
title
message
read_at NULL
created_at
```

### audit_logs

``` text
id PK
user_id FK NULL
entity_type
entity_id
action
old_values JSON NULL
new_values JSON NULL
ip_address NULL
user_agent NULL
created_at
```

## 5. Important Indexes

-   users.email
-   employees.employee_code
-   employees.nip
-   activities.activity_code
-   activities.status
-   activities.start_date
-   honor_rates.honor_type_id + effective_from
-   honor_details.activity_id
-   honor_details.employee_id
-   approvals.activity_id + sequence
-   payments.payment_number
-   payments.payment_date
-   audit_logs.entity_type + entity_id
-   permissions.name
-   role_permission.role_id + permission_id

## 6. Financial Integrity

Untuk proses approval/payment gunakan database transaction.

Tidak boleh:

`PAID → DRAFT`

Tidak boleh mengubah: - rate_snapshot; - gross_amount; - net_amount; -
payment detail;

setelah payment completed tanpa mekanisme adjustment resmi.

## 7. Future Integration

Jangan menggunakan foreign key langsung ke database SendaGo.

Pada fase integrasi, tambahkan external reference:

``` text
external_system
external_id
```

Contoh:

``` text
employees.external_id
units.external_id
```

Dengan begitu VAKASI tetap standalone.
