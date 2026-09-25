<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ActivityResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'activity_code' => $this->activity_code,
            'name' => $this->name,
            'description' => $this->description,
            'activity_type' => new ActivityTypeResource($this->whenLoaded('activityType')),
            'unit' => new UnitResource($this->whenLoaded('unit')),
            'fund_source' => new FundSourceResource($this->whenLoaded('fundSource')),
            'pic' => new EmployeeResource($this->whenLoaded('pic')),
            'start_date' => $this->start_date?->toDateString(),
            'end_date' => $this->end_date?->toDateString(),
            'location' => $this->location,
            'budget_amount' => $this->budget_amount,
            'status' => $this->status,
            'submitted_at' => $this->submitted_at,
            'approved_at' => $this->approved_at,
            'completed_at' => $this->completed_at,
            'verification_code' => $this->verification_code,
            // Nomor persetujuan (APV-...) dihasilkan ApprovalService::approve() dan dipakai
            // kartu "Bukti Approval" di halaman detail — tanpa baris ini
            // nomornya tersimpan di database tapi tidak pernah sampai ke UI.
            'approval_document_number' => $this->approval_document_number,
            // Handoff to Sianggar (FLOW.md section 8) — surfaced so a
            // failed push is visible instead of only sitting in the log.
            'sianggar_status' => $this->sianggar_status,
            'sianggar_synced_at' => $this->sianggar_synced_at,
            'sianggar_last_error' => $this->sianggar_last_error,
            'creator' => $this->whenLoaded('creator', fn () => [
                'id' => $this->creator->id,
                'name' => $this->creator->name,
            ]),
            'budget' => new BudgetResource($this->whenLoaded('budget')),
            'members' => ActivityMemberResource::collection($this->whenLoaded('members')),
            'honor_details' => HonorDetailResource::collection($this->whenLoaded('honorDetails')),
            'approvals' => ApprovalResource::collection($this->whenLoaded('approvals')),
            'documents' => DocumentResource::collection($this->whenLoaded('documents')),
            'created_at' => $this->created_at,
        ];
    }
}
