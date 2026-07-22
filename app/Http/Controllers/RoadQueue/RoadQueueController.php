<?php

namespace App\Http\Controllers\RoadQueue;

use App\Http\Controllers\Controller;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Read-only display of the XPS Road Queue (import/export FCL moves) and the
 * previous shift's TAT figures. Display-only for now — the source app's
 * per-shift TAT history / high-elapsed-transaction capture into local MySQL
 * has not been ported.
 */
class RoadQueueController extends Controller
{
    public function index(): Response
    {
        try {
            DB::reconnect('sqlsrv');

            $shiftData = $this->getPreviousShift();

            $roadQueueData = DB::connection('sqlsrv')->select($this->getRoadQueueQuery());

            $precheckTatResult = DB::connection('sqlsrv')->select(
                $this->getPrecheckToOutgateTatQuery(),
                [$shiftData['shiftStart'], $shiftData['shiftEnd']]
            );
            $avgTatPrecheckToOutgate = $precheckTatResult[0]->avg_tat ?? null;

            $ingateTatResult = DB::connection('sqlsrv')->select(
                $this->getIngateToOutgateTatQuery(),
                [$shiftData['shiftStart'], $shiftData['shiftEnd']]
            );
            $avgTatIngateToOutgate = $ingateTatResult[0]->avg_tat ?? null;

            Log::info('Road Queue data retrieved successfully', [
                'record_count' => count($roadQueueData),
            ]);

            return Inertia::render('road-queue/index', [
                'roadQueues' => $roadQueueData,
                'tatPrecheckToOutgate' => $avgTatPrecheckToOutgate,
                'tatIngateToOutgate' => $avgTatIngateToOutgate,
                'shiftLabel' => $shiftData['shiftLabel'],
                'shiftRange' => $shiftData['shiftRange'],
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to fetch Road Queue data', [
                'error' => $e->getMessage(),
                'code' => $e->getCode(),
            ]);

            return Inertia::render('road-queue/index', [
                'roadQueues' => [],
                'error' => 'Unable to fetch road queue data. Please try again later.',
                'debug_error' => config('app.debug') ? $e->getMessage() : null,
            ]);
        }
    }

    /** @return array{shiftLabel: string, shiftRange: string, shiftStart: string, shiftEnd: string} */
    private function getPreviousShift(): array
    {
        $now = Carbon::now('Asia/Manila');
        $hour = $now->hour;

        if ($hour >= 7 && $hour < 19) {
            // Currently Day Shift → previous was Night Shift
            $start = $now->copy()->subDay()->setTime(19, 0, 0);
            $end = $now->copy()->setTime(7, 0, 0);
            $label = 'Night Shift';
        } elseif ($hour >= 19) {
            // Night Shift just started → previous was today's Day Shift
            $start = $now->copy()->setTime(7, 0, 0);
            $end = $now->copy()->setTime(19, 0, 0);
            $label = 'Day Shift';
        } else {
            // Night Shift ongoing (midnight–7AM) → previous was yesterday's Day Shift
            $start = $now->copy()->subDay()->setTime(7, 0, 0);
            $end = $now->copy()->subDay()->setTime(19, 0, 0);
            $label = 'Day Shift';
        }

        return [
            'shiftLabel' => $label,
            'shiftRange' => $start->format('M d g:i A').' – '.$end->format('M d g:i A'),
            'shiftStart' => $start->format('Y-m-d H:i:s').'.000',
            'shiftEnd' => $end->format('Y-m-d H:i:s').'.000',
        ];
    }

