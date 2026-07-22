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
        <div className="flex min-h-screen bg-slate-900 text-slate-100">
            {/* Sidebar */}
            <aside className="flex w-56 shrink-0 flex-col border-r border-slate-700 bg-slate-800">
                <div className="border-b border-slate-700 px-5 py-5">
                    <Link
                        href="/"
                        className="text-lg leading-tight font-bold text-cyan-400"
                    >
                        Vessel
                    </Link>
                    <p className="text-xs text-slate-400">Admin Panel</p>
                </div>
                <nav className="flex-1 space-y-1 px-3 py-4">
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
                <div className="border-t border-slate-700 px-3 py-4">
                    <Link
                        href="/logout"
                        method="post"
                        as="button"
                        className="w-full rounded-lg px-3 py-2 text-left text-sm text-slate-400 transition-colors hover:bg-slate-700 hover:text-white"
                    >
                        Sign out
                    </Link>
                </div>
            </aside>

            {/* Main content */}
            <div className="flex flex-1 flex-col">
                <header className="flex items-center border-b border-slate-700 px-8 py-4">
                    <h1 className="text-lg font-semibold text-white">
                        {title}
                    </h1>
                </header>
                <main className="flex-1 px-8 py-6">{children}</main>
            </div>
        </div>
    );
}
