<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;

class Activity extends Model
{
    use HasFactory, SoftDeletes;

    /**
     * Status lifecycle per FLOW.md section 3 / ARSITEKTUR.md section 7.
     * Transitions must only ever happen through ApprovalService /
     * PaymentService — never assign ->status directly elsewhere.
     */
    public const DRAFT = 'draft';

    public const SUBMITTED = 'submitted';

    public const REJECTED = 'rejected';

    public const APPROVED = 'approved';

    public const VERIFIED = 'verified';

    public const PROCESSING = 'processing';

    public const PAID = 'paid';

    public const COMPLETED = 'completed';

    protected $fillable = [
        'activity_code',
        'activity_type_id',
        'unit_id',
        'fund_source_id',
        'name',
        'description',
        'start_date',
        'end_date',
        'location',
        'budget_amount',
        'pic_employee_id',
        'status',
        'submitted_at',
        'approved_at',
        'completed_at',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'start_date' => 'date',
            'end_date' => 'date',
            'submitted_at' => 'datetime',
            'approved_at' => 'datetime',
            'completed_at' => 'datetime',
        ];
    }

    /** @return BelongsTo<ActivityType, $this> */
    public function activityType(): BelongsTo
    {
        return $this->belongsTo(ActivityType::class);
    }

    /** @return BelongsTo<Unit, $this> */
    public function unit(): BelongsTo
    {
        return $this->belongsTo(Unit::class);
    }

    /** @return BelongsTo<FundSource, $this> */
    public function fundSource(): BelongsTo
    {
        return $this->belongsTo(FundSource::class);
    }

    /** @return BelongsTo<Employee, $this> */
    public function pic(): BelongsTo
    {
        return $this->belongsTo(Employee::class, 'pic_employee_id');
    }

    /** @return BelongsTo<User, $this> */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /** @return HasMany<ActivityMember, $this> */
    public function members(): HasMany
    {
        return $this->hasMany(ActivityMember::class);
    }

    /** @return HasMany<HonorDetail, $this> */
    public function honorDetails(): HasMany
    {
        return $this->hasMany(HonorDetail::class);
    }

    /** @return HasOne<Budget, $this> */
    public function budget(): HasOne
    {
        return $this->hasOne(Budget::class);
    }

    /** @return HasMany<Approval, $this> */
    public function approvals(): HasMany
    {
        return $this->hasMany(Approval::class);
    }

    /** @return HasMany<Payment, $this> */
    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }

    /** @return HasMany<Document, $this> */
    public function documents(): HasMany
    {
        return $this->hasMany(Document::class);
    }

    public function isEditableByTu(): bool
    {
        return $this->status === self::DRAFT;
    }
}
