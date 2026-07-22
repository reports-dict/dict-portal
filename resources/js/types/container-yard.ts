export type Container = {
    id: number;
    container: string;
    category: string;
    iso_type: string;
    position: string;
    time_in: string | null;
    notes: string | null;
    dwell_days: number | null;
    line_op: string | null;
    transit_state: string | null;
    condition: string | null;
    pod: string | null;
    pod_place_name: string | null;
    pol: string | null;
    pol_place_name: string | null;
    outbound_carrier_id: string | null;
    outbound_carrier_name: string | null;
    inbound_carrier_id: string | null;
    inbound_carrier_name: string | null;
    shipper: string | null;
    consignee: string | null;
    requires_power: boolean;
    is_powered: boolean;
    created_at: string;
    updated_at: string;
};

export type Block = {
    id: number;
    name: string;
    bay_start: number;
    bay_end: number;
    row_start: string;
    row_end: string;
    max_tier: number;
    facility: 'Terminal' | 'ECD';
    road_side: 'row_start' | 'row_end' | 'both';
    excluded_rows: string | null;
    is_active: boolean;
    total_bays?: number;
    total_rows?: number;
    total_capacity?: number;
};

export type Allocation = {
    id: number;
    service: string | null;
    discharge_port: string | null;
    iso_basic_length: string | null;
    reefer_type: string | null;
    location: string;
};

export type Pagination = {
    current_page: number;
    total: number;
    per_page: number;
    last_page: number;
};

export type ApiListResponse<T> = {
    success: boolean;
    data: T[];
    pagination?: Pagination;
};

export type LiveSearchRow = {
    container?: string;
    category?: string;
    pos?: string;
    move_kind?: string;
    type_iso?: string;
    line_op?: string;
    ob_vessel?: string;
    yard_slot?: string;
    reefer_type?: string;
    vessel_service?: string;
    container_port?: string;
    iso_basic_length?: string;
    [key: string]: string | number | undefined;
};

export type LiveSearchResponse = {
    success: boolean;
    data: LiveSearchRow[];
    count: number;
    allowed_locations: string[];
    debug_filter: Record<string, string | null>;
};
