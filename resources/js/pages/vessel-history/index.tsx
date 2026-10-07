import { Head, router } from '@inertiajs/react';
import { History, X } from 'lucide-react';
import { useState } from 'react';
import type { ReactNode } from 'react';
import VesselHistoryController from '@/actions/App/Http/Controllers/VesselHistory/VesselHistoryController';
import { Card } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import VesselCard from '@/components/vessel-dashboard/vessel-card';
import PortalLayout from '@/layouts/portal-layout';
import type { Vessel } from '@/types/vessel-dashboard';
import type {
    VesselHistoryFilters,
    VesselHistoryRow,
} from '@/types/vessel-history';

type VesselHistoryIndexProps = {
    vessels: VesselHistoryRow[];
    filters: VesselHistoryFilters;
};

function VesselHistoryIndex({ vessels, filters }: VesselHistoryIndexProps) {
    const [month, setMonth] = useState(filters.month);
    const [date, setDate] = useState(filters.date);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [selected, setSelected] = useState<Vessel | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    function navigate(overrides: Partial<VesselHistoryFilters>) {
        const next = { month, date, ...overrides };

        router.get(
            VesselHistoryController.index.url({
                query: Object.fromEntries(
                    Object.entries(next).filter(([, value]) => value !== ''),
                ),
            }),
            {},
            { preserveState: true, preserveScroll: true, replace: true },
        );
    }

    function handleMonthChange(value: string) {
        setMonth(value);
        setDate('');
        navigate({ month: value, date: '' });
    }

    function handleDateChange(value: string) {
        setDate(value);

        // Picking a date implies its own month, so keep the month field in
        // sync rather than leaving it pointed at a now-contradictory value.
        const impliedMonth = value ? value.slice(0, 7) : month;
        setMonth(impliedMonth);
        navigate({ date: value, month: impliedMonth });
    }

    async function selectVessel(row: VesselHistoryRow) {
        setSelectedId(row.ob_ib_id);
        setSelected(null);
        setError(null);
        setLoading(true);

        try {
            const response = await fetch(
                VesselHistoryController.show.url(row.ob_ib_id),
            );

            if (!response.ok) {
                throw new Error('Request failed');
            }

            const payload = (await response.json()) as { vessel: Vessel };
            setSelected(payload.vessel);
        } catch {
            setError('Failed to load vessel detail.');
        } finally {
            setLoading(false);
        }
    }

    const fmtDate = (dt: string | null) =>
        dt ? new Date(dt).toLocaleString() : '—';

    function closeDetail() {
        setSelectedId(null);
        setSelected(null);
        setError(null);
    }

    return (
        <>
            <Head title="Vessel History" />
            <div className="min-h-full space-y-6 bg-neutral-50 p-4 sm:p-6">
                <PageHeader
                    icon={History}
                    title="Vessel History"
                    subtitle="Browse departed/closed vessel visits by month and view their full operations history."
                />

                <Card>
                    <div className="mb-4 flex flex-wrap items-start gap-3 sm:items-center sm:gap-4">
                        <label className="flex flex-col gap-1 text-sm text-neutral-600 sm:flex-row sm:items-center sm:gap-2">
                            Month
                            <input
                                type="month"
                                value={month}
                                onChange={(e) =>
                                    handleMonthChange(e.target.value)
                                }
                                className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm transition-colors focus:border-brand-400 focus:ring-1 focus:ring-brand-400 focus:outline-none"
                            />
                        </label>
                        <label className="flex flex-col gap-1 text-sm text-neutral-600 sm:flex-row sm:items-center sm:gap-2">
                            Date
                            <input
                                type="date"
                                value={date}
                                onChange={(e) =>
                                    handleDateChange(e.target.value)
                                }
                                className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm transition-colors focus:border-brand-400 focus:ring-1 focus:ring-brand-400 focus:outline-none"
                            />
                        </label>
                        {date !== '' && (
                            <button
                                type="button"
                                onClick={() => handleDateChange('')}
                                className="self-start text-sm font-medium text-brand-600 hover:underline sm:self-center"
                            >
                                Clear date
                            </button>
                        )}
                    </div>

                    {vessels.length === 0 ? (
                        <p className="py-8 text-center text-sm text-neutral-500">
                            No departed vessels found for this{' '}
                            {date !== '' ? 'date' : 'month'}.
                        </p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead>
                                    <tr className="border-b border-neutral-200 text-xs tracking-wide text-neutral-500 uppercase">
                                        <th className="py-2 pr-3">
                                            Date (ATA)
                                        </th>
                                        <th className="py-2 pr-3">Vessel</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {vessels.map((row) => (
                                        <tr
                                            key={row.ob_ib_id}
                                            onClick={() => selectVessel(row)}
                                            className={`cursor-pointer border-b border-neutral-100 hover:bg-neutral-50 ${
                                                selectedId === row.ob_ib_id
                                                    ? 'bg-brand-50'
                                                    : ''
                                            }`}
                                        >
                                            <td className="py-2 pr-3 text-neutral-600">
                                                {fmtDate(
                                                    row.actual_time_of_arrival,
                                                )}
                                            </td>
                                            <td className="py-2 pr-3 font-semibold text-neutral-900">
                                                {row.vessel_name} (
                                                {row.vessel_id})
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </Card>

                {selectedId && (
                    <div className="rounded-xl p-3 sm:p-4">
                        <div className="mb-2 flex items-center justify-between">
                            <p className="text-sm font-medium text-neutral-500">
                                Vessel Detail
                            </p>
                            <button
                                type="button"
                                onClick={closeDetail}
                                className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-sm font-medium text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700"
                            >
                                <X className="h-4 w-4" />
                                Close
                            </button>
                        </div>
                        {loading && (
                            <p className="py-10 text-center text-sm text-slate-400">
                                Loading vessel detail…
                            </p>
                        )}
                        {!loading && error && (
                            <p className="py-10 text-center text-sm text-red-400">
                                {error}
                            </p>
                        )}
                        {!loading && !error && selected && (
                            <div className="h-auto lg:h-[32rem]">
                                <VesselCard
                                    vessel={selected}
                                    isAlone
                                    hideElapsed
                                    forceChartScroll
                                />
                            </div>
                        )}
                    </div>
                )}
            </div>
        </>
    );
}

VesselHistoryIndex.layout = (page: ReactNode) => (
    <PortalLayout>{page}</PortalLayout>
);

export default VesselHistoryIndex;
