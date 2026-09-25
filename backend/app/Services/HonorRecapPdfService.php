<?php

namespace App\Services;

use App\Models\Activity;
use App\Models\ApprovalLog;
use App\Models\Document;
use Barryvdh\DomPDF\Facade\Pdf;

/**
 * Builds the honor recap PDF that VAKASI attaches to the handoff, so the
 * document Sianggar files with the pengajuan is authored by the system
 * that owns the approval — it carries VAKASI's approval number (APV-...) and the same
 * public verification QR, and can be checked by anyone without a VAKASI
 * account.
 *
 * Deliberately one amount column: this flow is honor/upah panitia only,
 * with no tax or other deductions involved, so showing gross/tax/net
 * would imply a distinction that does not exist here.
 */
class HonorRecapPdfService
{
    public function __construct(private readonly QrCodeService $qrCodeService) {}

    public function fileName(Activity $activity): string
    {
        return "rekap-honor-{$activity->activity_code}.pdf";
    }

    public function render(Activity $activity): string
    {
        $activity->loadMissing([
            'activityType', 'unit', 'fundSource', 'creator', 'documents',
            'honorDetails.employee', 'honorDetails.honorType', 'honorDetails.activityMember',
        ]);

        $lines = $activity->honorDetails->map(fn ($detail) => [
            'employee_name' => $detail->employee->name,
            // Through the member row, not the employee: one employee can
            // hold several roles on the same activity.
            'role_name' => $detail->activityMember?->role_name,
            'honor_type' => $detail->honorType?->name,
            'rate_decree_number' => $detail->rate_decree_number_snapshot,
            'rate' => (int) $detail->rate_snapshot,
            'volume' => (int) $detail->volume,
            'unit' => $detail->unit_snapshot,
            'amount' => (int) $detail->net_amount,
            'bank_name' => $detail->employee->bank_name,
            'bank_account_number' => $detail->employee->bank_account_number,
        ])->values();

        // What the payment rests on: the signed SK Panitia (who is on the
        // committee) and the SK tarif (how much each role is paid).
        $skPanitia = $activity->documents
            ->where('document_type', Document::SK_PANITIA)
            ->pluck('file_name')
            ->values();
        $rateDecrees = $lines->pluck('rate_decree_number')->filter()->unique()->values();

        $totalAmount = (int) $lines->sum('amount');

        $approverName = ApprovalLog::whereHas('approval', fn ($q) => $q->where('activity_id', $activity->id))
            ->where('action', 'approve')
            ->with('actor')
            ->latest('acted_at')
            ->first()
            ?->actor?->name;

        return Pdf::loadView('pdf.honor-recap', [
            'activity' => $activity,
            'lines' => $lines,
            'totalAmount' => $totalAmount,
            'skPanitia' => $skPanitia,
            'rateDecrees' => $rateDecrees,
            'terbilang' => $this->terbilang($totalAmount),
            'approverName' => $approverName,
            'qrCodeDataUri' => $activity->verification_code
                ? $this->qrCodeService->generate(
                    $this->qrCodeService->verificationUrl($activity->verification_code)
                )->getDataUri()
                : null,
        ])->output();
    }

    /**
     * Indonesian long-form amount. A honor recap is a payment document,
     * and "terbilang" is what makes the figure hard to alter after the
     * fact — the same reason a cheque spells its amount out.
     */
    private function terbilang(int $number): string
    {
        if ($number === 0) {
            return 'nol';
        }

        $units = ['', 'satu', 'dua', 'tiga', 'empat', 'lima', 'enam', 'tujuh', 'delapan', 'sembilan', 'sepuluh', 'sebelas'];

        $convert = function (int $n) use (&$convert, $units): string {
            if ($n < 12) {
                return $units[$n];
            }

            if ($n < 20) {
                return $convert($n - 10).' belas';
            }

            if ($n < 100) {
                return trim($convert(intdiv($n, 10)).' puluh '.$convert($n % 10));
            }

            if ($n < 200) {
                return trim('seratus '.$convert($n - 100));
            }

            if ($n < 1000) {
                return trim($convert(intdiv($n, 100)).' ratus '.$convert($n % 100));
            }

            if ($n < 2000) {
                return trim('seribu '.$convert($n - 1000));
            }

            if ($n < 1_000_000) {
                return trim($convert(intdiv($n, 1000)).' ribu '.$convert($n % 1000));
            }

            if ($n < 1_000_000_000) {
                return trim($convert(intdiv($n, 1_000_000)).' juta '.$convert($n % 1_000_000));
            }

            return trim($convert(intdiv($n, 1_000_000_000)).' miliar '.$convert($n % 1_000_000_000));
        };

        return preg_replace('/\s+/', ' ', trim($convert($number)));
    }
}
