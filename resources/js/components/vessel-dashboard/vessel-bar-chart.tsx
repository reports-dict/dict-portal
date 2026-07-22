import {
    Bar,
    CartesianGrid,
    ComposedChart,
    LabelList,
    ReferenceLine,
    ResponsiveContainer,
    XAxis,
    YAxis,
} from 'recharts';
import type { VesselGraphRow } from '@/types/vessel-dashboard';

const Y_MAX = 60;
const THRESHOLD = 20;

function fmtRange(range: string | undefined): string | number {
    if (!range) {
        return '';
    }

    const match = range.match(/-(\d+):/);

    return match ? parseInt(match[1], 10) : range;
}

type VesselBarChartProps = {
    graphData: VesselGraphRow[] | null | undefined;
    vesselName: string;
    isAlone?: boolean;
};

export default function VesselBarChart({
    graphData,
    vesselName,
    isAlone,
}: VesselBarChartProps) {
    const data = graphData ?? null;

    if (data === null) {
        return (
            <div className="h-full rounded-lg border border-slate-700/30 bg-slate-900/40" />
        );
    }

    if (data.length === 0) {
        return (
            <div className="flex h-full items-center justify-center rounded-lg border border-slate-700/30 bg-slate-900/40">
                <span className="text-xs tracking-widest text-slate-500 uppercase">
                    No graph data available
                </span>
            </div>
        );
    }

    const chartData = data.map((d) => ({
        label: fmtRange(d.time_range),
        capped: Math.min(d.total_moves || 0, Y_MAX),
        actual: d.total_moves || 0,
    }));

    const tickSize = isAlone ? 16 : 14;
    const labelSize = isAlone ? 15 : 13;
    const refSize = isAlone ? 13 : 12;
    const yLabelSize = isAlone ? 14 : 13;

    return (
        <div className="flex h-full flex-col">
            <p
                className={`mb-1 shrink-0 text-center tracking-widest text-slate-400 uppercase ${isAlone ? 'text-base' : 'text-xs'}`}
            >
                {vesselName} — Total Moves Per Extraction Time
            </p>
            <div className="min-h-0 flex-1">
                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart
                        data={chartData}
                        margin={{
                            top: 22,
                            right: 10,
                            left: isAlone ? 0 : -10,
                            bottom: 0,
                        }}
                    >
                        <CartesianGrid
                            vertical={false}
                            strokeDasharray="3 3"
                            stroke="#334155"
                        />
                        <XAxis
                            dataKey="label"
                            tick={{
                                fill: '#cbd5e1',
                                fontSize: tickSize,
                                fontWeight: 600,
                            }}
                            axisLine={{ stroke: '#475569' }}
                            tickLine={false}
                        />
                        <YAxis
                            domain={[0, Y_MAX]}
                            ticks={[0, 15, 30, 45, 60]}
                            tick={{
                                fill: '#cbd5e1',
                                fontSize: tickSize,
                                fontWeight: 600,
                            }}
                            axisLine={false}
                            tickLine={false}
                            label={{
                                value: 'Moves',
                                angle: -90,
                                position: 'insideLeft',
                                fill: '#94a3b8',
                                fontSize: yLabelSize,
                                dy: 30,
                            }}
                        />

                        <Bar
                            dataKey="capped"
                            fill="#c8a97e"
                            radius={[3, 3, 0, 0]}
                            isAnimationActive={false}
                        >
                            <LabelList
                                dataKey="actual"
                                position="top"
                                style={{
                                    fill: '#ffffff',
                                    fontSize: labelSize,
                                    fontWeight: 800,
                                }}
                            />
                        </Bar>

                        <ReferenceLine
                            y={THRESHOLD}
                            stroke="#38bdf8"
                            strokeWidth={isAlone ? 3 : 2.5}
                            strokeDasharray="8 4"
                            label={{
                                value: '20 moves/hr',
                                position: 'insideTopRight',
                                fill: '#38bdf8',
                                fontSize: refSize,
                                fontWeight: 700,
                            }}
                        />
                    </ComposedChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
