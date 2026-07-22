<?php

namespace App\Console\Commands;

use App\Models\Container;
use Exception;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class SyncContainersFromMssql extends Command
{
    /** @var string */
    protected $signature = 'app:sync-containers-from-mssql';

    /** @var string */
    protected $description = 'Sync containers from MSSQL sparcsn4 database to local MySQL, gated to the DICT yard';

    public function handle(): int
    {
        try {
            $this->info('Starting container sync from MSSQL...');

            $rawContainers = $this->fetchFromMssql();
            $mssqlContainers = collect($rawContainers);

            if ($mssqlContainers->isEmpty()) {
                $this->warn('No containers found in MSSQL. Using cached data if available.');
                Cache::put('sync:status', [
                    'status' => 'error',
                    'message' => 'No containers found in MSSQL',
                    'last_sync' => now(),
                    'count' => 0,
                ], 600);

                return Command::FAILURE;
            }

            $this->info('Clearing existing containers...');
            Container::truncate();

            $batchSize = 1000;
            $total = $mssqlContainers->count();
            $inserted = 0;

            $this->info("Inserting {$total} containers in batches of {$batchSize}...");

            foreach ($mssqlContainers->chunk($batchSize) as $batch) {
                $data = $batch->map(function ($item) {
                    return [
                        'container' => $item->container ?? null,
                        'category' => $item->category ?? null,
                        'iso_type' => $item->iso_type ?? null,
                        'time_in' => $item->time_in ?? null,
                        'position' => $this->cleanPosition($item->position ?? null),
                        'dwell_days' => $item->dwell_days ?? 0,
                        'line_op' => $item->line_op ?? null,
                        'transit_state' => $item->transit_state ?? null,
                        'condition' => $item->condition ?? null,
                        'pod' => $item->pod ?? null,
                        'pod_place_name' => $item->pod_place_name ?? null,
                        'pol' => $item->pol ?? null,
                        'pol_place_name' => $item->pol_place_name ?? null,
                        'outbound_carrier_id' => $item->outbound_carrier_id ?? null,
                        'outbound_carrier_name' => $item->outbound_carrier_name ?? null,
                        'inbound_carrier_id' => $item->inbound_carrier_id ?? null,
                        'inbound_carrier_name' => $item->inbound_carrier_name ?? null,
                        'shipper' => $item->shipper ?? null,
                        'consignee' => $item->consignee ?? null,
                        'requires_power' => $this->convertToBoolean($item->requires_power ?? null),
                        'is_powered' => $this->convertToBoolean($item->is_powered ?? null),
                        'created_at' => now(),
                        'updated_at' => now(),
                    ];
                })->toArray();

                Container::insert($data);
                $inserted += count($data);
                $this->info("Inserted {$inserted} of {$total} containers...");
            }

            $this->clearContainerCache();

            Cache::put('sync:status', [
                'status' => 'success',
                'message' => 'Sync completed successfully',
                'last_sync' => now(),
                'count' => $total,
            ], 600);

            $this->info("Successfully synced {$inserted} containers from MSSQL");

            return Command::SUCCESS;
        } catch (Exception $e) {
            $this->error("Sync failed: {$e->getMessage()}");

            Cache::put('sync:status', [
                'status' => 'error',
                'message' => $e->getMessage(),
                'last_sync' => now(),
                'count' => Container::count(),
                'error_time' => now(),
            ], 600);

            return Command::FAILURE;
        }
    }

    /** @return array<int, object> */
    private function fetchFromMssql(): array
    {
        try {
            return DB::connection('sqlsrv')->select($this->query());
        } catch (Exception $e) {
            $this->error("Failed to connect to MSSQL: {$e->getMessage()}");
            throw $e;
        }
    }

    private function query(): string
    {
        return <<<'SQL'
SELECT
    ref.id_full AS container,
    unit.category AS category,
    eq_type.id as iso_type,
    fcy_visit.time_in,
    CASE
        WHEN LEFT(fcy_visit.last_pos_name, 8) = 'Y-DICT1-'
          OR LEFT(fcy_visit.last_pos_name, 8) = 'Y-DICT2-'
        THEN SUBSTRING(fcy_visit.last_pos_name, 9, LEN(fcy_visit.last_pos_name))
        ELSE fcy_visit.last_pos_name
    END AS position,
    DATEDIFF(day, fcy_visit.time_in, GETDATE()) AS dwell_days,
    bizunit.id AS line_op,
    SUBSTRING(fcy_visit.transit_state, 5, LEN(fcy_visit.transit_state)) AS transit_state,
    cond.description AS condition,
    pod_route.id as pod,
    pod_unloc.place_name as pod_place_name,
    pol_route.id as pol,
    pol_unloc.place_name as pol_place_name,
    ob_argo_cv.id as outbound_carrier_id,
    ob_vvsl.name as outbound_carrier_name,
    ib_argo_cv.id as inbound_carrier_id,
    ib_vvsl.name as inbound_carrier_name,
    ref_biz_shipper.name as shipper,
    ref_biz_consignee.name as consignee,
    unit.requires_power,
    unit.is_powered
FROM
    [sparcsn4].[dbo].[inv_unit_fcy_visit] AS fcy_visit
INNER JOIN [sparcsn4].[dbo].[inv_unit] AS unit
    ON fcy_visit.unit_gkey = unit.gkey
INNER JOIN [sparcsn4].[dbo].[ref_equipment] AS ref
    ON ref.gkey = unit.eq_gkey
INNER JOIN [sparcsn4].[dbo].[ref_equip_type] as eq_type
    ON ref.eqtyp_gkey = eq_type.gkey
INNER JOIN [sparcsn4].[dbo].[inv_goods] AS goods
    ON unit.goods = goods.gkey
LEFT JOIN [sparcsn4].[dbo].[ref_bizunit_scoped] as ref_biz_shipper
    ON goods.shipper_bzu=ref_biz_shipper.gkey
LEFT JOIN [sparcsn4].[dbo].[ref_bizunit_scoped] as ref_biz_consignee
    ON goods.consignee_bzu=ref_biz_consignee.gkey
INNER JOIN [sparcsn4].[dbo].[ref_bizunit_scoped] AS bizunit
    ON unit.line_op = bizunit.gkey
LEFT JOIN [sparcsn4].[dbo].[ref_equip_conditions] AS cond
    ON unit.condition_gkey = cond.gkey
LEFT JOIN [sparcsn4].[dbo].[ref_routing_point] AS pol_route
    ON unit.pol_gkey = pol_route.gkey
LEFT JOIN [sparcsn4].[dbo].[ref_routing_point] AS pod_route
    ON unit.pod1_gkey = pod_route.gkey
LEFT JOIN [sparcsn4].[dbo].[ref_unloc_code] AS pol_unloc
    ON pol_route.unloc_gkey = pol_unloc.gkey
LEFT JOIN [sparcsn4].[dbo].[ref_unloc_code] AS pod_unloc
    ON pod_route.unloc_gkey = pod_unloc.gkey

LEFT JOIN [sparcsn4].[dbo].[argo_carrier_visit] AS ob_argo_cv
    ON fcy_visit.actual_ob_cv = ob_argo_cv.gkey

LEFT JOIN [sparcsn4].[dbo].[argo_carrier_visit] AS ib_argo_cv
    ON fcy_visit.actual_ib_cv = ib_argo_cv.gkey

LEFT JOIN dbo.vsl_vessel_visit_details as ob_vvsl_vd
ON ob_argo_cv.cvcvd_gkey=ob_vvsl_vd.vvd_gkey

LEFT JOIN dbo.vsl_vessel_visit_details as ib_vvsl_vd
ON ib_argo_cv.cvcvd_gkey=ib_vvsl_vd.vvd_gkey

LEFT JOIN dbo.vsl_vessels as ob_vvsl
ON ob_vvsl_vd.vessel_gkey=ob_vvsl.gkey

LEFT JOIN dbo.vsl_vessels as ib_vvsl
ON ib_vvsl_vd.vessel_gkey=ib_vvsl.gkey

WHERE
    fcy_visit.transit_state = 'S40_YARD'
    AND LEN(
        CASE
            WHEN LEFT(fcy_visit.last_pos_name, 8) IN ('Y-DICT1-', 'Y-DICT2-')
                THEN SUBSTRING(fcy_visit.last_pos_name, 9, LEN(fcy_visit.last_pos_name))
            ELSE fcy_visit.last_pos_name
        END
    ) >= 4
    AND
        CASE
            WHEN LEFT(fcy_visit.last_pos_name, 8) IN ('Y-DICT1-', 'Y-DICT2-')
                THEN SUBSTRING(fcy_visit.last_pos_name, 9, LEN(fcy_visit.last_pos_name))
            ELSE fcy_visit.last_pos_name
        END LIKE 'B%'
ORDER BY
    fcy_visit.time_move DESC
SQL;
    }

    private function cleanPosition(?string $position): ?string
    {
        return empty($position) ? null : $position;
    }

    private function convertToBoolean(mixed $value): int
    {
        if ($value === null) {
            return 0;
        }

        if (is_bool($value)) {
            return $value ? 1 : 0;
        }

        if (is_numeric($value)) {
            return ((int) $value) > 0 ? 1 : 0;
        }

        if (is_string($value)) {
            $lower = strtolower(trim($value));

            return in_array($lower, ['1', 'true', 'yes', 't', 'y', 'on'], true) ? 1 : 0;
        }

        return 0;
    }

    private function clearContainerCache(): void
    {
        $blocks = ['B01', 'B02', 'B03', 'B04', 'B05', 'B06', 'B07', 'B08', 'B09', 'B10', 'B11', 'B12', 'B13', 'B14', 'B15', 'B16', 'B17'];

        foreach ($blocks as $block) {
            Cache::forget("containers:block:{$block}");
        }

        Cache::forget('containers:all');
    }
}
