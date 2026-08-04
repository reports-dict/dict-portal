export function EditableCell({
    editable,
    value,
    onChange,
    error,
    type = 'text',
    className,
}: {
    editable: boolean;
    value: string;
    onChange: (value: string) => void;
    error?: string;
    type?: string;
    className?: string;
}) {
    if (!editable) {
        return <span className={className}>{value || '—'}</span>;
    }

    return (
        <div>
            <input
                type={type}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className={`w-full rounded-md border border-neutral-300 px-2 py-1.5 text-sm transition-colors focus:border-brand-400 focus:ring-1 focus:ring-brand-400 focus:outline-none ${className ?? ''}`}
            />
            {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
        </div>
    );
}
