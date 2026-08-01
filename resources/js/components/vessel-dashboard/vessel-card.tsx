import { useEffect, useState } from 'react';
import type { Vessel } from '@/types/vessel-dashboard';
import ProgressBar from './progress-bar';
import VesselBarChart from './vessel-bar-chart';

function useElapsed(dateStr: string | null) {
    const calc = () => {
        if (!dateStr) {
            return null;
        }

        const ms = Date.now() - new Date(dateStr).getTime();

        if (ms < 0) {
            return null;
        }

        return Math.round((ms / (1000 * 60 * 60)) * 2) / 2;
    };
    const [elapsed, setElapsed] = useState(calc);
    useEffect(() => {
        if (!dateStr) {
            return;
        }

        // Recompute on a 30s tick — this is a self-updating clock reading an
        // external value (Date.now()), not derived render state.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setElapsed(calc());
        const t = setInterval(() => setElapsed(calc()), 30000);

        return () => clearInterval(t);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dateStr]);

    return elapsed;
}

function PhaseBadge({ phase }: { phase: string }) {
    const cls =
        phase === '40WORKING'
            ? 'bg-amber-900/50 text-amber-400 border border-amber-700'
            : 'bg-cyan-900/50 text-cyan-400 border border-cyan-700';
    const label = phase === '40WORKING' ? 'Working' : 'Arrived';

    return (
        <span className={`rounded px-2 py-0.5 text-xs font-semibold ${cls}`}>
            {label}
        </span>
    );
}

const bal = (planned: number, done: number) =>
    Math.max(0, (planned || 0) - (done || 0));

