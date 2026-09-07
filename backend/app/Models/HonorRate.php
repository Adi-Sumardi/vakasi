<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class HonorRate extends Model
{
    use HasFactory;

    protected $fillable = [
        'honor_type_id',
        'unit_id',
        'rate',
        'effective_from',
        'effective_to',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'effective_from' => 'date',
            'effective_to' => 'date',
        ];
    }

    /** @return BelongsTo<HonorType, $this> */
    public function honorType(): BelongsTo
    {
        return $this->belongsTo(HonorType::class);
    }

    /** @return BelongsTo<Unit, $this> */
    public function unit(): BelongsTo
    {
        return $this->belongsTo(Unit::class);
    }

    /**
     * Rate aktif untuk sebuah jenis honor pada tanggal tertentu, sesuai
     * FLOW.md "Honor Calculation Flow" (Jenis Honor -> Tarif Aktif).
     * Rate dengan unit_id spesifik didahulukan atas rate umum (unit_id null).
     *
     * @param  Builder<HonorRate>  $query
     * @return Builder<HonorRate>
     */
    public function scopeActiveFor(Builder $query, int $honorTypeId, string $date, ?int $unitId = null): Builder
    {
        // whereDate() (not where()) because DATE columns can be stored
        // with a time component depending on the driver (e.g. SQLite
        // keeps whatever Eloquent's date-cast serializes), which would
        // break a plain string "<=" comparison against a bare date.
        return $query->where('honor_type_id', $honorTypeId)
            ->where('status', 'active')
            ->whereDate('effective_from', '<=', $date)
            ->where(fn (Builder $q) => $q->whereNull('effective_to')->orWhereDate('effective_to', '>=', $date))
            ->where(fn (Builder $q) => $q->whereNull('unit_id')->orWhere('unit_id', $unitId))
            ->orderByRaw('unit_id is null')
            ->orderByDesc('effective_from');
    }
}
