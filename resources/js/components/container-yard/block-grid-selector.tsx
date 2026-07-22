import { ChevronDown } from 'lucide-react';
import { useState } from 'react';
import type { Block } from '@/types/container-yard';

type BlockGridSelectorProps = {
    blocks?: Block[];
    detailedViewBlock?: string | null;
    onBlockSelect?: (blockName: string) => void;
};

export default function BlockGridSelector({
    blocks = [],
    detailedViewBlock = null,
    onBlockSelect = () => {},
}: BlockGridSelectorProps) {
    const [isOpen, setIsOpen] = useState(false);

    if (blocks.length === 0) {
        return (
            <div className="mb-6 rounded-lg bg-white p-6 text-center text-gray-500 shadow-md">
                No blocks available
            </div>
        );
    }

    const selectedBlock = blocks.find((b) => b.name === detailedViewBlock);

    return (
        <div className="rounded-lg bg-white p-6 shadow-md">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Blocks</h2>

            <div className="relative w-full md:w-64">
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="flex w-full items-center justify-between rounded-lg border border-gray-300 bg-gray-100 px-4 py-3 font-semibold text-gray-900 transition-all hover:bg-gray-200"
                >
                    <span>
                        {selectedBlock ? (
                            <div className="flex items-center gap-2">
                                <span className="font-bold">
                                    {selectedBlock.name}
                                </span>
                                <span className="text-xs text-gray-600">
                                    (
                                    {selectedBlock.facility === 'Terminal'
                                        ? 'Term'
                                        : 'ECD'}
                                    )
                                </span>
                            </div>
                        ) : (
                            'Select a Block...'
                        )}
                    </span>
                    <ChevronDown
                        size={20}
                        className={`transition-transform ${isOpen ? 'rotate-180' : ''}`}
                    />
                </button>

                {isOpen && (
                    <div className="absolute top-full left-0 z-10 mt-2 max-h-96 w-full overflow-y-auto rounded-lg border border-gray-300 bg-white shadow-lg">
                        {blocks.map((block) => (
                            <button
                                key={block.id}
                                onClick={() => {
                                    onBlockSelect(block.name);
                                    setIsOpen(false);
                                }}
                                className={`w-full border-b border-gray-200 px-4 py-3 text-left font-semibold transition-all hover:bg-blue-50 ${
                                    detailedViewBlock === block.name
                                        ? 'bg-blue-100 text-blue-700'
                                        : 'text-gray-900'
                                }`}
                                title={`View ${block.name} (Rows ${block.bay_start}-${block.bay_end})`}
                            >
                                <div className="flex items-center justify-between">
                                    <span>{block.name}</span>
                                    <div className="flex items-center gap-2 text-xs">
                                        <span className="text-gray-600">
                                            Rows {block.bay_start}-
                                            {block.bay_end}
                                        </span>
                                        <span
                                            className={`rounded px-2 py-1 text-[10px] font-bold text-white ${
                                                block.facility === 'Terminal'
                                                    ? 'bg-blue-600'
                                                    : 'bg-orange-600'
                                            }`}
                                        >
                                            {block.facility === 'Terminal'
                                                ? 'Term'
                                                : 'ECD'}
                                        </span>
                                    </div>
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
