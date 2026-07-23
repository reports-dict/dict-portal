<?php

namespace App\Enums;

enum PortalModule: string
{
    case VesselDashboard = 'vessel-dashboard';
    case VesselDashboardOverrides = 'vessel-dashboard-overrides';
    case RoadQueue = 'road-queue';
    case RoadQueueEcd = 'road-queue-ecd';
    case ContainerYard = 'container-yard';
    case ContainerYardBlocks = 'container-yard-blocks';
    case ContainerYardAllocations = 'container-yard-allocations';

    public function label(): string
    {
        return match ($this) {
            self::VesselDashboard => 'Vessel Dashboard',
            self::VesselDashboardOverrides => 'Manage Planning Overrides',
            self::RoadQueue => 'Road Queue',
            self::RoadQueueEcd => 'Road Queue (ECD)',
            self::ContainerYard => 'Container Yard',
            self::ContainerYardBlocks => 'Manage Blocks',
            self::ContainerYardAllocations => 'Manage Allocations',
        };
    }

    /**
     * Whether this permission is a sub-permission of another module, shown
     * indented under its parent in the Role Permissions matrix rather than
     * as its own top-level module.
     */
    public function isSubPermission(): bool
    {
        return match ($this) {
            self::VesselDashboardOverrides,
            self::ContainerYardBlocks,
            self::ContainerYardAllocations => true,
            default => false,
        };
    }
}
