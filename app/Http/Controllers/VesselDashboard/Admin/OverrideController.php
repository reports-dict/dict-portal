<?php

namespace App\Http\Controllers\VesselDashboard\Admin;

use App\Http\Controllers\Controller;
use App\Models\VesselPlanOverride;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class OverrideController extends Controller
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
        return Inertia::render('vessel-dashboard/admin/overrides');
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'ob_ib_id' => 'required|string',
            ...(array_fill_keys($this->overrideFields, 'nullable|integer|min:0')),
        ]);

        VesselPlanOverride::updateOrCreate(
            ['ob_ib_id' => $validated['ob_ib_id']],
            $validated
        );

        return back();
    }

    public function destroy(string $obIbId): RedirectResponse
    {
        VesselPlanOverride::where('ob_ib_id', $obIbId)->delete();

        return back();
    }
}
