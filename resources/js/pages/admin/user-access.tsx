import { Head, router, usePage } from '@inertiajs/react';
import { ShieldCheck } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import UserAccessController from '@/actions/App/Http/Controllers/Admin/UserAccessController';
import { CreateUserForm } from '@/components/admin/user-access/create-user-form';
import { FiltersBar } from '@/components/admin/user-access/filters-bar';
import { StatsSummary } from '@/components/admin/user-access/stats-summary';
import { UserCard } from '@/components/admin/user-access/user-card';
import { UserRow } from '@/components/admin/user-access/user-row';
import { Card } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { Pagination } from '@/components/ui/pagination';
import { useOnlineUsers } from '@/hooks/use-online-users';
import PortalLayout from '@/layouts/portal-layout';
import type { Auth } from '@/types/auth';
import type {
    ManagedUser,
    OnlineUser,
    Paginated,
    UserAccessFilters,
    UserAccessStats,
} from '@/types/user-access';

type UserAccessProps = {
    users: Paginated<ManagedUser>;
    filters: UserAccessFilters;
    stats: UserAccessStats;
    onlineUsers: OnlineUser[];
};

function UserAccess({
    users,
    filters,
    stats,
    onlineUsers: initialOnlineUsers,
}: UserAccessProps) {
    const { auth } = usePage<{ auth: Auth }>().props;
    const [search, setSearch] = useState(filters.search);
    const skipNextDebounce = useRef(false);
    const onlineUsers = useOnlineUsers(initialOnlineUsers);
    const onlineById = useMemo(
        () => new Map(onlineUsers.map((user) => [user.id, user])),
        [onlineUsers],
    );

    function navigate(overrides: Partial<UserAccessFilters>) {
        const next = {
            search: overrides.search ?? filters.search,
            role: overrides.role ?? filters.role,
            status: overrides.status ?? filters.status,
        };

        router.get(
            UserAccessController.index.url({
                query: Object.fromEntries(
                    Object.entries(next).filter(([, value]) => value !== ''),
                ),
            }),
            {},
            { preserveState: true, replace: true },
        );
    }

    useEffect(() => {
        if (skipNextDebounce.current) {
            skipNextDebounce.current = false;

            return;
        }

        if (search === filters.search) {
            return;
        }

        const timeout = setTimeout(() => navigate({ search }), 400);

        return () => clearTimeout(timeout);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search]);

    function clearFilters() {
        skipNextDebounce.current = true;
        setSearch('');
        navigate({ search: '', role: '', status: '' });
    }

    function getPageUrl(page: number) {
        return UserAccessController.index.url({
            query: Object.fromEntries(
                Object.entries({
                    search: filters.search,
                    role: filters.role,
                    status: filters.status,
                    page,
                }).filter(([, value]) => value !== ''),
            ),
        });
    }

    return (
        <>
            <Head title="User Access Management" />
            <div className="min-h-full bg-neutral-50 px-2 py-4 sm:px-4">
                <div className="w-full">
                    <PageHeader
                        title="User Access Management"
                        subtitle="Manage who can access the portal and their role"
                        icon={ShieldCheck}
                        className="mb-4"
                        actions={<CreateUserForm />}
                    />

                    <StatsSummary stats={stats} />

                    <FiltersBar
                        search={search}
                        onSearchChange={setSearch}
                        filters={filters}
                        onFilterChange={navigate}
                        onClear={clearFilters}
                    />

                    <Card className="hidden overflow-x-auto p-0 lg:block">
                        <table className="w-full min-w-[720px] text-left text-sm">
                            <thead className="border-b border-neutral-200 bg-neutral-50 text-xs font-semibold tracking-wide text-neutral-500 uppercase">
                                <tr>
                                    <th className="px-3 py-2">Name</th>
                                    <th className="px-3 py-2">Email</th>
                                    <th className="px-3 py-2">Username</th>
                                    <th className="px-3 py-2">Status</th>
                                    <th className="px-3 py-2">Role</th>
                                    <th className="px-3 py-2">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.data.map((user) => (
                                    <UserRow
                                        key={user.id}
                                        user={user}
                                        isSelf={user.id === auth.user.id}
                                        online={onlineById.get(user.id)}
                                    />
                                ))}
                            </tbody>
                        </table>
                        {users.data.length === 0 && (
                            <p className="p-6 text-center text-sm text-neutral-500">
                                No users match the current filters.
                            </p>
                        )}
                    </Card>

                    <Card className="p-0 lg:hidden">
                        {users.data.map((user) => (
                            <UserCard
                                key={user.id}
                                user={user}
                                isSelf={user.id === auth.user.id}
                                online={onlineById.get(user.id)}
                            />
                        ))}
                        {users.data.length === 0 && (
                            <p className="p-6 text-center text-sm text-neutral-500">
                                No users match the current filters.
                            </p>
                        )}
                    </Card>

                    {users.total > 0 && (
                        <div className="mt-4 flex flex-col items-center justify-between gap-3 sm:flex-row">
                            <p className="text-sm text-neutral-500">
                                Showing {users.from}–{users.to} of {users.total}{' '}
                                users
                            </p>
                            <Pagination
                                currentPage={users.current_page}
                                lastPage={users.last_page}
                                getPageUrl={getPageUrl}
                            />
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

UserAccess.layout = (page: ReactNode) => <PortalLayout>{page}</PortalLayout>;

export default UserAccess;
