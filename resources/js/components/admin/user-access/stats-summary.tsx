import { Clock, ShieldCheck, UserCheck, Users } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Card } from '@/components/ui/card';
import type { UserAccessStats } from '@/types/user-access';

const tiles: {
    key: keyof UserAccessStats;
    label: string;
    icon: LucideIcon;
}[] = [
    { key: 'total', label: 'Total users', icon: Users },
    { key: 'linked', label: 'Linked', icon: UserCheck },
    { key: 'pending', label: 'Pending SSO', icon: Clock },
    { key: 'superadmins', label: 'Superadmins', icon: ShieldCheck },
];

export function StatsSummary({ stats }: { stats: UserAccessStats }) {
    return (
        <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {tiles.map(({ key, label, icon: Icon }) => (
                <Card key={key} className="flex items-center gap-3 p-3 sm:p-4">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                        <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                        <p className="text-xl font-bold text-neutral-900">
                            {stats[key]}
                        </p>
                        <p className="truncate text-xs text-neutral-500">
                            {label}
                        </p>
                    </div>
                </Card>
            ))}
        </div>
    );
}
