export type Paginated<T> = {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
};

export type TatHistoryRow = {
    id: number;
    shift_label: string;
    shift_start: string;
    shift_end: string;
    // Road Queue (non-ECD) only — road_queue_ecd_tat_history has no status
    // column, since ECD has a single TAT metric rather than two.
    status: string | null;
    avg_tat: string | null;
    avg_tat_seconds: number;
    container_count: number | null;
    recorded_at: string;
};

export type HighElapsedTransactionRow = {
    container: string | null;
    category: string | null;
    // Road Queue (non-ECD) only.
    precheck_time: string | null;
    // Road Queue ECD only.
    truck_visit_entered_yard: string | null;
    trucking_company: string | null;
    elapsed_time: string | null;
    assigned_che: string | null;
    type_iso: string | null;
    ob_carrier: string | null;
    freight_kind: string | null;
    line_op: string | null;
    pos_slot_from: string | null;
    pos_slot: string | null;
    bat_nbr: string | null;
    first_captured_at: string;
    last_seen_at: string;
};

export type RoadQueueHistoryFilters = {
    tat_shift: string;
    tat_status: string;
    tat_from: string;
    tat_to: string;
    tx_container: string;
    tx_category: string;
};

export type RoadQueueEcdHistoryFilters = Omit<
    RoadQueueHistoryFilters,
    'tat_status'
>;
