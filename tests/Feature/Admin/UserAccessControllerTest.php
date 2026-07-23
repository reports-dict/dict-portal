<?php

use App\Enums\UserRole;
use App\Models\User;

test('superadmin can view the user access index', function () {
    $superadmin = User::factory()->superadmin()->create();

    $response = $this->actingAs($superadmin)->get(route('user-access.index'));

    $response->assertOk();
});

test('admin cannot view the user access index', function () {
    $admin = User::factory()->admin()->create();

    $response = $this->actingAs($admin)->get(route('user-access.index'));

    $response->assertForbidden();
});

test('user cannot view the user access index', function () {
    $user = User::factory()->user()->create();

    $response = $this->actingAs($user)->get(route('user-access.index'));

    $response->assertForbidden();
});

test('admin and user get 403 on all user access routes', function () {
    $target = User::factory()->user()->create();
    $actor = User::factory()->admin()->create();

    $this->actingAs($actor)->post(route('user-access.store'), [
        'samaccountname' => 'jdoe',
        'name' => 'John Doe',
        'email' => 'jdoe@example.com',
        'role' => 'user',
    ])->assertForbidden();

    $this->actingAs($actor)->put(route('user-access.update', $target), [
        'role' => 'admin',
    ])->assertForbidden();

    $this->actingAs($actor)->delete(route('user-access.destroy', $target))
        ->assertForbidden();
});

test('superadmin can pre-provision a placeholder user', function () {
    $superadmin = User::factory()->superadmin()->create();

    $response = $this->actingAs($superadmin)->post(route('user-access.store'), [
        'samaccountname' => 'jdoe',
        'name' => 'John Doe',
        'email' => 'jdoe@example.com',
        'role' => 'admin',
    ]);

    $response->assertRedirect();

    $this->assertDatabaseHas('users', [
        'samaccountname' => 'jdoe',
        'name' => 'John Doe',
        'email' => 'jdoe@example.com',
        'role' => 'admin',
        'guid' => null,
    ]);
});

test('pre-provisioning rejects a duplicate samaccountname', function () {
    $superadmin = User::factory()->superadmin()->create();
    User::factory()->user()->create(['samaccountname' => 'jdoe']);

    $response = $this->actingAs($superadmin)->post(route('user-access.store'), [
        'samaccountname' => 'jdoe',
        'name' => 'Jane Doe',
        'email' => 'jane@example.com',
        'role' => 'user',
    ]);

    $response->assertInvalid(['samaccountname']);
});

test('superadmin can change another user role', function () {
    $superadmin = User::factory()->superadmin()->create();
    $target = User::factory()->user()->create(['guid' => 'some-guid']);

    $response = $this->actingAs($superadmin)->put(route('user-access.update', $target), [
        'role' => 'admin',
    ]);

    $response->assertRedirect();

    expect($target->fresh()->role)->toBe(UserRole::Admin);
});

test('superadmin cannot change their own role', function () {
    $superadmin = User::factory()->superadmin()->create();

    $response = $this->actingAs($superadmin)->put(route('user-access.update', $superadmin), [
        'role' => 'admin',
    ]);

    $response->assertForbidden();
    expect($superadmin->fresh()->role)->toBe(UserRole::Superadmin);
});

test('superadmin cannot delete their own account', function () {
    $superadmin = User::factory()->superadmin()->create();

    $response = $this->actingAs($superadmin)->delete(route('user-access.destroy', $superadmin));

    $response->assertForbidden();
    $this->assertDatabaseHas('users', ['id' => $superadmin->id]);
});

test('superadmin can delete another user', function () {
    $superadmin = User::factory()->superadmin()->create();
    $target = User::factory()->user()->create();

    $response = $this->actingAs($superadmin)->delete(route('user-access.destroy', $target));

    $response->assertRedirect();
    $this->assertDatabaseMissing('users', ['id' => $target->id]);
});
