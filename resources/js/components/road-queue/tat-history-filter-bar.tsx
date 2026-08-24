import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { RoadQueueHistoryFilters } from '@/types/road-queue-history';

const shiftOptions = [
    { value: '', label: 'All shifts' },
    { value: 'Day Shift', label: 'Day Shift' },
    { value: 'Night Shift', label: 'Night Shift' },
];

const statusOptions = [
    { value: '', label: 'All types' },
    { value: 'precheck_to_outgate', label: 'Precheck to Outgate' },
    { value: 'ingate_to_outgate', label: 'Ingate to Outgate' },
];

type TatHistoryFilterBarProps = {
    filters: RoadQueueHistoryFilters;
    onFilterChange: (overrides: Partial<RoadQueueHistoryFilters>) => void;
    onClear: () => void;
    showStatus?: boolean;
};

export function TatHistoryFilterBar({
    filters,
    onFilterChange,
    onClear,
    showStatus = false,
}: TatHistoryFilterBarProps) {
    const hasActiveFilters =
        filters.tat_shift !== '' ||
        filters.tat_status !== '' ||
        filters.tat_from !== '' ||
        filters.tat_to !== '';

    return (
        <div className="mb-4 flex flex-wrap items-center gap-2">
            <select
                value={filters.tat_shift}
                onChange={(e) => onFilterChange({ tat_shift: e.target.value })}
                className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm transition-colors focus:border-brand-400 focus:ring-1 focus:ring-brand-400 focus:outline-none"
            >
                {shiftOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
            {showStatus && (
                <select
                    value={filters.tat_status}
                    onChange={(e) =>
                        onFilterChange({ tat_status: e.target.value })
                    }
                    className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm transition-colors focus:border-brand-400 focus:ring-1 focus:ring-brand-400 focus:outline-none"
                >
                    {statusOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>
            )}
            <input
                type="date"
                value={filters.tat_from}
                onChange={(e) => onFilterChange({ tat_from: e.target.value })}
                className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm transition-colors focus:border-brand-400 focus:ring-1 focus:ring-brand-400 focus:outline-none"
            />
            <span className="text-sm text-neutral-400">to</span>
            <input
                type="date"
                value={filters.tat_to}
                onChange={(e) => onFilterChange({ tat_to: e.target.value })}
                className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm transition-colors focus:border-brand-400 focus:ring-1 focus:ring-brand-400 focus:outline-none"
            />
            {hasActiveFilters && (
                <Button variant="secondary" size="sm" onClick={onClear}>
                    <X className="h-3.5 w-3.5" />
                    Clear filters
                </Button>
            )}
        </div>
    );
}
