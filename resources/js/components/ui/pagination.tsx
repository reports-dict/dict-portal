import { Link } from '@inertiajs/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

type PaginationProps = {
    currentPage: number;
    lastPage: number;
    getPageUrl: (page: number) => string;
    className?: string;
};

function getPageNumbers(current: number, last: number): (number | 'ellipsis')[] {
    if (last <= 7) {
        return Array.from({ length: last }, (_, i) => i + 1);
    }

    const pages = new Set<number>([1, last, current - 1, current, current + 1]);
    const sorted = [...pages]
        .filter((page) => page >= 1 && page <= last)
        .sort((a, b) => a - b);

    const result: (number | 'ellipsis')[] = [];
    let previous: number | null = null;

    for (const page of sorted) {
        if (previous !== null && page - previous > 1) {
            result.push('ellipsis');
        }
        result.push(page);
        previous = page;
    }

    return result;
}

export function Pagination({
    currentPage,
    lastPage,
    getPageUrl,
    className,
}: PaginationProps) {
    if (lastPage <= 1) {
        return null;
    }

    return (
        <nav
            aria-label="Pagination"
            className={cn('flex items-center gap-1', className)}
        >
            <Link
                href={getPageUrl(Math.max(1, currentPage - 1))}
                preserveState
                aria-disabled={currentPage === 1}
                className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-md text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900',
                    currentPage === 1 && 'pointer-events-none opacity-40',
                )}
            >
                <ChevronLeft className="h-4 w-4" />
            </Link>

            {getPageNumbers(currentPage, lastPage).map((page, index) =>
                page === 'ellipsis' ? (
                    <span
                        key={`ellipsis-${index}`}
                        className="px-1.5 text-sm text-neutral-400"
                    >
                        …
                    </span>
                ) : (
                    <Link
                        key={page}
                        href={getPageUrl(page)}
                        preserveState
                        className={cn(
                            'flex h-8 w-8 items-center justify-center rounded-md text-sm font-medium transition-colors',
                            page === currentPage
                                ? 'bg-brand-600 text-white'
                                : 'text-neutral-600 hover:bg-neutral-100',
                        )}
                    >
                        {page}
                    </Link>
                ),
            )}

            <Link
                href={getPageUrl(Math.min(lastPage, currentPage + 1))}
                preserveState
                aria-disabled={currentPage === lastPage}
                className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-md text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900',
                    currentPage === lastPage && 'pointer-events-none opacity-40',
                )}
            >
                <ChevronRight className="h-4 w-4" />
            </Link>
        </nav>
    );
}
