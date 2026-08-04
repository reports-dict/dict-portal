import { router } from '@inertiajs/react';
import { Check, Loader2, Minus, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import UserPermissionController from '@/actions/App/Http/Controllers/Admin/UserPermissionController';
import { Button } from '@/components/ui/button';
import type {
    PermissionState,
    UserPermissionsResponse,
} from '@/types/user-permissions';

const overrideStates: PermissionState[] = ['default', 'allow', 'deny'];

const overrideStateIcon: Record<PermissionState, typeof Minus> = {
    default: Minus,
    allow: Check,
    deny: X,
};

const overrideStateClass: Record<PermissionState, string> = {
    default: 'bg-neutral-600 text-white',
    allow: 'bg-green-600 text-white',
    deny: 'bg-red-600 text-white',
};

export function UserPermissionsPanel({ userId }: { userId: number }) {
    const [data, setData] = useState<UserPermissionsResponse | null>(null);
    const [overrides, setOverrides] = useState<Record<string, PermissionState>>(
        {},
    );
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        let cancelled = false;

        fetch(UserPermissionController.show.url(userId))
            .then((res) => res.json())
            .then((response: UserPermissionsResponse) => {
                if (cancelled) {
                    return;
                }

                setData(response);
                setOverrides(
                    Object.fromEntries(
                        response.modules.map((module) => [
                            module.key,
                            response.overrides[module.key] ?? 'default',
                        ]),
                    ),
                );
            });

        return () => {
            cancelled = true;
        };
    }, [userId]);

    function setState(moduleKey: string, state: PermissionState) {
        setOverrides((prev) => ({ ...prev, [moduleKey]: state }));
        setSaved(false);
    }

    function save() {
        setSaving(true);
        router.put(
            UserPermissionController.update.url(userId),
            { overrides },
            {
                preserveScroll: true,
                onSuccess: () => setSaved(true),
                onFinish: () => setSaving(false),
            },
        );
    }

    if (data === null) {
        return (
            <p className="p-3 text-sm text-neutral-500">Loading permissions…</p>
        );
    }

    return (
        <div className="p-4">
            <p className="mb-3 text-xs text-neutral-500">
                Overrides this user&apos;s role-based access per module.
                &quot;Default&quot; falls back to their role&apos;s setting.
            </p>
            <div className="flex flex-col gap-1.5">
                {data.modules.map((module) => (
                    <div
                        key={module.key}
                        className={`flex flex-wrap items-center justify-between gap-2 rounded-md py-1 ${
                            module.indent
                                ? 'ml-4 border-l-2 border-neutral-200 pl-3'
                                : ''
                        }`}
                    >
                        <span
                            className={`text-sm ${module.indent ? 'text-neutral-500' : 'font-medium text-neutral-900'}`}
                        >
                            {module.label}
                        </span>
                        <div className="flex shrink-0 gap-1">
                            {overrideStates.map((state) => {
                                const Icon = overrideStateIcon[state];

                                return (
                                    <button
                                        key={state}
                                        type="button"
                                        onClick={() =>
                                            setState(module.key, state)
                                        }
                                        title={state}
                                        aria-label={state}
                                        className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold capitalize transition-colors ${
                                            overrides[module.key] === state
                                                ? overrideStateClass[state]
                                                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                                        }`}
                                    >
                                        <Icon className="h-3 w-3" />
                                        <span className="hidden sm:inline">
                                            {state}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
            <div className="mt-3 flex items-center gap-3">
                <Button
                    variant="secondary"
                    size="sm"
                    onClick={save}
                    disabled={saving}
                >
                    {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    Save overrides
                </Button>
                {saved && (
                    <span className="text-sm text-green-600">Saved.</span>
                )}
            </div>
        </div>
    );
}
