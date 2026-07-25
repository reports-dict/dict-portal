import { Head, router, useForm, usePage } from '@inertiajs/react';
import { Loader2, ShieldCheck, Trash2, UserPlus } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import UserAccessController from '@/actions/App/Http/Controllers/Admin/UserAccessController';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { Pagination } from '@/components/ui/pagination';
import PortalLayout from '@/layouts/portal-layout';
import type { Auth } from '@/types/auth';
import type {
    ManagedUser,
    Paginated,
    UserAccessFilters,
    UserRole,
} from '@/types/user-access';

type UserAccessProps = {
    users: Paginated<ManagedUser>;
    filters: UserAccessFilters;
};

const statusOptions: { value: UserAccessFilters['status']; label: string }[] = [
    { value: '', label: 'All statuses' },
    { value: 'linked', label: 'Linked' },
    { value: 'pending', label: 'Pending' },
];

const roleOptions: { value: UserRole; label: string }[] = [
    { value: 'superadmin', label: 'Superadmin' },
    { value: 'admin', label: 'Admin' },
    { value: 'user', label: 'User' },
];

function CreateUserForm() {
    const [open, setOpen] = useState(false);
    const { data, setData, post, processing, errors, reset } = useForm({
        samaccountname: '',
        name: '',
        email: '',
        role: 'user' as UserRole,
    });

    function submit(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        post(UserAccessController.store.url(), {
            preserveScroll: true,
            onSuccess: () => {
                reset();
                setOpen(false);
            },
        });
    }

    if (!open) {
        return (
            <Button variant="primary" size="sm" onClick={() => setOpen(true)}>
                <UserPlus className="h-4 w-4" />
                Pre-provision user
            </Button>
        );
    }

    return (
        <Card className="p-4">
            <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
                <div>
                    <label className="mb-1 block text-sm font-medium text-neutral-700">
                        Username (samaccountname)
                    </label>
                    <input
                        type="text"
                        value={data.samaccountname}
                        onChange={(e) =>
                            setData('samaccountname', e.target.value)
                        }
                        className="w-full rounded-md border border-neutral-300 px-3 py-1.5 text-sm"
                    />
                    {errors.samaccountname && (
                        <p className="mt-1 text-xs text-red-600">
                            {errors.samaccountname}
                        </p>
                    )}
                </div>

                <div>
                    <label className="mb-1 block text-sm font-medium text-neutral-700">
                        Name
                    </label>
                    <input
                        type="text"
                        value={data.name}
                        onChange={(e) => setData('name', e.target.value)}
                        className="w-full rounded-md border border-neutral-300 px-3 py-1.5 text-sm"
                    />
                    {errors.name && (
                        <p className="mt-1 text-xs text-red-600">
                            {errors.name}
                        </p>
                    )}
                </div>

                <div>
                    <label className="mb-1 block text-sm font-medium text-neutral-700">
                        Email
                    </label>
                    <input
                        type="email"
                        value={data.email}
                        onChange={(e) => setData('email', e.target.value)}
                        className="w-full rounded-md border border-neutral-300 px-3 py-1.5 text-sm"
                    />
                    {errors.email && (
                        <p className="mt-1 text-xs text-red-600">
                            {errors.email}
                        </p>
                    )}
                </div>

                <div>
                    <label className="mb-1 block text-sm font-medium text-neutral-700">
                        Role
                    </label>
                    <select
                        value={data.role}
                        onChange={(e) =>
                            setData('role', e.target.value as UserRole)
                        }
                        className="w-full rounded-md border border-neutral-300 px-3 py-1.5 text-sm"
                    >
                        {roleOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                    {errors.role && (
                        <p className="mt-1 text-xs text-red-600">
                            {errors.role}
                        </p>
                    )}
                </div>

                <div className="flex items-center gap-2 sm:col-span-2">
                    <Button type="submit" size="sm" disabled={processing}>
                        {processing && (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        )}
                        Pre-provision
                    </Button>
                    <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                            reset();
                            setOpen(false);
                        }}
                    >
                        Cancel
                    </Button>
                </div>
            </form>
        </Card>
    );
}

