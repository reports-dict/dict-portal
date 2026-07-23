<?php

use App\Enums\PortalModule;
use App\Enums\UserRole;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $now = now();
        $rows = [];

        foreach ([UserRole::Admin, UserRole::User] as $role) {
            foreach (PortalModule::cases() as $module) {
                $rows[] = [
                    'role' => $role->value,
                    'module_key' => $module->value,
                    'created_at' => $now,
                    'updated_at' => $now,
                ];
            }
        }

        DB::table('role_permissions')->insert($rows);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::table('role_permissions')
            ->whereIn('role', [UserRole::Admin->value, UserRole::User->value])
            ->delete();
    }
};
