<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Document extends Model
{
    /**
     * `document_type` used to be a free-form string, which mattered
     * because PaymentService::complete() only accepts the literal
     * "bukti_transfer" — a typo from any client made a payment
     * impossible to finish. These are the values the UI offers
     * (activity-documents.tsx / dokumen/page.tsx).
     */
    public const ACTIVITY_TYPES = ['surat_tugas', 'daftar_hadir', 'rincian_anggaran', 'lainnya'];

    public const PAYMENT_EVIDENCE_TYPES = ['bukti_transfer', 'lainnya'];

    const UPDATED_AT = null;

    protected $fillable = [
        'activity_id',
        'payment_id',
        'document_type',
        'file_name',
        'file_path',
        'mime_type',
        'file_size',
        'uploaded_by',
    ];

    /** @return BelongsTo<Activity, $this> */
    public function activity(): BelongsTo
    {
        return $this->belongsTo(Activity::class);
    }

    /** @return BelongsTo<Payment, $this> */
    public function payment(): BelongsTo
    {
        return $this->belongsTo(Payment::class);
    }

    /** @return BelongsTo<User, $this> */
    public function uploader(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }
}
