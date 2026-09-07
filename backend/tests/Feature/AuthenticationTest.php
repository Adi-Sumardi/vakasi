<?php

namespace Tests\Feature;

use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Covers the Sanctum SPA login flow described in API.md section 2.
 * Requests must carry a Referer/Origin matching SANCTUM_STATEFUL_DOMAINS
 * for Laravel to treat them as a stateful frontend request — see the
 * `hasSession()` guard in AuthController.
 */
class AuthenticationTest extends TestCase
{
    use RefreshDatabase;

    /** @return array<string, string> */
    private function frontendHeaders(): array
    {
        return ['Referer' => 'http://localhost:3000'];
    }

    public function test_user_can_login_with_valid_credentials(): void
    {
        $role = Role::create(['name' => 'tu', 'description' => 'TU']);
        $user = User::factory()->create(['role_id' => $role->id]);

        $response = $this->withHeaders($this->frontendHeaders())
            ->postJson('/api/v1/auth/login', [
                'email' => $user->email,
                'password' => 'password',
            ]);

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.email', $user->email)
            ->assertJsonPath('data.role.name', 'tu');

        $this->assertAuthenticatedAs($user, 'web');
    }

    public function test_login_fails_with_invalid_password(): void
    {
        $user = User::factory()->create();

        $response = $this->withHeaders($this->frontendHeaders())
            ->postJson('/api/v1/auth/login', [
                'email' => $user->email,
                'password' => 'wrong-password',
            ]);

        $response->assertStatus(422)->assertJsonPath('success', false);

        $this->assertGuest('web');
    }

    public function test_login_without_frontend_referer_is_rejected_cleanly(): void
    {
        $user = User::factory()->create();

        $response = $this->postJson('/api/v1/auth/login', [
            'email' => $user->email,
            'password' => 'password',
        ]);

        $response->assertStatus(400)->assertJsonPath('success', false);
    }

    public function test_authenticated_user_can_fetch_own_profile(): void
    {
        $role = Role::create(['name' => 'tu', 'description' => 'TU']);
        $user = User::factory()->create(['role_id' => $role->id]);

        $response = $this->actingAs($user, 'web')->getJson('/api/v1/auth/me');

        $response->assertOk()->assertJsonPath('data.email', $user->email);
    }

    public function test_guest_cannot_fetch_profile(): void
    {
        $this->getJson('/api/v1/auth/me')->assertStatus(401);
    }

    public function test_user_can_logout(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user, 'web')
            ->withHeaders($this->frontendHeaders())
            ->postJson('/api/v1/auth/logout');

        $response->assertOk()->assertJsonPath('success', true);

        $this->assertGuest('web');
    }
}
