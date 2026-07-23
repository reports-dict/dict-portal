# Deploying to the Ubuntu server

Assumes the repo lives at `/var/www/dict-portal` and Docker + the Docker Compose plugin are already installed on the server.

## 1. Get the code onto the server

```bash
sudo mkdir -p /var/www/dict-portal
sudo chown $USER:$USER /var/www/dict-portal
git clone <repo-url> /var/www/dict-portal
cd /var/www/dict-portal
```

(If you're not using git on the server, copy the project directory over some other way — just make sure `.env`/`.env.production` and anything in `.gitignore` come along separately, since those never live in the repo.)

## 2. Create `.env.production`

There's no `.env.production` in the repo (it's gitignored on purpose — real secrets shouldn't be committed). Copy the template and fill it in:

```bash
cp .env.production.example .env.production
```

Fields that **must** be changed from the template's blanks before this will actually run:

| Variable | Notes |
|---|---|
| `APP_KEY` | Generate one — see step 3 below. |
| `APP_URL` | The real URL this deploys behind. |
| `DB_PASSWORD` | Password for the `mysql` service (also sets `MYSQL_ROOT_PASSWORD` via `docker-compose.prod.yml`'s `${DB_PASSWORD:-changeme}` fallback). |
| `DB_HOST` | Defaults to `mysql` — the bundled `mysql` service in `docker-compose.prod.yml` (a fresh, empty database on first boot). If you're pointing this at the centralized MySQL server instead (shared with `vessel-dashboard-app`) rather than the bundled container, change this — and drop the `mysql` service from `docker-compose.prod.yml` so you're not running a second, unused database next to it. |
| `VESSEL_DB_HOST`, `VESSEL_DB_PASSWORD` | The centralized `vessel_dashboard` database — this one's always external, never the bundled `mysql` service. Only `VesselPlanOverride` uses it. |
| `DB_SQLSRV_USERNAME`, `DB_SQLSRV_PASSWORD` | SQL Server (`sparcsn4`) credentials. |
| `NAVIS_DB_PASSWORD` | Navis MySQL password (graph data). |
| `LDAP_DEFAULT_USERNAME`, `LDAP_DEFAULT_PASSWORD` | LDAP bind account. |

## 3. Generate `APP_KEY`

Needs a built image, so do this after the first build (step 4) or generate it any other way you have PHP available and paste the result in:

```bash
docker compose -f docker-compose.prod.yml run --rm app php artisan key:generate --show
```

Copy the `base64:...` output into `.env.production`'s `APP_KEY=`.

## 4. Build and start

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

This builds one image (the `production` Dockerfile target) and starts five containers: `app` (php-fpm), `scheduler` (`schedule:work` — currently just the container-yard sync, every 2 minutes, production-only), `nginx`, and `mysql`. `app`/`scheduler`/`nginx` share a `app_public` volume for the built frontend assets.

## 5. Run migrations

Not automated on boot (deliberately — see below), so run it by hand after the containers are up:

```bash
docker compose -f docker-compose.prod.yml exec app php artisan migrate --force
```

**If `DB_HOST` points at the centralized MySQL server** (not the bundled `mysql` service): the `vessel_dashboard` database may already have `vessel_plan_overrides` populated with live data from `vessel-dashboard-app`. `migrate --force` won't touch it if it's already been migrated once — but if this is genuinely the first time dict-portal's migration tracking table sees those entries, check `php artisan migrate:status` first rather than blindly running `migrate --force` against a database another live app is already using.

Migrations aren't run automatically on every deploy on purpose — this was a deliberate call, not an oversight, given the shared-database situation above. Re-run this command by hand after every deploy that changes the schema.

## 6. Verify it's actually running

```bash
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs -f app
docker compose -f docker-compose.prod.yml logs -f scheduler
```

To confirm the scheduler is actually ticking (it logs each run via `--verbose`):

```bash
docker compose -f docker-compose.prod.yml logs -f scheduler
```

The site should now be reachable on port 80 of the server (nginx). There's no HTTPS/TLS termination configured here — put this behind a reverse proxy or set up certbot separately if you need HTTPS.

## Redeploying after a code change

```bash
cd /var/www/dict-portal
git pull
docker compose -f docker-compose.prod.yml up -d --build
docker compose -f docker-compose.prod.yml exec app php artisan migrate --force   # only if migrations changed
```

`--build` rebuilds the image (fresh `npm run build`/`composer install --no-dev` inside the Dockerfile's `builder` stage) and recreates any container whose image changed — `app`, `scheduler`, and `nginx` will restart with the new build; `mysql`'s data volume is untouched.

## Stopping / tearing down

```bash
docker compose -f docker-compose.prod.yml down          # stops and removes containers, keeps volumes (mysql_data, app_public)
docker compose -f docker-compose.prod.yml down -v        # also deletes volumes — this deletes the bundled mysql service's data if you're using it
```
