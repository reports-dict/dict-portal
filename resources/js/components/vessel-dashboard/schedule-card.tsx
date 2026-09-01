import { CalendarClock, Ship } from 'lucide-react';
import type { VesselSchedule } from '@/types/vessel-dashboard';

function splitDateTime(value: string) {
    const date = new Date(value);
    const includeYear = date.getFullYear() !== new Date().getFullYear();

    return {
        time: date.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
        }),
        date: date.toLocaleDateString([], {
            month: 'short',
            day: '2-digit',
            ...(includeYear ? { year: 'numeric' } : {}),
        }),
    };
}

type ScheduleCardProps = {
    schedule: VesselSchedule;
    position: number;
    // 0-1 — how much emerald tint a "scheduled" card gets, soonest ETB
    // strongest. Ignored for "on_dock" (fixed cyan tint, no fade).
    intensity: number;
};

export default function ScheduleCard({
    schedule,
    position,
    intensity,
}: ScheduleCardProps) {
    const isOnDock = schedule.status === 'on_dock';
    const etb = splitDateTime(schedule.etb);
    const etd = splitDateTime(schedule.etd);

    const backgroundColor = isOnDock
        ? 'rgba(8,74,92,0.55)'
        : `rgba(16,90,65,${(0.28 + intensity * 0.42).toFixed(2)})`;
    const borderColor = isOnDock
        ? 'rgba(34,211,238,0.55)'
        : `rgba(16,185,129,${(0.25 + intensity * 0.45).toFixed(2)})`;

    return (
        <div
            className="@container relative flex h-full flex-col justify-between rounded-xl border p-2 @min-[220px]:p-3"
            style={{ backgroundColor, borderColor }}
        >
            <span className="absolute top-1.5 left-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-black/30 text-[10px] font-bold text-white">
                {position}
            </span>

            <div className="flex flex-col items-center gap-0.5 pt-1">
                <span
                    className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold tracking-widest uppercase @min-[220px]:text-xs ${
                        isOnDock
                            ? 'bg-cyan-500/20 text-cyan-300'
                            : 'bg-amber-500/20 text-amber-300'
                    }`}
                >
                    {isOnDock ? (
                        <Ship className="h-3 w-3" />
                    ) : (
                        <CalendarClock className="h-3 w-3" />
                    )}
                    {isOnDock ? 'On Dock' : 'Scheduled'}
                </span>

                <p className="text-center text-sm font-extrabold text-white @min-[220px]:text-xl @min-[320px]:text-2xl">
                    {schedule.vessel_name}
                </p>
                <p className="text-center text-[9px] tracking-widest text-emerald-200/70 uppercase @min-[220px]:text-xs">
                    SVC {schedule.service} &middot; OPR {schedule.line_operator}
                </p>
            </div>

            <div className="my-1.5 border-t border-white/10" />

            <div className="grid grid-cols-2 gap-2 text-center">
                <div>
                    <p className="text-[9px] font-semibold tracking-widest text-emerald-200/60 uppercase">
                        ETB
                    </p>
                    <p className="text-sm font-bold text-white @min-[220px]:text-lg">
                        {etb.time}
                    </p>
                    <p className="text-[10px] text-emerald-100/70">
                        {etb.date}
                    </p>
                </div>
                <div>
                    <p className="text-[9px] font-semibold tracking-widest text-emerald-200/60 uppercase">
                        ETD
                    </p>
                    <p className="text-sm font-bold text-white @min-[220px]:text-lg">
                        {etd.time}
                    </p>
                    <p className="text-[10px] text-emerald-100/70">
                        {etd.date}
                    </p>
                </div>
            </div>

            <div className="my-1.5 border-t border-white/10" />

            <div className="grid grid-cols-3 gap-1 text-center">
                <div>
                    <p className="text-[8px] font-semibold tracking-widest text-emerald-200/60 uppercase">
                        LOA
                    </p>
                    <p className="text-xs font-bold text-white">
                        {schedule.loa_meters}m
                    </p>
                </div>
                <div>
                    <p className="text-[8px] font-semibold tracking-widest text-emerald-200/60 uppercase">
                        Berth
                    </p>
                    <p className="text-xs font-bold text-white">
                        {schedule.berth_number || '—'}
                    </p>
                </div>
                <div>
                    <p className="text-[8px] font-semibold tracking-widest text-emerald-200/60 uppercase">
                        Moves
                    </p>
                    <p className="text-xs font-bold text-white">
                        {schedule.estimated_moves}
                    </p>
                </div>
            </div>
        </div>
    );
}
