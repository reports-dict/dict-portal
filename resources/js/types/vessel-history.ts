import type { Vessel } from '@/types/vessel-dashboard';

export type VesselHistoryRow = {
    ob_ib_id: string;
    actual_time_of_arrival: string | null;
    actual_time_of_departure: string | null;
    vessel_name: string;
    vessel_id: string;
};

export type VesselHistoryFilters = {
    month: string;
    date: string;
};

export type VesselHistoryDetail = Vessel;
