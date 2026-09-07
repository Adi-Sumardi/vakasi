<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Concerns\ApiResponse;
use App\Http\Controllers\Controller;
use App\Http\Requests\Document\StoreDocumentRequest;
use App\Http\Requests\Payment\StorePaymentRequest;
use App\Http\Resources\PaymentResource;
use App\Models\Activity;
use App\Models\Payment;
use App\Services\DocumentService;
use App\Services\PaymentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PaymentController extends Controller
{
    use ApiResponse;

    public function __construct(
        private readonly PaymentService $paymentService,
        private readonly DocumentService $documentService,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $payments = Payment::query()
            ->with(['activity', 'processor'])
            ->when($request->string('status')->toString(), fn ($q, $status) => $q->where('status', $status))
            ->latest('payment_date')
            ->paginate(20);

        return $this->success(PaymentResource::collection($payments));
    }

    public function store(StorePaymentRequest $request): JsonResponse
    {
        $activity = Activity::findOrFail($request->validated('activity_id'));

        $payment = $this->paymentService->create($activity, $request->validated(), $request->user());

        return $this->success(new PaymentResource($payment->load(['activity', 'details.employee'])), 'Pembayaran berhasil dibuat.', 201);
    }

    public function show(Payment $payment): JsonResponse
    {
        return $this->success(new PaymentResource($payment->load(['activity', 'processor', 'details.employee', 'documents'])));
    }

    public function process(Payment $payment): JsonResponse
    {
        $payment = $this->paymentService->process($payment);

        return $this->success(new PaymentResource($payment), 'Pembayaran sedang diproses.');
    }

    public function evidence(StoreDocumentRequest $request, Payment $payment): JsonResponse
    {
        $document = $this->documentService->store(
            $request->file('file'),
            $request->validated('document_type'),
            $request->user(),
            payment: $payment,
        );

        return $this->success($document, 'Bukti pembayaran berhasil diunggah.', 201);
    }

    public function complete(Payment $payment): JsonResponse
    {
        $payment = $this->paymentService->complete($payment);

        return $this->success(new PaymentResource($payment->load(['activity', 'details.employee'])), 'Pembayaran berhasil diselesaikan.');
    }
}
