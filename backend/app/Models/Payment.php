<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Payment extends Model
{
    use HasFactory;

    public const PROCESSING = 'processing';

    public const PAID = 'paid';

    public const FAILED = 'payment_failed';

    protected $fillable = [
        'payment_number',
        'activity_id',
        'payment_date',
        'payment_method',
        'source_account',
        'total_amount',
        'reference_number',
        'status',
        'processed_by',
    ];

    protected function casts(): array
    {
        return ['payment_date' => 'date'];
    }

    /** @return BelongsTo<Activity, $this> */
    public function activity(): BelongsTo
    {
        return $this->belongsTo(Activity::class);
    }

    /** @return BelongsTo<User, $this> */
    public function processor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'processed_by');
    }

    /** @return HasMany<PaymentDetail, $this> */
    public function details(): HasMany
    {
        return $this->hasMany(PaymentDetail::class);
    }

    /** @return HasMany<Document, $this> */
    public function documents(): HasMany
    {
        return $this->hasMany(Document::class);
    }
}
