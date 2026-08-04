import { useForm } from '@inertiajs/react';
import { Loader2, Trash2 } from 'lucide-react';
import { useState } from 'react';
import UserAccessController from '@/actions/App/Http/Controllers/Admin/UserAccessController';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { ManagedUser, OnlineUser, UserRole } from '@/types/user-access';
import { EditableCell } from './editable-cell';
import { OnlineDot } from './online-dot';
import { roleOptions } from './role-options';
import { UserPermissionsPanel } from './user-permissions-panel';

const roleSelectAccent: Record<UserRole, string> = {
    superadmin: 'border-l-4 border-l-brand-500',
    admin: 'border-l-4 border-l-neutral-300',
    user: 'border-l-4 border-l-neutral-300',
};

export function UserRow({
    user,
    isSelf,
    online,
}: {
    user: ManagedUser;
    isSelf: boolean;
    online?: OnlineUser;
}) {
    const isPlaceholder = user.guid === null && user.azure_oid === null;
    const [overridesOpen, setOverridesOpen] = useState(false);
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
        <>
            <tr
                className={cn(
                    'border-b border-neutral-200 transition-colors last:border-0',
                    online ? 'animate-pulse-online' : 'hover:bg-neutral-50',
                )}
            >
                <td className="px-3 py-2.5 align-top">
                    <div className="flex items-center gap-1.5">
                        <OnlineDot online={online} />
                        <EditableCell
                            editable={isPlaceholder}
                            value={form.data.name}
                            onChange={(value) => form.setData('name', value)}
                            error={form.errors.name}
                            className="font-medium text-neutral-900"
                        />
                    </div>
                </td>
                <td className="px-3 py-2.5 align-top">
                    <EditableCell
                        editable={isPlaceholder}
                        value={form.data.email}
                        onChange={(value) => form.setData('email', value)}
                        error={form.errors.email}
                        type="email"
                        className="text-neutral-600"
                    />
                </td>
                <td className="px-3 py-2.5 align-top">
                    <EditableCell
                        editable={isPlaceholder}
                        value={form.data.samaccountname}
                        onChange={(value) =>
                            form.setData('samaccountname', value)
                        }
                        error={form.errors.samaccountname}
                        className="text-neutral-600"
                    />
                </td>
                <td className="px-3 py-2.5 align-top">
                    <Badge variant={isPlaceholder ? 'warning' : 'success'}>
                        {isPlaceholder ? 'Pending' : 'Linked'}
                    </Badge>
                </td>
                <td className="px-3 py-2.5 align-top">
                    <select
                        value={form.data.role}
                        onChange={(e) =>
                            form.setData('role', e.target.value as UserRole)
                        }
                        disabled={isSelf}
                        className={`rounded-md border border-neutral-300 px-2 py-1 text-sm transition-colors focus:border-brand-400 focus:ring-1 focus:ring-brand-400 focus:outline-none disabled:opacity-50 ${roleSelectAccent[form.data.role]}`}
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
                <td className="px-3 py-2.5 align-top">
                    <div className="flex items-center gap-2">
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={save}
                            disabled={
                                isSelf || !form.isDirty || form.processing
                            }
                        >
                            {form.processing && (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            )}
                            Save
                        </Button>
                        {user.role !== 'superadmin' && (
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={() =>
                                    setOverridesOpen((prev) => !prev)
                                }
                            >
                                Overrides
                            </Button>
                        )}
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={destroy}
                            disabled={isSelf || deleteForm.processing}
                            aria-label={`Remove ${user.name}`}
                        >
                            <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                    </div>
                </td>
            </tr>
            {overridesOpen && (
                <tr className="border-b border-neutral-200 bg-neutral-50 last:border-0">
                    <td colSpan={6} className="p-0">
                        <UserPermissionsPanel userId={user.id} />
                    </td>
                </tr>
            )}
        </>
    );
}
