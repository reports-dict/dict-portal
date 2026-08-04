import type { UserRole } from '@/types/user-access';

export const roleOptions: { value: UserRole; label: string }[] = [
    { value: 'superadmin', label: 'Superadmin' },
    { value: 'admin', label: 'Admin' },
    { value: 'user', label: 'User' },
];
