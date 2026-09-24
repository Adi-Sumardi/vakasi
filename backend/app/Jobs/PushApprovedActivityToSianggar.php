<?php

namespace App\Jobs;

use App\Models\Activity;
use App\Services\SianggarService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * Hands an approved activity over to Sianggar (FLOW.md section 8).
 *
 * Queued on purpose: an approval must never fail, or feel slow, because
 * an external system is down. SianggarService records the outcome on the
 * activity, so a permanently failed handoff stays visible and can be
 * retried from the UI instead of being silently lost.
 */
class PushApprovedActivityToSianggar implements ShouldQueue
{
    use Queueable;

    public int $tries = 5;

    public function __construct(public readonly Activity $activity) {}

    /**
     * 1, 5, 15, 30 minutes — Sianggar being down for a while is an
     * operational hiccup, not a reason to give up within seconds.
     *
     * @return array<int, int>
     */
    public function backoff(): array
    {
        return [60, 300, 900, 1800];
    }

    public function handle(SianggarService $sianggar): void
    {
        if ($this->activity->status !== Activity::APPROVED) {
            // The activity was changed after the job was queued; pushing
            // a no-longer-approved activity would mislead SDM.
            return;
        }

        $sianggar->push($this->activity);
    }

    public function failed(?Throwable $e): void
    {
        Log::error('Gagal mengirim kegiatan ke Sianggar setelah semua percobaan.', [
            'activity_code' => $this->activity->activity_code,
            'error' => $e?->getMessage(),
        ]);
    }
}
