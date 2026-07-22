<?php

use App\Http\Controllers\Auth\LoginController;
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
    Route::get('/login', [LoginController::class, 'create'])->name('login');
    Route::post('/login', [LoginController::class, 'store']);
});

Route::middleware(['auth', 'superadmin'])->group(function () {
    Route::post('/logout', [LoginController::class, 'destroy'])->name('logout');

    Route::inertia('/', 'home')->name('home');

    Route::prefix('vessel-dashboard')->name('vessel-dashboard.')->group(function () {
        Route::get('/', [VesselDashboardController::class, 'index'])->name('index');
        Route::get('/api/data', [VesselDashboardController::class, 'data'])->name('data');

        Route::prefix('admin')->name('admin.')->group(function () {
            Route::get('/overrides', [VesselOverrideController::class, 'index'])->name('overrides');
            Route::post('/overrides', [VesselOverrideController::class, 'store'])->name('overrides.store');
            Route::delete('/overrides/{obIbId}', [VesselOverrideController::class, 'destroy'])->name('overrides.destroy');
        });
    });

    Route::get('/road-queue', [RoadQueueController::class, 'index'])->name('road-queue.index');
    Route::get('/road-queue-ecd', [RoadQueueEcdController::class, 'index'])->name('road-queue-ecd.index');

    Route::prefix('container-yard')->name('container-yard.')->group(function () {
        Route::get('/', [ContainerYardController::class, 'index'])->name('index');
        Route::get('/search', [ContainerYardController::class, 'search'])->name('search');

        Route::prefix('api')->name('api.')->group(function () {
            Route::get('/container-search', [ContainerYardContainerController::class, 'liveSearch'])->name('container-search');
            Route::apiResource('containers', ContainerYardContainerController::class);
            Route::apiResource('blocks', ContainerYardBlockController::class);
            Route::apiResource('allocations', ContainerYardAllocationController::class);
        });
    });
});
