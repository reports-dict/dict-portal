import { Link, usePage } from '@inertiajs/react';
import { LogOut } from 'lucide-react';
import { useEffect, useRef } from 'react';
import type { PropsWithChildren } from 'react';
import { useFullscreen } from '@/hooks/use-fullscreen';
import { portalModules } from '@/lib/modules';
import type { Auth } from '@/types';

export default function PortalLayout({ children }: PropsWithChildren) {
    const page = usePage<{ auth: Auth }>();
    const { auth } = page.props;
    const { url } = page;
    const path = url.split('?')[0];
    const { isFullscreen } = useFullscreen();
    const mainRef = useRef<HTMLElement>(null);

    useEffect(() => {
        mainRef.current?.scrollTo(0, 0);
    }, [url]);

    return (
        <div className="flex h-screen flex-col overflow-hidden bg-neutral-950">
            {!isFullscreen && (
                <header className="flex h-14 flex-shrink-0 items-center justify-between gap-4 border-b border-neutral-800 bg-neutral-950 px-4 text-white sm:px-6">
                    <Link href="/" className="flex items-center gap-2.5">
                        <span className="flex h-8 w-8 items-center justify-center rounded-md bg-white p-1">
                            <img
                                src="/images/dict-logo.jpg"
                                alt="DICT"
                                className="h-full w-full object-contain"
                            />
                        </span>
                        <span className="hidden text-sm font-semibold tracking-wide sm:inline">
                            DICT Portal
                        </span>
                    </Link>

                    <nav className="hidden flex-1 items-center gap-1 overflow-x-auto sm:flex">
                        {portalModules.map((module) => {
                            const isActive =
                                path === module.href ||
                                path.startsWith(`${module.href}/`);
                            const Icon = module.icon;

                            return (
                                <Link
                                    key={module.href}
                                    href={module.href}
                                    title={module.name}
                                    className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-colors ${
                                        isActive
                                            ? 'bg-brand-600/15 text-white ring-1 ring-brand-500/40 ring-inset'
                                            : 'text-neutral-300 hover:bg-white/5 hover:text-white'
                                    }`}
                                >
                                    <Icon
                                        className={`h-4 w-4 ${isActive ? 'text-brand-400' : 'text-neutral-500'}`}
                                    />
                                    <span className="hidden xl:inline">
                                        {module.name}
                                    </span>
                                </Link>
                            );
                        })}
                    </nav>

                    <div className="flex items-center gap-3">
                        <span className="hidden text-sm text-neutral-400 lg:inline">
                            {auth.user.name}
                        </span>
                        <Link
                            href="/logout"
                            method="post"
                            as="button"
                            className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-neutral-300 transition-colors hover:bg-white/5 hover:text-white"
                        >
                            <LogOut className="h-4 w-4" />
                            Sign out
                        </Link>
                    </div>
                </header>
            )}

            <main ref={mainRef} className="min-h-0 flex-1 overflow-y-auto">
                {children}
            </main>
        </div>
    );
}
