import { useEffect, useState } from 'react';
import { containerYardApi } from '@/lib/container-yard-api';
import type { Block } from '@/types/container-yard';

export function useBlocks() {
    const [blocks, setBlocks] = useState<Block[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadBlocks = async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await containerYardApi.getBlocks();
            setBlocks(response.data ?? []);
        } catch (err) {
            setError(
                err instanceof Error ? err.message : 'Failed to load blocks',
            );
            console.error('Error loading blocks:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Initial fetch of the external blocks source.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        loadBlocks();
    }, []);

    return {
        blocks,
        loading,
        error,
        reload: loadBlocks,
    };
}
