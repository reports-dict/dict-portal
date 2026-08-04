<?php

use App\Models\User;
use Illuminate\Support\Facades\DB;

test('online-now lists users with a recent session and excludes stale sessions', function () {
    $superadmin = User::factory()->superadmin()->create();
    $recentlyActive = User::factory()->user()->create();
    $stale = User::factory()->user()->create();

    DB::table('sessions')->insert([
        [
            'id' => 'recent-session',
            'user_id' => $recentlyActive->id,
            'ip_address' => '127.0.0.1',
            'user_agent' => 'test',
            'payload' => 'payload',
            'last_activity' => now()->subMinute()->getTimestamp(),
        ],
        [
            'id' => 'stale-session',
            'user_id' => $stale->id,
            'ip_address' => '127.0.0.1',
            'user_agent' => 'test',
            'payload' => 'payload',
            'last_activity' => now()->subMinutes(10)->getTimestamp(),
        ],
    ]);

    $response = $this->actingAs($superadmin)->getJson(route('user-access.online'));

    $response->assertOk();
    $response->assertJsonFragment(['id' => $recentlyActive->id]);
    $response->assertJsonMissing(['id' => $stale->id]);
});

test('online-now groups multiple sessions for the same user into one entry', function () {
    $superadmin = User::factory()->superadmin()->create();
    $user = User::factory()->user()->create();

    DB::table('sessions')->insert([
        [
            'id' => 'session-one',
            'user_id' => $user->id,
            'ip_address' => '127.0.0.1',
            'user_agent' => 'device-one',
            'payload' => 'payload',
            'last_activity' => now()->subMinute()->getTimestamp(),
        ],
        [
            'id' => 'session-two',
            'user_id' => $user->id,
            'ip_address' => '127.0.0.1',
            'user_agent' => 'device-two',
            'payload' => 'payload',
            'last_activity' => now()->getTimestamp(),
        ],
    ]);

    $response = $this->actingAs($superadmin)->getJson(route('user-access.online'));

    $response->assertOk();
    $response->assertJsonCount(1);
    $response->assertJsonFragment(['id' => $user->id, 'session_count' => 2]);
});

test('non-superadmin cannot view the online users endpoint', function () {
    $user = User::factory()->user()->create();

    $response = $this->actingAs($user)->getJson(route('user-access.online'));

    $response->assertForbidden();
});
