import type { OnlineUser } from '@/types/user-access';

export function OnlineDot({ online }: { online?: OnlineUser }) {
    if (!online) {
        return null;
    }

    const title =
        online.session_count > 1
            ? `Online now · ${online.session_count} devices`
            : 'Online now';

    return (
        <span
            className="inline-block h-2 w-2 shrink-0 rounded-full bg-green-500"
            title={title}
        />
    );
}
