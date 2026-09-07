<?php

namespace App\Services;

use App\Models\Notification;
use App\Models\User;

/**
 * In-app notifications only for MVP (PRD.md "Channel MVP: in-app"),
 * per FLOW.md section 9 triggers: submit, approval, reject,
 * verification, payment, completion.
 */
class NotificationService
{
    public function send(User $user, string $type, string $title, string $message): Notification
    {
        return Notification::create([
            'user_id' => $user->id,
            'type' => $type,
            'title' => $title,
            'message' => $message,
        ]);
    }

    /**
     * @param  iterable<User>  $users
     */
    public function sendToMany(iterable $users, string $type, string $title, string $message): void
    {
        foreach ($users as $user) {
            $this->send($user, $type, $title, $message);
        }
    }

    public function sendToRole(string $roleName, string $type, string $title, string $message): void
    {
        $users = User::whereHas('role', fn ($q) => $q->where('name', $roleName))->get();
        $this->sendToMany($users, $type, $title, $message);
    }
}
