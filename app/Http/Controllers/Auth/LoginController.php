<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;
use Laravel\Socialite\Facades\Socialite;
use SocialiteProviders\Microsoft\Provider as MicrosoftProvider;
use Symfony\Component\HttpFoundation\Response as SymfonyResponse;

class LoginController extends Controller
{
    public function create(): Response
    {
        return Inertia::render('auth/login');
    }

    public function store(Request $request): RedirectResponse
    {
        $credentials = $request->validate([
            'username' => ['required', 'string'],
            'password' => ['required', 'string'],
        ]);

        if (Auth::attempt(['samaccountname' => $credentials['username'], 'password' => $credentials['password']], $request->boolean('remember'))) {
            $request->session()->regenerate();

            return redirect()->intended(route('home'));
        }

        return back()->withErrors([
            'username' => 'These credentials do not match our records.',
        ])->onlyInput('username');
    }

    public function destroy(Request $request): SymfonyResponse
    {
        Auth::logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        // End Microsoft's own SSO session too, not just the local one — otherwise
        // the browser's still-active Microsoft session silently re-authenticates
        // the user the moment they hit any page again, making "Log out" a no-op.
        /** @var MicrosoftProvider $provider */
        $provider = Socialite::driver('microsoft');

        // The logout link is triggered via an Inertia XHR visit, so a plain
        // redirect() gets followed by the XHR itself and blocked by CORS when
        // it hits Microsoft's logout endpoint. Inertia::location() instead
        // sends a 409 with X-Inertia-Location, telling the client to do a
        // real top-level window.location redirect.
        return Inertia::location($provider->getLogoutUrl(route('login')));
    }
}
