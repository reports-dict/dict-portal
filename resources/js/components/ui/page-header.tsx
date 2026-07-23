import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

type PageHeaderProps = {
    title: string;
    subtitle?: string;
    icon?: LucideIcon;
    actions?: ReactNode;
    variant?: 'light' | 'dark';
    className?: string;
};

export function PageHeader({
    title,
    subtitle,
    icon: Icon,
    actions,
    variant = 'light',
    className,
}: PageHeaderProps) {
    const isDark = variant === 'dark';

    return (
        <div
            className={cn(
                'flex flex-wrap items-start justify-between gap-4',
                className,
            )}
        >
            <div className="flex items-start gap-3">
                {Icon && (
                    <div
                        className={cn(
                            'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg sm:h-10 sm:w-10',
                            isDark
                                ? 'bg-white/10 text-brand-400'
                                : 'bg-brand-50 text-brand-600',
                        )}
                    >
                        <Icon className="h-5 w-5" />
                    </div>
                )}
                <div>
                    <h1
                        className={cn(
                            'text-xl font-bold sm:text-2xl',
                            isDark ? 'text-white' : 'text-neutral-900',
                        )}
                    >
                        {title}
                    </h1>
                    {subtitle && (
                        <p
                            className={cn(
                                'mt-1 text-sm',
                                isDark
                                    ? 'text-neutral-400'
                                    : 'text-neutral-500',
                            )}
                        >
                            {subtitle}
                        </p>
                    )}
                </div>
            </div>
            {actions && (
                <div className="flex flex-shrink-0 items-center gap-3">
                    {actions}
                </div>
            )}
        </div>
    );
}
