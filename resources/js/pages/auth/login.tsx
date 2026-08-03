import { Head, useForm } from '@inertiajs/react';
import {
    Container,
    Eye,
    EyeOff,
    Loader2,
    Lock,
    MapPinned,
    ShipWheel,
    User,
} from 'lucide-react';
import { useState } from 'react';
import type { FormEvent } from 'react';

const highlights = [
    {
        icon: ShipWheel,
        label: 'Vessel Dashboard',
        description: 'Live loading and discharge operations',
    },
    {
        icon: Container,
        label: 'Container Yard',
        description: 'Yard block allocation and container search',
    },
    {
        icon: MapPinned,
        label: 'Road Queue',
        description: 'Gate turnaround time and queue analytics',
    },
];

export default function Login() {
    const { data, setData, post, processing, errors } = useForm({
        username: '',
        password: '',
        remember: false,
    });
    const [showPassword, setShowPassword] = useState(false);

    function submit(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        post('/login/ldap');
    }

    return (
        <>
            <Head title="Sign in" />
            <div className="flex min-h-screen bg-neutral-950 text-white">
                <div className="relative hidden overflow-hidden lg:flex lg:w-1/2 lg:flex-col lg:justify-between lg:p-12 xl:p-16">
                    <img
                        src="/images/dict-background.avif"
                        alt=""
                        className="absolute inset-0 h-full w-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-brand-950/80 via-brand-950/60 to-brand-950/30" />
                    <div className="absolute inset-0 bg-gradient-to-r from-brand-950/25 via-transparent to-transparent" />

                    <div className="relative">
                        <div className="inline-flex rounded-lg bg-white p-3 shadow-lg">
                            <img
                                src="/images/dict-logo.jpg"
                                alt="DICT"
                                className="h-16 w-auto"
                            />
                        </div>
                    </div>

                    <div className="relative">
                        <h1 className="mb-2 text-3xl leading-tight font-bold text-white xl:text-4xl">
                            Davao International
                            <br />
                            Container Terminal
                        </h1>
                        <p className="mb-10 text-lg font-semibold tracking-wide text-brand-100/80">
                            MINDANAO&apos;S PREMIER AGRO-INDUSTRIAL GATEWAY
                        </p>

                        <ul className="space-y-4">
                            {highlights.map(
                                ({ icon: Icon, label, description }) => (
                                    <li
                                        key={label}
                                        className="flex items-start gap-3"
                                    >
                                        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-white/10 ring-1 ring-white/10">
                                            <Icon className="h-4 w-4 text-brand-100" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-white">
                                                {label}
                                            </p>
                                            <p className="text-xs text-brand-100/70">
                                                {description}
                                            </p>
                                        </div>
                                    </li>
                                ),
                            )}
                        </ul>
                    </div>

                    <p className="relative text-xs text-brand-100/60">
                        &copy; {new Date().getFullYear()} Davao International
                        Container Terminal. Authorized personnel only.
                    </p>
                </div>

                <div className="flex min-w-0 flex-1 flex-col justify-center bg-white px-6 py-12 text-neutral-900 sm:px-12 lg:px-16 xl:px-24">
                    <div className="mx-auto w-full max-w-sm">
                        <div className="mb-8 flex items-center gap-3 lg:hidden">
                            <div className="inline-flex rounded-lg bg-white p-2.5 shadow-sm">
                                <img
                                    src="/images/dict-logo.jpg"
                                    alt="DICT"
                                    className="h-12 w-auto"
                                />
                            </div>
                            <p className="text-xs text-neutral-500">
                                Davao International
                                <br />
                                Container Terminal
                            </p>
                        </div>

                        <h2 className="mb-1 text-2xl font-bold text-neutral-900">
                            Sign in
                        </h2>
                        <p className="mb-8 text-sm text-neutral-500">
                            Enter your domain credentials to access the portal.
                        </p>

                        <form
                            onSubmit={submit}
                            className="space-y-5"
                            noValidate
                        >
                            <div>
                                <label
                                    htmlFor="username"
                                    className="mb-1.5 block text-sm font-medium text-neutral-700"
                                >
                                    Username
                                </label>
                                <div className="relative">
                                    <User className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                                    <input
                                        id="username"
                                        type="text"
                                        value={data.username}
                                        onChange={(e) =>
                                            setData('username', e.target.value)
                                        }
                                        autoComplete="username"
                                        autoFocus
                                        className="w-full rounded-lg border border-neutral-300 bg-white py-2.5 pr-4 pl-10 text-neutral-900 placeholder-neutral-400 transition-colors focus:border-brand-500 focus:ring-1 focus:ring-brand-500 focus:outline-none"
                                        placeholder="domain\username"
                                    />
                                </div>
                                {errors.username && (
                                    <p className="mt-1.5 text-xs text-red-600">
                                        {errors.username}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label
                                    htmlFor="password"
                                    className="mb-1.5 block text-sm font-medium text-neutral-700"
                                >
                                    Password
                                </label>
                                <div className="relative">
                                    <Lock className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                                    <input
                                        id="password"
                                        type={
                                            showPassword ? 'text' : 'password'
                                        }
                                        value={data.password}
                                        onChange={(e) =>
                                            setData('password', e.target.value)
                                        }
                                        autoComplete="current-password"
                                        className="w-full rounded-lg border border-neutral-300 bg-white py-2.5 pr-11 pl-10 text-neutral-900 placeholder-neutral-400 transition-colors focus:border-brand-500 focus:ring-1 focus:ring-brand-500 focus:outline-none"
                                    />
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setShowPassword((prev) => !prev)
                                        }
                                        tabIndex={-1}
                                        className="absolute top-1/2 right-3 -translate-y-1/2 text-neutral-400 transition-colors hover:text-neutral-600"
                                        aria-label={
                                            showPassword
                                                ? 'Hide password'
                                                : 'Show password'
                                        }
                                    >
                                        {showPassword ? (
                                            <EyeOff className="h-4 w-4" />
                                        ) : (
                                            <Eye className="h-4 w-4" />
                                        )}
                                    </button>
                                </div>
                                {errors.password && (
                                    <p className="mt-1.5 text-xs text-red-600">
                                        {errors.password}
                                    </p>
                                )}
                            </div>

                            <div className="flex items-center justify-between">
                                <label className="flex cursor-pointer items-center gap-2 text-sm text-neutral-700 select-none">
                                    <input
                                        type="checkbox"
                                        checked={data.remember}
                                        onChange={(e) =>
                                            setData(
                                                'remember',
                                                e.target.checked,
                                            )
                                        }
                                        className="h-4 w-4 rounded border-neutral-300 bg-white text-brand-500 accent-brand-500"
                                    />
                                    Remember me
                                </label>
                            </div>

                            <button
                                type="submit"
                                disabled={processing}
                                className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-600 py-2.5 font-semibold text-white transition-colors hover:bg-brand-500 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {processing && (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                )}
                                {processing ? 'Signing in…' : 'Sign in'}
                            </button>
                        </form>

                        <p className="mt-6 text-center text-sm text-neutral-500">
                            <a
                                href="/login"
                                className="underline hover:text-neutral-700"
                            >
                                Sign in with Microsoft instead
                            </a>
                        </p>

                        <p className="mt-8 text-center text-xs text-neutral-400">
                            Access restricted to authorized DICT personnel.
                            Contact IT Support if you need assistance.
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
}
