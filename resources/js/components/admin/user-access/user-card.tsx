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

export function UserCard({
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
        <div
            className={cn(
                'border-b border-neutral-200 p-4 last:border-0',
                online && 'animate-pulse-online',
            )}
        >
            <div className="mb-3 flex items-start justify-between gap-2">
                <div className="flex items-center gap-1.5">
                    <OnlineDot online={online} />
                    <EditableCell
                        editable={isPlaceholder}
                        value={form.data.name}
                        onChange={(value) => form.setData('name', value)}
                        error={form.errors.name}
                        className="font-semibold text-neutral-900"
                    />
                </div>
                <Badge
                    variant={isPlaceholder ? 'warning' : 'success'}
                    className="shrink-0"
                >
                    {isPlaceholder ? 'Pending' : 'Linked'}
                </Badge>
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
                    className="rounded-md border border-neutral-300 px-2 py-1.5 text-sm transition-colors focus:border-brand-400 focus:ring-1 focus:ring-brand-400 focus:outline-none disabled:opacity-50"
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
                {user.role !== 'superadmin' && (
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setOverridesOpen((prev) => !prev)}
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
            {form.errors.role && (
                <p className="mt-1 text-xs text-red-600">{form.errors.role}</p>
            )}
            {isSelf && (
                <p className="mt-1 text-xs text-neutral-400">
                    You can&apos;t change your own role.
                </p>
            )}
            {overridesOpen && (
                <div className="mt-3 rounded-md border border-neutral-200 bg-neutral-50">
                    <UserPermissionsPanel userId={user.id} />
                </div>
            )}
        </div>
    );
}
