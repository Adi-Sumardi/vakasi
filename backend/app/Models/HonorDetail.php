<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class HonorDetail extends Model
{
    use HasFactory;

    protected $fillable = [
        'activity_id',
        'activity_member_id',
        'employee_id',
        'honor_type_id',
        'rate_snapshot',
        'volume',
        'unit_snapshot',
        'gross_amount',
        'tax_amount',
        'deduction_amount',
        'net_amount',
        'notes',
    ];

    /** @return BelongsTo<Activity, $this> */
    public function activity(): BelongsTo
    {
        return $this->belongsTo(Activity::class);
    }

    /** @return BelongsTo<ActivityMember, $this> */
    public function activityMember(): BelongsTo
    {
        return $this->belongsTo(ActivityMember::class);
    }

    /** @return BelongsTo<Employee, $this> */
    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
    }

    /** @return BelongsTo<HonorType, $this> */
    public function honorType(): BelongsTo
    {
        return $this->belongsTo(HonorType::class);
    }

    /** @return HasMany<PaymentDetail, $this> */
    public function paymentDetails(): HasMany
    {
        return $this->hasMany(PaymentDetail::class);
    }
}
