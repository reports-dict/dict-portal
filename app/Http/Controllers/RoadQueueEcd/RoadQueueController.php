<?php

namespace App\Http\Controllers\RoadQueueEcd;

use App\Http\Controllers\Controller;
use Carbon\Carbon;
use Illuminate\Database\Query\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * Read-only display of the XPS Road Queue ECD (empty/storage container
 * delivery moves) and the previous shift's TAT figure. Display-only for
 * now — the source app's per-shift TAT history / high-elapsed-transaction
 * capture into local MySQL has not been ported.
 */
class RoadQueueController extends Controller
{
    public function index(): Response
    {
        try {
            DB::reconnect('sqlsrv');

            $shiftData = $this->getPreviousShift();

            $roadQueueData = DB::connection('sqlsrv')->select($this->getRoadQueueQuery());

            $tatResult = DB::connection('sqlsrv')->select(
                $this->getTatQuery(),
                [$shiftData['shiftStart'], $shiftData['shiftEnd']]
            );
            $avgTat = $tatResult[0]->avg_tat ?? null;

            Log::info('Road Queue ECD data retrieved successfully', [
                'record_count' => count($roadQueueData),
            ]);

            return Inertia::render('road-queue-ecd/index', [
                'roadQueues' => $roadQueueData,
                'tat' => $avgTat,
                'shiftLabel' => $shiftData['shiftLabel'],
                'shiftRange' => $shiftData['shiftRange'],
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to fetch Road Queue ECD data', [
                'error' => $e->getMessage(),
                'code' => $e->getCode(),
            ]);

            return Inertia::render('road-queue-ecd/index', [
                'roadQueues' => [],
                'error' => 'Unable to fetch road queue data. Please try again later.',
                'debug_error' => config('app.debug') ? $e->getMessage() : null,
            ]);
        }
    }

    /**
     * Read-only history of shift TAT snapshots and high-elapsed (≥1h)
     * transactions, captured into dict_operations_suite by the separate
     * dict-operations-suite application (its own board loads + cron) — this
     * module never writes to that database, only reads it.
     */
    public function history(Request $request): Response
    {
        $tatHistory = $this->tatHistoryQuery($request)
            ->paginate(20, ['*'], 'tat_page')
            ->withQueryString();

        $transactions = $this->transactionsQuery($request)
            ->paginate(20, ['*'], 'tx_page')
            ->withQueryString();

        return Inertia::render('road-queue-ecd/history', [
            'tatHistory' => $tatHistory,
            'transactions' => $transactions,
            'filters' => [
                'tat_shift' => $this->queryString($request, 'tat_shift') ?? '',
                'tat_from' => $this->queryString($request, 'tat_from') ?? '',
                'tat_to' => $this->queryString($request, 'tat_to') ?? '',
                'tx_container' => $this->queryString($request, 'tx_container') ?? '',
                'tx_category' => $this->queryString($request, 'tx_category') ?? '',
            ],
        ]);
    }

    public function exportTatHistory(Request $request): StreamedResponse
    {
        $rows = $this->tatHistoryQuery($request)->get();

        return response()->streamDownload(function () use ($rows) {
            $handle = $this->openCsvOutput();
            fputcsv($handle, ['Shift', 'Shift Start', 'Shift End', 'Avg TAT', 'Seconds', 'Recorded At']);

            foreach ($rows as $row) {
                fputcsv($handle, [
                    $row->shift_label,
                    $this->formatManila($row->shift_start),
                    $this->formatManila($row->shift_end),
                    $row->avg_tat,
                    $row->avg_tat_seconds,
                    $this->formatManila($row->recorded_at),
                ]);
            }

            fclose($handle);
        }, 'road-queue-ecd-tat-history.csv');
    }

