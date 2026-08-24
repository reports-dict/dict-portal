import { Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export type TransactionsFilters = {
    tx_container: string;
    tx_category: string;
};

type TransactionsFilterBarProps = {
    container: string;
    onContainerChange: (value: string) => void;
    filters: TransactionsFilters;
    onFilterChange: (overrides: Partial<TransactionsFilters>) => void;
    onClear: () => void;
    categoryOptions: { value: string; label: string }[];
};

export function TransactionsFilterBar({
    container,
    onContainerChange,
    filters,
    onFilterChange,
    onClear,
    categoryOptions,
}: TransactionsFilterBarProps) {
    const hasActiveFilters = container !== '' || filters.tx_category !== '';

    return (
        <div className="mb-4 flex flex-wrap items-center gap-2">
            <div className="relative w-full sm:w-56">
                <Search className="pointer-events-none absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                <input
                    type="text"
                    value={container}
                    onChange={(e) => onContainerChange(e.target.value)}
                    placeholder="Search container"
                    className="w-full rounded-md border border-neutral-300 py-1.5 pr-3 pl-8 text-sm transition-colors focus:border-brand-400 focus:ring-1 focus:ring-brand-400 focus:outline-none"
                />
            </div>
            <select
                value={filters.tx_category}
                onChange={(e) =>
                    onFilterChange({ tx_category: e.target.value })
                }
                className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm transition-colors focus:border-brand-400 focus:ring-1 focus:ring-brand-400 focus:outline-none"
            >
                <option value="">All categories</option>
                {categoryOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
            {hasActiveFilters && (
                <Button variant="secondary" size="sm" onClick={onClear}>
                    <X className="h-3.5 w-3.5" />
                    Clear filters
                </Button>
            )}
        </div>
    );
}
