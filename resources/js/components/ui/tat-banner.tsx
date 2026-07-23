import { cn } from '@/lib/utils';

type TatMetric = {
    label: string;
    value?: string | null;
};

type TatBannerProps = {
    title: string;
    subtitle?: string | null;
    metrics: TatMetric[];
    className?: string;
};

export function TatBanner({
    title,
    subtitle,
    metrics,
    className,
}: TatBannerProps) {
    return (
        <div
            className={cn(
                'rounded-lg border border-brand-200 bg-brand-50 p-3 shadow-sm',
                className,
            )}
        >
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <span className="text-sm font-semibold tracking-wide text-brand-700 uppercase">
                        {title}
                    </span>
                    <p className="mt-0.5 text-xs text-brand-500">
                        {subtitle ?? '—'}
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-6">
                    {metrics.map((metric) => (
                        <div key={metric.label} className="text-right">
                            <div className="text-xs font-semibold tracking-wide text-brand-500 uppercase">
                                {metric.label}
                            </div>
                            <div className="text-xl font-bold text-brand-900 sm:text-2xl lg:text-3xl">
                                {metric.value ?? 'No data'}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
