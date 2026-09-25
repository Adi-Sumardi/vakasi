<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
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

    /**
     * Handoff state for the Sianggar push (FLOW.md section 8). Separate
     * from the activity status: APPROVED is terminal for VAKASI whether
     * or not Sianggar has acknowledged the data yet.
     */
    public const SIANGGAR_PENDING = 'pending';

    public const SIANGGAR_SENT = 'sent';

    public const SIANGGAR_FAILED = 'failed';

    public const SIANGGAR_SKIPPED = 'skipped';

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
        'verification_code',
        'approval_document_number',
        'sianggar_status',
        'sianggar_synced_at',
        'sianggar_attempts',
        'sianggar_last_error',
    ];

    protected function casts(): array
    {
        return [
            'start_date' => 'date',
            'end_date' => 'date',
            'submitted_at' => 'datetime',
            'approved_at' => 'datetime',
            'completed_at' => 'datetime',
            'sianggar_synced_at' => 'datetime',
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

    /** @return HasOne<ActivityDisbursement, $this> */
    public function disbursement(): HasOne
    {
        return $this->hasOne(ActivityDisbursement::class);
    }

    public const DISBURSEMENT_NOT_SENT = 'belum_terkirim';

    public const DISBURSEMENT_WAITING = 'menunggu_sdm';

    public const DISBURSEMENT_PROCESSING = 'diproses';

    public const DISBURSEMENT_PAID = 'dibayar';

    public const DISBURSEMENT_REJECTED = 'ditolak';

    /**
     * Where an approved activity's money stands, as mirrored from
     * Sianggar. Null while the activity is not approved yet — before
     * approval there is nothing to disburse.
     */
    public function disbursementState(): ?string
    {
        if ($this->status !== self::APPROVED) {
            return null;
        }

        $disbursement = $this->disbursement;

        return match (true) {
            $disbursement?->isPaid() => self::DISBURSEMENT_PAID,
            $disbursement?->isRejected() => self::DISBURSEMENT_REJECTED,
            $disbursement !== null => self::DISBURSEMENT_PROCESSING,
            $this->sianggar_status === self::SIANGGAR_SENT => self::DISBURSEMENT_WAITING,
            default => self::DISBURSEMENT_NOT_SENT,
        };
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

    /**
     * The activities a user may see, in one place so the list, reports,
     * dashboard and approval queue cannot drift apart:
     * - Guru/Tendik: activities they sit on the committee of;
     * - an account tied to a unit: that unit's activities;
     * - a TU without a unit (older accounts): only what they created;
     * - everyone else: all activities.
     *
     * @param  Builder<Activity>  $query
     * @return Builder<Activity>
     */
    public function scopeVisibleTo(Builder $query, User $user): Builder
    {
        if ($user->hasRole('guru_tendik')) {
            return $query->whereHas('members', fn (Builder $m) => $m->where('employee_id', $user->employee_id ?? 0));
        }

        if ($unitId = $user->scopedUnitId()) {
            return $query->where('unit_id', $unitId);
        }

        if ($user->hasRole('tu')) {
            return $query->where('created_by', $user->id);
        }

        return $query;
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
