<?php

use App\Models\RolePermission;
use App\Models\User;

test('a role with a module revoked is forbidden from that route', function () {
    $user = User::factory()->user()->create();

    RolePermission::where('role', 'user')->where('module_key', 'road-queue')->delete();

    $response = $this->actingAs($user)->get('/road-queue');

    $response->assertForbidden();
});

test('a role with a module granted is not forbidden from that route', function () {
    $user = User::factory()->user()->create();

    $response = $this->actingAs($user)->get('/road-queue');

    expect($response->status())->not->toBe(403);
});

test('superadmin is never forbidden regardless of the permissions matrix', function () {
    $superadmin = User::factory()->superadmin()->create();

    RolePermission::query()->delete();

    $response = $this->actingAs($superadmin)->get('/road-queue');

    expect($response->status())->not->toBe(403);
});

test('reading container yard blocks only requires the base container-yard permission', function () {
    $user = User::factory()->user()->create();

    RolePermission::where('role', 'user')->where('module_key', 'container-yard-blocks')->delete();

    $response = $this->actingAs($user)->getJson('/container-yard/api/blocks');

    expect($response->status())->not->toBe(403);
});

test('creating a container yard block requires the container-yard-blocks permission', function () {
    $user = User::factory()->user()->create();

    RolePermission::where('role', 'user')->where('module_key', 'container-yard-blocks')->delete();

    $response = $this->actingAs($user)->postJson('/container-yard/api/blocks', []);

    $response->assertForbidden();
});

test('creating an allocation requires the container-yard-allocations permission', function () {
    $user = User::factory()->user()->create();

    RolePermission::where('role', 'user')->where('module_key', 'container-yard-allocations')->delete();

    $response = $this->actingAs($user)->postJson('/container-yard/api/allocations', []);

    $response->assertForbidden();
});

test('viewing vessel dashboard overrides requires the vessel-dashboard-overrides permission', function () {
    $user = User::factory()->user()->create();

    RolePermission::where('role', 'user')->where('module_key', 'vessel-dashboard-overrides')->delete();

    $response = $this->actingAs($user)->get('/vessel-dashboard/admin/overrides');

    $response->assertForbidden();
});
