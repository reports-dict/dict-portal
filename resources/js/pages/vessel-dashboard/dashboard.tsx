import { Head } from '@inertiajs/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { FullscreenButton } from '@/components/ui/fullscreen-button';
import VesselCard from '@/components/vessel-dashboard/vessel-card';
import { useFullscreen } from '@/hooks/use-fullscreen';
import PortalLayout from '@/layouts/portal-layout';
import type { DashboardData, Vessel } from '@/types/vessel-dashboard';

const REFRESH_INTERVAL = 60;
const SLIDE_INTERVAL = 30;

function WaveLoader({
    progressPct,
    fetching,
}: {
    progressPct: number;
    fetching: boolean;
}) {
    const waveDuration = fetching ? '1.2s' : '3s';

    return (
        <div
            style={{
                position: 'relative',
                height: 44,
                overflow: 'hidden',
                background: '#0a0e17',
            }}
        >
            <style>{`
                @keyframes wave-flow {
                    0%   { transform: translateX(0); }
                    100% { transform: translateX(-400px); }
                }
                @keyframes boat-bob {
                    0%, 100% { transform: translateY(0px) rotate(-1.5deg); }
                    50%       { transform: translateY(-5px) rotate(1.5deg); }
                }
                @keyframes slide-in-left {
                    from { transform: translateX(60px); opacity: 0; }
                    to   { transform: translateX(0);    opacity: 1; }
                }
                @keyframes slide-in-right {
                    from { transform: translateX(-60px); opacity: 0; }
                    to   { transform: translateX(0);     opacity: 1; }
                }
                .wave-anim       { animation: wave-flow var(--wave-dur, 3s) linear infinite; }
                .boat-bob        { animation: boat-bob 2s ease-in-out infinite; }
                .slide-in-left   { animation: slide-in-left  350ms ease-out both; }
                .slide-in-right  { animation: slide-in-right 350ms ease-out both; }
            `}</style>

            <svg
                width="100%"
                height="100%"
                viewBox="0 0 1440 44"
                preserveAspectRatio="none"
                style={{ position: 'absolute', inset: 0 }}
            >
                <rect
                    x="0"
                    y="28"
                    width="1440"
                    height="16"
                    fill="rgba(6,78,115,0.25)"
                />

                <g
                    className="wave-anim"
                    style={
                        { '--wave-dur': waveDuration } as React.CSSProperties
                    }
                >
                    <path
                        d="M0,30 C100,20 200,38 400,30 C600,22 700,38 900,30
                           C1100,22 1200,38 1400,30 C1600,22 1700,38 1840,30
                           L1840,44 L0,44 Z"
                        fill="rgba(6,78,115,0.35)"
                    />
                    <path
                        d="M0,33 C120,24 220,42 440,33 C660,24 760,42 980,33
                           C1200,24 1300,42 1520,33 C1680,24 1760,42 1840,33"
                        fill="none"
                        stroke="rgba(43,153,104,0.45)"
                        strokeWidth="1.5"
                    />
                    <path
                        d="M0,28 C80,22 160,34 320,28 C480,22 560,34 720,28
                           C880,22 960,34 1120,28 C1280,22 1360,34 1520,28
                           C1680,22 1760,34 1840,28"
                        fill="none"
                        stroke="rgba(127,209,168,0.2)"
                        strokeWidth="1"
                    />
                </g>

                <rect
                    x="0"
                    y="42"
                    width={`${progressPct}%`}
                    height="2"
                    fill="rgba(43,153,104,0.7)"
                    rx="1"
                />
            </svg>

            <div
                className="boat-bob"
                style={{
                    position: 'absolute',
                    top: 4,
                    left: `calc(${progressPct}% - 22px)`,
                    transition: 'left 1s linear',
                    pointerEvents: 'none',
                }}
            >
                <svg width="44" height="30" viewBox="0 0 44 30">
                    <path d="M4,20 L40,20 L35,27 L9,27 Z" fill="#475569" />
                    <rect
                        x="12"
                        y="13"
                        width="15"
                        height="8"
                        fill="#334155"
                        rx="1.5"
                    />
                    <rect
                        x="14"
                        y="15"
                        width="4"
                        height="3"
                        fill="rgba(43,153,104,0.5)"
                        rx="0.5"
                    />
                    <rect
                        x="24"
                        y="9"
                        width="4"
                        height="5"
                        fill="#1e293b"
                        rx="1"
                    />
                    <circle
                        cx="26"
                        cy="7"
                        r="2.5"
                        fill="rgba(148,163,184,0.35)"
                    />
                    <circle
                        cx="29"
                        cy="5"
                        r="1.8"
                        fill="rgba(148,163,184,0.2)"
                    />
                    <line
                        x1="17"
                        y1="3"
                        x2="17"
                        y2="13"
                        stroke="#64748b"
                        strokeWidth="1.2"
                    />
                    <path d="M17,3 L24,6 L17,9 Z" fill="rgba(43,153,104,0.7)" />
                    <path
                        d="M6,23 Q16,21 22,23 Q30,25 38,23"
                        fill="none"
                        stroke="rgba(43,153,104,0.3)"
                        strokeWidth="1"
                    />
                </svg>
            </div>
        </div>
    );
}