    private function getIngateToOutgateTatQuery(): string
    {
        return <<<'SQL'
SELECT
    CONCAT(
        FLOOR(AVG(DATEDIFF(SECOND, rtvd.entered_yard, rtvd.exited_yard)) / 60.0),
        ' min ',
        RIGHT(
            '00' + CAST(
                AVG(DATEDIFF(SECOND, rtvd.entered_yard, rtvd.exited_yard)) % 60
                AS VARCHAR(2)
            ),
            2
        ),
        ' sec'
    ) AS avg_tat
FROM [sparcsn4].[dbo].[inv_unit] AS unit
INNER JOIN [sparcsn4].[dbo].[inv_unit_fcy_visit] AS fcy_visit
    ON unit.gkey = fcy_visit.unit_gkey
LEFT JOIN [sparcsn4].[dbo].[road_truck_transactions] AS tk_transactions
    ON unit.gkey = tk_transactions.unit_gkey
LEFT JOIN [sparcsn4].[dbo].[road_truck_visit_details] AS rtvd
    ON tk_transactions.truck_visit_gkey = rtvd.tvdtls_gkey
WHERE
    (
        (unit.category = 'IMPRT' AND unit.freight_kind = 'FCL' AND tk_transactions.sub_type = 'DI')
        OR (unit.category = 'EXPRT' AND tk_transactions.sub_type = 'RE')
    )
    AND tk_transactions.status = 'COMPLETE'
    AND tk_transactions.stage_id = 'OUTGATE'
    AND rtvd.entered_yard >= ?
    AND rtvd.exited_yard < ?
SQL;
    }

    private function getPrecheckToOutgateTatQuery(): string
    {
        return <<<'SQL'
SELECT
    CONCAT(
        FLOOR(AVG(DATEDIFF(SECOND, rtvd.created, rtvd.exited_yard)) / 60.0),
        ' min ',
        RIGHT(
            '00' + CAST(
                AVG(DATEDIFF(SECOND, rtvd.created, rtvd.exited_yard)) % 60
                AS VARCHAR(2)
            ),
            2
        ),
        ' sec'
    ) AS avg_tat
FROM [sparcsn4].[dbo].[inv_unit] AS unit
INNER JOIN [sparcsn4].[dbo].[inv_unit_fcy_visit] AS fcy_visit
    ON unit.gkey = fcy_visit.unit_gkey
LEFT JOIN [sparcsn4].[dbo].[road_truck_transactions] AS tk_transactions
    ON unit.gkey = tk_transactions.unit_gkey
LEFT JOIN [sparcsn4].[dbo].[road_truck_visit_details] AS rtvd
    ON tk_transactions.truck_visit_gkey = rtvd.tvdtls_gkey
WHERE
    (
        (unit.category = 'IMPRT' AND unit.freight_kind = 'FCL' AND tk_transactions.sub_type = 'DI')
        OR (unit.category = 'EXPRT' AND tk_transactions.sub_type = 'RE')
    )
    AND tk_transactions.status = 'COMPLETE'
    AND tk_transactions.stage_id = 'OUTGATE'
    AND rtvd.created >= ?
    AND rtvd.exited_yard < ?
SQL;
    }

