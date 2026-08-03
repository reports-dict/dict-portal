import { Head, router } from '@inertiajs/react';
import { ChevronDown, MapPinned } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { FullscreenButton } from '@/components/ui/fullscreen-button';
import { PageHeader } from '@/components/ui/page-header';
import { RoadQueueTruckLoader } from '@/components/ui/road-queue-truck-loader';
import { TatBanner } from '@/components/ui/tat-banner';
import { useFullscreen } from '@/hooks/use-fullscreen';
import PortalLayout from '@/layouts/portal-layout';
import type { RoadQueueRow } from '@/types/road-queue';

type SortDirection = 'asc' | 'desc';

type RoadQueueProps = {
    roadQueues?: RoadQueueRow[];
    error?: string | null;
    debug_error?: string | null;
    tatPrecheckToOutgate?: string | null;
    tatIngateToOutgate?: string | null;
    shiftLabel?: string | null;
    shiftRange?: string | null;
};

const columns: {
    key: keyof RoadQueueRow;
    label: string;
    alwaysVisible: boolean;
}[] = [
    { key: 'container', label: 'Container', alwaysVisible: true },
    { key: 'category', label: 'Category', alwaysVisible: true },
    { key: 'precheck_time', label: 'Precheck Time', alwaysVisible: true },
    { key: 'elapsed_time', label: 'Elapsed Time', alwaysVisible: true },
    { key: 'assigned_che', label: 'Assigned CHE', alwaysVisible: false },
    { key: 'type_iso', label: 'ISO Type', alwaysVisible: true },
    { key: 'ob_carrier', label: 'O/B CARRIER', alwaysVisible: false },
    { key: 'freight_kind', label: 'F.Kind', alwaysVisible: true },
    { key: 'line_op', label: 'Line Op', alwaysVisible: true },
    { key: 'pos_slot_from', label: 'FROM', alwaysVisible: false },
    { key: 'pos_slot', label: 'TO', alwaysVisible: false },
    { key: 'bat_nbr', label: 'BAT#', alwaysVisible: false },
];

const summaryColumns = columns.filter((col) => col.alwaysVisible);
const detailColumns = columns.filter((col) => !col.alwaysVisible);

function formatTime(date: Date) {
    return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
    });
}

function formatDateTime(value: string | number | null | undefined) {
    if (!value) {
        return '-';
    }

    try {
        const date = new Date(value);

        return date.toLocaleString('en-US', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
        });
    } catch {
        return String(value);
    }
}

function getFreightKindColor(value: string | number | null | undefined) {
    if (value === 'MTY') {
        return 'bg-violet-100 text-violet-800 font-semibold';
    }

    if (value === 'FCL') {
        return 'bg-red-100 text-red-800 font-semibold';
    }

    return '';
}

function getCategoryColor(value: string | number | null | undefined) {
    if (value === 'EXPRT') {
        return 'bg-cyan-600 text-white font-semibold';
    }

    if (value === 'IMPRT') {
        return 'bg-red-600 text-white font-semibold';
    }

    return '';
}

function getCellClassName(col: (typeof columns)[number], item: RoadQueueRow) {
    if (col.key === 'freight_kind') {
        return `${getFreightKindColor(item[col.key])} rounded-md px-3 py-2`;
    }

    if (col.key === 'container' || col.key === 'category') {
        return `${getCategoryColor(item['category'])} rounded-md px-3 py-2`;
    }

    if (col.key === 'pos_slot_from' || col.key === 'pos_slot') {
        return 'font-bold text-neutral-900';
    }

    return 'text-neutral-900';
}

function getCellValue(col: (typeof columns)[number], item: RoadQueueRow) {
    if (col.key === 'precheck_time') {
        return formatDateTime(item[col.key]);
    }

    return item[col.key] ?? '-';
}

function isElapsedTimeGreaterOrEqualOneHour(
    elapsedTimeStr: string | number | null | undefined,
) {
    if (!elapsedTimeStr) {
        return false;
    }

    const str = String(elapsedTimeStr);
    const dayMatch = str.match(/(\d+)D/);
    const hourMatch = str.match(/(\d+)H/);
    const days = dayMatch ? parseInt(dayMatch[1]) : 0;
    const hours = hourMatch ? parseInt(hourMatch[1]) : 0;

    return days > 0 || hours >= 1;
}

