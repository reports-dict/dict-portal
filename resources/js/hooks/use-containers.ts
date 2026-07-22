import { useEffect, useState } from 'react';
import { containerYardApi } from '@/lib/container-yard-api';
import type { Container } from '@/types/container-yard';

export function useContainers(blockName: string | null = null) {
    const [containers, setContainers] = useState<Container[]>([]);
    const [loading, setLoading] = useState(!!blockName);
    const [error, setError] = useState<string | null>(null);

    const loadContainers = async () => {
        try {
            setLoading(true);
            setError(null);

            const filters = blockName
                ? { block: blockName, per_page: 1000 }
                : {};
            const response = await containerYardApi.getContainers(filters);

            setContainers(response.data ?? []);
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : 'Failed to load containers',
            );
            console.error('Error loading containers:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (blockName) {
            // Initial fetch of the external containers source for the selected block.
            // eslint-disable-next-line react-hooks/set-state-in-effect
            loadContainers();
        } else {
            setContainers([]);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [blockName]);

    return {
        containers,
        loading,
        error,
        reload: loadContainers,
    };
}
