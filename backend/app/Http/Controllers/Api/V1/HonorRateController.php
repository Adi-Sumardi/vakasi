<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Concerns\ApiResponse;
use App\Http\Controllers\Controller;
use App\Http\Requests\HonorRate\StoreHonorRateRequest;
use App\Http\Requests\HonorRate\UpdateHonorRateRequest;
use App\Http\Requests\HonorRate\UploadHonorRateDecreeRequest;
use App\Http\Resources\HonorRateResource;
use App\Models\HonorRate;
use App\Services\AuditService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\StreamedResponse;

class HonorRateController extends Controller
{
    use ApiResponse;

    public function __construct(private readonly AuditService $auditService) {}

    public function index(Request $request): JsonResponse
    {
        $rates = HonorRate::query()
            ->with(['honorType', 'unit'])
            ->when($request->integer('honor_type_id'), fn ($q, $id) => $q->where('honor_type_id', $id))
            ->when($request->string('status')->toString(), fn ($q, $status) => $q->where('status', $status))
            ->latest('effective_from')
            ->paginate(20);

        return $this->success(HonorRateResource::collection($rates));
    }

    public function store(StoreHonorRateRequest $request): JsonResponse
    {
        $rate = HonorRate::create($request->validated());

        return $this->success(new HonorRateResource($rate->load(['honorType', 'unit'])), 'Tarif honor berhasil dibuat.', 201);
    }

    public function show(HonorRate $honorRate): JsonResponse
    {
        return $this->success(new HonorRateResource($honorRate->load(['honorType', 'unit'])));
    }

    public function update(UpdateHonorRateRequest $request, HonorRate $honorRate): JsonResponse
    {
        $honorRate->update($request->validated());

        return $this->success(new HonorRateResource($honorRate->load(['honorType', 'unit'])), 'Tarif honor berhasil diperbarui.');
    }

    /**
     * Replaces the decree scan. Stored on the private disk like activity
     * documents (ARSITEKTUR.md section 9) — only reachable through
     * downloadDecree(), never by public URL.
     */
    public function uploadDecree(UploadHonorRateDecreeRequest $request, HonorRate $honorRate): JsonResponse
    {
        $file = $request->file('file');
        $old = $honorRate->decree_file_path;

        $path = $file->storeAs(
            'documents/honor-rates',
            Str::uuid()->toString().'.'.$file->extension(),
            'local',
        );

        $honorRate->update([
            'decree_file_name' => $file->getClientOriginalName(),
            'decree_file_path' => $path,
        ]);

        if ($old) {
            Storage::disk('local')->delete($old);
        }

        $this->auditService->logModel('honor_rate.decree_uploaded', $honorRate, newValues: [
            'decree_number' => $honorRate->decree_number,
            'decree_file_name' => $honorRate->decree_file_name,
        ]);

        return $this->success(new HonorRateResource($honorRate->load(['honorType', 'unit'])), 'Berkas SK tarif berhasil diunggah.');
    }

    public function downloadDecree(HonorRate $honorRate): StreamedResponse
    {
        if (! $honorRate->decree_file_path || ! Storage::disk('local')->exists($honorRate->decree_file_path)) {
            abort(404, 'Berkas SK tarif belum diunggah.');
        }

        return Storage::disk('local')->download($honorRate->decree_file_path, $honorRate->decree_file_name);
    }
}
