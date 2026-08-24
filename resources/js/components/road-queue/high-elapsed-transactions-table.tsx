import { Badge } from '@/components/ui/badge';
import type { HighElapsedTransactionRow } from '@/types/road-queue-history';
import { formatDbDateTime } from './format-db-date-time';

const CATEGORY_VARIANT: Record<
    string,
    'brand' | 'danger' | 'neutral' | 'success' | 'warning'
> = {
    EXPRT: 'brand',
    IMPRT: 'danger',
    STRGE: 'neutral',
};

type HighElapsedTransactionsTableProps = {
    rows: HighElapsedTransactionRow[];
    dateColumnLabel: string;
    dateColumnKey: 'precheck_time' | 'truck_visit_entered_yard';
    showTruckingCompany?: boolean;
};

export function HighElapsedTransactionsTable({
    rows,
    dateColumnLabel,
    dateColumnKey,
    showTruckingCompany = false,
}: HighElapsedTransactionsTableProps) {
    if (rows.length === 0) {
        return (
            <p className="py-8 text-center text-sm text-neutral-500">
                No records match the current filters.
            </p>
        );
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm">
                <thead>
                    <tr className="border-b border-neutral-200 text-left text-xs tracking-wide text-neutral-500 uppercase">
                        <th className="py-2 pr-3">Container</th>
                        <th className="py-2 pr-3">Category</th>
                        {showTruckingCompany && (
                            <th className="py-2 pr-3">Trucking Co.</th>
                        )}
                        <th className="py-2 pr-3">{dateColumnLabel}</th>
                        <th className="py-2 pr-3">Elapsed</th>
                        <th className="py-2 pr-3">CHE</th>
                        <th className="py-2 pr-3">ISO Type</th>
                        <th className="py-2 pr-3">O/B Carrier</th>
                        <th className="py-2 pr-3">F.Kind</th>
                        <th className="py-2 pr-3">Line Op</th>
                        <th className="py-2 pr-3">From</th>
                        <th className="py-2 pr-3">To</th>
                        <th className="py-2 pr-3">BAT#</th>
                        <th className="py-2 pr-3">First Captured</th>
                        <th className="py-2">Last Seen</th>
                    </tr>
                </thead>
                <tbody>
                    {rows.map((row) => (
                        <tr
                            key={row.bat_nbr}
                            className="border-b border-neutral-100 hover:bg-red-50/60"
                        >
                            <td className="py-2 pr-3 font-mono">
                                {row.container || '—'}
                            </td>
                            <td className="py-2 pr-3">
                                {row.category ? (
                                    <Badge
                                        variant={
                                            CATEGORY_VARIANT[row.category] ??
                                            'neutral'
                                        }
                                    >
                                        {row.category}
                                    </Badge>
                                ) : (
                                    '—'
                                )}
                            </td>
                            {showTruckingCompany && (
                                <td className="py-2 pr-3 text-neutral-600">
                                    {row.trucking_company || '—'}
                                </td>
                            )}
                            <td className="py-2 pr-3 text-neutral-600">
                                {formatDbDateTime(row[dateColumnKey])}
                            </td>
                            <td className="py-2 pr-3 font-bold text-red-700">
                                {row.elapsed_time || '—'}
                            </td>
                            <td className="py-2 pr-3 text-neutral-600">
                                {row.assigned_che || '—'}
                            </td>
                            <td className="py-2 pr-3 text-neutral-600">
                                {row.type_iso || '—'}
                            </td>
                            <td className="py-2 pr-3 text-neutral-600">
                                {row.ob_carrier || '—'}
                            </td>
                            <td className="py-2 pr-3 text-neutral-600">
                                {row.freight_kind || '—'}
                            </td>
                            <td className="py-2 pr-3 text-neutral-600">
                                {row.line_op || '—'}
                            </td>
                            <td className="py-2 pr-3 text-neutral-600">
                                {row.pos_slot_from || '—'}
                            </td>
                            <td className="py-2 pr-3 text-neutral-600">
                                {row.pos_slot || '—'}
                            </td>
                            <td className="py-2 pr-3 font-mono text-neutral-600">
                                {row.bat_nbr || '—'}
                            </td>
                            <td className="py-2 pr-3 text-neutral-600">
                                {formatDbDateTime(row.first_captured_at)}
                            </td>
                            <td className="py-2 text-neutral-600">
                                {formatDbDateTime(row.last_seen_at)}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
