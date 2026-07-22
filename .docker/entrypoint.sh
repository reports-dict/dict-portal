#!/bin/sh
set -e

# public/ may be an (initially empty) shared docker volume so the standalone
# nginx container can serve built assets — a volume mount shadows whatever
# the image had at that path, so repopulate it from the untouched build
# output on every boot. Runs harmlessly for the queue-worker/scheduler
# containers too, since they use the same image and entrypoint.
cp -r /var/www/html/public-build/. /var/www/html/public/

exec "$@"
