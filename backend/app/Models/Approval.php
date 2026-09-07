<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Approval extends Model
{
    use HasFactory;

    public const PENDING = 'pending';

    public const APPROVED = 'approved';

    public const REJECTED = 'rejected';

    protected $fillable = [
        'activity_id',
        'approval_type',
        'sequence',
        'approver_user_id',
        'status',
        'decision_at',
        'notes',
    ];

    protected function casts(): array
    {
        return ['decision_at' => 'datetime'];
    }

    /** @return BelongsTo<Activity, $this> */
    public function activity(): BelongsTo
    {
        return $this->belongsTo(Activity::class);
    }

    /** @return BelongsTo<User, $this> */
    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approver_user_id');
    }

    /** @return HasMany<ApprovalLog, $this> */
    public function logs(): HasMany
    {
        return $this->hasMany(ApprovalLog::class);
    }
}
