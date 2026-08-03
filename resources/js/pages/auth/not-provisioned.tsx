import { Head } from '@inertiajs/react';
import { Card } from '@/components/ui/card';

type NotProvisionedProps = {
    email: string | null;
    message: string;
    microsoftLogoutUrl: string;
};

function NotProvisioned({
    email,
    message,
    microsoftLogoutUrl,
}: NotProvisionedProps) {
    return (
        <>
            <Head title="Access restricted" />
            <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-4">
                <Card className="w-full max-w-sm text-center">
                    <div className="mb-4 inline-flex rounded-lg bg-white p-3 shadow-lg ring-1 ring-neutral-200">
                        <img
                            src="/images/dict-logo.jpg"
                            alt="DICT"
                            className="h-12 w-auto"
                        />
                    </div>

                    <p className="mb-1 text-xs font-semibold tracking-wide text-brand-600 uppercase">
                        Access restricted
                    </p>
                    <h1 className="mb-2 text-xl font-bold text-neutral-900">
                        You don&apos;t have access yet
                    </h1>
                    <p className="mb-2 text-sm text-neutral-500">{message}</p>
                    {email && (
                        <p className="mb-6 text-xs text-neutral-400">
                            Signed in as {email}
                        </p>
                    )}
                    {!email && <div className="mb-6" />}

                    <a
                        href={microsoftLogoutUrl}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-500"
                    >
                        Sign out and try a different account
                    </a>

                    <a
                        href="/login/ldap"
                        className="mt-3 inline-block text-sm text-neutral-500 underline hover:text-neutral-700"
                    >
                        Or sign in with domain credentials
                    </a>
                </Card>
            </div>
        </>
    );
}

export default NotProvisioned;
