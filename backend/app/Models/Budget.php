<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Budget extends Model
{
    use HasFactory;

    protected $fillable = [
        'activity_id',
        'budget_code',
        'budget_amount',
        'committed_amount',
        'approved_amount',
        'paid_amount',
        'remaining_amount',
        'status',
    ];

    /** @return BelongsTo<Activity, $this> */
    public function activity(): BelongsTo
    {
        return $this->belongsTo(Activity::class);
    }

    /** @return HasMany<BudgetDetail, $this> */
    public function details(): HasMany
    {
        return $this->hasMany(BudgetDetail::class);
    }
}
