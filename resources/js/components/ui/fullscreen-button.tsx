import { cn } from '@/lib/utils';
import { Maximize2, Minimize2 } from 'lucide-react';

type FullscreenButtonProps = {
    isFullscreen: boolean;
    onToggle: () => void;
    variant?: 'light' | 'dark';
    className?: string;
};

const variantClasses: Record<NonNullable<FullscreenButtonProps['variant']>, string> = {
    light: 'border-neutral-300 bg-white text-neutral-700 hover:border-brand-400 hover:text-brand-700',
    dark: 'border-white/15 bg-white/5 text-neutral-200 hover:border-brand-400/60 hover:text-white',
};

export function FullscreenButton({
    isFullscreen,
    onToggle,
    variant = 'light',
    className,
}: FullscreenButtonProps) {
    const Icon = isFullscreen ? Minimize2 : Maximize2;

    return (
        <button
            type="button"
            onClick={onToggle}
            className={cn(
                'flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors',
                variantClasses[variant],
                className,
            )}
            title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
        >
            <Icon className="h-4 w-4" />
            <span>{isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}</span>
        </button>
    );
}