function StatTable({ vessel, isAlone }: { vessel: Vessel; isAlone?: boolean }) {
    const cell =
        'text-center text-xs sm:text-lg lg:text-4xl font-extrabold px-1 sm:px-2 align-middle';
    const label =
        'text-left text-xs sm:text-lg lg:text-4xl font-bold uppercase tracking-widest px-1 sm:px-2 whitespace-nowrap align-middle';
    const colHead =
        'text-center text-[9px] sm:text-base lg:text-3xl font-bold uppercase tracking-widest px-1 sm:px-2 py-0';
    const groupHead =
        'text-center text-[9px] sm:text-base lg:text-3xl font-extrabold uppercase tracking-widest px-1 sm:px-2 py-0 border-b border-slate-600/50';
    const sectionRow = `${isAlone ? 'text-xs sm:text-lg lg:text-3xl' : 'text-sm'} font-extrabold uppercase tracking-widest px-1 sm:px-2 py-0.5`;
    const totalLabel = 'text-[9px] sm:text-lg lg:text-2xl';
    const totalValue = 'text-xs sm:text-xl lg:text-4xl';

    return (
        <div className="h-full overflow-x-auto">
            <table className="h-full w-full border-collapse text-white">
                <thead>
                    <tr className="bg-slate-900/60">
                        <th className="px-1 py-0 sm:px-3" />
                        <th
                            colSpan={2}
                            className={`${groupHead} border-l border-slate-600/50`}
                        >
                            20FT
                        </th>
                        <th
                            colSpan={2}
                            className={`${groupHead} border-l border-slate-600/50`}
                        >
                            40FT
                        </th>
                    </tr>
                    <tr className="bg-slate-900/40">
                        <th className="px-1 py-0 sm:px-3" />
                        <th
                            className={`${colHead} border-l border-slate-600/50 text-slate-300`}
                        >
                            FCL
                        </th>
                        <th className={`${colHead} text-slate-300`}>MTY</th>
                        <th
                            className={`${colHead} border-l border-slate-600/50 text-slate-300`}
                        >
                            FCL
                        </th>
                        <th className={`${colHead} text-slate-300`}>MTY</th>
                    </tr>
                </thead>
                <tbody>
                    {/* DISCHARGING section */}
                    <tr className="border-t border-amber-700/40 bg-amber-900/20">
                        <td
                            colSpan={5}
                            className={`${sectionRow} text-amber-400`}
                        >
                            Discharging
                        </td>
                    </tr>
                    <tr className="bg-slate-800/60">
                        <td className={`${label} text-blue-400`}>Planned</td>
                        <td
                            className={`${cell} border-l border-slate-700/30 text-blue-300`}
                        >
                            {vessel.discharge_plan_fcl_20ft}
                        </td>
                        <td className={`${cell} text-blue-300`}>
                            {vessel.discharge_plan_mty_20ft}
                        </td>
                        <td
                            className={`${cell} border-l border-slate-700/30 text-blue-300`}
                        >
                            {vessel.discharge_plan_fcl_40ft}
                        </td>
                        <td className={`${cell} text-blue-300`}>
                            {vessel.discharge_plan_mty_40ft}
                        </td>
                    </tr>
                    <tr className="bg-slate-800/40">
                        <td className={`${label} text-green-400`}>
                            Discharged
                        </td>
                        <td
                            className={`${cell} border-l border-slate-700/30 text-green-300`}
                        >
                            {vessel.discharged_fcl_20ft}
                        </td>
                        <td className={`${cell} text-green-300`}>
                            {vessel.discharged_empty_20ft}
                        </td>
                        <td
                            className={`${cell} border-l border-slate-700/30 text-green-300`}
                        >
                            {vessel.discharged_fcl_40ft}
                        </td>
                        <td className={`${cell} text-green-300`}>
                            {vessel.discharged_empty_40ft}
                        </td>
                    </tr>
                    <tr className="bg-slate-800/20">
                        <td className={`${label} text-yellow-400`}>Balance</td>
                        <td
                            className={`${cell} border-l border-slate-700/30 text-yellow-300`}
                        >
                            {bal(
                                vessel.discharge_plan_fcl_20ft,
                                vessel.discharged_fcl_20ft,
                            )}
                        </td>
                        <td className={`${cell} text-yellow-300`}>
                            {bal(
                                vessel.discharge_plan_mty_20ft,
                                vessel.discharged_empty_20ft,
                            )}
                        </td>
                        <td
                            className={`${cell} border-l border-slate-700/30 text-yellow-300`}
                        >
                            {bal(
                                vessel.discharge_plan_fcl_40ft,
                                vessel.discharged_fcl_40ft,
                            )}
                        </td>
                        <td className={`${cell} text-yellow-300`}>
                            {bal(
                                vessel.discharge_plan_mty_40ft,
                                vessel.discharged_empty_40ft,
                            )}
                        </td>
                    </tr>
                    <tr className="border-b border-amber-700/30 bg-amber-900/10">
                        <td colSpan={5} className="px-2 py-0.5">
                            <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-0.5">
                                <span
                                    className={`${totalLabel} font-bold tracking-widest text-blue-500 uppercase`}
                                >
                                    Total Planned:{' '}
                                    <span
                                        className={`text-blue-300 ${totalValue} font-extrabold`}
                                    >
                                        {vessel.total_planned_discharge}
                                    </span>
                                </span>
                                <span
                                    className={`${totalLabel} font-bold tracking-widest text-green-600 uppercase`}
                                >
                                    Total Disch:{' '}
                                    <span
                                        className={`text-green-400 ${totalValue} font-extrabold`}
                                    >
                                        {vessel.total_discharged_count}
                                    </span>
                                </span>
                                <span
                                    className={`${totalLabel} font-bold tracking-widest text-yellow-600 uppercase`}
                                >
                                    Balance:{' '}
                                    <span
                                        className={`text-yellow-300 ${totalValue} font-extrabold`}
                                    >
                                        {bal(
                                            vessel.total_planned_discharge,
                                            vessel.total_discharged_count,
                                        )}
                                    </span>
                                </span>
                            </div>
                        </td>
                    </tr>

                    {/* LOADING section */}
                    <tr className="border-t-2 border-slate-600/60 bg-cyan-900/20">
                        <td
                            colSpan={5}
                            className={`${sectionRow} text-cyan-400`}
                        >
                            Loading
                        </td>
                    </tr>
                    <tr className="bg-slate-800/60">
                        <td className={`${label} text-blue-400`}>Planned</td>
                        <td
                            className={`${cell} border-l border-slate-700/30 text-blue-300`}
                        >
                            {vessel.load_plan_fcl_20ft}
                        </td>
                        <td className={`${cell} text-blue-300`}>
                            {vessel.load_plan_empty_20ft}
                        </td>
                        <td
                            className={`${cell} border-l border-slate-700/30 text-blue-300`}
                        >
                            {vessel.load_plan_fcl_40ft}
                        </td>
                        <td className={`${cell} text-blue-300`}>
                            {vessel.load_plan_empty_40ft}
                        </td>
                    </tr>
                    <tr className="bg-slate-800/40">
                        <td className={`${label} text-green-400`}>Loaded</td>
                        <td
                            className={`${cell} border-l border-slate-700/30 text-green-300`}
                        >
                            {vessel.loaded_fcl_20ft}
                        </td>
                        <td className={`${cell} text-green-300`}>
                            {vessel.loaded_empty_20ft}
                        </td>
                        <td
                            className={`${cell} border-l border-slate-700/30 text-green-300`}
                        >
                            {vessel.loaded_fcl_40ft}
                        </td>
                        <td className={`${cell} text-green-300`}>
                            {vessel.loaded_empty_40ft}
                        </td>
                    </tr>
                    <tr className="bg-slate-800/20">
                        <td className={`${label} text-yellow-400`}>Balance</td>
                        <td
                            className={`${cell} border-l border-slate-700/30 text-yellow-300`}
                        >
                            {bal(
                                vessel.load_plan_fcl_20ft,
                                vessel.loaded_fcl_20ft,
                            )}
                        </td>
                        <td className={`${cell} text-yellow-300`}>
                            {bal(
                                vessel.load_plan_empty_20ft,
                                vessel.loaded_empty_20ft,
                            )}
                        </td>
                        <td
                            className={`${cell} border-l border-slate-700/30 text-yellow-300`}
                        >
                            {bal(
                                vessel.load_plan_fcl_40ft,
                                vessel.loaded_fcl_40ft,
                            )}
                        </td>
                        <td className={`${cell} text-yellow-300`}>
                            {bal(
                                vessel.load_plan_empty_40ft,
                                vessel.loaded_empty_40ft,
                            )}
                        </td>
                    </tr>
                    <tr className="border-b border-cyan-700/30 bg-cyan-900/10">
                        <td colSpan={5} className="px-2 py-0.5">
                            <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-0.5">
                                <span
                                    className={`${totalLabel} font-bold tracking-widest text-blue-500 uppercase`}
                                >
                                    Total Planned:{' '}
                                    <span
                                        className={`text-blue-300 ${totalValue} font-extrabold`}
                                    >
                                        {vessel.total_planned_loading_wi}
                                    </span>
                                </span>
                                <span
                                    className={`${totalLabel} font-bold tracking-widest text-green-600 uppercase`}
                                >
                                    Total Loaded:{' '}
                                    <span
                                        className={`text-green-400 ${totalValue} font-extrabold`}
                                    >
                                        {vessel.total_loaded_count}
                                    </span>
                                </span>
                                <span
                                    className={`${totalLabel} font-bold tracking-widest text-yellow-600 uppercase`}
                                >
                                    Balance:{' '}
                                    <span
                                        className={`text-yellow-300 ${totalValue} font-extrabold`}
                                    >
                                        {bal(
                                            vessel.total_planned_loading_wi,
                                            vessel.total_loaded_count,
                                        )}
                                    </span>
                                </span>
                            </div>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    );
}

