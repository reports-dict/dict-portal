export function formatLastSeen(
    lastActivity: string | null,
    isOnline: boolean,
): string {
    if (isOnline) {
        return 'Online now';
    }

    if (!lastActivity) {
        return 'Never';
    }

    const seconds = Math.floor(
        (Date.now() - new Date(lastActivity).getTime()) / 1000,
    );

    if (seconds < 60) {
        return 'Just now';
    }

    const minutes = Math.floor(seconds / 60);

    if (minutes < 60) {
        return `${minutes}m ago`;
    }

    const hours = Math.floor(minutes / 60);

    if (hours < 24) {
        return `${hours}h ago`;
    }

    return `${Math.floor(hours / 24)}d ago`;
}
