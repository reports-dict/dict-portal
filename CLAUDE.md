# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

`dict-portal` is a Laravel 13 + Inertia.js v3 + React 19 portal that consolidates several previously-standalone operational tools for a container terminal (DICT) into one authenticated app: a vessel dashboard, a road queue display, a road queue ECD display, and a container yard viewer. All routes except `/login` require `auth` middleware. There are three roles (`App\Enums\UserRole`: `superadmin`, `admin`, `user`) — `admin` and `user` currently have identical access, equal to what every authenticated user gets (all four modules). `superadmin` gets that plus an exclusive User Access Management screen (`App\Http\Controllers\Admin\UserAccessController`, at `/admin/users`, gated by the `superadmin` middleware alias / `App\Models\User::isSuperadmin()`) for managing everyone's role, including pre-provisioning a placeholder account by email before someone's first SSO login (matched and claimed on first login, see below).

Authentication is Microsoft Entra ID SSO (`laravel/socialite` + `socialiteproviders/microsoft`, see `App\Http\Controllers\Auth\MicrosoftLoginController`): visiting the app while logged out redirects straight to Microsoft sign-in (`/login` → `MicrosoftLoginController::redirect()`), and the callback (`/auth/microsoft/callback`) only logs a person in if their email already matches an existing `users` row pre-provisioned by a superadmin — it never auto-creates accounts. The original LDAP-only auth (`directorytree/ldaprecord-laravel`, matched on `samaccountname`) is commented out, not removed, across `config/auth.php`, `app/Models/User.php`, and `routes/web.php` — search those files for "LDAP" to find and restore it if SSO is ever reverted. `App\Http\Controllers\Auth\LoginController` still exists (its `create()`/`store()` LDAP form handlers are just unrouted) and its `destroy()` now also ends the Microsoft SSO session on logout.

## Commands

Run from the project root (Windows/PowerShell).

```
composer dev              # serve + queue:listen + vite, concurrently (primary local dev loop)
npm run dev                # vite only
composer test              # config:clear + lint:check + types:check + php artisan test
composer ci:check           # npm lint:check + format:check + types:check + PHP test suite (mirrors CI)

# PHP
vendor/bin/pint --parallel                  # format PHP (composer lint)
vendor/bin/pint --parallel --test           # check formatting without writing (composer lint:check)
vendor/bin/phpstan analyse                   # static analysis, level 7 (composer types:check)
php artisan test                              # full Pest suite
php artisan test --filter=NameOrPattern       # single test
php artisan test tests/Feature/SomeTest.php   # single file

# JS/TS
npm run lint         # eslint --fix
npm run lint:check   # eslint, no write
npm run format        # prettier --write resources/
npm run format:check  # prettier --check resources/
npm run types:check   # tsc --noEmit
npm run build          # vite build
npm run build:ssr      # vite build + SSR build
```

There is no seeded "happy path" script beyond `composer setup` (install, .env, key:generate, migrate, npm build) — LDAP credentials and the remote DB hosts below must be reachable for the app to be useful locally beyond the login screen.

## Architecture

### Multi-database data flow

This app is a read-mostly aggregator over data it does not own. Four connections are configured in `config/database.php`:

- `mysql` (default) — the app's own DB (`dict_portal`): users, sessions, cache, jobs, and the tables synced from SQL Server (`containers`, `blocks`, `allocations`).
- `mysql_vessel_dashboard` — a **separate, dedicated** database (`vessel_dashboard`) on the same centralized MySQL server, shared with the standalone `vessel-dashboard-app` codebase. Only `App\Models\VesselPlanOverride` uses this connection (set via `protected $connection` on the model and its migration) — don't assume it's the same database as `mysql`, and don't drop/recreate its tables casually, since another live application reads/writes them too.
- `sqlsrv` — remote, **read-only** SQL Server (`sparcsn4`), the terminal operating system's live database. Queried directly with large raw SQL (`DB::connection('sqlsrv')->select(...)`) — see `App\Console\Commands\SyncContainersFromMssql` and `ContainerYard\Api\ContainerController::liveSearch()` for the canonical queries and their many-join shape (`inv_unit`, `argo_carrier_visit`, `vsl_vessels`, etc.). Don't restructure these queries without understanding the sparcsn4 schema; they encode terminal-specific business rules (e.g. DICT yard block filtering, transit-state filtering).
- `mysql_navis` — remote, **read-only** MySQL ("Navis"), used only for moves-per-hour graph data on the vessel dashboard (`DashboardController::data()`).

