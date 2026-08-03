import { Link } from '@inertiajs/react';
import type { PropsWithChildren } from 'react';

const navItems = [
    { label: 'Overrides', href: '/vessel-dashboard/admin/overrides' },
];

type VesselAdminLayoutProps = PropsWithChildren<{
    title: string;
}>;

export default function VesselAdminLayout({
    children,
    title,
}: VesselAdminLayoutProps) {
    return (
        <div className="flex min-h-screen flex-col bg-slate-900 text-slate-100 lg:flex-row">
            {/* Sidebar (horizontal bar below lg, vertical sidebar at lg and up) */}
            <aside className="flex w-full flex-row items-center justify-between border-b border-slate-700 bg-slate-800 px-4 py-2 lg:w-56 lg:flex-col lg:items-stretch lg:justify-start lg:border-r lg:border-b-0 lg:px-0 lg:py-0">
                <div className="lg:border-b lg:border-slate-700 lg:px-5 lg:py-5">
                    <Link
                        href="/"
                        className="text-lg leading-tight font-bold text-cyan-400"
                    >
                        Vessel
                    </Link>
                    <p className="hidden text-xs text-slate-400 lg:block">
                        Admin Panel
                    </p>
                </div>
                <nav className="flex gap-1 px-2 lg:flex-1 lg:flex-col lg:space-y-1 lg:px-3 lg:py-4">
                    {navItems.map((item) => {
                        const active =
                            typeof window !== 'undefined' &&
                            window.location.pathname === item.href;

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                                    active
                                        ? 'bg-cyan-700 text-white'
                                        : 'text-slate-300 hover:bg-slate-700'
                                }`}
                            >
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>
                <div className="lg:border-t lg:border-slate-700 lg:px-3 lg:py-4">
                    <Link
                        href="/logout"
                        method="post"
                        as="button"
                        className="rounded-lg px-3 py-2 text-left text-sm text-slate-400 transition-colors hover:bg-slate-700 hover:text-white lg:w-full"
                    >
                        Sign out
                    </Link>
                </div>
            </aside>

            {/* Main content */}
            <div className="flex flex-1 flex-col">
                <header className="flex items-center border-b border-slate-700 px-4 py-3 lg:px-8 lg:py-4">
                    <h1 className="text-lg font-semibold text-white">
                        {title}
                    </h1>
                </header>
                <main className="flex-1 px-4 py-4 lg:px-8 lg:py-6">
                    {children}
                </main>
            </div>
        </div>
    );
}
