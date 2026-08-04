import { Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { UserAccessFilters, UserRole } from '@/types/user-access';
import { roleOptions } from './role-options';

const statusOptions: { value: UserAccessFilters['status']; label: string }[] = [
    { value: '', label: 'All statuses' },
    { value: 'linked', label: 'Linked' },
    { value: 'pending', label: 'Pending' },
];

export function FiltersBar({
    search,
    onSearchChange,
    filters,
    onFilterChange,
    onClear,
}: {
    search: string;
    onSearchChange: (value: string) => void;
    filters: UserAccessFilters;
    onFilterChange: (overrides: Partial<UserAccessFilters>) => void;
    onClear: () => void;
}) {
    const hasActiveFilters =
        search !== '' || filters.role !== '' || filters.status !== '';

    return (
        <div className="mb-4 flex flex-wrap items-center gap-2">
            <div className="relative w-full sm:w-72">
                <Search className="pointer-events-none absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                <input
                    type="text"
                    value={search}
                    onChange={(e) => onSearchChange(e.target.value)}
                    placeholder="Search by name, email, or username"
                    className="w-full rounded-md border border-neutral-300 py-1.5 pr-3 pl-8 text-sm transition-colors focus:border-brand-400 focus:ring-1 focus:ring-brand-400 focus:outline-none"
                />
            </div>
            <select
                value={filters.role}
                onChange={(e) =>
                    onFilterChange({ role: e.target.value as UserRole | '' })
                }
                className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm transition-colors focus:border-brand-400 focus:ring-1 focus:ring-brand-400 focus:outline-none"
            >
                <option value="">All roles</option>
                {roleOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
            <select
                value={filters.status}
                onChange={(e) =>
                    onFilterChange({
                        status: e.target.value as UserAccessFilters['status'],
                    })
                }
                className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm transition-colors focus:border-brand-400 focus:ring-1 focus:ring-brand-400 focus:outline-none"
            >
                {statusOptions.map((option) => (
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
