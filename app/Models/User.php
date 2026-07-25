<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use App\Enums\UserRole;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Carbon;

// LDAP auth is disabled — SSO via Microsoft Entra ID is the active login path
// (see config/auth.php, routes/web.php, MicrosoftLoginController). Restore
// these traits/interface if LDAP login is reinstated.
// use LdapRecord\Laravel\Auth\AuthenticatesWithLdap;
// use LdapRecord\Laravel\Auth\HasLdapUser;
// use LdapRecord\Laravel\Auth\LdapAuthenticatable;

/**
 * @property int $id
 * @property string $name
 * @property string $email
 * @property Carbon|null $email_verified_at
 * @property string|null $password
 * @property string|null $guid
 * @property string|null $azure_oid
 * @property string|null $domain
 * @property string|null $samaccountname
 * @property UserRole $role
 * @property string|null $remember_token
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable(['name', 'email', 'password', 'guid', 'azure_oid', 'domain', 'samaccountname', 'role'])]
#[Hidden(['password', 'remember_token'])]
class User extends Authenticatable /* implements LdapAuthenticatable */
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable; // , AuthenticatesWithLdap, HasLdapUser — LDAP disabled, see config/auth.php

    /**
     * @var array<string, mixed>
     */
    protected $attributes = [
        'role' => UserRole::User->value,
    ];

    public function isSuperadmin(): bool
    {
        return $this->role === UserRole::Superadmin;
    }

    public function isAdmin(): bool
    {
        return $this->role === UserRole::Admin;
    }

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'role' => UserRole::class,
        ];
    }
}
