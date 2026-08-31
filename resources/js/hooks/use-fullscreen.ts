import { useCallback, useEffect, useState } from 'react';

const FALLBACK_CLASS = 'fs-fallback';

// iPhone Safari never implements the Fullscreen API for regular web pages
// (iPad Safari does) — feature-detect rather than sniff the user agent, so
// this also covers any other browser lacking the API, not just iOS.
const supportsNativeFullscreen =
    typeof document !== 'undefined' &&
    typeof document.documentElement.requestFullscreen === 'function';

export function useFullscreen() {
    const [isFullscreen, setIsFullscreen] = useState(false);

    useEffect(() => {
        if (!supportsNativeFullscreen) {
            return;
        }

        const onChange = () => setIsFullscreen(!!document.fullscreenElement);
        document.addEventListener('fullscreenchange', onChange);

        return () => document.removeEventListener('fullscreenchange', onChange);
    }, []);

    const toggle = useCallback(() => {
        if (!supportsNativeFullscreen) {
            const next =
                !document.documentElement.classList.contains(FALLBACK_CLASS);
            document.documentElement.classList.toggle(FALLBACK_CLASS, next);
            setIsFullscreen(next);

            return;
        }

        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
        } else {
            document.exitFullscreen();
        }
    }, []);

    return { isFullscreen, toggle };
}
