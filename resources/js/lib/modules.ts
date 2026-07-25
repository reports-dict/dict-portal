import { Container, MapPinned, ShipWheel, Truck } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export type PortalModule = {
    key: string;
    name: string;
    href: string;
    icon: LucideIcon;
    description: string;
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
    },
    {
        key: 'road-queue-ecd',
        name: 'Road Queue (ECD)',
        href: '/road-queue-ecd',
        icon: Truck,
        description:
            'Empty/storage container road queue and gate TAT analytics.',
    },
    {
        key: 'container-yard',
        name: 'Container Yard',
        href: '/container-yard',
        icon: Container,
        description: 'Container search and yard block/allocation management.',
    },
];