One scheduled task (`routes/console.php`) keeps the local `containers` table fresh: `app:sync-containers-from-mssql`, every 2 minutes, gated to `->environments('production')` so it never fires in dev. It fully truncates and reinserts `containers` — see `App\Console\Commands\SyncContainersFromMssql`.

`VesselDashboardController::data()` queries `sqlsrv` **live** on every request (no local caching table for vessel visits) and merges in `VesselPlanOverride` rows (manually admin-entered planning numbers, since sparcsn4 doesn't expose planned-loading figures), auto-deleting overrides for vessels no longer active in sparcsn4.

### Module structure

Each of the four consolidated tools follows the same convention: a controller namespace under `App\Http\Controllers\<Module>`, routes grouped by prefix in `routes/web.php`, and a matching directory in `resources/js/pages/<module>`:

- `VesselDashboard` — public dashboard (`DashboardController`) + `VesselDashboard\Admin` sub-namespace (`OverrideController`, at `/vessel-dashboard/admin/overrides`) for managing planning overrides.
- `ContainerYard` — `ContainerYardController` (Inertia pages: index/search) plus `ContainerYard\Api` controllers (`ContainerController`, `BlockController`, `AllocationController`) exposed as JSON via `Route::apiResource` under `/container-yard/api/*`, consumed client-side for live filtering/search.
- `RoadQueue` and `RoadQueueEcd` — separate, near-identical controllers/pages (not shared) — treat them as independently evolving screens rather than assuming a shared abstraction exists.

Frontend routes are not hand-written: `resources/js/routes/` and `resources/js/actions/` are generated by Laravel Wayfinder (`laravel/wayfinder` + `@laravel/vite-plugin-wayfinder`) from the PHP route/controller definitions. Regenerate rather than hand-edit when backend routes change (see the `wayfinder-development` skill).

### Frontend conventions

- Pages live in `resources/js/pages/<module>/*.tsx`, rendered via `Inertia::render('module/page')` on the backend — the string must match the page path.
- Shared UI in `resources/js/components/ui/`; module-specific components under `resources/js/components/<module>/`.
- `resources/js/layouts/portal-layout` is the shared authenticated shell.
- `HandleInertiaRequests` shares `auth.user` and `name` (app name) as global Inertia props on every request.
- These dashboards run unattended on displays (vessel dashboard, road queue screens): expect polling/refresh-interval patterns and fullscreen handling (`useFullscreen` hook, `FullscreenButton`) rather than typical user-driven navigation.

### PHP static analysis note

`phpstan.neon` runs Larastan at level 7 with no suppressions. (It previously had one for `App\Http\Middleware\Superadmin`, needed because LdapRecord-Laravel's `ldap`-driver provider config made Larastan infer the wrong user model for the `web` guard, producing false "unreachable code" errors — that's gone now that `config/auth.php`'s active provider is a plain `eloquent` driver. If LDAP is ever restored as the active auth path, that suppression will likely need to come back too — see git history for the exact pattern.)

## Deployment

Docker-based, via `Dockerfile` / `docker-compose.yml` (dev) and `docker-compose.prod.yml` (production). `.env` vs `.env.docker` select different `DB_HOST`/`DB_PORT` for the local MySQL depending on whether the app runs host-side or inside the `mysql8_default` Docker network — see the comment block at the top of `.env.example`.

Dev and prod use structurally different container topologies, not just different env vars — see the `Dockerfile`'s `development` vs `production` build targets. Dev bind-mounts live source and runs a separate `vite` dev-server container; production bakes built assets into an immutable image and splits into one process per container (`app` = php-fpm, `scheduler` = `schedule:work`, `nginx` = separate `nginx:1.27-alpine` image), all sharing an `app_public` docker volume populated by `.docker/entrypoint.sh` on boot (a volume mount would otherwise shadow the image's baked-in `public/build`). There's no supervisor/multi-process-per-container setup — that was deliberately removed in favor of one process per container, matching the pattern used by other DICT Laravel projects on the same server.
