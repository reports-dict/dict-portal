<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('containers', function (Blueprint $table) {
            $table->id();
            $table->string('container')->unique();
            $table->string('category'); // Import, Export, Storage, Transship
            $table->string('iso_type'); // 20ft, 40ft
            $table->string('position'); // BLOCK-BAY-ROW-TIER format
            $table->dateTime('time_in')->nullable();
            $table->text('notes')->nullable();
            $table->integer('dwell_days')->nullable();
            $table->string('line_op')->nullable();
            $table->string('transit_state')->nullable(); // Loaded, Empty, Damaged
            $table->string('condition')->nullable(); // Good, Fair, Poor, Unknown
            $table->string('pod')->nullable();
            $table->string('pod_place_name')->nullable();
            $table->string('pol')->nullable();
            $table->string('pol_place_name')->nullable();
            $table->string('outbound_carrier_id')->nullable();
            $table->string('outbound_carrier_name')->nullable();
            $table->string('inbound_carrier_id')->nullable();
            $table->string('inbound_carrier_name')->nullable();
            $table->string('shipper')->nullable();
            $table->string('consignee')->nullable();
            $table->tinyInteger('requires_power')->nullable()->default(0);
            $table->tinyInteger('is_powered')->nullable()->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('containers');
    }
};
