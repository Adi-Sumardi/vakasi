<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Simple in-app notification (PRD.md "Notifikasi aplikasi"). Not to be
 * confused with Illuminate\Notifications\Notification — this is a
 * plain Eloquent-backed record, not the framework's notification bus.
 *
 * WARNING: this table is named `notifications` per ERD.md, which is
 * also Laravel's conventional table for the built-in "database"
 * notification channel (Illuminate\Notifications\DatabaseNotification,
 * a different, incompatible schema). Never call User::notify(...) with
 * the database channel — only mail/other channels are safe to use.
 */
class Notification extends Model
{
    const UPDATED_AT = null;

    protected $fillable = ['user_id', 'type', 'title', 'message', 'read_at'];

    protected function casts(): array
    {
        return ['read_at' => 'datetime'];
    }

    /** @return BelongsTo<User, $this> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function markAsRead(): void
    {
        if ($this->read_at === null) {
            $this->forceFill(['read_at' => now()])->save();
        }
    }
}
