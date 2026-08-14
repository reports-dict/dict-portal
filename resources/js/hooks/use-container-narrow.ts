import { useEffect, useState } from 'react';
import type { RefObject } from 'react';

// Measures the ref'd element's own rendered width via ResizeObserver, rather
// than the browser viewport (see use-narrow-viewport.ts) — needed for layouts
// like the vessel card where sidebar/chrome can shrink the available width
// well below the viewport, which viewport-based matchMedia can't detect.
export function useContainerNarrow(
    ref: RefObject<HTMLElement | null>,
    breakpoint = 1024,
) {
    const [isNarrow, setIsNarrow] = useState(true);

    useEffect(() => {
        const el = ref.current;

        if (!el) {
            return;
        }

        const observer = new ResizeObserver(([entry]) => {
            setIsNarrow(entry.contentRect.width < breakpoint);
        });
        observer.observe(el);

        return () => observer.disconnect();
    }, [ref, breakpoint]);

    return isNarrow;
}
