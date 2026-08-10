<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use App\Enums\PermissionEffect;
use App\Enums\PortalModule;
use App\Enums\UserRole;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Carbon;
// LDAP is a secondary/fallback login path alongside Microsoft Entra ID SSO
// (see config/auth.php's 'ldap' guard, routes/web.php's /login/ldap, and
// LoginController).
use LdapRecord\Laravel\Auth\AuthenticatesWithLdap;
use LdapRecord\Laravel\Auth\HasLdapUser;
use LdapRecord\Laravel\Auth\LdapAuthenticatable;

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
 * @property Carbon|null $last_seen_at
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable(['name', 'email', 'password', 'guid', 'azure_oid', 'domain', 'samaccountname', 'role'])]
#[Hidden(['password', 'remember_token'])]
class User extends Authenticatable implements LdapAuthenticatable
{
    /** @use HasFactory<UserFactory> */
    use AuthenticatesWithLdap, HasFactory, HasLdapUser, Notifiable;

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
     * @return HasMany<UserPermission, $this>
     */
    public function permissionOverrides(): HasMany
    {
        return $this->hasMany(UserPermission::class);
    }

    /**
     * @return HasMany<Session, $this>
     */
    public function sessions(): HasMany
    {
        return $this->hasMany(Session::class);
    }

    /**
     * Whether this user can access the given module, applying any per-user
     * override on top of their role's default (see permissionOverrides()).
     * Superadmin always has full access, never subject to overrides.
     */
    public function hasModuleAccess(string $moduleKey): bool
    {
        if ($this->isSuperadmin()) {
            return true;
        }

        $override = $this->permissionOverrides()->where('module_key', $moduleKey)->first();

        if ($override !== null) {
            return $override->effect === PermissionEffect::Allow;
        }

        return RolePermission::where('role', $this->role->value)
            ->where('module_key', $moduleKey)
            ->exists();
    }

    /**
     * All module keys this user can access — role defaults with per-user
     * overrides applied. Null means "all modules" (superadmin).
     *
     * @return array<int, string>|null
     */
    public function permittedModuleKeys(): ?array
    {
        if ($this->isSuperadmin()) {
            return null;
        }

        $roleGrants = RolePermission::where('role', $this->role->value)
            ->pluck('module_key')
            ->map(fn (PortalModule $module) => $module->value);
        $overrides = $this->permissionOverrides()->get()->keyBy(fn (UserPermission $o) => $o->module_key->value);

        return collect(PortalModule::cases())
            ->map(fn (PortalModule $module) => $module->value)
            ->filter(fn (string $key) => $overrides->has($key)
                ? $overrides[$key]->effect === PermissionEffect::Allow
                : $roleGrants->contains($key))
            ->values()
            ->all();
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
            'last_seen_at' => 'datetime',
        ];
    }
}
