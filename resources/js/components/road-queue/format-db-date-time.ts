// The backend stores/returns these as naive "YYYY-MM-DD HH:MM:SS" strings
// already in Asia/Manila wall-clock time (no UTC offset) — parsed here via
// explicit numeric components (not `new Date(string)`) so the browser's own
// timezone never reinterprets/shifts the displayed value.
export function formatDbDateTime(value: string | null): string {
    if (!value) {
        return '—';
    }

    const match = value.match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})/);

    if (!match) {
        return value;
    }

    const [, year, month, day, hour, minute] = match;
    const date = new Date(
        Number(year),
        Number(month) - 1,
        Number(day),
        Number(hour),
        Number(minute),
    );

    return date.toLocaleString('en-US', {
        month: 'short',
        day: '2-digit',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
    });
}
