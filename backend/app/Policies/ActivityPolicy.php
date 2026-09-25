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
        return Activity::query()->whereKey($activity->id)->visibleTo($user)->exists();
    }

    /**
     * A unit-scoped account only reaches its own unit's activities; an
     * unscoped one (Super Admin, yayasan-level Admin) reaches all.
     */
    private function inScope(User $user, Activity $activity): bool
    {
        $unitId = $user->scopedUnitId();

        return $unitId === null || $activity->unit_id === $unitId;
    }

    public function update(User $user, Activity $activity): bool
    {
        if (! in_array($activity->status, [Activity::DRAFT, Activity::REJECTED], true)) {
            return false;
        }

        if ($activity->created_by === $user->id) {
            return true;
        }

        // Any TU of the unit may carry on a colleague's draft; with a
        // unit, the kegiatan belongs to the school, not to one account.
        if ($user->hasRole('tu')) {
            return $user->scopedUnitId() !== null && $this->inScope($user, $activity);
        }

        return $user->hasRole('super_admin', 'admin') && $this->inScope($user, $activity);
    }

    public function submit(User $user, Activity $activity): bool
    {
        return $this->update($user, $activity);
    }

    /**
     * ROLE_PERMISSION.md grants Honor Calculation to Keuangan as well as
     * Admin/TU, but update() is ownership-based, so authorizing the
     * calculation against it made Keuangan's permission unusable — every
     * call 403'd. The activity must still be editable: an approved honor
     * is a financial snapshot (BR-03).
     */
    public function calculateHonor(User $user, Activity $activity): bool
    {
        if (! in_array($activity->status, [Activity::DRAFT, Activity::REJECTED], true)) {
            return false;
        }

        if ($activity->created_by === $user->id) {
            return true;
        }

        return $this->update($user, $activity)
            || ($user->hasRole('super_admin', 'admin', 'keuangan') && $this->inScope($user, $activity));
    }

    /**
     * Keuangan attaches supporting documents after approval, when the
     * activity is no longer editable by the TU who created it — so this
     * cannot simply defer to update().
     */
    public function uploadDocument(User $user, Activity $activity): bool
    {
        if ($user->hasRole('super_admin', 'admin', 'keuangan') && $this->inScope($user, $activity)) {
            return true;
        }

        return $this->update($user, $activity);
    }

    public function approve(User $user, Activity $activity): bool
    {
        // A Kepala Sekolah tied to a unit approves only that school.
        return $activity->status === Activity::SUBMITTED
            && $activity->created_by !== $user->id
            && $this->inScope($user, $activity);
    }

    public function delete(User $user, Activity $activity): bool
    {
        if ($activity->payments()->exists()) {
            return false;
        }

        return $this->update($user, $activity);
    }
}
