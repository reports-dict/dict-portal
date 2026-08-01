import {
    Bar,
    CartesianGrid,
    ComposedChart,
    DefaultLegendContent,
    LabelList,
    Legend,
    ReferenceLine,
    ResponsiveContainer,
    XAxis,
    YAxis,
} from 'recharts';
import type { BarShapeProps, LabelProps } from 'recharts';
import type { VesselGraphRow } from '@/types/vessel-dashboard';

const Y_MAX = 60;
const THRESHOLD = 20;
const GAP = 1; // 1px inset per touching edge = 2px surface gap between stacked segments

type CraneKey = 'QC1' | 'QC2' | 'QC3' | 'QC4' | 'UNKR' | 'ECIN';

// Fixed crane colors (dark-surface categorical palette hues), per crane identity.
const CRANE_COLORS: Record<CraneKey, string> = {
    QC1: '#a0522d', // brown
    QC2: '#3987e5', // blue
    QC3: '#008300', // green
    QC4: '#c2368f', // magenta/pink
    UNKR: '#e66767', // red
    ECIN: '#c98500', // yellow
};

// Stacking order (bottom to top). This is NOT the same as reading order —
// it's chosen so adjacent segments clear the color-vision-deficiency
// separation check (validated via the dataviz skill's palette validator);
// putting yellow (ECIN) next to red (UNKR) or orange (QC1) both fail that
// check, so ECIN/UNKR sit at opposite ends of the stack instead. Legend
// order below is independent and follows natural crane numbering.
const STACK_ORDER: CraneKey[] = ['ECIN', 'QC3', 'QC2', 'QC1', 'QC4', 'UNKR'];
const LEGEND_ORDER: CraneKey[] = ['QC1', 'QC2', 'QC3', 'QC4', 'UNKR', 'ECIN'];

const CRANES = STACK_ORDER.map((key) => ({ key, color: CRANE_COLORS[key] }));

type StackSegmentProps = {
    x: number;
    y: number;
    width: number;
    height: number;
    fill: string;
    gapTop: boolean;
    gapBottom: boolean;
    radius?: number;
};

function StackSegment({
    x,
    y,
    width,
    height,
    fill,
    gapTop,
    gapBottom,
    radius = 0,
}: StackSegmentProps) {
    if (height <= 0) {
        return null;
    }

    const top = gapTop ? GAP : 0;
    const bottom = gapBottom ? GAP : 0;
    const h = Math.max(0, height - top - bottom);

    if (h <= 0) {
        return null;
    }

    const yy = y + top;

    if (radius > 0) {
        const r = Math.min(radius, width / 2, h);
        const d = `M${x},${yy + h} L${x},${yy + r} Q${x},${yy} ${x + r},${yy}
                   L${x + width - r},${yy} Q${x + width},${yy} ${x + width},${yy + r}
                   L${x + width},${yy + h} Z`;

        return <path d={d} fill={fill} />;
    }

    return <rect x={x} y={yy} width={width} height={h} fill={fill} />;
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

    // Minimum drawn segment size (in moves-units on the 0-60 axis) so a small
    // but nonzero crane count still renders tall enough to fit its own label.
    const MIN_SEGMENT_VALUE = isAlone ? 3 : 2;

    const chartData = data.map((d) => {
        const total = d.total || 0;
        const scale = total > Y_MAX ? Y_MAX / total : 1;
        const entry: Record<string, number | string> = {
            label: String(d.hour),
            total,
        };
        CRANES.forEach(({ key }) => {
            const raw = d[key] || 0;
            const scaled = raw * scale;
            entry[key] = raw > 0 ? Math.max(scaled, MIN_SEGMENT_VALUE) : 0; // scaled + floored — drives bar height
            entry[`${key}Raw`] = raw; // true unscaled count — shown in the segment label
        });

        return entry;
    });

    const tickSize = isAlone ? 16 : 14;
    const labelSize = isAlone ? 15 : 13;
    const segLabelSize = isAlone ? 12 : 10;
    const refSize = isAlone ? 13 : 12;
    const yLabelSize = isAlone ? 14 : 13;
    const legendSize = isAlone ? 13 : 11;

    return (
        <div className="flex h-full flex-col">
            <p
                className={`mb-1 shrink-0 text-center tracking-widest text-slate-400 uppercase ${isAlone ? 'text-base' : 'text-xs'}`}
            >
                {vesselName} — Moves Per Hour by Crane
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

                        {/* Stacked bars — one segment per crane, capped at 60 with real totals labeled */}
                        {CRANES.map(({ key, color }, i) => {
                            const isFirst = i === 0;
                            const isLast = i === CRANES.length - 1;

                            return (
                                <Bar
                                    key={key}
                                    dataKey={key}
                                    stackId="moves"
                                    fill={color}
                                    isAnimationActive={false}
                                    shape={(props: BarShapeProps) => (
                                        <StackSegment
                                            x={props.x ?? 0}
                                            y={props.y ?? 0}
                                            width={props.width ?? 0}
                                            height={props.height ?? 0}
                                            fill={color}
                                            gapTop={!isFirst}
                                            gapBottom={!isLast}
                                            radius={isLast ? 4 : 0}
                                        />
                                    )}
                                >
                                    <LabelList
                                        dataKey={`${key}Raw`}
                                        position="center"
                                        content={(props: LabelProps) => {
                                            if (!props.value) {
                                                return null;
                                            }

                                            const x = Number(props.x ?? 0);
                                            const y = Number(props.y ?? 0);
                                            const width = Number(
                                                props.width ?? 0,
                                            );
                                            const height = Number(
                                                props.height ?? 0,
                                            );

                                            return (
                                                <text
                                                    x={x + width / 2}
                                                    y={y + height / 2}
                                                    dy={4}
                                                    textAnchor="middle"
                                                    fill="#ffffff"
                                                    fontSize={segLabelSize}
                                                    fontWeight={700}
                                                >
                                                    {props.value}
                                                </text>
                                            );
                                        }}
                                    />
                                    {isLast && (
                                        <LabelList
                                            dataKey="total"
                                            position="top"
                                            content={(props: LabelProps) => {
                                                if (!props.value) {
                                                    return null;
                                                }

                                                const x = Number(props.x ?? 0);
                                                const y = Number(props.y ?? 0);
                                                const width = Number(
                                                    props.width ?? 0,
                                                );

                                                return (
                                                    <text
                                                        x={x + width / 2}
                                                        y={y - 6}
                                                        textAnchor="middle"
                                                        fill="#ffffff"
                                                        fontSize={labelSize}
                                                        fontWeight={800}
                                                    >
                                                        {props.value}
                                                    </text>
                                                );
                                            }}
                                        />
                                    )}
                                </Bar>
                            );
                        })}

                        {/* 20 moves/hour threshold line */}
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

                        <Legend
                            verticalAlign="bottom"
                            height={isAlone ? 28 : 22}
                            wrapperStyle={{ fontSize: legendSize }}
                            content={() => (
                                <DefaultLegendContent
                                    payload={LEGEND_ORDER.map((key) => ({
                                        value: key,
                                        type: 'square',
                                        color: CRANE_COLORS[key],
                                    }))}
                                    formatter={(value) => (
                                        <span style={{ color: '#cbd5e1' }}>
                                            {value}
                                        </span>
                                    )}
                                />
                            )}
                        />
                    </ComposedChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
