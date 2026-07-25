<?php

use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Laravel\Socialite\Facades\Socialite;
use Laravel\Socialite\Two\InvalidStateException;
use Laravel\Socialite\Two\User as SocialiteUser;
use SocialiteProviders\Microsoft\Provider as MicrosoftProvider;

function mockMicrosoftProvider(?SocialiteUser $user = null, ?string $tenantId = null, bool $throwsInvalidState = false): void
{
    $provider = Mockery::mock(MicrosoftProvider::class);

    if ($throwsInvalidState) {
        $provider->shouldReceive('user')->andThrow(new InvalidStateException);
    } else {
        $provider->shouldReceive('user')->andReturn($user);
        $provider->shouldReceive('getClaims')->andReturn((object) ['tid' => $tenantId]);
    }

    $provider->shouldReceive('getLogoutUrl')
        ->andReturn('https://login.microsoftonline.com/tenant-abc/oauth2/v2.0/logout');

    Socialite::shouldReceive('driver')->with('microsoft')->andReturn($provider);
}

test('a pre-provisioned matching email logs in and claims azure_oid', function () {
    config(['services.microsoft.tenant' => 'tenant-abc']);
    $placeholder = User::factory()->create(['email' => 'Jdoe@Example.com', 'azure_oid' => null]);

    mockMicrosoftProvider(
        SocialiteUser::fake(['id' => 'oid-123', 'email' => 'jdoe@example.com']),
        'tenant-abc',
    );

    $response = $this->get(route('auth.microsoft.callback'));

    $response->assertRedirect(route('home'));
    expect(Auth::check())->toBeTrue();
    expect(Auth::id())->toBe($placeholder->id);
    expect($placeholder->fresh()->azure_oid)->toBe('oid-123');
});

test('an unmatched email is denied without creating a user row', function () {
    config(['services.microsoft.tenant' => 'tenant-abc']);

    mockMicrosoftProvider(
        SocialiteUser::fake(['id' => 'oid-999', 'email' => 'stranger@example.com']),
        'tenant-abc',
    );

    $before = User::count();

    $response = $this->get(route('auth.microsoft.callback'));

    $response->assertForbidden();
    expect(Auth::check())->toBeFalse();
    expect(User::count())->toBe($before);
});

test('a tenant id mismatch is rejected even for a matching email', function () {
    config(['services.microsoft.tenant' => 'tenant-abc']);
    User::factory()->create(['email' => 'jdoe@example.com']);

    mockMicrosoftProvider(
        SocialiteUser::fake(['id' => 'oid-123', 'email' => 'jdoe@example.com']),
        'some-other-tenant',
    );

    $response = $this->get(route('auth.microsoft.callback'));

    $response->assertForbidden();
    expect(Auth::check())->toBeFalse();
});

test('a state/CSRF failure from Socialite is handled without a 500', function () {
    config(['services.microsoft.tenant' => 'tenant-abc']);

    mockMicrosoftProvider(throwsInvalidState: true);

    $response = $this->get(route('auth.microsoft.callback'));

    $response->assertForbidden();
    expect(Auth::check())->toBeFalse();
});

test('logging out redirects to the Microsoft logout endpoint', function () {
    config(['services.microsoft.tenant' => 'tenant-abc']);
    $user = User::factory()->create();

    mockMicrosoftProvider();

    $response = $this->actingAs($user)->post(route('logout'));

    $response->assertRedirect('https://login.microsoftonline.com/tenant-abc/oauth2/v2.0/logout');
    expect(Auth::check())->toBeFalse();
});
