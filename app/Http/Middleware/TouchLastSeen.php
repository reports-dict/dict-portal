<?php

namespace App\Http\Middleware;

use App\Models\User;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Symfony\Component\HttpFoundation\Response;

class TouchLastSeen
{
    /**
     * Persist the authenticated user's last-activity timestamp on the
     * `users` table itself, independent of the `sessions` table — which
     * Laravel's session garbage collector prunes after `SESSION_LIFETIME`
     * minutes, wiping out any "last seen" reading derived from it.
     * Throttled to once a minute per user to avoid an UPDATE on every
     * request, including polling endpoints.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user instanceof User && (
            $user->last_seen_at === null || $user->last_seen_at->lt(Carbon::now()->subMinute())
        )) {
            $user->forceFill(['last_seen_at' => Carbon::now()])->saveQuietly();
        }

        return $next($request);
    }
}
