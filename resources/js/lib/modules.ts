import { Container, MapPinned, ShipWheel, Truck } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export type PortalModuleChild = {
    key: string;
    name: string;
    href: string;
};

export type PortalModule = {
    key: string;
    name: string;
    href: string;
    icon: LucideIcon;
    description: string;
    // Sidebar sub-navigation (e.g. Board / History) — the module still has
    // a single `href` (used for the home grid card and as the sidebar's
    // collapsed-mode fallback link), children are additional named routes
    // nested under it.
    children?: PortalModuleChild[];
};

export const portalModules: PortalModule[] = [
    {
        key: 'vessel-dashboard',
        name: 'Vessel Dashboard',
        href: '/vessel-dashboard',
        icon: ShipWheel,
        description:
            'Vessel loading/discharge ops dashboard, synced hourly from SQL Server.',
    },
    {
        key: 'road-queue',
        name: 'Road Queue (Terminal)',
        href: '/road-queue',
        icon: MapPinned,
        description: 'Import/export road queue and gate TAT analytics.',
        children: [
            { key: 'road-queue', name: 'Board', href: '/road-queue' },
            {
                key: 'road-queue-history',
                name: 'History',
                href: '/road-queue/history',
            },
        ],
    },
    {
        key: 'road-queue-ecd',
        name: 'Road Queue (ECD)',
        href: '/road-queue-ecd',
        icon: Truck,
        description:
            'Empty/storage container road queue and gate TAT analytics.',
        children: [
            { key: 'road-queue-ecd', name: 'Board', href: '/road-queue-ecd' },
            {
                key: 'road-queue-ecd-history',
                name: 'History',
                href: '/road-queue-ecd/history',
            },
        ],
    },
    {
        key: 'container-yard',
        name: 'Container Yard',
        href: '/container-yard',
        icon: Container,
        description: 'Container search and yard block/allocation management.',
    },
];
