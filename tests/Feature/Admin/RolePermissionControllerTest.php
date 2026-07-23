<?php

use App\Models\RolePermission;
use App\Models\User;

test('superadmin can view the role permissions matrix', function () {
    $superadmin = User::factory()->superadmin()->create();

    $response = $this->actingAs($superadmin)->get(route('role-permissions.index'));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('admin/role-permissions')
        ->has('modules', 7)
        ->has('permissions.admin', 7)
        ->has('permissions.user', 7)
    );
});

test('admin cannot view or update the role permissions matrix', function () {
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)->get(route('role-permissions.index'))->assertForbidden();

    $this->actingAs($admin)->put(route('role-permissions.update'), [
        'permissions' => ['admin' => [], 'user' => []],
    ])->assertForbidden();
});

test('user cannot view or update the role permissions matrix', function () {
    $user = User::factory()->user()->create();

    $this->actingAs($user)->get(route('role-permissions.index'))->assertForbidden();

    $this->actingAs($user)->put(route('role-permissions.update'), [
        'permissions' => ['admin' => [], 'user' => []],
    ])->assertForbidden();
});

test('superadmin can update the matrix and revoke access', function () {
    $superadmin = User::factory()->superadmin()->create();

    $response = $this->actingAs($superadmin)->put(route('role-permissions.update'), [
        'permissions' => [
            'admin' => ['vessel-dashboard', 'road-queue'],
            'user' => [],
        ],
    ]);

    $response->assertRedirect();

    $this->assertDatabaseCount('role_permissions', 2);
    $this->assertDatabaseHas('role_permissions', ['role' => 'admin', 'module_key' => 'vessel-dashboard']);
    $this->assertDatabaseHas('role_permissions', ['role' => 'admin', 'module_key' => 'road-queue']);
    $this->assertDatabaseMissing('role_permissions', ['role' => 'user']);
});

test('updating the matrix rejects an invalid module key', function () {
    $superadmin = User::factory()->superadmin()->create();

    $response = $this->actingAs($superadmin)->put(route('role-permissions.update'), [
        'permissions' => [
            'admin' => ['not-a-real-module'],
            'user' => [],
        ],
    ]);

    $response->assertInvalid(['permissions.admin.0']);
    expect(RolePermission::count())->toBe(14);
});