function Dashboard() {
    const { isFullscreen, toggle } = useFullscreen();
    const [vessels, setVessels] = useState<Vessel[]>([]);
    const [fetchedAt, setFetchedAt] = useState<Date | null>(null);
    const [countdown, setCountdown] = useState(REFRESH_INTERVAL);
    const [fetching, setFetching] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [activeIdx, setActiveIdx] = useState(0);
    const [slideDir, setSlideDir] = useState<'left' | 'right'>('left');
    const [animating, setAnimating] = useState(false);
    const [slideCountdown, setSlideCountdown] = useState(SLIDE_INTERVAL);
    const activeIdxRef = useRef(0);
    const vesselsRef = useRef<Vessel[]>([]);
    const slideTimerRef = useRef<ReturnType<typeof setInterval> | undefined>(
        undefined,
    );
    const slideTickRef = useRef<ReturnType<typeof setInterval> | undefined>(
        undefined,
    );

    const fetchData = useCallback(async () => {
        setFetching(true);
        setError(null);

        try {
            const res = await fetch('/vessel-dashboard/api/data');
            const json: DashboardData = await res.json();
            const list = json.vessels || [];
            vesselsRef.current = list;
            setVessels(list);
            setActiveIdx((prev) => {
                const clamped = Math.min(prev, Math.max(0, list.length - 1));
                activeIdxRef.current = clamped;

                return clamped;
            });
            setFetchedAt(new Date());
        } catch {
            setError('Failed to fetch data. Retrying next cycle.');
        } finally {
            setFetching(false);
        }
    }, []);

    const goTo = useCallback((idx: number, dir: 'left' | 'right' = 'left') => {
        setSlideDir(dir);
        setAnimating(true);
        setTimeout(() => {
            activeIdxRef.current = idx;
            setActiveIdx(idx);
            setAnimating(false);
        }, 350);
    }, []);

    const startSlideTimer = useCallback(() => {
        clearInterval(slideTimerRef.current);
        clearInterval(slideTickRef.current);
        setSlideCountdown(SLIDE_INTERVAL);
        slideTimerRef.current = setInterval(() => {
            const total = vesselsRef.current.length;

            if (total <= 1) {
                return;
            }

            const next = (activeIdxRef.current + 1) % total;
            goTo(next, 'left');
        }, SLIDE_INTERVAL * 1000);
        slideTickRef.current = setInterval(() => {
            setSlideCountdown((prev) =>
                prev <= 1 ? SLIDE_INTERVAL : prev - 1,
            );
        }, 1000);
    }, [goTo]);

    useEffect(() => {
        // Arms the slideshow's own interval timers; not derived render state.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        startSlideTimer();

        return () => {
            clearInterval(slideTimerRef.current);
            clearInterval(slideTickRef.current);
        };
    }, [startSlideTimer]);

    useEffect(() => {
        // Initial fetch of the external vessel data source; refetched on
        // REFRESH_INTERVAL below.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        fetchData();

        const timer = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    fetchData();

                    return REFRESH_INTERVAL;
                }

                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [fetchData]);

    const progressPct =
        ((REFRESH_INTERVAL - countdown) / REFRESH_INTERVAL) * 100;

    return (
        <>
            <Head title="Vessel Dashboard" />
            <div
                className="h-full w-full overflow-hidden p-4"
                style={{ backgroundColor: '#060a12' }}
            >
                <div
                    className="flex h-full w-full flex-col overflow-hidden rounded-xl border border-slate-700/60"
                    style={{ backgroundColor: '#0a0e17', color: '#e2e8f0' }}
                >
                    {/* Header */}
                    <header className="flex items-center justify-between border-b border-slate-700/50 px-6 py-1.5">
                        <div className="flex items-center gap-3">
                            {isFullscreen && (
                                <span className="flex h-8 w-8 items-center justify-center rounded-md bg-white p-1">
                                    <img
                                        src="/images/dict-logo.jpg"
                                        alt="DICT"
                                        className="h-full w-full object-contain"
                                    />
                                </span>
                            )}
                            <div>
                                <h1 className="text-xl leading-none font-bold tracking-tight text-brand-400 uppercase">
                                    Vessel Operations
                                </h1>
                                <p className="text-xs text-slate-400">
                                    Live Port Dashboard
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            {fetchedAt && (
                                <p className="text-xs text-slate-500">
                                    Updated {fetchedAt.toLocaleTimeString()}
                                </p>
                            )}
                            <FullscreenButton
                                variant="dark"
                                isFullscreen={isFullscreen}
                                onToggle={toggle}
                            />

                            <div className="flex items-center gap-1">
                                <a
                                    href="/vessel-dashboard/admin/overrides"
                                    className="h-1.5 w-1.5 shrink-0 rounded-full bg-slate-700 transition-colors hover:bg-slate-500"
                                />
                                <div className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5">
                                    {fetching ? (
                                        <>
                                            <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-brand-400" />
                                            <span className="font-mono text-xs text-brand-400">
                                                Fetching…
                                            </span>
                                        </>
                                    ) : (
                                        <>
                                            <span className="inline-block h-2 w-2 rounded-full bg-slate-500" />
                                            <span className="font-mono text-xs text-slate-300">
                                                Next refresh in{' '}
                                                <span className="font-bold text-brand-400">
                                                    {countdown}s
                                                </span>
                                            </span>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    </header>

                    <WaveLoader progressPct={progressPct} fetching={fetching} />

                    {error && (
                        <div className="mx-6 mt-4 rounded-lg border border-red-700 bg-red-900/40 px-4 py-2 text-sm text-red-400">
                            {error}
                        </div>
                    )}

                    {/* Vessel cards — full-screen slideshow */}
                    <main className="flex min-h-0 flex-1 flex-col overflow-hidden px-6 py-3">
                        {vessels.length === 0 ? (
                            <div className="flex h-full flex-col items-center justify-center gap-6">
                                <h2 className="text-5xl font-extrabold tracking-widest text-slate-500 uppercase">
                                    No Active Vessel Visits
                                </h2>
                                <div className="flex items-center gap-3">
                                    <span className="h-4 w-4 animate-pulse rounded-full bg-brand-500" />
                                    <p className="text-2xl tracking-wide text-slate-500">
                                        {fetching
                                            ? 'Checking for vessels…'
                                            : 'Monitoring for incoming vessels…'}
                                    </p>
                                </div>
                                {fetchedAt && (
                                    <p className="text-lg text-slate-600">
                                        Last checked:{' '}
                                        {fetchedAt.toLocaleTimeString()}
                                    </p>
                                )}
                            </div>
                        ) : (
                            <>
                                <div
                                    key={activeIdx}
                                    className={`min-h-0 flex-1 ${!animating ? (slideDir === 'left' ? 'slide-in-left' : 'slide-in-right') : ''}`}
                                    style={{
                                        opacity: animating ? 0 : undefined,
                                    }}
                                >
                                    <VesselCard
                                        vessel={vessels[activeIdx]}
                                        isAlone={true}
                                    />
                                </div>

                                {vessels.length > 1 && (
                                    <div className="flex shrink-0 flex-col items-center gap-1.5 pt-2">
                                        <div className="flex w-48 items-center gap-2">
                                            <div className="h-1 flex-1 overflow-hidden rounded-full bg-slate-700">
                                                <div
                                                    className="h-full rounded-full bg-brand-500 transition-all duration-1000 ease-linear"
                                                    style={{
                                                        width: `${(slideCountdown / SLIDE_INTERVAL) * 100}%`,
                                                    }}
                                                />
                                            </div>
                                            <span className="w-6 text-right font-mono text-xs text-slate-400">
                                                {slideCountdown}s
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {vessels.map((v, i) => (
                                                <button
                                                    key={v.ob_ib_id}
                                                    onClick={() => {
                                                        const dir =
                                                            i > activeIdx
                                                                ? 'left'
                                                                : 'right';
                                                        goTo(i, dir);
                                                        startSlideTimer();
                                                    }}
                                                    className={`rounded-full transition-all duration-300 ${
                                                        i === activeIdx
                                                            ? 'h-2.5 w-6 bg-brand-400'
                                                            : 'h-2.5 w-2.5 bg-slate-600 hover:bg-slate-400'
                                                    }`}
                                                    title={v.vessel_name}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </main>

                    {/* Footer */}
                    <footer className="flex items-center gap-3 border-t border-slate-700/50 px-6 py-1 text-xs text-slate-500">
                        <span>Data source: N4 SPARCS</span>
                        <span>•</span>
                        <span>Auto-refreshes every {REFRESH_INTERVAL}s</span>
                    </footer>
                </div>
            </div>
        </>
    );
}

Dashboard.layout = (page: ReactNode) => <PortalLayout>{page}</PortalLayout>;

export default Dashboard;
