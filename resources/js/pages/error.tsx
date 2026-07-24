import { Head, Link, usePage } from '@inertiajs/react';
import { Card } from '@/components/ui/card';
import type { Auth } from '@/types/auth';

type ErrorProps = {
    status: number;
};

const statusCopy: Record<number, { title: string; message: string }> = {
    403: {
        title: 'Access restricted',
        message:
            "You don't have permission to view this page. If you believe this is a mistake, contact a superadmin.",
    },
    404: {
        title: 'Page not found',
        message: "The page you're looking for doesn't exist or may have moved.",
    },
    419: {
        title: 'Session expired',
        message: 'Your session has expired. Please go back and try again.',
    },
    429: {
        title: 'Too many requests',
        message:
            "You've made too many requests. Please wait a moment and try again.",
    },
};

function Error({ status }: ErrorProps) {
    const { auth } = usePage<{ auth: Auth | null }>().props;
    const copy = statusCopy[status] ?? {
        title: 'Something went wrong',
        message: 'An unexpected error occurred. Please try again.',
    };
    const isAuthenticated = auth?.user != null;

    return (
        <>
            <Head title={copy.title} />
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
                        Error {status}
                    </p>
                    <h1 className="mb-2 text-xl font-bold text-neutral-900">
                        {copy.title}
                    </h1>
                    <p className="mb-6 text-sm text-neutral-500">
                        {copy.message}
                    </p>

                    <Link
                        href={isAuthenticated ? '/' : '/login'}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-500"
                    >
                        {isAuthenticated ? 'Back to Modules' : 'Back to Login'}
                    </Link>
                </Card>
            </div>
        </>
    );
}

export default Error;
