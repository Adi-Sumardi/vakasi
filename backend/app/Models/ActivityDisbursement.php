<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Mirror of a Sianggar PengajuanAnggaran raised from this activity.
 * Written only by the signed Sianggar callback — see
 * SianggarCallbackService.
 */
class ActivityDisbursement extends Model
{
    use HasFactory;

    /**
     * Sianggar's ProposalStatus values, in the order they are reached.
     * Kept here so VAKASI can render a stepper without asking Sianggar
     * what comes next.
     */
    public const STAGE_ORDER = [
        'staff-keuangan',
        'direktur',
        'kabag-sdm-umum',
        'kabag-sekretariat',
        'wakil-ketua',
        'sekretaris',
        'ketum',
        'keuangan',
        'bendahara',
        'kasir',
        'payment',
    ];

    protected $fillable = [
        'activity_id',
        'pengajuan_ulid',
        'nomor_pengajuan',
        'no_surat',
        'perihal',
        'status_proses',
        'current_stage',
        'approved_amount',
        'no_voucher',
        'paid_at',
        'last_event_at',
    ];

    protected function casts(): array
    {
        return [
            'paid_at' => 'datetime',
            'last_event_at' => 'datetime',
        ];
    }

    /** @return BelongsTo<Activity, $this> */
    public function activity(): BelongsTo
    {
        return $this->belongsTo(Activity::class);
    }

    /** @return HasMany<ActivityDisbursementEvent, $this> */
    public function events(): HasMany
    {
        return $this->hasMany(ActivityDisbursementEvent::class)->orderBy('occurred_at');
    }

    public function isPaid(): bool
    {
        return $this->status_proses === 'paid';
    }
}
