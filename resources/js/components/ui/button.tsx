import { cn } from '@/lib/utils';
import type { ButtonHTMLAttributes } from 'react';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: 'primary' | 'secondary' | 'ghost';
    size?: 'sm' | 'md';
};

const variantClasses: Record<NonNullable<ButtonProps['variant']>, string> = {
    primary: 'bg-brand-600 text-white hover:bg-brand-500',
    secondary:
        'border border-neutral-300 bg-white text-neutral-700 hover:border-brand-400 hover:text-brand-700',
    ghost: 'text-neutral-300 hover:bg-white/5 hover:text-white',
};

const sizeClasses: Record<NonNullable<ButtonProps['size']>, string> = {
    sm: 'gap-1.5 rounded-md px-3 py-1.5 text-sm',
    md: 'gap-2 rounded-lg px-4 py-2.5 text-sm',
};

export function Button({
    variant = 'primary',
    size = 'md',
    className,
    ...props
}: ButtonProps) {
    return (
        <button
            className={cn(
                'inline-flex items-center justify-center font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50',
                variantClasses[variant],
                sizeClasses[size],
                className,
            )}
            {...props}
        />
    );
}
