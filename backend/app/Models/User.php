<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

#[Fillable(['name', 'email', 'password', 'role_id', 'employee_id', 'status'])]
#[Hidden(['password', 'remember_token'])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'last_login_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    /**
     * @return BelongsTo<Role, $this>
     */
    public function role(): BelongsTo
    {
        return $this->belongsTo(Role::class);
    }

    /** @return BelongsTo<Employee, $this> */
    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
    }

    /**
     * Mirrors Employee::isActive(). A user whose status is anything but
     * "active" must not be able to authenticate or keep using an
     * existing session — see EnsureUserIsActive.
     */
    public function isActive(): bool
    {
        return $this->status === 'active';
    }

    public function hasRole(string ...$names): bool
    {
        return in_array($this->role?->name, $names, true);
    }

    /**
     * Memoized: the permission middleware calls this on every request,
     * and `role.permissions` is a lazy relation — without the cache each
     * check re-queries the pivot (AI_CODING_RULES.md section 13).
     *
     * @var array<string, bool>|null
     */
    private ?array $permissionCache = null;

    public function hasPermission(string $permission): bool
    {
        $this->permissionCache ??= $this->role?->permissions
            ->pluck('name')
            ->flip()
            ->map(fn () => true)
            ->all() ?? [];

        return $this->permissionCache[$permission] ?? false;
    }

    /** @return HasMany<Activity, $this> */
    public function createdActivities(): HasMany
    {
        return $this->hasMany(Activity::class, 'created_by');
    }

    /** @return HasMany<Notification, $this> */
    public function appNotifications(): HasMany
    {
        return $this->hasMany(Notification::class);
    }
}
