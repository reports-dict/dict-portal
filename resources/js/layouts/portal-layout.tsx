import { Link, usePage } from '@inertiajs/react';
import {
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    LayoutGrid,
    LogOut,
    ShieldCheck,
    SlidersHorizontal,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { PropsWithChildren } from 'react';
import { useFullscreen } from '@/hooks/use-fullscreen';
import { portalModules } from '@/lib/modules';
import { hasModulePermission } from '@/lib/permissions';
import rolePermissions from '@/routes/role-permissions';
import userAccess from '@/routes/user-access';
import type { Auth } from '@/types';

const SIDEBAR_COLLAPSED_KEY = 'dict-portal-sidebar-collapsed';
const NARROW_VIEWPORT_QUERY = '(max-width: 1023px)';

export default function PortalLayout({ children }: PropsWithChildren) {
    const page = usePage<{
        auth: Auth;
        permittedModules: string[] | null;
    }>();
    const { auth, permittedModules } = page.props;
    const { url } = page;
    const path = url.split('?')[0];
    const { isFullscreen } = useFullscreen();
    const mainRef = useRef<HTMLElement>(null);
    const [collapsed, setCollapsed] = useState(
        () => localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === 'true',
    );
    const [isNarrowViewport, setIsNarrowViewport] = useState(
        () => window.matchMedia(NARROW_VIEWPORT_QUERY).matches,
    );
    const visibleModules = portalModules
        .filter(
            (module) =>
                hasModulePermission(permittedModules, module.key) ||
                module.children?.some((child) =>
                    hasModulePermission(permittedModules, child.key),
                ),
        )
        .map((module) => ({
            ...module,
            children: module.children?.filter((child) =>
                hasModulePermission(permittedModules, child.key),
            ),
        }));
    const effectiveCollapsed = isNarrowViewport || collapsed;
    // Sub-nav groups start expanded only if the currently-active page is one
    // of their children, so a direct link into e.g. History lands expanded;
    // otherwise collapsed until the user toggles them open.
    const [expandedGroups, setExpandedGroups] = useState<
        Record<string, boolean>
    >(() =>
        Object.fromEntries(
            portalModules
                .filter((module) => module.children)
                .map((module) => [
                    module.key,
                    module.children!.some((child) => path === child.href),
                ]),
        ),
    );

    function toggleGroup(key: string) {
        setExpandedGroups((prev) => ({ ...prev, [key]: !prev[key] }));
    }

    useEffect(() => {
        mainRef.current?.scrollTo(0, 0);
    }, [url]);

    useEffect(() => {
        localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(collapsed));
    }, [collapsed]);

    useEffect(() => {
        const mediaQuery = window.matchMedia(NARROW_VIEWPORT_QUERY);
        const handleChange = (event: MediaQueryListEvent) =>
            setIsNarrowViewport(event.matches);

        mediaQuery.addEventListener('change', handleChange);

        return () => mediaQuery.removeEventListener('change', handleChange);
    }, []);

    const adminLinks = [
        {
            href: userAccess.index.url(),
            match: '/admin/users',
            label: 'User Access',
            icon: ShieldCheck,
        },
        {
            href: rolePermissions.index.url(),
            match: '/admin/permissions',
            label: 'Role Permissions',
            icon: SlidersHorizontal,
        },
    ];

    return (
        <div className="flex h-screen overflow-hidden bg-neutral-950">
            {!isFullscreen && (
                <aside
                    className={`flex shrink-0 flex-col border-r border-neutral-800 bg-neutral-950 text-white transition-[width] duration-200 ${
                        effectiveCollapsed ? 'w-16' : 'w-60'
                    }`}
                >
                    <Link
                        href="/"
                        className="flex h-14 shrink-0 items-center gap-2.5 border-b border-neutral-800 px-4"
                    >
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-white p-1">
                            <img
                                src="/images/dict-logo.jpg"
                                alt="DICT"
                                className="h-full w-full object-contain"
                            />
                        </span>
                        {!effectiveCollapsed && (
                            <span className="truncate text-sm font-semibold tracking-wide">
                                DICT Portal
                            </span>
                        )}
                    </Link>

                    <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-2 py-3">
                        <Link
                            href="/"
                            title={effectiveCollapsed ? 'Modules' : undefined}
                            className={`flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-medium whitespace-nowrap transition-colors ${
                                path === '/'
                                    ? 'bg-brand-600/15 text-white ring-1 ring-brand-500/40 ring-inset'
                                    : 'text-neutral-300 hover:bg-white/5 hover:text-white'
                            }`}
                        >
                            <LayoutGrid
                                className={`h-4 w-4 shrink-0 ${path === '/' ? 'text-brand-400' : 'text-neutral-500'}`}
                            />
                            {!effectiveCollapsed && (
                                <span className="truncate">Modules</span>
                            )}
                        </Link>

                        {visibleModules.map((module) => {
                            const groupActive =
                                path === module.href ||
                                path.startsWith(`${module.href}/`);
                            const Icon = module.icon;
                            // Falls back to the first permitted child's route
                            // if the module's own default (board) route isn't
                            // itself permitted — only differs from module.href
                            // when a per-user override grants History without
                            // also granting Board.
                            const fallbackHref =
                                module.children?.[0]?.href ?? module.href;

                            // Collapsed sidebar has no room for sub-nav — fall
                            // back to a single link, same as a module with no
                            // (or only one permitted) child.
                            if (
                                !module.children ||
                                module.children.length <= 1 ||
                                effectiveCollapsed
                            ) {
                                return (
                                    <Link
                                        key={module.href}
                                        href={fallbackHref}
                                        title={
                                            effectiveCollapsed
                                                ? module.name
                                                : undefined
                                        }
                                        className={`flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-medium whitespace-nowrap transition-colors ${
                                            groupActive
                                                ? 'bg-brand-600/15 text-white ring-1 ring-brand-500/40 ring-inset'
                                                : 'text-neutral-300 hover:bg-white/5 hover:text-white'
                                        }`}
                                    >
                                        <Icon
                                            className={`h-4 w-4 shrink-0 ${groupActive ? 'text-brand-400' : 'text-neutral-500'}`}
                                        />
                                        {!effectiveCollapsed && (
                                            <span className="truncate">
                                                {module.name}
                                            </span>
                                        )}
                                    </Link>
                                );
                            }

                            const expanded = Boolean(
                                expandedGroups[module.key],
                            );

                            return (
                                <div key={module.key}>
                                    <button
                                        type="button"
                                        onClick={() => toggleGroup(module.key)}
                                        aria-expanded={expanded}
                                        className={`flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-medium whitespace-nowrap transition-colors ${
                                            groupActive
                                                ? 'text-white'
                                                : 'text-neutral-300 hover:bg-white/5 hover:text-white'
                                        }`}
                                    >
                                        <Icon
                                            className={`h-4 w-4 shrink-0 ${groupActive ? 'text-brand-400' : 'text-neutral-500'}`}
                                        />
                                        <span className="flex-1 truncate text-left">
                                            {module.name}
                                        </span>
                                        <ChevronDown
                                            className={`h-3.5 w-3.5 shrink-0 text-neutral-500 transition-transform ${expanded ? 'rotate-180' : ''}`}
                                        />
                                    </button>
                                    {expanded && (
                                        <div className="mb-1 ml-[1.375rem] flex flex-col gap-0.5 border-l border-neutral-800 pl-3">
                                            {module.children.map((child) => {
                                                const isActive =
                                                    path === child.href;

                                                return (
                                                    <Link
                                                        key={child.href}
                                                        href={child.href}
                                                        className={`rounded-md px-2.5 py-1.5 text-sm whitespace-nowrap transition-colors ${
                                                            isActive
                                                                ? 'bg-brand-600/15 text-white ring-1 ring-brand-500/40 ring-inset'
                                                                : 'text-neutral-400 hover:bg-white/5 hover:text-white'
                                                        }`}
                                                    >
                                                        {child.name}
                                                    </Link>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            );
                        })}

                        {auth.user.role === 'superadmin' && (
                            <>
                                <div className="my-2 border-t border-neutral-800" />
                                {adminLinks.map((link) => {
                                    const isActive = path === link.match;
                                    const Icon = link.icon;

                                    return (
                                        <Link
                                            key={link.href}
                                            href={link.href}
                                            title={
                                                effectiveCollapsed
                                                    ? link.label
                                                    : undefined
                                            }
                                            className={`flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-medium whitespace-nowrap transition-colors ${
                                                isActive
                                                    ? 'bg-brand-600/15 text-white ring-1 ring-brand-500/40 ring-inset'
                                                    : 'text-neutral-300 hover:bg-white/5 hover:text-white'
                                            }`}
                                        >
                                            <Icon
                                                className={`h-4 w-4 shrink-0 ${isActive ? 'text-brand-400' : 'text-neutral-500'}`}
                                            />
                                            {!effectiveCollapsed && (
                                                <span className="truncate">
                                                    {link.label}
                                                </span>
                                            )}
                                        </Link>
                                    );
                                })}
                            </>
                        )}
                    </nav>

                    <div className="shrink-0 border-t border-neutral-800 px-2 py-3">
                        {!effectiveCollapsed && (
                            <div className="truncate px-2.5 pb-2 text-xs text-neutral-400">
                                {auth.user.name}
                            </div>
                        )}
                        <Link
                            href="/logout"
                            method="post"
                            as="button"
                            title={effectiveCollapsed ? 'Sign out' : undefined}
                            className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-medium text-neutral-300 transition-colors hover:bg-white/5 hover:text-white"
                        >
                            <LogOut className="h-4 w-4 shrink-0" />
                            {!effectiveCollapsed && <span>Sign out</span>}
                        </Link>
                        {!isNarrowViewport && (
                            <button
                                type="button"
                                onClick={() => setCollapsed((prev) => !prev)}
                                title={collapsed ? 'Expand sidebar' : undefined}
                                className="mt-1 flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-medium text-neutral-400 transition-colors hover:bg-white/5 hover:text-white"
                            >
                                {collapsed ? (
                                    <ChevronRight className="h-4 w-4 shrink-0" />
                                ) : (
                                    <ChevronLeft className="h-4 w-4 shrink-0" />
                                )}
                                {!collapsed && <span>Collapse</span>}
                            </button>
                        )}
                    </div>
                </aside>
            )}

            <main ref={mainRef} className="min-h-0 flex-1 overflow-y-auto">
                {children}
            </main>
        </div>
    );
}
