<?php

namespace App\Http\Middleware;

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

        if (! $user->hasModuleAccess($module)) {
            abort(403);
        }

        return $next($request);
    }
}
