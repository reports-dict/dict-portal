<?php

namespace App\Http\Controllers\Admin;

use App\Enums\PortalModule;
use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Models\RolePermission;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class RolePermissionController extends Controller
{
    public function index(): Response
    {
        $permissions = RolePermission::all()
            ->groupBy(fn (RolePermission $permission) => $permission->role->value)
            ->map(fn ($rows) => $rows->map(fn (RolePermission $permission) => $permission->module_key->value)->values());

        return Inertia::render('admin/role-permissions', [
            'modules' => collect(PortalModule::cases())
                ->map(fn (PortalModule $module) => [
                    'key' => $module->value,
                    'label' => $module->label(),
                    'indent' => $module->isSubPermission(),
                ])
                ->values(),
            'permissions' => [
                'admin' => $permissions->get(UserRole::Admin->value, collect())->values(),
                'user' => $permissions->get(UserRole::User->value, collect())->values(),
            ],
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'permissions.admin' => ['present', 'array'],
            'permissions.admin.*' => [Rule::enum(PortalModule::class)],
            'permissions.user' => ['present', 'array'],
            'permissions.user.*' => [Rule::enum(PortalModule::class)],
        ]);

        $now = now();
        $rows = [];

        foreach ([UserRole::Admin, UserRole::User] as $role) {
            foreach ($validated['permissions'][$role->value] as $moduleKey) {
                $rows[] = [
                    'role' => $role->value,
                    'module_key' => $moduleKey,
                    'created_at' => $now,
                    'updated_at' => $now,
                ];
            }
        }

        DB::transaction(function () use ($rows) {
            RolePermission::query()->delete();

            if ($rows !== []) {
                RolePermission::query()->insert($rows);
            }
        });

        return back();
    }
}
