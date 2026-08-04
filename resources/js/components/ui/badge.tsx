import { cn } from '@/lib/utils';
import type { HTMLAttributes } from 'react';

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
    variant?: 'neutral' | 'brand' | 'success' | 'warning' | 'danger';
};

const variantClasses: Record<NonNullable<BadgeProps['variant']>, string> = {
    neutral: 'bg-neutral-100 text-neutral-700',
    brand: 'bg-brand-100 text-brand-800',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    danger: 'bg-red-100 text-red-800',
};

export function Badge({ variant = 'neutral', className, ...props }: BadgeProps) {
    return (
        <span
            className={cn(
                'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold',
                variantClasses[variant],
                className,
            )}
            {...props}
        />
    );
}
