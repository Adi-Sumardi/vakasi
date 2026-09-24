<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * One reported step of the disbursement in Sianggar. Append-only: the
 * timeline VAKASI shows is the record of what Sianggar told us, so an
 * entry is never edited or removed once written.
 */
class ActivityDisbursementEvent extends Model
{
    use HasFactory;

    protected $fillable = [
        'activity_disbursement_id',
        'external_event_id',
        'event_type',
        'stage',
        'status',
        'actor_name',
        'note',
        'occurred_at',
        'payload',
    ];

    protected function casts(): array
    {
        return [
            'occurred_at' => 'datetime',
            'payload' => 'array',
        ];
    }

    /** @return BelongsTo<ActivityDisbursement, $this> */
    public function disbursement(): BelongsTo
    {
        return $this->belongsTo(ActivityDisbursement::class, 'activity_disbursement_id');
    }
}