    private function getRoadQueueQuery(): string
    {
        return <<<'SQL'
SELECT
     unit.id as container,
     unit.category as category,
     CASE
        WHEN argo_cv.id IN ('GEN_CARRIER', 'GEN_TRUCK') THEN 'TRUCK'
        ELSE argo_cv.id
     END AS ob_carrier,
     unit.freight_kind,
     wi.move_kind as kind,
     bizunit.id AS line_op,
     CASE
        WHEN wi.pos_slot LIKE '%TIP%' THEN tk_transactions.ctr_pos_slot
        ELSE 'TIP'
     END AS pos_slot_from,
     wi.pos_slot,
     routing_point.id as discharge_port,
     COALESCE(carrier_service.id, carrier_service_ib.id) AS vessel_service,
     COALESCE(
        rtvd.bat_nbr,
        TRY_CAST(tk_transactions.nbr AS VARCHAR(50))
     ) AS bat_nbr,
     eq_type.id as type_iso,
     CASE
        WHEN unit.freight_kind = 'MTY' THEN 'MT'
        ELSE cmdy.id
     END AS commodity,
     CASE
        WHEN
            CASE
                WHEN wi.pos_slot LIKE '%TIP%' THEN tk_transactions.ctr_pos_slot
                ELSE wi.pos_slot
            END IS NOT NULL
        AND
            CASE
                WHEN wi.pos_slot LIKE '%TIP%' THEN tk_transactions.ctr_pos_slot
                ELSE wi.pos_slot
            END NOT LIKE '%TIP%'
        THEN (
            SELECT STRING_AGG(che_name, ',')
            FROM (
                SELECT DISTINCT chezone.che_name
                FROM [sparcsn4].[dbo].[xps_chezone] chezone
                WHERE chezone.sel_block = LEFT(
                    CASE
                        WHEN wi.pos_slot LIKE '%TIP%' THEN tk_transactions.ctr_pos_slot
                        ELSE wi.pos_slot
                    END, 3)
            ) x
        )
    END AS assigned_che,

    tk_transactions.created AS precheck_time,
    CONCAT(
        CASE
            WHEN t.total_seconds / 86400 > 0
            THEN CONCAT(t.total_seconds / 86400, 'D ')
            ELSE ''
        END,
        (t.total_seconds % 86400) / 3600, 'H ',
        (t.total_seconds % 3600) / 60, 'M'
    ) AS elapsed_time

FROM [sparcsn4].[dbo].[inv_wi] AS wi

LEFT JOIN [sparcsn4].[dbo].[inv_unit_yrd_visit] AS yrd_visit
    ON wi.uyv_gkey=yrd_visit.gkey

LEFT JOIN [sparcsn4].[dbo].[inv_unit_fcy_visit] AS fcy_visit
    ON yrd_visit.ufv_gkey=fcy_visit.gkey

LEFT JOIN [sparcsn4].[dbo].[inv_unit] AS unit
    ON fcy_visit.unit_gkey=unit.gkey

LEFT JOIN [sparcsn4].[dbo].argo_carrier_visit as argo_cv
    ON unit.cv_gkey=argo_cv.gkey

INNER JOIN [sparcsn4].[dbo].[ref_bizunit_scoped] as bizunit
    ON unit.line_op = bizunit.gkey

INNER JOIN [sparcsn4].[dbo].[ref_routing_point] as routing_point
    ON unit.pod1_gkey = routing_point.gkey

LEFT JOIN [sparcsn4].[dbo].[ref_carrier_service] as carrier_service
    ON unit.service_gkey = carrier_service.gkey

LEFT JOIN [sparcsn4].[dbo].[argo_carrier_visit] as carrier_visit
    ON fcy_visit.actual_ib_cv = carrier_visit.gkey

LEFT JOIN [sparcsn4].[dbo].[argo_visit_details] as visit_details
    ON carrier_visit.cvcvd_gkey = visit_details.gkey

LEFT JOIN [sparcsn4].[dbo].[ref_carrier_service] as carrier_service_ib
    ON visit_details.service = carrier_service_ib.gkey

LEFT JOIN [sparcsn4].[dbo].[road_truck_transactions] as tk_transactions
    ON unit.gkey = tk_transactions.unit_gkey

CROSS APPLY (
    SELECT DATEDIFF(SECOND, tk_transactions.created, GETDATE()) AS total_seconds
) t

LEFT JOIN [sparcsn4].[dbo].[road_truck_visit_details] as rtvd
    ON tk_transactions.truck_visit_gkey = rtvd.tvdtls_gkey

INNER JOIN [sparcsn4].[dbo].[ref_equipment] as ref_eq
    ON unit.eq_gkey = ref_eq.gkey

INNER JOIN [sparcsn4].[dbo].[ref_equip_type] as eq_type
    ON ref_eq.eqtyp_gkey = eq_type.gkey

LEFT JOIN [sparcsn4].[dbo].[inv_goods] as goods
    ON unit.goods = goods.gkey

LEFT JOIN [sparcsn4].[dbo].[ref_commodity] as cmdy
    ON goods.commodity_gkey = cmdy.gkey

LEFT JOIN [sparcsn4].[dbo].[xps_workassignment] as wa
    ON wi.che_work_assignment_gkey = wa.gkey

LEFT JOIN [sparcsn4].[dbo].[xps_che] as che
    ON wa.che_entity_gkey = che.gkey

WHERE
    wi.move_kind IN ('DLVR', 'RECV')
    AND wi.move_stage='PLANNED'
    AND wi.conf_move_stage='PLANNED'
    AND wi.work_queue_gkey = 36
    AND wi.ec_state_fetch !='NONE'
    AND (
        (unit.category = 'IMPRT' AND unit.freight_kind = 'FCL')
        OR (unit.category = 'EXPRT')
    )
    AND fcy_visit.transit_state NOT IN ('S10_ADVISED','S40_YARD','S70_DEPARTED')
    AND tk_transactions.status = 'OK'
    AND argo_cv.id != 'BBK_PLUGIN'

ORDER BY tk_transactions.created;
;
SQL;
    }
}
