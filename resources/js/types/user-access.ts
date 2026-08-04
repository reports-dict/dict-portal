export type UserRole = 'superadmin' | 'admin' | 'user';

export type ManagedUser = {
    id: number;
    name: string;
    email: string;
    samaccountname: string | null;
    role: UserRole;
    guid: string | null;
    azure_oid: string | null;
    created_at: string;
};

export type Paginated<T> = {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
};

export type UserAccessFilters = {
    search: string;
    role: UserRole | '';
    status: 'linked' | 'pending' | '';
};

export type UserAccessStats = {
    total: number;
    linked: number;
    pending: number;
    superadmins: number;
};

export type OnlineUser = {
    id: number;
    name: string;
    email: string;
    role: UserRole;
    session_count: number;
    last_activity: string;
};
