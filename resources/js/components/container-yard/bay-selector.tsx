import { ChevronDown } from 'lucide-react';
import { useState } from 'react';
import type { Block } from '@/types/container-yard';

type BaySelectorProps = {
    block?: Block | null;
    selectedBay?: number | null;
    onBaySelect?: (bay: number) => void;
};

export default function BaySelector({
    block = null,
    selectedBay = null,
    onBaySelect = () => {},
}: BaySelectorProps) {
    const [isOpen, setIsOpen] = useState(false);

    if (!block) {
        return null;
    }

    const excludedRows = block.excluded_rows
        ? block.excluded_rows
              .split(',')
              .map((num) => parseInt(num.trim()))
              .filter((num) => !isNaN(num))
        : [];

    const bays = Array.from(
        { length: block.bay_end - block.bay_start + 1 },
        (_, i) => block.bay_start + i,
    ).filter((bay) => !excludedRows.includes(bay));

    return (
        <div className="rounded-lg bg-white p-6 shadow-md">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Rows</h2>

            <div className="relative w-full md:w-64">
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="flex w-full items-center justify-between rounded-lg border border-gray-300 bg-gray-100 px-4 py-3 font-semibold text-gray-900 transition-all hover:bg-gray-200"
                >
                    <span>
                        {selectedBay ? (
                            <div className="flex items-center gap-2">
                                <span className="font-bold">
                                    Row {selectedBay}
                                </span>
                            </div>
                        ) : (
                            'Select a Row...'
                        )}
                    </span>
                    <ChevronDown
                        size={20}
                        className={`transition-transform ${isOpen ? 'rotate-180' : ''}`}
                    />
                </button>

                {isOpen && (
                    <div className="absolute top-full left-0 z-10 mt-2 max-h-96 w-full overflow-y-auto rounded-lg border border-gray-300 bg-white shadow-lg">
                        {bays.map((bay) => (
                            <button
                                key={bay}
                                onClick={() => {
                                    onBaySelect(bay);
                                    setIsOpen(false);
                                }}
                                className={`w-full border-b border-gray-200 px-4 py-3 text-left font-semibold transition-all hover:bg-blue-50 ${
                                    selectedBay === bay
                                        ? 'bg-blue-100 text-blue-700'
                                        : 'text-gray-900'
                                }`}
                            >
                                <div className="flex items-center justify-between">
                                    <span>Row {bay}</span>
                                    <span
                                        className={`rounded px-2 py-1 text-xs font-bold ${bay % 2 === 0 ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}
                                    >
                                        {bay % 2 === 0 ? '40FT' : '20FT'}
                                    </span>
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {isOpen && (
                <div
                    className="fixed inset-0 z-0"
                    onClick={() => setIsOpen(false)}
                />
            )}
        </div>
    );
}
