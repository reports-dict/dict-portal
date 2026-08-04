<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;

/**
 * @property string $id
 * @property int|null $user_id
 * @property string|null $ip_address
 * @property string|null $user_agent
 * @property string $payload
 * @property int $last_activity
 */
class Session extends Model
{
    public $timestamps = false;

    public $incrementing = false;

    protected $keyType = 'string';

    /**
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Users with at least one session active within the last $withinMinutes,
     * one row per user (not per session) with a session_count for anyone
     * signed in from more than one device/browser.
     *
     * @return Collection<int, array{id: int, name: string, email: string, role: 'admin'|'superadmin'|'user', session_count: int, last_activity: string}>
     */
    public static function onlineUsers(int $withinMinutes = 5): Collection
    {
        $threshold = now()->subMinutes($withinMinutes)->getTimestamp();

        return User::query()
            ->select(['users.id', 'users.name', 'users.email', 'users.role'])
            ->selectRaw('COUNT(sessions.id) as session_count')
            ->selectRaw('MAX(sessions.last_activity) as last_activity_ts')
            ->join('sessions', 'sessions.user_id', '=', 'users.id')
            ->where('sessions.last_activity', '>=', $threshold)
            ->groupBy('users.id', 'users.name', 'users.email', 'users.role')
            ->orderByDesc('last_activity_ts')
            ->get()
            ->map(fn (User $user) => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role->value,
                'session_count' => (int) $user->getAttribute('session_count'),
                'last_activity' => (string) Carbon::createFromTimestamp($user->getAttribute('last_activity_ts'))->toISOString(),
            ]);
    }
}
