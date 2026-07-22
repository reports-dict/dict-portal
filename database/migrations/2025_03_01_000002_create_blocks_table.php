<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('blocks', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->integer('bay_start');
            $table->integer('bay_end');
            $table->string('row_start')->default('A');
            $table->string('row_end')->default('F');
            $table->integer('max_tier')->default(5);
            $table->string('facility')->default('Terminal'); // Terminal, ECD
            $table->enum('road_side', ['row_start', 'row_end', 'both'])->default('both');
            $table->text('excluded_rows')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('blocks');
    }
};