    public function exportHighElapsedTransactions(Request $request): StreamedResponse
    {
        $rows = $this->transactionsQuery($request)->get();

        return response()->streamDownload(function () use ($rows) {
            $handle = $this->openCsvOutput();
            fputcsv($handle, [
                'Container', 'Category', 'Trucking Company', 'Truck Entered Yard', 'Elapsed Time', 'CHE',
                'ISO Type', 'O/B Carrier', 'Freight Kind', 'Line Op', 'From', 'To', 'BAT#', 'First Captured', 'Last Seen',
            ]);

            foreach ($rows as $row) {
                fputcsv($handle, [
                    $row->container,
                    $row->category,
                    $row->trucking_company,
                    $this->formatManila($row->truck_visit_entered_yard),
                    $row->elapsed_time,
                    $row->assigned_che,
                    $row->type_iso,
                    $row->ob_carrier,
                    $row->freight_kind,
                    $row->line_op,
                    $row->pos_slot_from,
                    $row->pos_slot,
                    $row->bat_nbr,
                    $this->formatManila($row->first_captured_at),
                    $this->formatManila($row->last_seen_at),
                ]);
            }

            fclose($handle);
        }, 'road-queue-ecd-high-elapsed-transactions.csv');
    }

    private function tatHistoryQuery(Request $request): Builder
    {
        return DB::connection('mysql_operations_suite')
            ->table('road_queue_ecd_tat_history')
            ->when($this->queryString($request, 'tat_shift'), fn ($query, $shift) => $query->where('shift_label', $shift))
            ->when($this->queryString($request, 'tat_from'), fn ($query, $from) => $query->whereDate('shift_start', '>=', $from))
            ->when($this->queryString($request, 'tat_to'), fn ($query, $to) => $query->whereDate('shift_start', '<=', $to))
            ->orderByDesc('recorded_at');
    }

    private function transactionsQuery(Request $request): Builder
    {
        return DB::connection('mysql_operations_suite')
            ->table('road_queue_ecd_high_elapsed_transactions')
            ->when(
                $this->queryString($request, 'tx_container'),
                fn ($query, $container) => $query->where('container', 'like', "%{$container}%"),
            )
            ->when(
                $this->queryString($request, 'tx_category'),
                fn ($query, $category) => $query->where('category', $category),
            )
            ->orderByDesc('first_captured_at');
    }

    private function queryString(Request $request, string $key): ?string
    {
        $value = $request->query($key);

        return is_string($value) && $value !== '' ? $value : null;
    }

    /** @return resource */
    private function openCsvOutput()
    {
        $handle = fopen('php://output', 'w');

        if ($handle === false) {
            throw new \RuntimeException('Unable to open output stream for CSV export.');
        }

        return $handle;
    }

    private function formatManila(?string $datetime): ?string
    {
        return $datetime ? Carbon::parse($datetime, 'Asia/Manila')->format('M d, Y h:i A') : null;
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

    private function getTatQuery(): string
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
LEFT JOIN [sparcsn4].[dbo].[road_truck_transaction_stages] AS tk_transaction_stages
    ON tk_transactions.gkey = tk_transaction_stages.tran_gkey
LEFT JOIN [sparcsn4].[dbo].[road_truck_visit_details] AS rtvd
    ON tk_transactions.truck_visit_gkey = rtvd.tvdtls_gkey
WHERE
    unit.category = 'STRGE' AND unit.freight_kind = 'MTY' AND tk_transactions.sub_type = 'DM'
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
     unit.category as category,
     tk_visit_details.truck_license_nbr as ob_carrier,
     tk_visit_details.trucking_co_id as trucking_company,
     unit.freight_kind,
     wi.move_kind as kind,
     bizunit.id AS line_op,
     CASE
        WHEN wi.pos_slot LIKE '%TIP%' THEN tk_transactions.ctr_pos_slot
        ELSE 'TIP'
     END AS pos_slot_from,
     wi.pos_slot,
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
     tk_transactions.eqo_nbr as booking_number,
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

    tk_transactions.created AS truck_visit_entered_yard,

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

LEFT JOIN [sparcsn4].[dbo].[road_truck_visit_details] as tk_visit_details
    ON tk_transactions.truck_visit_gkey = tk_visit_details.tvdtls_gkey

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
    wi.move_kind IN ('DLVR')
    AND unit.category = 'STRGE'
    AND unit.freight_kind = 'MTY'
    AND wi.move_stage='PLANNED'
    AND tk_transactions.status NOT IN ('COMPLETE', 'CLOSED', 'CANCEL')

ORDER BY tk_transactions.created;
;
SQL;
    }
}
