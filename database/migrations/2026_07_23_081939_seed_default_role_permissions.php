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

        // insertOrIgnore, not insert: PortalModule::cases() is evaluated at
        // migrate-time, not frozen to what existed when this migration was
        // first written — on a fresh database (e.g. CI) it already includes
        // every case the later seed_*_role_permissions migrations exist to
        // backfill, so those would otherwise collide with the rows this
        // migration just inserted for the same (role, module_key) pairs.
        DB::table('role_permissions')->insertOrIgnore($rows);
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
