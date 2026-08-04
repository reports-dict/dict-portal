import { useForm } from '@inertiajs/react';
import { Loader2, UserPlus } from 'lucide-react';
import { useState } from 'react';
import type { FormEvent } from 'react';
import UserAccessController from '@/actions/App/Http/Controllers/Admin/UserAccessController';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import type { UserRole } from '@/types/user-access';
import { roleOptions } from './role-options';

export function CreateUserForm() {
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
        <Card className="w-full p-4 sm:w-auto">
            <div className="mb-3 flex items-start gap-2">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                    <UserPlus className="h-4 w-4" />
                </div>
                <div>
                    <p className="text-sm font-semibold text-neutral-900">
                        Pre-provision a user
                    </p>
                    <p className="text-xs text-neutral-500">
                        Reserve access for someone before their first SSO login.
                        Their account is claimed automatically the first time
                        they sign in.
                    </p>
                </div>
            </div>
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
                        className="w-full rounded-md border border-neutral-300 px-3 py-1.5 text-sm transition-colors focus:border-brand-400 focus:ring-1 focus:ring-brand-400 focus:outline-none"
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
                        className="w-full rounded-md border border-neutral-300 px-3 py-1.5 text-sm transition-colors focus:border-brand-400 focus:ring-1 focus:ring-brand-400 focus:outline-none"
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
                        className="w-full rounded-md border border-neutral-300 px-3 py-1.5 text-sm transition-colors focus:border-brand-400 focus:ring-1 focus:ring-brand-400 focus:outline-none"
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
                        className="w-full rounded-md border border-neutral-300 px-3 py-1.5 text-sm transition-colors focus:border-brand-400 focus:ring-1 focus:ring-brand-400 focus:outline-none"
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
