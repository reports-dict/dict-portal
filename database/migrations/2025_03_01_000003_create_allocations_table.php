<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('allocations', function (Blueprint $table) {
            $table->id();
            $table->string('service')->nullable();
            $table->string('discharge_port')->nullable();
            $table->string('iso_basic_length')->nullable();
            $table->string('reefer_type')->nullable();
            $table->string('location', 255);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('allocations');
    }
};
