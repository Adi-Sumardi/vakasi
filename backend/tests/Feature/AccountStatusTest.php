<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Password;
use Tests\Concerns\CreatesUsersWithRoles;
use Tests\TestCase;

/**
 * `users.status` exists and is editable in Pengaturan, but nothing used
 * to read it: a deactivated account could still log in and keep working.
 */
class AccountStatusTest extends TestCase
{
    use CreatesUsersWithRoles, RefreshDatabase;

    /**
     * Sanctum only treats a request as stateful when its Referer/Origin
     * matches SANCTUM_STATEFUL_DOMAINS (see AuthenticationTest).
     *
     * @return array<string, string>
     */
    private function frontendHeaders(): array
    {
        return ['Referer' => 'http://localhost:3000'];
    }

    public function test_deactivated_user_cannot_log_in(): void
    {
        $user = User::factory()->inactive()->create(['password' => 'password123']);

        $this->withHeaders($this->frontendHeaders())
            ->postJson('/api/v1/auth/login', [
                'email' => $user->email,
                'password' => 'password123',
            ])->assertStatus(422);

        $this->assertGuest('web');
        $this->assertDatabaseHas('audit_logs', ['action' => 'login_blocked_inactive']);
    }

    public function test_active_user_can_still_log_in(): void
    {
        $user = User::factory()->create(['password' => 'password123']);

        $this->withHeaders($this->frontendHeaders())
            ->postJson('/api/v1/auth/login', [
                'email' => $user->email,
                'password' => 'password123',
            ])->assertOk();

        $this->assertAuthenticatedAs($user, 'web');
    }

    public function test_deactivating_a_user_mid_session_revokes_their_access(): void
    {
        $user = $this->userWithRole('tu', ['activities.view']);

        $this->as($user)->getJson('/api/v1/auth/me')->assertOk();

        $user->update(['status' => 'inactive']);

        $this->as($user)->getJson('/api/v1/auth/me')->assertForbidden();
    }

    public function test_forgot_password_sends_a_reset_link_to_an_active_user(): void
    {
        Notification::fake();
        $user = User::factory()->create();

        $this->postJson('/api/v1/auth/forgot-password', ['email' => $user->email])->assertOk();

        Notification::assertSentTo($user, ResetPassword::class);
    }

    public function test_forgot_password_does_not_leak_whether_an_account_exists(): void
    {
        Notification::fake();
        $inactive = User::factory()->inactive()->create();

        $known = $this->postJson('/api/v1/auth/forgot-password', ['email' => $inactive->email]);
        $unknown = $this->postJson('/api/v1/auth/forgot-password', ['email' => 'nobody@example.test']);

        $known->assertOk();
        $unknown->assertOk();
        $this->assertSame($known->json('message'), $unknown->json('message'));
        Notification::assertNothingSent();
    }

    public function test_user_can_reset_their_password_with_a_valid_token(): void
    {
        $user = User::factory()->create();
        $token = Password::broker()->createToken($user);

        $this->postJson('/api/v1/auth/reset-password', [
            'token' => $token,
            'email' => $user->email,
            'password' => 'brand-new-secret',
            'password_confirmation' => 'brand-new-secret',
        ])->assertOk();

        $this->assertTrue(
            auth('web')->attempt(['email' => $user->email, 'password' => 'brand-new-secret']),
        );
    }

    public function test_reset_password_rejects_an_invalid_token(): void
    {
        $user = User::factory()->create();

        $this->postJson('/api/v1/auth/reset-password', [
            'token' => 'not-a-real-token',
            'email' => $user->email,
            'password' => 'brand-new-secret',
            'password_confirmation' => 'brand-new-secret',
        ])->assertStatus(422);
    }
}
