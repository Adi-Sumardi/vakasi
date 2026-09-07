<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Employee extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'unit_id',
        'position_id',
        'employee_code',
        'nip',
        'nuptk',
        'name',
        'employee_type',
        'bank_name',
        'bank_account_name',
        'bank_account_number',
        'status',
    ];

    public function isActive(): bool
    {
        return $this->status === 'active';
    }

    /** @return BelongsTo<Unit, $this> */
    public function unit(): BelongsTo
    {
        return $this->belongsTo(Unit::class);
    }

    /** @return BelongsTo<Position, $this> */
    public function position(): BelongsTo
    {
        return $this->belongsTo(Position::class);
    }

    /** @return HasMany<ActivityMember, $this> */
    public function activityMembers(): HasMany
    {
        return $this->hasMany(ActivityMember::class);
    }

    /** @return HasMany<HonorDetail, $this> */
    public function honorDetails(): HasMany
    {
        return $this->hasMany(HonorDetail::class);
    }

    /** @return HasMany<PaymentDetail, $this> */
    public function paymentDetails(): HasMany
    {
        return $this->hasMany(PaymentDetail::class);
    }
}
