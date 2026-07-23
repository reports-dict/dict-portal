import { Head, useForm } from '@inertiajs/react';
import { Loader2, ShieldCheck } from 'lucide-react';
import type { FormEvent, ReactNode } from 'react';
import RolePermissionController from '@/actions/App/Http/Controllers/Admin/RolePermissionController';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import PortalLayout from '@/layouts/portal-layout';

type ModuleDefinition = {
    key: string;
    label: string;
    indent: boolean;
};

type RolePermissionsProps = {
    modules: ModuleDefinition[];
    permissions: {
        admin: string[];
        user: string[];
    };
};

const editableRoles: { role: 'admin' | 'user'; label: string }[] = [
    { role: 'admin', label: 'Admin' },
    { role: 'user', label: 'User' },
];

function RolePermissions({ modules, permissions }: RolePermissionsProps) {
    const { data, setData, put, processing, errors, recentlySuccessful } =
        useForm({
            permissions,
        });

    function toggle(role: 'admin' | 'user', moduleKey: string) {
        const current = data.permissions[role];
        const next = current.includes(moduleKey)
            ? current.filter((key) => key !== moduleKey)
            : [...current, moduleKey];

        setData('permissions', {
            ...data.permissions,
            [role]: next,
        });
    }

    function submit(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        put(RolePermissionController.update.url(), {
            preserveScroll: true,
        });
    }

    return (
        <>
            <Head title="Role Permissions" />
            <div className="min-h-full bg-neutral-50 px-2 py-4 sm:px-4">
                <div className="w-full">
                    <PageHeader
                        title="Role Permissions"
                        subtitle="Choose which modules each role can access. Superadmin always has full access."
                        icon={ShieldCheck}
                        className="mb-4"
                    />

                    <Card className="overflow-x-auto p-0">
                        <form onSubmit={submit}>
                            <table className="w-full text-left text-sm">
                                <thead className="border-b border-neutral-200 bg-neutral-50 text-xs font-semibold tracking-wide text-neutral-500 uppercase">
                                    <tr>
                                        <th className="px-3 py-2 sm:px-4">
                                            Module
                                        </th>
                                        {editableRoles.map(
                                            ({ role, label }) => (
                                                <th
                                                    key={role}
                                                    className="px-3 py-2 text-center sm:px-4"
                                                >
                                                    {label}
                                                </th>
                                            ),
                                        )}
                                    </tr>
                                </thead>
                                <tbody>
                                    {modules.map((module) => (
                                        <tr
                                            key={module.key}
                                            className="border-b border-neutral-200 last:border-0"
                                        >
                                            <td
                                                className={`px-3 py-3 whitespace-nowrap sm:px-4 ${
                                                    module.indent
                                                        ? 'pl-8 text-neutral-500 sm:pl-10'
                                                        : 'font-medium text-neutral-900'
                                                }`}
                                            >
                                                {module.indent && '↳ '}
                                                {module.label}
                                            </td>
                                            {editableRoles.map(({ role }) => (
                                                <td
                                                    key={role}
                                                    className="px-3 py-3 text-center sm:px-4"
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={data.permissions[
                                                            role
                                                        ].includes(module.key)}
                                                        onChange={() =>
                                                            toggle(
                                                                role,
                                                                module.key,
                                                            )
                                                        }
                                                        className="h-5 w-5 rounded border-neutral-300 text-brand-600 accent-brand-600 sm:h-4 sm:w-4"
                                                    />
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            <div className="flex flex-wrap items-center gap-3 border-t border-neutral-200 px-3 py-3 sm:px-4">
                                <Button
                                    type="submit"
                                    size="sm"
                                    disabled={processing}
                                >
                                    {processing && (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    )}
                                    Save
                                </Button>
                                {recentlySuccessful && (
                                    <span className="text-sm text-green-600">
                                        Saved.
                                    </span>
                                )}
                                {(errors['permissions.admin'] ||
                                    errors['permissions.user']) && (
                                    <span className="text-sm text-red-600">
                                        Something went wrong. Please try again.
                                    </span>
                                )}
                            </div>
                        </form>
                    </Card>
                </div>
            </div>
        </>
    );
}

RolePermissions.layout = (page: ReactNode) => (
    <PortalLayout>{page}</PortalLayout>
);

export default RolePermissions;
