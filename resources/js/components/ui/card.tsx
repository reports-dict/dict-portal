import { cn } from '@/lib/utils';
import type { HTMLAttributes } from 'react';

type CardProps = HTMLAttributes<HTMLDivElement> & {
    /**
     * Bakes in hover/press/keyboard-focus feedback for cards wrapped in a
     * `group`-marked interactive ancestor (e.g. a `<Link>`). Focus doesn't
     * propagate to descendants the way hover/active do, hence the explicit
     * `group-focus-visible:` variants mirroring the hover treatment.
     */
    interactive?: boolean;
};

export function Card({ className, interactive, ...props }: CardProps) {
    return (
        <div
            className={cn(
                'rounded-lg border border-neutral-200 bg-white p-6 shadow-sm',
                interactive
                    ? 'transition-all duration-150 hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-md active:translate-y-0 active:shadow-sm group-focus-visible:-translate-y-0.5 group-focus-visible:border-brand-300 group-focus-visible:shadow-md'
                    : 'transition-colors hover:border-brand-300',
                className,
            )}
            {...props}
        />
    );
}