function SortIndicator({
    active,
    direction,
}: {
    active: boolean;
    direction: SortDirection;
}) {
    if (!active) {
        return null;
    }

    return <span className="ml-2">{direction === 'asc' ? '▲' : '▼'}</span>;
}

function RoadQueueCard({
    item,
    index,
    isExpanded,
    onToggle,
}: {
    item: RoadQueueRow;
    index: number;
    isExpanded: boolean;
    onToggle: () => void;
}) {
    const highlighted = isElapsedTimeGreaterOrEqualOneHour(item.elapsed_time);

    return (
        <div
            className={`overflow-hidden rounded-lg border shadow-sm ${
                highlighted
                    ? 'border-red-300 bg-red-50'
                    : 'border-neutral-200 bg-white'
            }`}
        >
            <button
                type="button"
                onClick={onToggle}
                aria-expanded={isExpanded}
                className="flex w-full items-start justify-between gap-3 p-3 text-left"
            >
                <div className="grid flex-1 grid-cols-2 gap-x-3 gap-y-1.5">
                    <div className="col-span-2 text-xs font-semibold text-neutral-400">
                        #{index + 1}
                    </div>
                    {summaryColumns.map((col) => (
                        <div key={col.key}>
                            <div className="text-[11px] font-semibold tracking-wide text-neutral-500 uppercase">
                                {col.label}
                            </div>
                            <div
                                className={`inline-block text-sm font-bold ${getCellClassName(col, item)}`}
                            >
                                {getCellValue(col, item)}
                            </div>
                        </div>
                    ))}
                </div>
                <ChevronDown
                    className={`mt-1 h-5 w-5 flex-shrink-0 text-neutral-400 transition-transform ${
                        isExpanded ? 'rotate-180' : ''
                    }`}
                />
            </button>
            {isExpanded && (
                <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 border-t border-neutral-200 bg-neutral-50 p-3">
                    {detailColumns.map((col) => (
                        <div key={col.key}>
                            <div className="text-[11px] font-semibold tracking-wide text-neutral-500 uppercase">
                                {col.label}
                            </div>
                            <div
                                className={`inline-block text-sm font-bold ${getCellClassName(col, item)}`}
                            >
                                {getCellValue(col, item)}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

function RoadQueue({
    roadQueues = [],
    error = null,
    debug_error = null,
    tatPrecheckToOutgate = null,
    tatIngateToOutgate = null,
    shiftLabel = null,
    shiftRange = null,
}: RoadQueueProps) {
    const [sortField, setSortField] = useState<keyof RoadQueueRow | null>(null);
    const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
    const [lastUpdated] = useState(new Date());
    const [secondsUntilRefresh, setSecondsUntilRefresh] = useState(60);
    const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
    const [fetching, setFetching] = useState(false);
    const { isFullscreen, toggle: toggleFullscreen } = useFullscreen();

    useEffect(() => {
        const refreshInterval = 60000;

        const timer = setInterval(() => {
            router.reload({
                onStart: () => setFetching(true),
                onFinish: () => setFetching(false),
            });
        }, refreshInterval);

        const countdownTimer = setInterval(() => {
            setSecondsUntilRefresh((prev) => (prev <= 1 ? 60 : prev - 1));
        }, 1000);

        return () => {
            clearInterval(timer);
            clearInterval(countdownTimer);
        };
    }, []);

    const handleSort = (field: keyof RoadQueueRow) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
    };

    const handleRefresh = () => {
        router.reload({
            onStart: () => setFetching(true),
            onFinish: () => setFetching(false),
        });
    };

    const toggleRowExpanded = (index: number) => {
        setExpandedRows((prev) => {
            const next = new Set(prev);

            if (next.has(index)) {
                next.delete(index);
            } else {
                next.add(index);
            }

            return next;
        });
    };

    const sortedData = useMemo(() => {
        if (!sortField) {
            return roadQueues;
        }

        return [...roadQueues].sort((a, b) => {
            const aValue = a[sortField] ?? '';
            const bValue = b[sortField] ?? '';
            const aNum = parseFloat(String(aValue));
            const bNum = parseFloat(String(bValue));
            const comparison =
                !isNaN(aNum) && !isNaN(bNum)
                    ? aNum - bNum
                    : String(aValue).localeCompare(String(bValue));

            return sortDirection === 'asc' ? comparison : -comparison;
        });
    }, [roadQueues, sortField, sortDirection]);

    if (error) {
        return (
            <div className="min-h-full bg-red-50 px-1 py-2 sm:px-2 lg:px-3">
                <Head title="XPS Road Queue TERMINAL" />
                <div className="w-full">
                    <div className="rounded border-2 border-red-400 bg-red-100 p-4">
                        <h1 className="mb-2 text-2xl font-bold text-red-800">
                            ⚠ Connection Error — Auto-retrying in{' '}
                            {secondsUntilRefresh}s
                        </h1>
                        <p className="mb-2 text-base text-red-700">
                            Unable to connect to the database. The page will
                            automatically retry.
                        </p>
                        {debug_error && (
                            <details className="mt-2 rounded border border-red-200 bg-white p-2 text-sm text-red-600">
                                <summary className="cursor-pointer font-semibold">
                                    Debug Information
                                </summary>
                                <pre className="mt-1 overflow-auto text-xs">
                                    {debug_error}
                                </pre>
                            </details>
                        )}
                        <button
                            onClick={handleRefresh}
                            className="mt-2 rounded bg-red-600 px-3 py-1 text-base font-bold text-white hover:bg-red-700"
                        >
                            Retry Now
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (roadQueues.length === 0) {
        return (
            <div className="min-h-full bg-neutral-50 px-1 py-2 sm:px-2 lg:px-3">
                <Head title="XPS Road Queue TERMINAL" />
                <div className="w-full">
                    <TatBanner
                        title={`Previous Shift TAT — ${shiftLabel ?? '—'}`}
                        subtitle={shiftRange}
                        metrics={[
                            {
                                label: 'Precheck To Outgate',
                                value: tatPrecheckToOutgate,
                            },
                            {
                                label: 'Ingate To Outgate',
                                value: tatIngateToOutgate,
                            },
                        ]}
                        className="mb-2"
                    />
                    <div className="rounded border border-yellow-200 bg-yellow-50 p-3">
                        <h1 className="mb-2 text-xl font-bold text-yellow-800">
                            No active gate transactions as of the last refresh
                            time. Next refresh in {secondsUntilRefresh}s.
                        </h1>
                        <button
                            onClick={handleRefresh}
                            className="mt-2 rounded bg-yellow-600 px-3 py-1 text-base font-bold text-white hover:bg-yellow-700"
                        >
                            Refresh
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <>
            <Head title="XPS Road Queue TERMINAL" />
            <div className="min-h-full bg-neutral-50 px-1 py-2 sm:px-2 lg:px-3">
                <div className="w-full">
                    <PageHeader
                        title="XPS Road Queue TERMINAL"
                        subtitle="View and manage planned deliveries and receipts"
                        icon={MapPinned}
                        className="mb-2"
                        actions={
                            <div className="flex flex-col items-end gap-2 sm:flex-row sm:items-center sm:gap-3">
                                <div className="text-right text-sm leading-snug">
                                    <div>
                                        <span className="font-semibold text-brand-700">
                                            Last Updated:{' '}
                                        </span>
                                        <span className="text-brand-600">
                                            {formatTime(lastUpdated)}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="font-semibold text-brand-700">
                                            Next Refresh:{' '}
                                        </span>
                                        <span className="font-semibold text-brand-600">
                                            {secondsUntilRefresh}s
                                        </span>
                                    </div>
                                </div>
                                <FullscreenButton
                                    isFullscreen={isFullscreen}
                                    onToggle={toggleFullscreen}
                                />
                            </div>
                        }
                    />

                    <RoadQueueTruckLoader
                        secondsRemaining={secondsUntilRefresh}
                        fetching={fetching}
                    />

                    <TatBanner
                        title={`Previous Shift TAT — ${shiftLabel ?? '—'}`}
                        subtitle={shiftRange}
                        metrics={[
                            {
                                label: 'Precheck To Outgate',
                                value: tatPrecheckToOutgate,
                            },
                            {
                                label: 'Ingate To Outgate',
                                value: tatIngateToOutgate,
                            },
                        ]}
                        className="mb-2"
                    />

                    <div className="mb-1 text-sm text-neutral-600">
                        Showing {sortedData.length} of {roadQueues.length}{' '}
                        records
                    </div>

                    <div className="mb-2 flex items-center gap-2 lg:hidden">
                        <label
                            htmlFor="road-queue-sort"
                            className="text-xs font-semibold whitespace-nowrap text-neutral-600"
                        >
                            Sort by
                        </label>
                        <select
                            id="road-queue-sort"
                            value={sortField ?? ''}
                            onChange={(e) => {
                                const value = e.target.value as
                                    keyof RoadQueueRow | '';
                                setSortField(value === '' ? null : value);
                                setSortDirection('asc');
                            }}
                            className="flex-1 rounded border border-neutral-300 bg-white px-2 py-1 text-sm text-neutral-900"
                        >
                            <option value="">Default order</option>
                            {columns.map((col) => (
                                <option key={col.key} value={col.key}>
                                    {col.label}
                                </option>
                            ))}
                        </select>
                        <button
                            type="button"
                            onClick={() =>
                                setSortDirection((prev) =>
                                    prev === 'asc' ? 'desc' : 'asc',
                                )
                            }
                            aria-label="Toggle sort direction"
                            className="rounded border border-neutral-300 bg-white px-2 py-1 text-sm text-neutral-700 hover:bg-neutral-50"
                        >
                            {sortDirection === 'asc' ? '▲' : '▼'}
                        </button>
                    </div>

                    <div className="hidden overflow-hidden rounded-lg bg-white shadow lg:block">
                        <div className="overflow-x-auto">
                            <table className="w-full divide-y divide-neutral-200">
                                <thead className="border-b-2 border-neutral-300 bg-neutral-100">
                                    <tr>
                                        <th className="w-8 px-1 py-1 text-left text-xl font-bold tracking-tight text-neutral-700 uppercase">
                                            #
                                        </th>
                                        {columns.map((col) => (
                                            <th
                                                key={col.key}
                                                className="cursor-pointer px-1 py-1 text-left text-xl font-bold tracking-tight text-neutral-700 uppercase transition hover:bg-neutral-200"
                                                onClick={() =>
                                                    handleSort(col.key)
                                                }
                                            >
                                                <div className="flex items-center">
                                                    {col.label}
                                                    <SortIndicator
                                                        active={
                                                            sortField ===
                                                            col.key
                                                        }
                                                        direction={
                                                            sortDirection
                                                        }
                                                    />
                                                </div>
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-neutral-200">
                                    {sortedData.map((item, idx) => (
                                        <tr
                                            key={idx}
                                            className={`transition duration-150 ${
                                                isElapsedTimeGreaterOrEqualOneHour(
                                                    item.elapsed_time,
                                                )
                                                    ? 'bg-red-200 hover:bg-red-300'
                                                    : 'hover:bg-brand-50'
                                            }`}
                                        >
                                            <td className="w-8 bg-neutral-50 px-1 py-1 text-xl font-bold text-neutral-700">
                                                {idx + 1}
                                            </td>
                                            {columns.map((col) => (
                                                <td
                                                    key={`${idx}-${col.key}`}
                                                    className={`px-1 py-1 text-xl font-bold whitespace-nowrap ${getCellClassName(col, item)}`}
                                                >
                                                    {getCellValue(col, item)}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="flex flex-col gap-2 lg:hidden">
                        {sortedData.map((item, idx) => (
                            <RoadQueueCard
                                key={idx}
                                item={item}
                                index={idx}
                                isExpanded={expandedRows.has(idx)}
                                onToggle={() => toggleRowExpanded(idx)}
                            />
                        ))}
                    </div>

                    <div className="mt-1 text-center text-xs text-neutral-500">
                        <p className="hidden lg:block">
                            Click column headers to sort • Auto-refresh every 60
                            seconds
                        </p>
                        <p className="lg:hidden">
                            Tap a record to see more • Auto-refresh every 60
                            seconds
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
}

RoadQueue.layout = (page: ReactNode) => <PortalLayout>{page}</PortalLayout>;

export default RoadQueue;
