<?php

namespace App\Http\Controllers\VesselHistory;

use App\Http\Controllers\Controller;
use App\Models\VesselPlanOverride;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class VesselHistoryController extends Controller
{
    /**
     * Chart windows are clamped to this many hours (14 days) so a vessel
     * with a missing/bad ATD doesn't produce a runaway hour spine.
     */
    private const int MAX_WINDOW_HOURS = 336;

    /**
     * sparcsn4 doesn't reliably expose real planned-loading figures, so —
     * same as the live dashboard — these are always zeroed and only shown
     * when a matching VesselPlanOverride row (entered via dict-operations-suite)
     * explicitly sets them. Discharge figures are reliable on their own and
     * are left untouched.
     *
     * @var list<string>
     */
    private array $loadingOverrideFields = [
        'total_planned_loading_wi',
        'load_plan_fcl_20ft',
        'load_plan_fcl_40ft',
        'load_plan_empty_20ft',
        'load_plan_empty_40ft',
    ];

    public function index(Request $request): Response
    {
        $month = (string) ($request->query('month') ?: now('Asia/Manila')->format('Y-m'));
        $date = (string) $request->query('date', '');

        [$start, $end] = $this->resolveRange($month, $date);

        $vessels = DB::connection('sqlsrv')->select($this->listQuery(), [
            $start->format('Y-m-d H:i:s'),
            $end->format('Y-m-d H:i:s'),
        ]);

        return Inertia::render('vessel-history/index', [
            'vessels' => $vessels,
            'filters' => [
                'month' => $month,
                'date' => $date,
            ],
        ]);
    }

    public function show(string $obIbId): JsonResponse
    {
        $rows = DB::connection('sqlsrv')->select($this->detailQuery(), [$obIbId]);
        $vessel = $rows[0] ?? null;

        if ($vessel === null) {
            abort(404);
        }

        $override = VesselPlanOverride::find($obIbId);

        foreach ($this->loadingOverrideFields as $field) {
            $vessel->$field = 0;
        }

        if ($override !== null) {
            foreach ($this->loadingOverrideFields as $field) {
                if (! is_null($override->$field)) {
                    $vessel->$field = $override->$field;
                }
            }
        }

        $vessel->has_override = $override !== null;
        $vessel->graph = $this->resolveGraph(
            $obIbId,
            $vessel->actual_time_of_arrival,
            $vessel->actual_time_of_departure
        );

        return response()->json(['vessel' => $vessel]);
    }

    /**
     * @return array{0: Carbon, 1: Carbon}
     */
    private function resolveRange(string $month, string $date): array
    {
        if ($date !== '') {
            $start = Carbon::parse($date, 'Asia/Manila')->startOfDay();

            return [$start, $start->copy()->addDay()];
        }

        $start = Carbon::parse($month.'-01', 'Asia/Manila')->startOfMonth();

        return [$start, $start->copy()->addMonth()];
    }

    /**
     * Derives the vessel's real operation window from its earliest/latest
     * crane move or ECIN event, falling back to ATA/ATD when no such events
     * exist (or either source is missing the other), per the "full time
     * range of operations if available, else ATA/ATD" requirement.
     *
     * @return array<int, array{hour: int, hour_bucket: string, total: int, QC1: int, QC2: int, QC3: int, QC4: int, UNKR: int, ECIN: int}>
     */
    private function resolveGraph(string $obIbId, ?string $ata, ?string $atd): array
    {
        $windowRows = DB::connection('sqlsrv')->select($this->operationWindowQuery(), [$obIbId, $obIbId]);
        $window = $windowRows[0] ?? null;

        $start = $window?->op_start !== null ? Carbon::parse($window->op_start) : ($ata !== null ? Carbon::parse($ata) : null);
        $end = $window?->op_end !== null ? Carbon::parse($window->op_end) : ($atd !== null ? Carbon::parse($atd) : null);

        if ($start === null || $end === null) {
            return [];
        }

        $start = $start->copy()->startOfHour();
        $end = $end->copy()->startOfHour()->addHour();

        if ($end->lessThanOrEqualTo($start)) {
            $end = $start->copy()->addHour();
        }

        if ($start->diffInHours($end) > self::MAX_WINDOW_HOURS) {
            $end = $start->copy()->addHours(self::MAX_WINDOW_HOURS);
        }

        $rows = DB::connection('sqlsrv')->select($this->graphQuery(), [
            $start->format('Y-m-d H:i:s'),
            $end->format('Y-m-d H:i:s'),
            $obIbId,
            $obIbId,
        ]);

        return $this->buildGraph($rows);
    }

    /**
     * @param  array<int, object{hour_bucket: string, move_hour: int|string, crane: string|null, total: int|string}>  $rows
     * @return array<int, array{hour: int, hour_bucket: string, total: int, QC1: int, QC2: int, QC3: int, QC4: int, UNKR: int, ECIN: int}>
     */
    private function buildGraph(array $rows): array
    {
        $craneKeys = ['QC1', 'QC2', 'QC3', 'QC4', 'UNKR', 'ECIN'];

        return collect($rows)->groupBy('hour_bucket')->map(function ($hourRows) use ($craneKeys) {
            $entry = array_merge(
                [
                    'hour' => (int) $hourRows->first()->move_hour,
                    'hour_bucket' => (string) $hourRows->first()->hour_bucket,
                    'total' => 0,
                ],
                array_fill_keys($craneKeys, 0)
            );

            foreach ($hourRows as $row) {
                if ($row->crane === null) {
                    continue; // zero-fill row for an hour with no moves at all
                }

                $crane = in_array($row->crane, $craneKeys, true) ? $row->crane : 'UNKR';
                $entry[$crane] += (int) $row->total;
                $entry['total'] += (int) $row->total;
            }

            return $entry;
        })->values()->all();
    }

    private function listQuery(): string
    {
        return <<<'SQL'
SELECT
    argo_cv.gkey as ob_ib_id,
    argo_cv.ata as actual_time_of_arrival,
    argo_cv.atd as actual_time_of_departure,
    vvsl.name AS vessel_name,
    argo_cv.id as vessel_id
FROM [sparcsn4].[dbo].vsl_vessels as vvsl
INNER JOIN [sparcsn4].[dbo].vsl_vessel_visit_details as vvsl_vd ON vvsl.gkey=vvsl_vd.vessel_gkey
INNER JOIN [sparcsn4].[dbo].argo_carrier_visit as argo_cv ON vvsl_vd.vvd_gkey=argo_cv.cvcvd_gkey
WHERE argo_cv.carrier_mode='VESSEL' AND argo_cv.atd IS NOT NULL
AND argo_cv.ata >= ? AND argo_cv.ata < ?
ORDER BY argo_cv.ata DESC
SQL;
    }

    /**
     * Same metrics as DashboardController::query(), scoped to a single
     * closed visit by gkey instead of the live "TOP 10 active" filter.
     * Duplicated rather than shared — see CLAUDE.md's "treat them as
     * independently evolving screens" guidance for sibling modules.
     */
    private function detailQuery(): string
    {
        return <<<'SQL'
SELECT
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
WHERE argo_cv.gkey = ? AND argo_cv.carrier_mode='VESSEL'
SQL;
    }

    private function operationWindowQuery(): string
    {
        return <<<'SQL'
SELECT MIN(ts) as op_start, MAX(ts) as op_end
FROM (
    SELECT (CASE mv_event.move_kind WHEN 'DSCH' THEN mv_event.t_discharge ELSE mv_event.t_put END) AS ts
    FROM [sparcsn4].[dbo].inv_move_event AS mv_event
    WHERE mv_event.carrier_gkey = ?
      AND mv_event.move_kind IN ('SHOB','SHFT','LOAD','DSCH')

    UNION ALL

    SELECT fcy_visit.time_rnd AS ts
    FROM [sparcsn4].[dbo].inv_unit AS unit
    INNER JOIN [sparcsn4].[dbo].inv_unit_fcy_visit AS fcy_visit ON unit.gkey = fcy_visit.unit_gkey
    WHERE unit.declrd_ib_cv = ?
      AND (unit.category = 'IMPRT' OR unit.category = 'TRSHP')
      AND fcy_visit.transit_state = 'S30_ECIN'
      AND fcy_visit.restow_typ IN ('NONE','RESTOW')
) AS events
SQL;
    }

    /**
     * Single-vessel variant of DashboardController::craneGraphQuery(),
     * parameterized by an explicit start/end instead of a fixed trailing
     * 24h window ending at GETDATE(). Bindings, in order: StartHour,
     * EndHour, carrier_gkey (MoveData), declrd_ib_cv (ECINData).
     */
    private function graphQuery(): string
    {
        return <<<'SQL'
DECLARE @StartHour DATETIME = ?;
DECLARE @EndHour   DATETIME = ?;

;WITH HourSpine AS (
    SELECT @StartHour AS hour_bucket
    UNION ALL
    SELECT DATEADD(HOUR, 1, hour_bucket) FROM HourSpine WHERE hour_bucket < @EndHour
),
MoveData AS (
    SELECT
        DATEADD(HOUR, DATEDIFF(HOUR, 0,
            CASE mv_event.move_kind WHEN 'DSCH' THEN mv_event.t_discharge ELSE mv_event.t_put END), 0) AS hour_bucket,
        COALESCE(xps_che.full_name, 'UNKR') AS crane,
        COUNT(*) AS total
    FROM [sparcsn4].[dbo].inv_move_event AS mv_event
    LEFT JOIN [sparcsn4].[dbo].xps_che ON mv_event.che_qc = xps_che.gkey
    WHERE mv_event.carrier_gkey = ?
      AND mv_event.move_kind IN ('SHOB','SHFT','LOAD','DSCH')
      AND (CASE mv_event.move_kind WHEN 'DSCH' THEN mv_event.t_discharge ELSE mv_event.t_put END) >= @StartHour
      AND (CASE mv_event.move_kind WHEN 'DSCH' THEN mv_event.t_discharge ELSE mv_event.t_put END) < @EndHour
    GROUP BY
        DATEADD(HOUR, DATEDIFF(HOUR, 0,
            CASE mv_event.move_kind WHEN 'DSCH' THEN mv_event.t_discharge ELSE mv_event.t_put END), 0),
        COALESCE(xps_che.full_name, 'UNKR')
    HAVING COALESCE(xps_che.full_name, 'UNKR') <> 'UNKR'
),
ECINData AS (
    SELECT
        DATEADD(HOUR, DATEDIFF(HOUR, 0, fcy_visit.time_rnd), 0) AS hour_bucket,
        'ECIN' AS crane,
        COUNT(*) AS total
    FROM [sparcsn4].[dbo].inv_unit AS unit
    INNER JOIN [sparcsn4].[dbo].inv_unit_fcy_visit AS fcy_visit ON unit.gkey = fcy_visit.unit_gkey
    WHERE unit.declrd_ib_cv = ?
      AND (unit.category = 'IMPRT' OR unit.category = 'TRSHP')
      AND fcy_visit.transit_state = 'S30_ECIN'
      AND fcy_visit.restow_typ IN ('NONE','RESTOW')
      AND fcy_visit.time_rnd >= @StartHour
      AND fcy_visit.time_rnd < @EndHour
    GROUP BY DATEADD(HOUR, DATEDIFF(HOUR, 0, fcy_visit.time_rnd), 0)
),
CombinedData AS (SELECT * FROM MoveData UNION ALL SELECT * FROM ECINData)
SELECT
    hs.hour_bucket,
    DATEPART(HOUR, hs.hour_bucket) AS move_hour,
    cd.crane,
    ISNULL(cd.total, 0) AS total
FROM HourSpine hs
LEFT JOIN CombinedData cd ON hs.hour_bucket = cd.hour_bucket
ORDER BY hs.hour_bucket
OPTION (MAXRECURSION 0)
SQL;
    }
}
