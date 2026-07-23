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
