import { Head, Link } from '@inertiajs/react';
import {
    ArrowLeft,
    ArrowRight,
    Check,
    Copy,
    MapPin,
    Package,
    Search,
    Thermometer,
    X,
} from 'lucide-react';
import { useState } from 'react';
import { ApiError, containerYardApi } from '@/lib/container-yard-api';
import type { LiveSearchRow } from '@/types/container-yard';

const CATEGORY_STYLES: Record<
    string,
    { bg: string; text: string; dot: string }
> = {
    Import: { bg: 'bg-amber-100', text: 'text-amber-800', dot: 'bg-amber-500' },
    IMPRT: { bg: 'bg-amber-100', text: 'text-amber-800', dot: 'bg-amber-500' },
    Export: { bg: 'bg-blue-100', text: 'text-blue-800', dot: 'bg-blue-500' },
    EXPRT: { bg: 'bg-blue-100', text: 'text-blue-800', dot: 'bg-blue-500' },
    Storage: { bg: 'bg-gray-100', text: 'text-gray-800', dot: 'bg-gray-500' },
    STRGE: { bg: 'bg-gray-100', text: 'text-gray-800', dot: 'bg-gray-500' },
    Transship: { bg: 'bg-red-100', text: 'text-red-800', dot: 'bg-red-500' },
    TRSHP: { bg: 'bg-red-100', text: 'text-red-800', dot: 'bg-red-500' },
};

