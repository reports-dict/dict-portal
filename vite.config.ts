import { existsSync } from 'node:fs';
import inertia from '@inertiajs/vite';
import { wayfinder } from '@laravel/vite-plugin-wayfinder';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import laravel from 'laravel-vite-plugin';
import { bunny } from 'laravel-vite-plugin/fonts';
import { defineConfig } from 'vite';

// Docker Desktop on Windows/macOS doesn't reliably forward native filesystem
// change events for bind-mounted volumes into the Linux container, so
// chokidar's default (event-based) watcher never fires there. Polling is the
// standard fallback — only needed inside the container, not for host-native
// `npm run dev`, where native events already work and polling would just
// burn CPU for nothing.
const runningInDocker = existsSync('/.dockerenv');

export default defineConfig({
    server: {
        // Bind all interfaces so the dev server is reachable from outside its
        // container (Docker dev setup), while telling the browser to connect
        // back to localhost for HMR/assets — matches the published port in
        // docker-compose.yml either way (host-based dev also uses localhost).
        host: true,
        hmr: {
            host: 'localhost',
        },
        watch: runningInDocker
            ? { usePolling: true, interval: 300 }
            : undefined,
    },
    plugins: [
        laravel({
            input: ['resources/css/app.css', 'resources/js/app.tsx'],
            refresh: true,
            fonts: [
                bunny('Instrument Sans', {
                    weights: [400, 500, 600],
                }),
            ],
        }),
        inertia(),
        react({
            babel: {
                plugins: ['babel-plugin-react-compiler'],
            },
        }),
        tailwindcss(),
        wayfinder({
            formVariants: true,
        }),
    ],
});