type VesselCardProps = {
    vessel: Vessel;
    isAlone?: boolean;
};

export default function VesselCard({ vessel, isAlone }: VesselCardProps) {
    const fmt = (dt: string | null) =>
        dt ? new Date(dt).toLocaleString() : null;
    const meta = 'text-xs sm:text-lg lg:text-3xl';
    const elapsed = useElapsed(vessel.actual_time_of_arrival);

    return (
        <div className="flex h-full flex-col rounded-xl border border-slate-700 bg-slate-800/80 p-2 sm:p-3">
            {/* Vessel header */}
            <div className="mb-1 flex shrink-0 flex-wrap items-center gap-2">
                <h2
                    className={`${isAlone ? 'text-lg sm:text-2xl lg:text-3xl' : 'text-xl'} font-extrabold tracking-wide text-white`}
                >
                    {vessel.vessel_name}
                </h2>
                <PhaseBadge phase={vessel.phase} />
                <div className="flex items-center gap-1">
                    <span
                        className={`text-slate-500 ${meta} tracking-widest uppercase`}
                    >
                        SVC
                    </span>
                    <span className={`text-slate-200 ${meta} font-bold`}>
                        {vessel.service}
                    </span>
                </div>
                <div className="flex items-center gap-1">
                    <span
                        className={`text-slate-500 ${meta} tracking-widest uppercase`}
                    >
                        OPR
                    </span>
                    <span className={`text-slate-200 ${meta} font-bold`}>
                        {vessel.line_op}
                    </span>
                </div>
                <div className="ml-auto flex items-center gap-3">
                    {fmt(vessel.actual_time_of_arrival) && (
                        <div className="flex items-center gap-2">
                            <span
                                className={`text-slate-500 ${meta} tracking-widest uppercase`}
                            >
                                ATA
                            </span>
                            <span
                                className={`text-slate-200 ${meta} font-bold`}
                            >
                                {fmt(vessel.actual_time_of_arrival)}
                            </span>
                            {elapsed !== null && (
                                <span
                                    className={`${meta} font-mono font-extrabold text-amber-400`}
                                >
                                    +{elapsed.toFixed(1)}h
                                </span>
                            )}
                        </div>
                    )}
                    {fmt(vessel.actual_time_of_departure) && (
                        <div className="flex items-center gap-1">
                            <span
                                className={`text-slate-500 ${meta} tracking-widest uppercase`}
                            >
                                ATD
                            </span>
                            <span
                                className={`text-slate-200 ${meta} font-bold`}
                            >
                                {fmt(vessel.actual_time_of_departure)}
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {/* Two progress bars side-by-side */}
            <div className="mb-1 grid shrink-0 grid-cols-2 gap-2">
                <div>
                    <div className="mb-0.5 flex items-center justify-between">
                        <span
                            className={`font-semibold text-amber-400 uppercase ${meta} tracking-widest`}
                        >
                            Discharge
                        </span>
                        <span
                            className={`text-slate-300 ${meta} font-mono font-bold`}
                        >
                            {vessel.total_discharged_count} /{' '}
                            {vessel.total_planned_discharge}
                        </span>
                    </div>
                    <ProgressBar
                        value={vessel.total_discharged_count}
                        max={vessel.total_planned_discharge}
                        colorClass="bg-amber-500"
                    />
                </div>
                <div>
                    <div className="mb-0.5 flex items-center justify-between">
                        <span
                            className={`font-semibold text-cyan-400 uppercase ${meta} tracking-widest`}
                        >
                            Loading
                        </span>
                        <span
                            className={`text-slate-300 ${meta} font-mono font-bold`}
                        >
                            {vessel.total_loaded_count} /{' '}
                            {vessel.total_planned_loading_wi}
                        </span>
                    </div>
                    <ProgressBar
                        value={vessel.total_loaded_count}
                        max={vessel.total_planned_loading_wi}
                        colorClass="bg-cyan-500"
                    />
                </div>
            </div>

            <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto lg:flex-row lg:overflow-hidden">
                {/* Left — stat table, full width on mobile, 50% on desktop/TV */}
                <div className="flex min-h-0 w-full shrink-0 flex-col overflow-hidden lg:w-1/2 lg:shrink">
                    <StatTable vessel={vessel} isAlone={isAlone} />
                </div>
                {/* Right — chart, full width on mobile, 50%/75%-height centered on desktop/TV */}
                <div className="flex min-h-0 w-full shrink-0 items-center justify-center lg:w-1/2 lg:shrink">
                    <div className="h-64 w-full sm:h-80 lg:h-3/4">
                        <VesselBarChart
                            graphData={vessel.graph}
                            vesselName={vessel.vessel_name}
                            isAlone={isAlone}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
