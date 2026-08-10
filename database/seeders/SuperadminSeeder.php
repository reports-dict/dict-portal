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
     * for the same pattern).
     */
    public function run(): void
    {
        User::firstOrCreate(
            ['email' => 'kmorbita@anflocor.com'],
            [
                'name' => 'Kinard Khin Orbita',
                'role' => UserRole::Superadmin,
            ],
        );
    }
}
