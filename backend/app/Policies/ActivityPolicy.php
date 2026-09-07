<?php

namespace App\Policies;

use App\Models\Activity;
use App\Models\User;

/**
 * Object-level rules per ROLE_PERMISSION.md section 7.3. The
 * `permission:module.action` middleware already confirmed the user's
 * role may access the feature at all; this policy answers whether
 * *this specific* activity may be acted on (ownership, status,
 * separation of duties).
 */
class ActivityPolicy
{
    public function view(User $user, Activity $activity): bool
    {
        if ($user->hasRole('super_admin', 'admin', 'kepala_sekolah', 'keuangan', 'auditor')) {
            return true;
        }

        if ($user->hasRole('tu')) {
            return $activity->created_by === $user->id;
        }

        return $user->employee_id !== null
            && $activity->members()->where('employee_id', $user->employee_id)->exists();
    }

    public function update(User $user, Activity $activity): bool
    {
        if (! in_array($activity->status, [Activity::DRAFT, Activity::REJECTED], true)) {
            return false;
        }

        return $user->hasRole('super_admin', 'admin') || $activity->created_by === $user->id;
    }

    public function submit(User $user, Activity $activity): bool
    {
        return $this->update($user, $activity);
    }

    public function approve(User $user, Activity $activity): bool
    {
        return $activity->status === Activity::SUBMITTED && $activity->created_by !== $user->id;
    }

    public function delete(User $user, Activity $activity): bool
    {
        if ($activity->payments()->exists()) {
            return false;
        }

        return $this->update($user, $activity);
    }
}
