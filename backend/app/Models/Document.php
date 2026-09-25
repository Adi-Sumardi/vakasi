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
    public const ACTIVITY_TYPES = ['sk_panitia', 'surat_tugas', 'daftar_hadir', 'rincian_anggaran', 'lainnya'];

    /**
     * The signed SK Panitia is the legal basis for paying anyone on the
     * committee at all, so an activity cannot be submitted without it
     * (ApprovalService::submit).
     */
    public const SK_PANITIA = 'sk_panitia';

    /** Human labels, also used to name the files handed to Sianggar. */
    public const LABELS = [
        'sk_panitia' => 'SK Panitia',
        'surat_tugas' => 'Surat Tugas',
        'daftar_hadir' => 'Daftar Hadir',
        'rincian_anggaran' => 'Rincian Anggaran',
        'lainnya' => 'Lampiran Lain',
        'bukti_transfer' => 'Bukti Transfer',
    ];

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
