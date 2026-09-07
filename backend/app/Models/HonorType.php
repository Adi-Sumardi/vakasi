<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class HonorType extends Model
{
    use HasFactory;

    protected $fillable = ['code', 'name', 'unit', 'description', 'status'];

    /** @return HasMany<HonorRate, $this> */
    public function rates(): HasMany
    {
        return $this->hasMany(HonorRate::class);
    }

    /** @return HasMany<HonorDetail, $this> */
    public function honorDetails(): HasMany
    {
        return $this->hasMany(HonorDetail::class);
    }
}
