import { Badge } from '@/components/ui/badge';
import type { TatHistoryRow } from '@/types/road-queue-history';
import { formatDbDateTime } from './format-db-date-time';

const STATUS_LABELS: Record<string, string> = {
    precheck_to_outgate: 'Precheck to Outgate',
    ingate_to_outgate: 'Ingate to Outgate',
};

type TatHistoryTableProps = {
    rows: TatHistoryRow[];
    showStatus?: boolean;
};

export function TatHistoryTable({
    rows,
    showStatus = false,
}: TatHistoryTableProps) {
    if (rows.length === 0) {
        return (
            <p className="py-8 text-center text-sm text-neutral-500">
                No TAT history recorded yet. Snapshots are captured
                automatically by the terminal operations system.
            </p>
        );
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm">
                <thead>
                    <tr className="border-b border-neutral-200 text-left text-xs tracking-wide text-neutral-500 uppercase">
                        <th className="py-2 pr-3">Shift</th>
                        <th className="py-2 pr-3">Shift Start</th>
                        <th className="py-2 pr-3">Shift End</th>
                        {showStatus && <th className="py-2 pr-3">Type</th>}
                        <th className="py-2 pr-3">Avg TAT</th>
                        <th className="py-2 pr-3">Seconds</th>
                        <th className="py-2">Recorded At</th>
                    </tr>
                </thead>
                <tbody>
                    {rows.map((row) => (
                        <tr
                            key={row.id}
                            className="border-b border-neutral-100 hover:bg-neutral-50"
                        >
                            <td className="py-2 pr-3">
                                <Badge
                                    variant={
                                        row.shift_label === 'Day Shift'
                                            ? 'warning'
                                            : 'brand'
                                    }
                                >
                                    {row.shift_label}
                                </Badge>
                            </td>
                            <td className="py-2 pr-3 text-neutral-600">
                                {formatDbDateTime(row.shift_start)}
                            </td>
                            <td className="py-2 pr-3 text-neutral-600">
                                {formatDbDateTime(row.shift_end)}
                            </td>
                            {showStatus && (
                                <td className="py-2 pr-3">
                                    <Badge variant="neutral">
                                        {row.status
                                            ? (STATUS_LABELS[row.status] ??
                                              row.status)
                                            : '—'}
                                    </Badge>
                                </td>
                            )}
                            <td className="py-2 pr-3 font-semibold text-neutral-900">
                                {row.avg_tat ?? '—'}
                            </td>
                            <td className="py-2 pr-3 text-neutral-600">
                                {row.avg_tat_seconds}
                            </td>
                            <td className="py-2 text-neutral-600">
                                {formatDbDateTime(row.recorded_at)}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
