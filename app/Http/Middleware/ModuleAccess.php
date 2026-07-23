<?php

namespace App\Http\Middleware;

use App\Models\RolePermission;
use App\Models\User;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ModuleAccess
{
    public function handle(Request $request, Closure $next, string $module): Response
    {
        /** @var User $user */
        $user = $request->user();

        if ($user->isSuperadmin()) {
            return $next($request);
        }

        $allowed = RolePermission::where('role', $user->role->value)
            ->where('module_key', $module)
            ->exists();

        if (! $allowed) {
            abort(403);
        }

        return $next($request);
    }
}
