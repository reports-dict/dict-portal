import { cn } from '@/lib/utils';

type CurrentShiftBannerProps = {
    label: string | null;
    count: number | null;
    className?: string;
};

export function CurrentShiftBanner({
    label,
    count,
    className,
}: CurrentShiftBannerProps) {
    return (
        <div
            className={cn(
                'flex items-center gap-2 rounded border border-green-200 bg-green-50 px-2 py-1 sm:px-3 sm:py-1.5',
                className,
            )}
        >
            <span className="inline-block h-2.5 w-2.5 animate-pulse rounded-full bg-green-500" />
            <span className="text-xs font-semibold tracking-wide text-green-700 uppercase sm:text-sm">
                {label ?? 'Current Shift'}:
            </span>
            <span className="text-xl font-bold text-green-800 sm:text-2xl lg:text-3xl">
                {count ?? '—'}
            </span>
        </div>
    );
}
