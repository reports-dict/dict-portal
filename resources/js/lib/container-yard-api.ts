import type {
    Allocation,
    ApiListResponse,
    Block,
    Container,
    LiveSearchResponse,
} from '@/types/container-yard';

const BASE_URL = '/container-yard/api';

export class ApiError extends Error {
    status: number;
    body: unknown;

    constructor(message: string, status: number, body: unknown) {
        super(message);
        this.status = status;
        this.body = body;
    }
}

function getCookie(name: string): string | null {
    const match = document.cookie.match(
        new RegExp('(?:^|; )' + name + '=([^;]*)'),
    );

    return match ? decodeURIComponent(match[1]) : null;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const method = (options.method ?? 'GET').toUpperCase();
    const headers: Record<string, string> = {
        Accept: 'application/json',
        ...(options.headers as Record<string, string> | undefined),
    };

    if (method !== 'GET' && method !== 'HEAD') {
        const token = getCookie('XSRF-TOKEN');

        if (token) {
            headers['X-XSRF-TOKEN'] = token;
        }

        if (options.body) {
            headers['Content-Type'] = 'application/json';
        }
    }

    const response = await fetch(`${BASE_URL}${path}`, {
        ...options,
        headers,
        credentials: 'same-origin',
    });

    const data = await response.json();

    if (!response.ok) {
        throw new ApiError(
            data?.message ?? data?.error ?? 'Request failed',
            response.status,
            data,
        );
    }

    return data as T;
}

function withQuery(
    path: string,
    params: Record<string, string | number | boolean | undefined> = {},
) {
    const query = new URLSearchParams();

    for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== '') {
            query.set(key, String(value));
        }
    }

    const qs = query.toString();

    return qs ? `${path}?${qs}` : path;
}

export const containerYardApi = {
    // Containers
    getContainers(filters: Record<string, string | number | undefined> = {}) {
        return request<ApiListResponse<Container>>(
            withQuery('/containers', filters),
        );
    },
    getContainer(id: number) {
        return request<{ success: boolean; data: Container }>(
            `/containers/${id}`,
        ).then((r) => r.data);
    },
    createContainer(data: Partial<Container>) {
        return request<{ success: boolean; data: Container }>('/containers', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },
    updateContainer(id: number, data: Partial<Container>) {
        return request<{ success: boolean; data: Container }>(
            `/containers/${id}`,
            {
                method: 'PUT',
                body: JSON.stringify(data),
            },
        );
    },
    deleteContainer(id: number) {
        return request<{ success: boolean }>(`/containers/${id}`, {
            method: 'DELETE',
        });
    },
    liveSearch(containerNumber: string) {
        return request<LiveSearchResponse>(
            withQuery('/container-search', { q: containerNumber }),
        );
    },

    // Blocks
    getBlocks(
        filters: Record<string, string | number | boolean | undefined> = {},
    ) {
        return request<ApiListResponse<Block>>(withQuery('/blocks', filters));
    },
    getBlock(id: number) {
        return request<{ success: boolean; data: Block }>(`/blocks/${id}`).then(
            (r) => r.data,
        );
    },
    createBlock(data: Partial<Block>) {
        return request<{ success: boolean; data: Block }>('/blocks', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },
    updateBlock(id: number, data: Partial<Block>) {
        return request<{ success: boolean; data: Block }>(`/blocks/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },
    deleteBlock(id: number) {
        return request<{ success: boolean }>(`/blocks/${id}`, {
            method: 'DELETE',
        });
    },

    // Allocations
    getAllocations(filters: Record<string, string | number | undefined> = {}) {
        return request<ApiListResponse<Allocation>>(
            withQuery('/allocations', filters),
        );
    },
    createAllocation(data: Partial<Allocation>) {
        return request<{ success: boolean; data: Allocation }>('/allocations', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },
    updateAllocation(id: number, data: Partial<Allocation>) {
        return request<{ success: boolean; data: Allocation }>(
            `/allocations/${id}`,
            {
                method: 'PUT',
                body: JSON.stringify(data),
            },
        );
    },
    deleteAllocation(id: number) {
        return request<{ success: boolean }>(`/allocations/${id}`, {
            method: 'DELETE',
        });
    },
};
