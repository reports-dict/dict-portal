<?php

namespace App\Http\Controllers\Admin;

use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class UserAccessController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('admin/user-access', [
            'users' => User::orderBy('name')
                ->get(['id', 'name', 'email', 'samaccountname', 'role', 'guid', 'created_at']),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'samaccountname' => ['required', 'string', 'max:255', 'unique:users,samaccountname'],
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

        if ($user->guid === null) {
            $rules += [
                'samaccountname' => ['required', 'string', 'max:255', Rule::unique('users', 'samaccountname')->ignore($user->id)],
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
