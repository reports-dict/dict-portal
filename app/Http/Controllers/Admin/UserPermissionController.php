<?php

namespace App\Http\Controllers\Admin;

use App\Enums\PortalModule;
use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\UserPermission;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class UserPermissionController extends Controller
{
    public function show(User $user): JsonResponse
    {
        $overrides = $user->permissionOverrides()
            ->get()
            ->mapWithKeys(fn (UserPermission $permission) => [
                $permission->module_key->value => $permission->effect->value,
            ]);

        return response()->json([
            'modules' => collect(PortalModule::cases())
                ->map(fn (PortalModule $module) => [
                    'key' => $module->value,
                    'label' => $module->label(),
                    'indent' => $module->isSubPermission(),
                ])
                ->values(),
            'overrides' => $overrides,
        ]);
    }

    public function update(Request $request, User $user): RedirectResponse
    {
        $validated = $request->validate([
            'overrides' => ['present', 'array'],
            'overrides.*' => [Rule::in(['default', 'allow', 'deny'])],
        ]);

        $validModuleKeys = array_column(PortalModule::cases(), 'value');
        $now = now();
        $rows = [];

        foreach ($validated['overrides'] as $moduleKey => $state) {
            if ($state === 'default' || ! in_array($moduleKey, $validModuleKeys, true)) {
                continue;
            }

            $rows[] = [
                'user_id' => $user->id,
                'module_key' => $moduleKey,
                'effect' => $state,
                'created_at' => $now,
                'updated_at' => $now,
            ];
        }

        DB::transaction(function () use ($user, $rows) {
            UserPermission::where('user_id', $user->id)->delete();

            if ($rows !== []) {
                UserPermission::query()->insert($rows);
            }
        });

        return back();
    }
}
