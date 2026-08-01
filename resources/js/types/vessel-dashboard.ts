export type VesselGraphRow = {
    hour: number;
    total: number;
    QC1: number;
    QC2: number;
    QC3: number;
    QC4: number;
    UNKR: number;
    ECIN: number;
};

export type Vessel = {
    ob_ib_id: string;
    actual_time_of_arrival: string | null;
    actual_time_of_departure: string | null;
    vessel_name: string;
    service: string;
    vessel_id: string;
    phase: string;
    line_op: string;
    total_planned_loading_wi: number;
    load_plan_fcl_20ft: number;
    load_plan_fcl_40ft: number;
    load_plan_empty_20ft: number;
    load_plan_empty_40ft: number;
    total_loaded_count: number;
    loaded_fcl_20ft: number;
    loaded_fcl_40ft: number;
    loaded_empty_20ft: number;
    loaded_empty_40ft: number;
    total_planned_discharge: number;
    discharge_plan_fcl_20ft: number;
    discharge_plan_fcl_40ft: number;
    discharge_plan_mty_20ft: number;
    discharge_plan_mty_40ft: number;
    total_discharged_count: number;
    discharged_fcl_20ft: number;
    discharged_fcl_40ft: number;
    discharged_empty_20ft: number;
    discharged_empty_40ft: number;
    has_override: boolean;
    graph: VesselGraphRow[];
};

export type DashboardData = {
    vessels: Vessel[];
    fetched_at: string;
};

export type SyncLogEntry = {
    id: number;
    ran_at: string;
    rows_fetched: number;
    rows_upserted: number;
    status: 'success' | 'failed';
    error_message: string | null;
    duration_ms: number;
};

export type Paginated<T> = {
    data: T[];
    from: number | null;
    to: number | null;
    total: number;
    links: { url: string | null; label: string; active: boolean }[];
};
