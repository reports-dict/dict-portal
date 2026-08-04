import { useEffect, useState } from 'react';
import OnlineUsersController from '@/actions/App/Http/Controllers/Admin/OnlineUsersController';
import type { OnlineUser } from '@/types/user-access';

const POLL_INTERVAL_MS = 5000;

export function useOnlineUsers(initialOnlineUsers: OnlineUser[]) {
    const [onlineUsers, setOnlineUsers] = useState(initialOnlineUsers);

    useEffect(() => {
        let cancelled = false;

        const interval = setInterval(() => {
            fetch(OnlineUsersController.index.url())
                .then((res) => res.json())
                .then((data: OnlineUser[]) => {
                    if (!cancelled) {
                        setOnlineUsers(data);
                    }
                })
                .catch(() => {});
        }, POLL_INTERVAL_MS);

        return () => {
            cancelled = true;
            clearInterval(interval);
        };
    }, []);

    return onlineUsers;
}
