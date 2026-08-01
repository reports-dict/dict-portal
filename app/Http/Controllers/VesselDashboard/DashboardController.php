<?php

namespace App\Http\Controllers\VesselDashboard;

use App\Http\Controllers\Controller;
use App\Models\VesselPlanOverride;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    /** @var list<string> */
    private array $overrideFields = [
        'total_planned_discharge',
        'discharge_plan_fcl_20ft',
        'discharge_plan_fcl_40ft',
        'discharge_plan_mty_20ft',
        'discharge_plan_mty_40ft',
        'total_planned_loading_wi',
        'load_plan_fcl_20ft',
        'load_plan_fcl_40ft',
        'load_plan_empty_20ft',
        'load_plan_empty_40ft',
    ];

    public function index(): Response
    {
        return Inertia::render('vessel-dashboard/dashboard');
    }

    public function data(): JsonResponse
    {
        $vessels = DB::connection('sqlsrv')->select($this->query());

        $activeIds = collect($vessels)->pluck('ob_ib_id');

        // Auto-cleanup overrides for vessels no longer active
        VesselPlanOverride::whereNotIn('ob_ib_id', $activeIds)->delete();

        // Merge overrides into vessel data
        $overrides = VesselPlanOverride::all()->keyBy('ob_ib_id');

        foreach ($vessels as $vessel) {
            // Loading planned figures default to 0; only shown when explicitly overridden
            $vessel->total_planned_loading_wi = 0;
            $vessel->load_plan_fcl_20ft = 0;
            $vessel->load_plan_fcl_40ft = 0;
            $vessel->load_plan_empty_20ft = 0;
            $vessel->load_plan_empty_40ft = 0;

            $vessel->has_override = false;
            if ($override = $overrides->get($vessel->ob_ib_id)) {
                foreach ($this->overrideFields as $field) {
                    if (! is_null($override->$field)) {
                        $vessel->$field = $override->$field;
                    }
                }
                $vessel->has_override = true;
            }
        }

        // Fetch per-crane hourly move data for all active vessels in one batched SQL Server query
        $obIbIds = $activeIds->filter()->values()->all();
        $graphRowsByVessel = collect();

        if (! empty($obIbIds)) {
            $inPlaceholders = implode(',', array_fill(0, count($obIbIds), '?'));
            $valuesPlaceholders = implode(',', array_fill(0, count($obIbIds), '(?)'));
            $sql = $this->craneGraphQuery($valuesPlaceholders, $inPlaceholders);
            $bindings = array_merge($obIbIds, $obIbIds, $obIbIds);

            $graphRowsByVessel = collect(DB::connection('sqlsrv')->select($sql, $bindings))
                ->groupBy('ob_ib_id');
        }

        $craneKeys = ['QC1', 'QC2', 'QC3', 'QC4', 'UNKR', 'ECIN'];

        foreach ($vessels as $vessel) {
            $rows = $graphRowsByVessel->get($vessel->ob_ib_id, collect());

            $vessel->graph = $rows->groupBy('hour_bucket')->map(function ($hourRows) use ($craneKeys) {
                $entry = array_merge(
                    ['hour' => (int) $hourRows->first()->move_hour, 'total' => 0],
                    array_fill_keys($craneKeys, 0)
                );

                foreach ($hourRows as $row) {
                    if ($row->crane === null) {
                        continue; // zero-fill row for an hour with no moves at all
                    }

                    // Fold any crane name outside the known 6 into UNKR, so `total` stays
                    // accurate even if a new crane is commissioned before this list is updated.
                    $crane = in_array($row->crane, $craneKeys, true) ? $row->crane : 'UNKR';
                    $entry[$crane] += (int) $row->total;
                    $entry['total'] += (int) $row->total;
                }

                return $entry;
            })->values()->all();
        }

        return response()->json([
            'vessels' => $vessels,
            'fetched_at' => now()->toISOString(),
        ]);
    }

    private function query(): string
    {
        return <<<'SQL'
SELECT TOP 10
    argo_cv.gkey as ob_ib_id,
    argo_cv.ata as actual_time_of_arrival,
    argo_cv.atd as actual_time_of_departure,
    vvsl.name AS vessel_name,
    ref_c_service.id as service,
    argo_cv.id as vessel_id,
    argo_cv.phase,
    ref_biz.id as line_op,
    (SELECT count(*)
    FROM [sparcsn4].[dbo].[inv_wi]
    WHERE pos_loctype = 'VESSEL'
    AND pos_loc_gkey = argo_cv.gkey
    AND move_kind = 'LOAD') as total_planned_loading_wi,
    (SELECT count(*)
    FROM [sparcsn4].[dbo].[inv_wi] as wi
    LEFT JOIN [sparcsn4].[dbo].[inv_unit_yrd_visit] AS yrd_visit ON wi.uyv_gkey=yrd_visit.gkey
    LEFT JOIN [sparcsn4].[dbo].[inv_unit_fcy_visit] AS fcy_visit ON yrd_visit.ufv_gkey=fcy_visit.gkey
    LEFT JOIN [sparcsn4].[dbo].[inv_unit] AS unit ON fcy_visit.unit_gkey=unit.gkey
    INNER JOIN [sparcsn4].[dbo].[ref_equipment] as ref_eq ON unit.eq_gkey = ref_eq.gkey
    INNER JOIN [sparcsn4].[dbo].[ref_equip_type] as eq_type ON ref_eq.eqtyp_gkey = eq_type.gkey
    WHERE wi.pos_loctype = 'VESSEL' AND wi.pos_loc_gkey = argo_cv.gkey
    AND wi.move_kind = 'LOAD' AND eq_type.basic_length = 'BASIC20' AND unit.freight_kind = 'FCL') as load_plan_fcl_20ft,
    (SELECT count(*)
    FROM [sparcsn4].[dbo].[inv_wi] as wi
    LEFT JOIN [sparcsn4].[dbo].[inv_unit_yrd_visit] AS yrd_visit ON wi.uyv_gkey=yrd_visit.gkey
    LEFT JOIN [sparcsn4].[dbo].[inv_unit_fcy_visit] AS fcy_visit ON yrd_visit.ufv_gkey=fcy_visit.gkey
    LEFT JOIN [sparcsn4].[dbo].[inv_unit] AS unit ON fcy_visit.unit_gkey=unit.gkey
    INNER JOIN [sparcsn4].[dbo].[ref_equipment] as ref_eq ON unit.eq_gkey = ref_eq.gkey
    INNER JOIN [sparcsn4].[dbo].[ref_equip_type] as eq_type ON ref_eq.eqtyp_gkey = eq_type.gkey
    WHERE wi.pos_loctype = 'VESSEL' AND wi.pos_loc_gkey = argo_cv.gkey
    AND wi.move_kind = 'LOAD' AND eq_type.basic_length = 'BASIC40' AND unit.freight_kind = 'FCL') as load_plan_fcl_40ft,
    (SELECT count(*)
    FROM [sparcsn4].[dbo].[inv_wi] as wi
    LEFT JOIN [sparcsn4].[dbo].[inv_unit_yrd_visit] AS yrd_visit ON wi.uyv_gkey=yrd_visit.gkey
    LEFT JOIN [sparcsn4].[dbo].[inv_unit_fcy_visit] AS fcy_visit ON yrd_visit.ufv_gkey=fcy_visit.gkey
    LEFT JOIN [sparcsn4].[dbo].[inv_unit] AS unit ON fcy_visit.unit_gkey=unit.gkey
    INNER JOIN [sparcsn4].[dbo].[ref_equipment] as ref_eq ON unit.eq_gkey = ref_eq.gkey
    INNER JOIN [sparcsn4].[dbo].[ref_equip_type] as eq_type ON ref_eq.eqtyp_gkey = eq_type.gkey
    WHERE wi.pos_loctype = 'VESSEL' AND wi.pos_loc_gkey = argo_cv.gkey
    AND wi.move_kind = 'LOAD' AND eq_type.basic_length = 'BASIC20' AND unit.freight_kind = 'MTY') as load_plan_empty_20ft,
    (SELECT count(*)
    FROM [sparcsn4].[dbo].[inv_wi] as wi
    LEFT JOIN [sparcsn4].[dbo].[inv_unit_yrd_visit] AS yrd_visit ON wi.uyv_gkey=yrd_visit.gkey
    LEFT JOIN [sparcsn4].[dbo].[inv_unit_fcy_visit] AS fcy_visit ON yrd_visit.ufv_gkey=fcy_visit.gkey
    LEFT JOIN [sparcsn4].[dbo].[inv_unit] AS unit ON fcy_visit.unit_gkey=unit.gkey
    INNER JOIN [sparcsn4].[dbo].[ref_equipment] as ref_eq ON unit.eq_gkey = ref_eq.gkey
    INNER JOIN [sparcsn4].[dbo].[ref_equip_type] as eq_type ON ref_eq.eqtyp_gkey = eq_type.gkey
    WHERE wi.pos_loctype = 'VESSEL' AND wi.pos_loc_gkey = argo_cv.gkey
    AND wi.move_kind = 'LOAD' AND eq_type.basic_length = 'BASIC40' AND unit.freight_kind = 'MTY') as load_plan_empty_40ft,
    (SELECT count(*)
    FROM [sparcsn4].[dbo].[inv_unit] as unit
    INNER JOIN [sparcsn4].[dbo].[inv_unit_fcy_visit] as fcy_visit ON unit.gkey=fcy_visit.unit_gkey
    WHERE fcy_visit.actual_ob_cv = argo_cv.gkey AND unit.id NOT LIKE '%DUMM%' AND unit.id NOT LIKE '%SAMM%'
    AND unit.category IN ('EXPRT','TRSHP','THRGH') AND fcy_visit.transit_state = 'S60_LOADED') as total_loaded_count,
    (SELECT count(*)
    FROM [sparcsn4].[dbo].[inv_unit] as unit
    INNER JOIN [sparcsn4].[dbo].[inv_unit_fcy_visit] as fcy_visit ON unit.gkey=fcy_visit.unit_gkey
    INNER JOIN [sparcsn4].[dbo].[ref_equipment] as ref_eq ON unit.eq_gkey = ref_eq.gkey
    INNER JOIN [sparcsn4].[dbo].[ref_equip_type] as eq_type ON ref_eq.eqtyp_gkey = eq_type.gkey
    WHERE fcy_visit.actual_ob_cv = argo_cv.gkey AND unit.id NOT LIKE '%DUMM%' AND unit.id NOT LIKE '%SAMM%'
    AND unit.category IN ('EXPRT','TRSHP','THRGH') AND unit.freight_kind = 'FCL'
    AND fcy_visit.transit_state = 'S60_LOADED' AND eq_type.basic_length = 'BASIC20') as loaded_fcl_20ft,
    (SELECT count(*)
    FROM [sparcsn4].[dbo].[inv_unit] as unit
    INNER JOIN [sparcsn4].[dbo].[inv_unit_fcy_visit] as fcy_visit ON unit.gkey=fcy_visit.unit_gkey
    INNER JOIN [sparcsn4].[dbo].[ref_equipment] as ref_eq ON unit.eq_gkey = ref_eq.gkey
    INNER JOIN [sparcsn4].[dbo].[ref_equip_type] as eq_type ON ref_eq.eqtyp_gkey = eq_type.gkey
    WHERE fcy_visit.actual_ob_cv = argo_cv.gkey AND unit.id NOT LIKE '%DUMM%' AND unit.id NOT LIKE '%SAMM%'
    AND unit.category IN ('EXPRT','TRSHP','THRGH') AND unit.freight_kind = 'FCL'
    AND fcy_visit.transit_state = 'S60_LOADED' AND eq_type.basic_length = 'BASIC40') as loaded_fcl_40ft,
    (SELECT count(*)
    FROM [sparcsn4].[dbo].[inv_unit] as unit
    INNER JOIN [sparcsn4].[dbo].[inv_unit_fcy_visit] as fcy_visit ON unit.gkey=fcy_visit.unit_gkey
    INNER JOIN [sparcsn4].[dbo].[ref_equipment] as ref_eq ON unit.eq_gkey = ref_eq.gkey
    INNER JOIN [sparcsn4].[dbo].[ref_equip_type] as eq_type ON ref_eq.eqtyp_gkey = eq_type.gkey
    WHERE fcy_visit.actual_ob_cv = argo_cv.gkey AND unit.id NOT LIKE '%DUMM%' AND unit.id NOT LIKE '%SAMM%'
    AND unit.category IN ('EXPRT','TRSHP','THRGH') AND unit.freight_kind = 'MTY'
    AND fcy_visit.transit_state = 'S60_LOADED' AND eq_type.basic_length = 'BASIC20') as loaded_empty_20ft,
    (SELECT count(*)
    FROM [sparcsn4].[dbo].[inv_unit] as unit
    INNER JOIN [sparcsn4].[dbo].[inv_unit_fcy_visit] as fcy_visit ON unit.gkey=fcy_visit.unit_gkey
    INNER JOIN [sparcsn4].[dbo].[ref_equipment] as ref_eq ON unit.eq_gkey = ref_eq.gkey
    INNER JOIN [sparcsn4].[dbo].[ref_equip_type] as eq_type ON ref_eq.eqtyp_gkey = eq_type.gkey
    WHERE fcy_visit.actual_ob_cv = argo_cv.gkey AND unit.id NOT LIKE '%DUMM%' AND unit.id NOT LIKE '%SAMM%'
    AND unit.category IN ('EXPRT','TRSHP','THRGH') AND unit.freight_kind = 'MTY'
    AND fcy_visit.transit_state = 'S60_LOADED' AND eq_type.basic_length = 'BASIC40') as loaded_empty_40ft,
    (SELECT count(*)
    FROM [sparcsn4].[dbo].[inv_unit] as unit
    INNER JOIN [sparcsn4].[dbo].[inv_unit_fcy_visit] as fcy_visit ON unit.gkey=fcy_visit.unit_gkey
    WHERE fcy_visit.actual_ib_cv = argo_cv.gkey AND unit.id NOT LIKE '%DUMM%' AND unit.id NOT LIKE '%SAMM%'
    AND (
	unit.category IN ('IMPRT','TRSHP')
	OR (
		unit.category = 'THRGH'
		AND fcy_visit.restow_typ = 'RESTOW'
	)
    )) as total_planned_discharge,
    (SELECT count(*)
    FROM [sparcsn4].[dbo].[inv_unit] as unit
    INNER JOIN [sparcsn4].[dbo].[inv_unit_fcy_visit] as fcy_visit ON unit.gkey=fcy_visit.unit_gkey
    INNER JOIN [sparcsn4].[dbo].[ref_equipment] as ref_eq ON unit.eq_gkey = ref_eq.gkey
    INNER JOIN [sparcsn4].[dbo].[ref_equip_type] as eq_type ON ref_eq.eqtyp_gkey = eq_type.gkey
    WHERE fcy_visit.actual_ib_cv = argo_cv.gkey AND unit.id NOT LIKE '%DUMM%' AND unit.id NOT LIKE '%SAMM%'
    AND unit.freight_kind = 'FCL' AND eq_type.basic_length = 'BASIC20'
    AND (
	unit.category IN ('IMPRT','TRSHP')
	OR (
		unit.category = 'THRGH'
		AND fcy_visit.restow_typ = 'RESTOW'
	)
    )) as discharge_plan_fcl_20ft,
    (SELECT count(*)
    FROM [sparcsn4].[dbo].[inv_unit] as unit
    INNER JOIN [sparcsn4].[dbo].[inv_unit_fcy_visit] as fcy_visit ON unit.gkey=fcy_visit.unit_gkey
    INNER JOIN [sparcsn4].[dbo].[ref_equipment] as ref_eq ON unit.eq_gkey = ref_eq.gkey
    INNER JOIN [sparcsn4].[dbo].[ref_equip_type] as eq_type ON ref_eq.eqtyp_gkey = eq_type.gkey
    WHERE fcy_visit.actual_ib_cv = argo_cv.gkey AND unit.id NOT LIKE '%DUMM%' AND unit.id NOT LIKE '%SAMM%'
    AND unit.freight_kind = 'FCL' AND eq_type.basic_length = 'BASIC40'
    AND (
	unit.category IN ('IMPRT','TRSHP')
	OR (
		unit.category = 'THRGH'
		AND fcy_visit.restow_typ = 'RESTOW'
	)
    )) as discharge_plan_fcl_40ft,
    (SELECT count(*)
    FROM [sparcsn4].[dbo].[inv_unit] as unit
    INNER JOIN [sparcsn4].[dbo].[inv_unit_fcy_visit] as fcy_visit ON unit.gkey=fcy_visit.unit_gkey
    INNER JOIN [sparcsn4].[dbo].[ref_equipment] as ref_eq ON unit.eq_gkey = ref_eq.gkey
    INNER JOIN [sparcsn4].[dbo].[ref_equip_type] as eq_type ON ref_eq.eqtyp_gkey = eq_type.gkey
    WHERE fcy_visit.actual_ib_cv = argo_cv.gkey AND unit.id NOT LIKE '%DUMM%' AND unit.id NOT LIKE '%SAMM%'
    AND unit.freight_kind = 'MTY' AND eq_type.basic_length = 'BASIC20'
    AND (
	unit.category IN ('IMPRT','TRSHP')
	OR (
		unit.category = 'THRGH'
		AND fcy_visit.restow_typ = 'RESTOW'
	)
    )) as discharge_plan_mty_20ft,
    (SELECT count(*)
    FROM [sparcsn4].[dbo].[inv_unit] as unit
    INNER JOIN [sparcsn4].[dbo].[inv_unit_fcy_visit] as fcy_visit ON unit.gkey=fcy_visit.unit_gkey
    INNER JOIN [sparcsn4].[dbo].[ref_equipment] as ref_eq ON unit.eq_gkey = ref_eq.gkey
    INNER JOIN [sparcsn4].[dbo].[ref_equip_type] as eq_type ON ref_eq.eqtyp_gkey = eq_type.gkey
    WHERE fcy_visit.actual_ib_cv = argo_cv.gkey AND unit.id NOT LIKE '%DUMM%' AND unit.id NOT LIKE '%SAMM%'
    AND unit.freight_kind = 'MTY' AND eq_type.basic_length = 'BASIC40'
    AND (
	unit.category IN ('IMPRT','TRSHP')
	OR (
		unit.category = 'THRGH'
		AND fcy_visit.restow_typ = 'RESTOW'
	)
    )) as discharge_plan_mty_40ft,
    (SELECT count(*)
    FROM [sparcsn4].[dbo].[inv_unit] as unit
    INNER JOIN [sparcsn4].[dbo].[inv_unit_fcy_visit] as fcy_visit ON unit.gkey=fcy_visit.unit_gkey
    WHERE fcy_visit.actual_ib_cv = argo_cv.gkey AND unit.id NOT LIKE '%DUMM%' AND unit.id NOT LIKE '%SAMM%'
    AND (
	unit.category IN ('IMPRT','TRSHP')
	OR (
		unit.category = 'THRGH'
		AND fcy_visit.restow_typ = 'RESTOW'
	)
    ) AND fcy_visit.transit_state NOT IN ('S10_ADVISED','S20_INBOUND','S99_RETIRED')) as total_discharged_count,
    (SELECT count(*)
    FROM [sparcsn4].[dbo].[inv_unit] as unit
    INNER JOIN [sparcsn4].[dbo].[inv_unit_fcy_visit] as fcy_visit ON unit.gkey=fcy_visit.unit_gkey
    INNER JOIN [sparcsn4].[dbo].[ref_equipment] as ref_eq ON unit.eq_gkey = ref_eq.gkey
    INNER JOIN [sparcsn4].[dbo].[ref_equip_type] as eq_type ON ref_eq.eqtyp_gkey = eq_type.gkey
    WHERE fcy_visit.actual_ib_cv = argo_cv.gkey AND unit.id NOT LIKE '%DUMM%' AND unit.id NOT LIKE '%SAMM%'
    AND (
	unit.category IN ('IMPRT','TRSHP')
	OR (
		unit.category = 'THRGH'
		AND fcy_visit.restow_typ = 'RESTOW'
	)
    ) AND unit.freight_kind = 'FCL'
    AND fcy_visit.transit_state NOT IN ('S10_ADVISED','S20_INBOUND','S99_RETIRED') AND eq_type.basic_length = 'BASIC20') as discharged_fcl_20ft,
    (SELECT count(*)
    FROM [sparcsn4].[dbo].[inv_unit] as unit
    INNER JOIN [sparcsn4].[dbo].[inv_unit_fcy_visit] as fcy_visit ON unit.gkey=fcy_visit.unit_gkey
    INNER JOIN [sparcsn4].[dbo].[ref_equipment] as ref_eq ON unit.eq_gkey = ref_eq.gkey
    INNER JOIN [sparcsn4].[dbo].[ref_equip_type] as eq_type ON ref_eq.eqtyp_gkey = eq_type.gkey
    WHERE fcy_visit.actual_ib_cv = argo_cv.gkey AND unit.id NOT LIKE '%DUMM%' AND unit.id NOT LIKE '%SAMM%'
    AND (
	unit.category IN ('IMPRT','TRSHP')
	OR (
		unit.category = 'THRGH'
		AND fcy_visit.restow_typ = 'RESTOW'
	)
    ) AND unit.freight_kind = 'FCL'
    AND fcy_visit.transit_state NOT IN ('S10_ADVISED','S20_INBOUND','S99_RETIRED') AND eq_type.basic_length = 'BASIC40') as discharged_fcl_40ft,
    (SELECT count(*)
    FROM [sparcsn4].[dbo].[inv_unit] as unit
    INNER JOIN [sparcsn4].[dbo].[inv_unit_fcy_visit] as fcy_visit ON unit.gkey=fcy_visit.unit_gkey
    INNER JOIN [sparcsn4].[dbo].[ref_equipment] as ref_eq ON unit.eq_gkey = ref_eq.gkey
    INNER JOIN [sparcsn4].[dbo].[ref_equip_type] as eq_type ON ref_eq.eqtyp_gkey = eq_type.gkey
    WHERE fcy_visit.actual_ib_cv = argo_cv.gkey AND unit.id NOT LIKE '%DUMM%' AND unit.id NOT LIKE '%SAMM%'
    AND (
	unit.category IN ('IMPRT','TRSHP')
	OR (
		unit.category = 'THRGH'
		AND fcy_visit.restow_typ = 'RESTOW'
	)
    ) AND unit.freight_kind = 'MTY'
    AND fcy_visit.transit_state NOT IN ('S10_ADVISED','S20_INBOUND','S99_RETIRED') AND eq_type.basic_length = 'BASIC20') as discharged_empty_20ft,
    (SELECT count(*)
    FROM [sparcsn4].[dbo].[inv_unit] as unit
    INNER JOIN [sparcsn4].[dbo].[inv_unit_fcy_visit] as fcy_visit ON unit.gkey=fcy_visit.unit_gkey
    INNER JOIN [sparcsn4].[dbo].[ref_equipment] as ref_eq ON unit.eq_gkey = ref_eq.gkey
    INNER JOIN [sparcsn4].[dbo].[ref_equip_type] as eq_type ON ref_eq.eqtyp_gkey = eq_type.gkey
    WHERE fcy_visit.actual_ib_cv = argo_cv.gkey AND unit.id NOT LIKE '%DUMM%' AND unit.id NOT LIKE '%SAMM%'
    AND (
	unit.category IN ('IMPRT','TRSHP')
	OR (
		unit.category = 'THRGH'
		AND fcy_visit.restow_typ = 'RESTOW'
	)
    ) AND unit.freight_kind = 'MTY'
    AND fcy_visit.transit_state NOT IN ('S10_ADVISED','S20_INBOUND','S99_RETIRED') AND eq_type.basic_length = 'BASIC40') as discharged_empty_40ft
FROM [sparcsn4].[dbo].vsl_vessels as vvsl
INNER JOIN [sparcsn4].[dbo].vsl_vessel_visit_details as vvsl_vd ON vvsl.gkey=vvsl_vd.vessel_gkey
INNER JOIN [sparcsn4].[dbo].argo_carrier_visit as argo_cv ON vvsl_vd.vvd_gkey=argo_cv.cvcvd_gkey
INNER JOIN [sparcsn4].[dbo].argo_visit_details as argo_vd ON argo_vd.gkey=argo_cv.cvcvd_gkey
INNER JOIN [sparcsn4].[dbo].ref_carrier_service as ref_c_service ON argo_vd.service=ref_c_service.gkey
INNER JOIN [sparcsn4].[dbo].ref_bizunit_scoped as ref_biz ON ref_biz.gkey=vvsl_vd.bizu_gkey
WHERE argo_cv.phase IN ('40WORKING','30ARRIVED') AND argo_cv.carrier_mode='VESSEL'
ORDER BY argo_cv.gkey DESC
SQL;
    }

    /**
     * $valuesPlaceholders is a comma-separated "(?)" list (one row per vessel id) for the VALUES
     * clause; $inPlaceholders is a comma-separated "?" list for the two IN (...) filters. Both are
     * sized to the number of bound ob_ib_id values, and the bindings array passed to DB::select()
     * must repeat the same ob_ib_id list three times, in order (VesselIds, MoveData, ECINData).
     */
    private function craneGraphQuery(string $valuesPlaceholders, string $inPlaceholders): string
    {
        return <<<SQL
DECLARE @CurrentHour DATETIME = DATEADD(HOUR, DATEDIFF(HOUR, 0, GETDATE()), 0);
DECLARE @StartHour   DATETIME = DATEADD(HOUR, -23, @CurrentHour);

;WITH HourSpine AS (
    SELECT @StartHour AS hour_bucket
    UNION ALL
    SELECT DATEADD(HOUR, 1, hour_bucket) FROM HourSpine WHERE hour_bucket < @CurrentHour
),
Spine AS (
    SELECT hs.hour_bucket, v.ob_ib_id
    FROM HourSpine hs
    CROSS JOIN (VALUES {$valuesPlaceholders}) AS v(ob_ib_id)
),
MoveData AS (
    SELECT
        argo_cv.gkey AS ob_ib_id,
        DATEADD(HOUR, DATEDIFF(HOUR, 0,
            CASE mv_event.move_kind WHEN 'DSCH' THEN mv_event.t_discharge ELSE mv_event.t_put END), 0) AS hour_bucket,
        COALESCE(xps_che.full_name, 'UNKR') AS crane,
        COUNT(*) AS total
    FROM [sparcsn4].[dbo].argo_carrier_visit AS argo_cv
    INNER JOIN [sparcsn4].[dbo].inv_move_event AS mv_event ON argo_cv.gkey = mv_event.carrier_gkey
    LEFT  JOIN [sparcsn4].[dbo].xps_che ON mv_event.che_qc = xps_che.gkey
    WHERE argo_cv.gkey IN ({$inPlaceholders})
      AND mv_event.move_kind IN ('SHOB','SHFT','LOAD','DSCH')
      AND (CASE mv_event.move_kind WHEN 'DSCH' THEN mv_event.t_discharge ELSE mv_event.t_put END) >= @StartHour
    GROUP BY argo_cv.gkey,
        DATEADD(HOUR, DATEDIFF(HOUR, 0,
            CASE mv_event.move_kind WHEN 'DSCH' THEN mv_event.t_discharge ELSE mv_event.t_put END), 0),
        COALESCE(xps_che.full_name, 'UNKR')
),
ECINData AS (
    SELECT
        unit.declrd_ib_cv AS ob_ib_id,
        DATEADD(HOUR, DATEDIFF(HOUR, 0, fcy_visit.time_rnd), 0) AS hour_bucket,
        'ECIN' AS crane,
        COUNT(*) AS total
    FROM [sparcsn4].[dbo].inv_unit AS unit
    INNER JOIN [sparcsn4].[dbo].inv_unit_fcy_visit AS fcy_visit ON unit.gkey = fcy_visit.unit_gkey
    WHERE unit.declrd_ib_cv IN ({$inPlaceholders})
      AND (unit.category = 'IMPRT' OR unit.category = 'TRSHP')
      AND fcy_visit.transit_state = 'S30_ECIN'
      AND fcy_visit.time_rnd >= @StartHour
    GROUP BY unit.declrd_ib_cv, DATEADD(HOUR, DATEDIFF(HOUR, 0, fcy_visit.time_rnd), 0)
),
CombinedData AS (SELECT * FROM MoveData UNION ALL SELECT * FROM ECINData)
SELECT
    sp.ob_ib_id,
    DATEPART(HOUR, sp.hour_bucket) AS move_hour,
    sp.hour_bucket,
    cd.crane,
    ISNULL(cd.total, 0) AS total
FROM Spine sp
LEFT JOIN CombinedData cd
    ON sp.hour_bucket = cd.hour_bucket AND sp.ob_ib_id = cd.ob_ib_id
ORDER BY sp.ob_ib_id, sp.hour_bucket
OPTION (MAXRECURSION 24)
SQL;
    }
}
