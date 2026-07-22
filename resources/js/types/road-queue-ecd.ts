export type RoadQueueEcdRow = {
    category: string | null;
    ob_carrier: string | null;
    trucking_company: string | null;
    freight_kind: string | null;
    kind: string | null;
    line_op: string | null;
    pos_slot_from: string | null;
    pos_slot: string | null;
    vessel_service: string | null;
    bat_nbr: string | null;
    type_iso: string | null;
    commodity: string | null;
    booking_number: string | null;
    assigned_che: string | null;
    truck_visit_entered_yard: string | null;
    elapsed_time: string | null;
    [key: string]: string | number | null | undefined;
};
