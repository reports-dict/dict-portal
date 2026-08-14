<?php

namespace Database\Seeders;

use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Database\Seeder;

class SuperadminSeeder extends Seeder
{
    /**
     * Pre-provision the default superadmin account — no guid/azure_oid, so
     * it's claimed automatically on this person's first Microsoft SSO login
     * (see MicrosoftLoginController::callback() / UserAccessController::store()
     * for the same pattern). samaccountname is set too so the LDAP fallback
     * path (config/auth.php's ldap_users provider, matched via sync_existing)
     * can also attach to this row instead of trying to import a new one,
     * which OnlyImported would then reject.
     */
    public function run(): void
    {
        User::firstOrCreate(
            ['email' => 'kmorbita@anflocor.com'],
            [
                'name' => 'Kinard Khin Orbita',
                'samaccountname' => 'kmorbita',
                'role' => UserRole::Superadmin,
            ],
        );
    }
}
