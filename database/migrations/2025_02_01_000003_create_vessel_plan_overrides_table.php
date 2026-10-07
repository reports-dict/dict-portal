<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    protected $connection = 'mysql_vessel_dashboard';

    public function up(): void
    {
        // This connection is a real, private-network-only MySQL server shared
        // with the standalone vessel-dashboard-app — unreachable from (and not
        // meant to be touched by) CI, which runs migrate --force against an
        // in-memory sqlite database for everything else. GitHub Actions sets
        // CI=true on every runner (hosted or self-hosted), so this no-ops
        // there instead of failing on a connection it can't and shouldn't reach.
        // getenv(), not Laravel's env() helper, since CI is a raw OS env var,
        // not a config()-backed value — env() would return null once config
        // is cached, silently defeating this guard in that scenario.
        if (getenv('CI')) {
            return;
        }

        Schema::create('vessel_plan_overrides', function (Blueprint $table) {
            $table->string('ob_ib_id')->primary();
            // Discharge planned overrides
            $table->unsignedInteger('total_planned_discharge')->nullable();
            $table->unsignedInteger('discharge_plan_fcl_20ft')->nullable();
            $table->unsignedInteger('discharge_plan_fcl_40ft')->nullable();
            $table->unsignedInteger('discharge_plan_mty_20ft')->nullable();
            $table->unsignedInteger('discharge_plan_mty_40ft')->nullable();
            // Loading planned overrides
            $table->unsignedInteger('total_planned_loading_wi')->nullable();
            $table->unsignedInteger('load_plan_fcl_20ft')->nullable();
            $table->unsignedInteger('load_plan_fcl_40ft')->nullable();
            $table->unsignedInteger('load_plan_empty_20ft')->nullable();
            $table->unsignedInteger('load_plan_empty_40ft')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        if (getenv('CI')) {
            return;
        }

        Schema::dropIfExists('vessel_plan_overrides');
    }
};
