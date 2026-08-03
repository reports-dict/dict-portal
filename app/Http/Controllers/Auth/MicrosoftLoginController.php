<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Laravel\Socialite\Facades\Socialite;
use Laravel\Socialite\Two\InvalidStateException;
use SocialiteProviders\Microsoft\Provider as MicrosoftProvider;
use Symfony\Component\HttpFoundation\RedirectResponse;
use Symfony\Component\HttpFoundation\Response;
use Throwable;

class MicrosoftLoginController extends Controller
{
    public function redirect(): RedirectResponse
    {
        // MICROSOFT_REDIRECT_URI is fixed to the production callback URL, so
        // SSO can never complete against a local dev server — Microsoft would
        // just bounce the browser to production after sign-in. Skip straight
        // to the LDAP fallback rather than sending local dev through a flow
        // that can only dead-end.
        if (app()->environment('local')) {
            return redirect()->route('login.ldap');
        }

        try {
            return Socialite::driver('microsoft')->redirect();
        } catch (Throwable $e) {
            report($e);

            return redirect()->route('login.ldap');
        }
    }

    public function callback(Request $request): Response
    {
        /** @var MicrosoftProvider $provider */
        $provider = Socialite::driver('microsoft');

        try {
            $ssoUser = $provider->user();
            // getClaims() validates the id_token's signature (against Microsoft's
            // published JWKS) plus iss/aud/exp — already invoked internally by
            // user() via mapUserToObject()'s getRoles()/getGroups() calls, so this
            // just reads the cached, already-verified claims (or throws the same
            // InvalidStateException below if validation failed).
            $tenantId = $provider->getClaims()?->tid;
        } catch (InvalidStateException) {
            return $this->denied($provider, $request, null, 'Your sign-in request expired or was tampered with. Please try again.');
        } catch (Throwable $e) {
            report($e);

            return $this->denied($provider, $request, null, 'Microsoft sign-in failed. Please try again or contact IT.');
        }

        if ($tenantId === null || ! hash_equals((string) config('services.microsoft.tenant'), $tenantId)) {
            return $this->denied($provider, $request, $ssoUser->getEmail(), 'This Microsoft account does not belong to the expected organization.');
        }

        $email = $ssoUser->getEmail();
        $user = $email ? User::whereRaw('LOWER(email) = ?', [Str::lower($email)])->first() : null;

        if (! $user) {
            return $this->denied($provider, $request, $email, 'Your account has not been provisioned yet. Ask a superadmin to add you under Admin > Users.');
        }

        $user->forceFill(['azure_oid' => $ssoUser->getId()])->save();

        Auth::login($user, remember: true);
        $request->session()->regenerate();
        $request->session()->put('auth_provider', 'microsoft');

        return redirect()->intended(route('home'));
    }

    protected function denied(MicrosoftProvider $provider, Request $request, ?string $email, string $message): Response
    {
        return Inertia::render('auth/not-provisioned', [
            'email' => $email,
            'message' => $message,
            'microsoftLogoutUrl' => $provider->getLogoutUrl(route('login')),
        ])->toResponse($request)->setStatusCode(403);
    }
}
