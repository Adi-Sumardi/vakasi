<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Concerns\ApiResponse;
use App\Http\Controllers\Controller;
use App\Services\SianggarCallbackService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

/**
 * Progress reported back by Sianggar as the pengajuan moves through its
 * approval chain (FLOW.md section 8).
 *
 * Unauthenticated by necessity — Sianggar is a server, not a VAKASI
 * user — so the request is authenticated by an HMAC signature over the
 * raw body instead, the same scheme VAKASI uses when pushing outbound.
 */
class SianggarCallbackController extends Controller
{
    use ApiResponse;

    public function __construct(private readonly SianggarCallbackService $callbackService) {}

    public function __invoke(Request $request): JsonResponse
    {
        if (! $this->hasValidSignature($request)) {
            return $this->error('Signature tidak valid.', status: 401);
        }

        $data = Validator::make($request->all(), [
            'event_id' => ['required', 'string', 'max:100'],
            'event' => ['required', 'string', 'max:100'],
            'activity_code' => ['required', 'string', 'max:100'],
            'occurred_at' => ['required', 'date'],
            'pengajuan_ulid' => ['nullable', 'string', 'max:64'],
            'nomor_pengajuan' => ['nullable', 'string', 'max:100'],
            'no_surat' => ['nullable', 'string', 'max:100'],
            'perihal' => ['nullable', 'string', 'max:255'],
            'status_proses' => ['nullable', 'string', 'max:50'],
            'stage' => ['nullable', 'string', 'max:50'],
            'actor_name' => ['nullable', 'string', 'max:255'],
            'note' => ['nullable', 'string', 'max:2000'],
            'approved_amount' => ['nullable', 'integer', 'min:0'],
            'no_voucher' => ['nullable', 'string', 'max:100'],
            'paid_at' => ['nullable', 'date'],
        ])->validate();

        $event = $this->callbackService->handle($data);

        return $this->success(
            ['event_id' => $event->external_event_id],
            'Callback diterima.',
        );
    }

    /**
     * Constant-time comparison, and an explicit refusal when no secret is
     * configured — an empty key would otherwise make every request with
     * a matching (empty-key) digest valid.
     */
    private function hasValidSignature(Request $request): bool
    {
        $secret = (string) config('vakasi.sianggar.callback_secret');
        $signature = (string) $request->header('X-Sianggar-Signature');

        if ($secret === '' || $signature === '') {
            return false;
        }

        return hash_equals(hash_hmac('sha256', $request->getContent(), $secret), $signature);
    }
}
