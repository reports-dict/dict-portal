<?php

namespace App\Http\Controllers\Admin;

use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Models\Session;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class UserAccessController extends Controller
{
    public function index(Request $request): Response
    {
        $search = trim((string) $request->query('search', ''));
        $role = (string) $request->query('role', '');
        $status = (string) $request->query('status', '');

        $users = User::query()
            ->when($search !== '', function ($query) use ($search) {
                $query->where(function ($query) use ($search) {
                    $query->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%")
                        ->orWhere('samaccountname', 'like', "%{$search}%");
                });
            })
            ->when(
                in_array($role, array_column(UserRole::cases(), 'value'), true),
                fn ($query) => $query->where('role', $role),
            )
            ->when($status === 'linked', fn ($query) => $query->where(
                fn ($query) => $query->whereNotNull('guid')->orWhereNotNull('azure_oid'),
            ))
            ->when($status === 'pending', fn ($query) => $query->whereNull('guid')->whereNull('azure_oid'))
            ->orderBy('name')
            ->paginate(15, ['id', 'name', 'email', 'samaccountname', 'role', 'guid', 'azure_oid', 'created_at'])
            ->withQueryString();

        $lastActivity = Session::lastActivityByUserId($users->pluck('id')->all());

        $users->getCollection()->each(
            fn (User $user) => $user->setAttribute('last_activity', $lastActivity[$user->id] ?? null),
        );

        return Inertia::render('admin/user-access', [
            'users' => $users,
            'filters' => [
                'search' => $search,
                'role' => $role,
                'status' => $status,
            ],
            'stats' => [
                'total' => User::count(),
                'linked' => User::query()->where(
                    fn ($query) => $query->whereNotNull('guid')->orWhereNotNull('azure_oid'),
                )->count(),
                'pending' => User::whereNull('guid')->whereNull('azure_oid')->count(),
                'superadmins' => User::where('role', UserRole::Superadmin)->count(),
            ],
            'onlineUsers' => Session::onlineUsers(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            // Nullable — SSO-only pre-provisioning has no AD username to give.
            'samaccountname' => ['nullable', 'string', 'max:255', 'unique:users,samaccountname'],
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'role' => ['required', Rule::enum(UserRole::class)],
        ]);

        User::create($validated);

        return back();
    }

    public function update(Request $request, User $user): RedirectResponse
    {
        /** @var User $currentUser */
        $currentUser = $request->user();

        if ($user->id === $currentUser->id) {
            abort(403, "You can't change your own role.");
        }

        $rules = [
            'role' => ['required', Rule::enum(UserRole::class)],
        ];

        if ($user->guid === null && $user->azure_oid === null) {
            $rules += [
                'samaccountname' => ['nullable', 'string', 'max:255', Rule::unique('users', 'samaccountname')->ignore($user->id)],
                'name' => ['required', 'string', 'max:255'],
                'email' => ['required', 'email', 'max:255', Rule::unique('users', 'email')->ignore($user->id)],
            ];
        }

        $user->update($request->validate($rules));

        return back();
    }

    public function destroy(Request $request, User $user): RedirectResponse
    {
        /** @var User $currentUser */
        $currentUser = $request->user();

        if ($user->id === $currentUser->id) {
            abort(403, "You can't delete your own account.");
        }

        $user->delete();

        return back();
    }
}