function EditableCell({
    editable,
    value,
    onChange,
    error,
    type = 'text',
    className,
}: {
    editable: boolean;
    value: string;
    onChange: (value: string) => void;
    error?: string;
    type?: string;
    className?: string;
}) {
    if (!editable) {
        return <span className={className}>{value || '—'}</span>;
    }

    return (
        <div>
            <input
                type={type}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className={`w-full rounded-md border border-neutral-300 px-2 py-1.5 text-sm ${className ?? ''}`}
            />
            {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
        </div>
    );
}

function UserRow({ user, isSelf }: { user: ManagedUser; isSelf: boolean }) {
    const isPlaceholder = user.guid === null && user.azure_oid === null;
    const form = useForm({
        samaccountname: user.samaccountname ?? '',
        name: user.name,
        email: user.email,
        role: user.role,
    });
    const deleteForm = useForm({});

    function save() {
        form.put(UserAccessController.update.url(user.id), {
            preserveScroll: true,
        });
    }

    function destroy() {
        if (!confirm(`Remove ${user.name} from the portal?`)) {
            return;
        }

        deleteForm.delete(UserAccessController.destroy.url(user.id), {
            preserveScroll: true,
        });
    }

    return (
        <tr className="border-b border-neutral-200 last:border-0">
            <td className="px-3 py-2 align-top">
                <EditableCell
                    editable={isPlaceholder}
                    value={form.data.name}
                    onChange={(value) => form.setData('name', value)}
                    error={form.errors.name}
                />
            </td>
            <td className="px-3 py-2 align-top">
                <EditableCell
                    editable={isPlaceholder}
                    value={form.data.email}
                    onChange={(value) => form.setData('email', value)}
                    error={form.errors.email}
                    type="email"
                />
            </td>
            <td className="px-3 py-2 align-top">
                <EditableCell
                    editable={isPlaceholder}
                    value={form.data.samaccountname}
                    onChange={(value) => form.setData('samaccountname', value)}
                    error={form.errors.samaccountname}
                />
            </td>
            <td className="px-3 py-2 align-top">
                <span
                    className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                        isPlaceholder
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-green-100 text-green-800'
                    }`}
                >
                    {isPlaceholder ? 'Pending' : 'Linked'}
                </span>
            </td>
            <td className="px-3 py-2 align-top">
                <select
                    value={form.data.role}
                    onChange={(e) =>
                        form.setData('role', e.target.value as UserRole)
                    }
                    disabled={isSelf}
                    className="rounded-md border border-neutral-300 px-2 py-1 text-sm disabled:opacity-50"
                >
                    {roleOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>
                {form.errors.role && (
                    <p className="mt-1 text-xs text-red-600">
                        {form.errors.role}
                    </p>
                )}
                {isSelf && (
                    <p className="mt-1 text-xs text-neutral-400">
                        You can&apos;t change your own role.
                    </p>
                )}
            </td>
            <td className="px-3 py-2 align-top">
                <div className="flex items-center gap-2">
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={save}
                        disabled={isSelf || !form.isDirty || form.processing}
                    >
                        {form.processing && (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        )}
                        Save
                    </Button>
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={destroy}
                        disabled={isSelf || deleteForm.processing}
                    >
                        <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                </div>
            </td>
        </tr>
    );
}

function UserCard({ user, isSelf }: { user: ManagedUser; isSelf: boolean }) {
    const isPlaceholder = user.guid === null && user.azure_oid === null;
    const form = useForm({
        samaccountname: user.samaccountname ?? '',
        name: user.name,
        email: user.email,
        role: user.role,
    });
    const deleteForm = useForm({});

    function save() {
        form.put(UserAccessController.update.url(user.id), {
            preserveScroll: true,
        });
    }

    function destroy() {
        if (!confirm(`Remove ${user.name} from the portal?`)) {
            return;
        }

        deleteForm.delete(UserAccessController.destroy.url(user.id), {
            preserveScroll: true,
        });
    }

    return (
        <div className="border-b border-neutral-200 p-4 last:border-0">
            <div className="mb-3 flex items-start justify-between gap-2">
                <EditableCell
                    editable={isPlaceholder}
                    value={form.data.name}
                    onChange={(value) => form.setData('name', value)}
                    error={form.errors.name}
                    className="font-semibold text-neutral-900"
                />
                <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${
                        isPlaceholder
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-green-100 text-green-800'
                    }`}
                >
                    {isPlaceholder ? 'Pending' : 'Linked'}
                </span>
            </div>

            <div className="mb-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                    <div className="mb-1 text-xs font-semibold tracking-wide text-neutral-500 uppercase">
                        Email
                    </div>
                    <EditableCell
                        editable={isPlaceholder}
                        value={form.data.email}
                        onChange={(value) => form.setData('email', value)}
                        error={form.errors.email}
                        type="email"
                        className="text-sm text-neutral-700"
                    />
                </div>
                <div>
                    <div className="mb-1 text-xs font-semibold tracking-wide text-neutral-500 uppercase">
                        Username
                    </div>
                    <EditableCell
                        editable={isPlaceholder}
                        value={form.data.samaccountname}
                        onChange={(value) =>
                            form.setData('samaccountname', value)
                        }
                        error={form.errors.samaccountname}
                        className="text-sm text-neutral-700"
                    />
                </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
                <select
                    value={form.data.role}
                    onChange={(e) =>
                        form.setData('role', e.target.value as UserRole)
                    }
                    disabled={isSelf}
                    className="rounded-md border border-neutral-300 px-2 py-1.5 text-sm disabled:opacity-50"
                >
                    {roleOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>
                <Button
                    variant="secondary"
                    size="sm"
                    onClick={save}
                    disabled={isSelf || !form.isDirty || form.processing}
                >
                    {form.processing && (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    )}
                    Save
                </Button>
                <Button
                    variant="secondary"
                    size="sm"
                    onClick={destroy}
                    disabled={isSelf || deleteForm.processing}
                >
                    <Trash2 className="h-3.5 w-3.5" />
                </Button>
            </div>
            {form.errors.role && (
                <p className="mt-1 text-xs text-red-600">{form.errors.role}</p>
            )}
            {isSelf && (
                <p className="mt-1 text-xs text-neutral-400">
                    You can&apos;t change your own role.
                </p>
            )}
        </div>
    );
}

function UserAccess({ users, filters }: UserAccessProps) {
    const { auth } = usePage<{ auth: Auth }>().props;
    const [search, setSearch] = useState(filters.search);

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
        if (search === filters.search) {
            return;
        }

        const timeout = setTimeout(() => navigate({ search }), 400);

        return () => clearTimeout(timeout);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search]);

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

                    <div className="mb-4 flex flex-wrap items-center gap-2">
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search by name, email, or username"
                            className="w-full rounded-md border border-neutral-300 px-3 py-1.5 text-sm sm:w-72"
                        />
                        <select
                            value={filters.role}
                            onChange={(e) =>
                                navigate({
                                    role: e.target.value as UserRole | '',
                                })
                            }
                            className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm"
                        >
                            <option value="">All roles</option>
                            {roleOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                        <select
                            value={filters.status}
                            onChange={(e) =>
                                navigate({
                                    status: e.target
                                        .value as UserAccessFilters['status'],
                                })
                            }
                            className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm"
                        >
                            {statusOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </div>

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
