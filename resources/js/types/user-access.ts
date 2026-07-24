export type UserRole = 'superadmin' | 'admin' | 'user';

export type ManagedUser = {
    id: number;
    name: string;
    email: string;
    samaccountname: string | null;
    role: UserRole;
    guid: string | null;
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
