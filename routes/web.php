<?php

use App\Http\Controllers\Admin\OnlineUsersController;
use App\Http\Controllers\Admin\RolePermissionController;
use App\Http\Controllers\Admin\UserAccessController;
use App\Http\Controllers\Admin\UserPermissionController;
use App\Http\Controllers\Auth\LoginController;
use App\Http\Controllers\Auth\MicrosoftLoginController;
use App\Http\Controllers\ContainerYard\Api\AllocationController as ContainerYardAllocationController;
use App\Http\Controllers\ContainerYard\Api\BlockController as ContainerYardBlockController;
use App\Http\Controllers\ContainerYard\Api\ContainerController as ContainerYardContainerController;
use App\Http\Controllers\ContainerYard\ContainerYardController;
use App\Http\Controllers\RoadQueue\RoadQueueController;
use App\Http\Controllers\RoadQueueEcd\RoadQueueController as RoadQueueEcdController;
use App\Http\Controllers\VesselDashboard\Admin\OverrideController as VesselOverrideController;
use App\Http\Controllers\VesselDashboard\DashboardController as VesselDashboardController;
use Illuminate\Support\Facades\Route;

Route::middleware('guest')->group(function () {
    Route::get('/login', [MicrosoftLoginController::class, 'redirect'])->name('login');

    // Secondary/fallback path — used when SSO is unavailable or the signing-in
    // account isn't matched by SSO. /login stays the primary, auto-triggered
    // path above so unauthenticated redirects (route('login')) are unaffected.
    Route::get('/login/ldap', [LoginController::class, 'create'])->name('login.ldap');
    Route::post('/login/ldap', [LoginController::class, 'store']);
});

// Bridges unauthenticated -> authenticated state, so it must be reachable
// regardless of current session state — not nested under 'guest' or 'auth'.
Route::get('/auth/microsoft/callback', [MicrosoftLoginController::class, 'callback'])
    ->name('auth.microsoft.callback');

Route::middleware('auth')->group(function () {
    Route::post('/logout', [LoginController::class, 'destroy'])->name('logout');

    Route::inertia('/', 'home')->name('home');

    Route::middleware('module:vessel-dashboard')->prefix('vessel-dashboard')->name('vessel-dashboard.')->group(function () {
        Route::get('/', [VesselDashboardController::class, 'index'])->name('index');
        Route::get('/api/data', [VesselDashboardController::class, 'data'])->name('data');

        Route::middleware('module:vessel-dashboard-overrides')->prefix('admin')->name('admin.')->group(function () {
            Route::get('/overrides', [VesselOverrideController::class, 'index'])->name('overrides');
            Route::post('/overrides', [VesselOverrideController::class, 'store'])->name('overrides.store');
            Route::delete('/overrides/{obIbId}', [VesselOverrideController::class, 'destroy'])->name('overrides.destroy');
        });
    });

    Route::middleware('module:road-queue')->get('/road-queue', [RoadQueueController::class, 'index'])->name('road-queue.index');
    Route::middleware('module:road-queue-ecd')->get('/road-queue-ecd', [RoadQueueEcdController::class, 'index'])->name('road-queue-ecd.index');

    Route::middleware('module:container-yard')->prefix('container-yard')->name('container-yard.')->group(function () {
        Route::get('/', [ContainerYardController::class, 'index'])->name('index');
        Route::get('/search', [ContainerYardController::class, 'search'])->name('search');

        Route::prefix('api')->name('api.')->group(function () {
            Route::get('/container-search', [ContainerYardContainerController::class, 'liveSearch'])->name('container-search');
            Route::apiResource('containers', ContainerYardContainerController::class);
            Route::apiResource('blocks', ContainerYardBlockController::class)->only(['index', 'show']);
            Route::apiResource('allocations', ContainerYardAllocationController::class)->only(['index', 'show']);

            Route::middleware('module:container-yard-blocks')->group(function () {
                Route::apiResource('blocks', ContainerYardBlockController::class)->except(['index', 'show']);
            });

            Route::middleware('module:container-yard-allocations')->group(function () {
                Route::apiResource('allocations', ContainerYardAllocationController::class)->except(['index', 'show']);
            });
        });
    });

    Route::middleware('superadmin')->group(function () {
        Route::prefix('admin/users')->name('user-access.')->group(function () {
            Route::get('/', [UserAccessController::class, 'index'])->name('index');
            Route::post('/', [UserAccessController::class, 'store'])->name('store');
            Route::get('/online-now', [OnlineUsersController::class, 'index'])->name('online');
            Route::put('/{user}', [UserAccessController::class, 'update'])->name('update');
            Route::delete('/{user}', [UserAccessController::class, 'destroy'])->name('destroy');
            Route::get('/{user}/permissions', [UserPermissionController::class, 'show'])->name('permissions.show');
            Route::put('/{user}/permissions', [UserPermissionController::class, 'update'])->name('permissions.update');
        });

        Route::prefix('admin/permissions')->name('role-permissions.')->group(function () {
            Route::get('/', [RolePermissionController::class, 'index'])->name('index');
            Route::put('/', [RolePermissionController::class, 'update'])->name('update');
        });
    });
});
