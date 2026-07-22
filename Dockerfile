# ─────────────────────────────────────────────────────────────────────────────
# Stage 1 — PHP base (extensions needed by every module: MySQL, LDAP, SQL Server)
# ─────────────────────────────────────────────────────────────────────────────
FROM php:8.4-fpm AS base

RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    unzip \
    git \
    libonig-dev \
    libldap2-dev \
    libxml2-dev \
    gnupg2 \
    apt-transport-https \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Microsoft ODBC Driver 18 (required by the sqlsrv PHP extension — road-queue,
# road-queue-ecd, vessel-dashboard, and container-yard all read the legacy
# SPARCS N4 SQL Server through it)
RUN curl https://packages.microsoft.com/keys/microsoft.asc | gpg --dearmor -o /usr/share/keyrings/microsoft-prod.gpg \
    && curl https://packages.microsoft.com/config/debian/12/prod.list > /etc/apt/sources.list.d/mssql-release.list \
    && apt-get update \
    && ACCEPT_EULA=Y apt-get install -y msodbcsql18 unixodbc-dev \
    && rm -rf /var/lib/apt/lists/*

RUN docker-php-ext-install -j$(nproc) \
        bcmath \
        ctype \
        fileinfo \
        mbstring \
        opcache \
        pdo \
        pdo_mysql \
        xml \
        ldap

RUN pecl install sqlsrv pdo_sqlsrv \
    && docker-php-ext-enable sqlsrv pdo_sqlsrv

# Node 22 — needed in every stage, not just the production builder: the
# wayfinder Vite plugin shells out to `php artisan wayfinder:generate` on
# every `vite dev`/`vite build`, so the dev container running `npm run dev`
# also needs a working PHP + artisan, not only Node.
RUN curl -fsSL https://deb.nodesource.com/setup_22.x | bash - \
    && apt-get install -y --no-install-recommends nodejs \
    && rm -rf /var/lib/apt/lists/*

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer
COPY .docker/php/php.ini /usr/local/etc/php/conf.d/app.ini

WORKDIR /var/www/html

# ─────────────────────────────────────────────────────────────────────────────
# Stage 2 — Dev image (source is bind-mounted; composer/npm run via compose)
# ─────────────────────────────────────────────────────────────────────────────
FROM base AS development

EXPOSE 9000 5173
CMD ["php-fpm"]

# ─────────────────────────────────────────────────────────────────────────────
# Stage 3 — Builder (composer + npm together: the wayfinder Vite plugin shells
# out to `php artisan wayfinder:generate` during `npm run build`, so PHP and
# the app's routes must be available at build time, not just Node)
# ─────────────────────────────────────────────────────────────────────────────
FROM base AS builder

COPY . .

# Throwaway .env so artisan can boot (package:discover, wayfinder:generate) —
# never copied into the production stage below.
RUN cp .env.example .env
RUN composer install --no-dev --no-interaction --optimize-autoloader
RUN php artisan key:generate --ansi

RUN npm ci --no-audit --no-fund \
    && npm run build \
    && rm -rf node_modules .env

# ─────────────────────────────────────────────────────────────────────────────
# Stage 4 — Production image: php-fpm only. nginx and the scheduler run as
# separate containers built from this same image with a different `command:`
# (see docker-compose.prod.yml) — one process per container, rather than
# bundling everything behind supervisor.
# ─────────────────────────────────────────────────────────────────────────────
FROM base AS production

COPY --from=builder --chown=www-data:www-data /var/www/html /var/www/html

# public/build is baked in above, but docker-compose mounts a shared volume
# over /var/www/html/public so the standalone nginx container can serve it —
# that mount starts out empty, so keep an untouched copy here for the
# entrypoint to repopulate it from on every boot.
RUN cp -r /var/www/html/public /var/www/html/public-build

COPY .docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh \
    && chown -R www-data:www-data storage bootstrap/cache

EXPOSE 9000
ENTRYPOINT ["/entrypoint.sh"]
CMD ["php-fpm"]