export default function ContainerSearch() {
    const [searchInput, setSearchInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [rows, setRows] = useState<LiveSearchRow[]>([]);
    const [allowedLocations, setAllowedLocations] = useState<string[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [copied, setCopied] = useState(false);

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        const term = searchInput.trim();

        if (!term) {
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const data = await containerYardApi.liveSearch(term);
            setRows(data.data ?? []);
            setAllowedLocations(data.allowed_locations ?? []);
            setModalOpen(true);
        } catch (err) {
            setError(
                err instanceof ApiError
                    ? err.message
                    : 'Failed to reach the server. Please try again.',
            );
        } finally {
            setIsLoading(false);
        }
    };

    const closeModal = () => {
        setModalOpen(false);
        setRows([]);
        setAllowedLocations([]);
    };

    const categoryStyle = (cat: string | undefined) =>
        CATEGORY_STYLES[cat ?? ''] ?? {
            bg: 'bg-gray-100',
            text: 'text-gray-700',
            dot: 'bg-gray-400',
        };

    const headerRow = rows[0];

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
            <Head title="Container Search" />

            {/* Header */}
            <header className="bg-white shadow-sm">
                <div className="mx-auto max-w-2xl px-6 py-4">
                    <Link
                        href="/container-yard"
                        className="flex items-center gap-2 font-medium text-blue-600 transition-colors hover:text-blue-700"
                    >
                        <ArrowLeft size={20} />
                        <span>Back to Dashboard</span>
                    </Link>
                </div>
            </header>

            {/* Main Content */}
            <main className="mx-auto max-w-2xl px-6 py-12">
                {/* Search Card */}
                <div className="rounded-2xl bg-white p-8 shadow-lg">
                    <form onSubmit={handleSearch} className="space-y-6">
                        <div>
                            <label
                                htmlFor="search"
                                className="mb-3 block text-sm font-semibold text-gray-700"
                            >
                                Container Number
                            </label>
                            <div className="relative">
                                <input
                                    id="search"
                                    type="text"
                                    value={searchInput}
                                    onChange={(e) =>
                                        setSearchInput(e.target.value)
                                    }
                                    placeholder="e.g., CONT123456"
                                    className="w-full rounded-lg border-2 border-gray-200 px-4 py-3 pr-12 text-lg transition-colors focus:border-blue-500 focus:outline-none"
                                    autoFocus
                                />
                                <Search
                                    size={22}
                                    className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 transform text-gray-400"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={!searchInput.trim() || isLoading}
                            className={`w-full rounded-lg px-6 py-3 text-lg font-semibold text-white transition-all ${
                                !searchInput.trim() || isLoading
                                    ? 'cursor-not-allowed bg-gray-400'
                                    : 'bg-blue-600 hover:bg-blue-700 active:scale-95'
                            }`}
                        >
                            {isLoading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <div className="h-5 w-5 animate-spin rounded-full border-b-2 border-white"></div>
                                    Searching...
                                </span>
                            ) : (
                                <span className="flex items-center justify-center gap-2">
                                    <Search size={20} />
                                    Search
                                </span>
                            )}
                        </button>
                    </form>

                    {/* Tips Section */}
                    <div className="mt-8 border-t border-gray-200 pt-8">
                        <h3 className="mb-3 text-sm font-semibold text-gray-700">
                            Search Tips:
                        </h3>
                        <ul className="space-y-2 text-sm text-gray-600">
                            <li className="flex items-start gap-2">
                                <span className="mt-0.5 font-bold text-blue-600">
                                    •
                                </span>
                                <span>
                                    Search by full container number:{' '}
                                    <code className="rounded bg-gray-100 px-2 py-1 text-gray-800">
                                        CONT123456
                                    </code>
                                </span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="mt-0.5 font-bold text-blue-600">
                                    •
                                </span>
                                <span>
                                    Search by last 5 digits:{' '}
                                    <code className="rounded bg-gray-100 px-2 py-1 text-gray-800">
                                        23456
                                    </code>
                                </span>
                            </li>
                        </ul>
                    </div>
                </div>

                {error && (
                    <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
                        {error}
                    </div>
                )}
            </main>

            {/* Results Modal */}
            {modalOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
                    onClick={(e) => {
                        if (e.target === e.currentTarget) {
                            closeModal();
                        }
                    }}
                >
                    <div className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-2xl bg-white shadow-2xl">
                        {/* Modal Header */}
                        <div className="flex shrink-0 items-center justify-between border-b border-gray-200 px-6 py-4">
                            <div className="flex items-center gap-3">
                                <Package size={20} className="text-blue-600" />
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h2 className="font-mono text-lg font-bold tracking-wide text-gray-900">
                                            {headerRow?.container ??
                                                searchInput}
                                        </h2>
                                        <button
                                            onClick={() =>
                                                copyToClipboard(
                                                    headerRow?.container ??
                                                        searchInput,
                                                )
                                            }
                                            title="Copy container number"
                                            className={`rounded p-1 transition-colors ${copied ? 'bg-green-50 text-green-600' : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600'}`}
                                        >
                                            {copied ? (
                                                <Check size={15} />
                                            ) : (
                                                <Copy size={15} />
                                            )}
                                        </button>
                                    </div>
                                    {headerRow && (
                                        <div className="mt-0.5 flex items-center gap-2">
                                            {headerRow.reefer_type ===
                                                'RFR' && (
                                                <span className="flex items-center gap-1 rounded-full bg-cyan-100 px-2 py-0.5 text-xs font-semibold text-cyan-700">
                                                    <Thermometer size={11} />{' '}
                                                    RFR
                                                </span>
                                            )}
                                            {(() => {
                                                const s = categoryStyle(
                                                    headerRow.category,
                                                );

                                                return (
                                                    <span
                                                        className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${s.bg} ${s.text}`}
                                                    >
                                                        <span
                                                            className={`h-1.5 w-1.5 rounded-full ${s.dot}`}
                                                        ></span>
                                                        {headerRow.category}
                                                    </span>
                                                );
                                            })()}
                                            <span className="text-xs text-gray-400">
                                                {rows.length} movement
                                                {rows.length !== 1 ? 's' : ''}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <button
                                onClick={closeModal}
                                className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="flex-1 space-y-4 overflow-y-auto p-6">
                            {rows.length === 0 ? (
                                <div className="py-16 text-center">
                                    <Package
                                        size={40}
                                        className="mx-auto mb-3 text-gray-300"
                                    />
                                    <p className="font-medium text-gray-500">
                                        No containers found
                                    </p>
                                    <p className="mt-1 text-sm text-gray-400">
                                        Try a different container number
                                    </p>
                                </div>
                            ) : (
                                rows.map((row, idx) => (
                                    <div
                                        key={idx}
                                        className="rounded-xl border border-gray-100 bg-gray-50 p-5"
                                    >
                                        {row.pos && (
                                            <div className="mb-4 flex items-center gap-2 rounded-lg border border-indigo-100 bg-indigo-50 px-3 py-2">
                                                <ArrowRight
                                                    size={17}
                                                    className="shrink-0 text-indigo-500"
                                                />
                                                <div>
                                                    <p className="text-sm font-medium text-indigo-400">
                                                        Pos
                                                    </p>
                                                    <p className="font-mono text-3xl font-bold text-indigo-700">
                                                        {row.pos}
                                                    </p>
                                                </div>
                                                <span className="ml-auto rounded-full bg-indigo-100 px-2 py-0.5 text-sm font-semibold text-indigo-400">
                                                    {row.move_kind}
                                                </span>
                                            </div>
                                        )}

                                        {row.yard_slot && (
                                            <div className="mb-4 rounded-lg border-2 border-amber-400 bg-amber-50 px-4 py-3">
                                                <p className="mb-1 text-xs font-bold tracking-widest text-amber-600 uppercase">
                                                    Allocation Filter
                                                </p>
                                                <p className="text-base text-amber-900">
                                                    {row.yard_slot}
                                                </p>
                                            </div>
                                        )}

                                        <div className="flex flex-wrap items-center gap-4 text-sm">
                                            <div>
                                                <p className="text-xs font-medium text-gray-400">
                                                    Type
                                                </p>
                                                <p className="font-semibold text-gray-800">
                                                    {row.type_iso || '—'}
                                                </p>
                                            </div>
                                            <div className="h-8 w-px shrink-0 bg-gray-200"></div>
                                            <div>
                                                <p className="text-xs font-medium text-gray-400">
                                                    Line Op
                                                </p>
                                                <p className="font-semibold text-gray-800">
                                                    {row.line_op || '—'}
                                                </p>
                                            </div>
                                            <div className="h-8 w-px shrink-0 bg-gray-200"></div>
                                            <div>
                                                <p className="text-xs font-medium text-gray-400">
                                                    O/B Actual Visit
                                                </p>
                                                <p className="font-semibold text-gray-800">
                                                    {row.ob_vessel || '—'}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3">
                                            <p className="mb-2 flex items-center gap-1 text-xs font-bold tracking-widest text-emerald-700 uppercase">
                                                <MapPin size={13} /> Allowed
                                                Locations
                                            </p>
                                            {allowedLocations.length > 0 ? (
                                                <div className="flex flex-wrap gap-2">
                                                    {allowedLocations.map(
                                                        (loc, i) => (
                                                            <span
                                                                key={i}
                                                                className="rounded-lg bg-emerald-600 px-4 py-2 font-mono text-xl tracking-wide text-white"
                                                            >
                                                                {loc}
                                                            </span>
                                                        ),
                                                    )}
                                                </div>
                                            ) : (
                                                <p className="text-xs text-emerald-600 italic">
                                                    No allocation match found.
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className="shrink-0 border-t border-gray-200 px-6 py-4">
                            <button
                                onClick={closeModal}
                                className="w-full rounded-lg bg-gray-100 px-4 py-2.5 font-semibold text-gray-700 transition-colors hover:bg-gray-200"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
