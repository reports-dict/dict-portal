import { X } from 'lucide-react';
import { useState } from 'react';
import type { Block } from '@/types/container-yard';

type BlockFormData = Partial<Block>;

const EMPTY_FORM: BlockFormData = {
    name: '',
    bay_start: 0,
    bay_end: 0,
    row_start: 'A',
    row_end: 'F',
    max_tier: 5,
    facility: 'Terminal',
    road_side: 'both',
    excluded_rows: '',
};

type AdminBlockManagementProps = {
    isOpen: boolean;
    onClose: () => void;
    blocks?: Block[];
    onBlockUpdate?: (id: number, data: BlockFormData) => void;
    onBlockCreate?: (data: BlockFormData) => void;
};

export default function AdminBlockManagement({
    isOpen,
    onClose,
    blocks = [],
    onBlockUpdate = () => {},
    onBlockCreate = () => {},
}: AdminBlockManagementProps) {
    const [editingBlock, setEditingBlock] = useState<Block | null>(null);
    const [formData, setFormData] = useState<BlockFormData>(EMPTY_FORM);
    const [isCreating, setIsCreating] = useState(false);

    const handleEditClick = (block: Block) => {
        setEditingBlock(block);
        setFormData(block);
        setIsCreating(false);
    };

    const handleCreateClick = () => {
        setEditingBlock(null);
        setFormData(EMPTY_FORM);
        setIsCreating(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (isCreating) {
            onBlockCreate(formData);
        } else if (editingBlock) {
            onBlockUpdate(editingBlock.id, formData);
        }

        setEditingBlock(null);
        setIsCreating(false);
    };

    const handleCancel = () => {
        setEditingBlock(null);
        setIsCreating(false);
    };

    if (!isOpen) {
        return null;
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-lg bg-white shadow-xl">
                {/* Header */}
                <div className="flex items-center justify-between border-b p-6">
                    <h2 className="text-2xl font-bold text-gray-900">
                        Manage Blocks
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 transition-colors hover:text-gray-600"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    {editingBlock || isCreating ? (
                        <div className="rounded-lg bg-gray-50 p-6">
                            <h3 className="mb-4 text-lg font-semibold text-gray-900">
                                {isCreating
                                    ? 'Create New Block'
                                    : `Edit ${editingBlock?.name}`}
                            </h3>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="mb-1 block text-sm font-semibold text-gray-700">
                                            Block Name
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.name ?? ''}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    name: e.target.value,
                                                })
                                            }
                                            className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="mb-1 block text-sm font-semibold text-gray-700">
                                            Facility
                                        </label>
                                        <select
                                            value={
                                                formData.facility ?? 'Terminal'
                                            }
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    facility: e.target
                                                        .value as Block['facility'],
                                                })
                                            }
                                            className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="Terminal">
                                                Terminal
                                            </option>
                                            <option value="ECD">ECD</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="mb-1 block text-sm font-semibold text-gray-700">
                                            Bay Start
                                        </label>
                                        <input
                                            type="number"
                                            value={formData.bay_start ?? 0}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    bay_start:
                                                        parseInt(
                                                            e.target.value,
                                                        ) || 0,
                                                })
                                            }
                                            className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="mb-1 block text-sm font-semibold text-gray-700">
                                            Bay End
                                        </label>
                                        <input
                                            type="number"
                                            value={formData.bay_end ?? 0}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    bay_end:
                                                        parseInt(
                                                            e.target.value,
                                                        ) || 0,
                                                })
                                            }
                                            className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="mb-1 block text-sm font-semibold text-gray-700">
                                            Row Start
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.row_start ?? ''}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    row_start: e.target.value,
                                                })
                                            }
                                            className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="mb-1 block text-sm font-semibold text-gray-700">
                                            Row End
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.row_end ?? ''}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    row_end: e.target.value,
                                                })
                                            }
                                            className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="mb-1 block text-sm font-semibold text-gray-700">
                                            Max Tier
                                        </label>
                                        <input
                                            type="number"
                                            value={formData.max_tier ?? 5}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    max_tier: parseInt(
                                                        e.target.value,
                                                    ),
                                                })
                                            }
                                            className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="mb-1 block text-sm font-semibold text-gray-700">
                                            Road Lane Access
                                        </label>
                                        <select
                                            value={formData.road_side ?? 'both'}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    road_side: e.target
                                                        .value as Block['road_side'],
                                                })
                                            }
                                            className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="row_start">
                                                Row Start (Top)
                                            </option>
                                            <option value="row_end">
                                                Row End (Bottom)
                                            </option>
                                            <option value="both">
                                                Both (Top & Bottom)
                                            </option>
                                        </select>
                                    </div>

                                    <div className="col-span-2">
                                        <label className="mb-1 block text-sm font-semibold text-gray-700">
                                            Excluded Rows (comma-separated, e.g.
                                            4,8,11,15)
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.excluded_rows ?? ''}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    excluded_rows:
                                                        e.target.value,
                                                })
                                            }
                                            placeholder="Leave empty if no excluded rows"
                                            className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                                        />
                                        <p className="mt-1 text-xs text-gray-500">
                                            Enter row numbers to exclude from
                                            the dropdown list
                                        </p>
                                    </div>
                                </div>

                                <div className="flex gap-4 pt-4">
                                    <button
                                        type="submit"
                                        className="rounded-lg bg-blue-600 px-6 py-2 font-medium text-white transition-colors hover:bg-blue-700"
                                    >
                                        {isCreating ? 'Create' : 'Save'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleCancel}
                                        className="rounded-lg bg-gray-600 px-6 py-2 font-medium text-white transition-colors hover:bg-gray-700"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </div>
                    ) : (
                        <div>
                            <button
                                onClick={handleCreateClick}
                                className="mb-4 rounded-lg bg-blue-600 px-6 py-2 font-medium text-white transition-colors hover:bg-blue-700"
                            >
                                + Create Block
                            </button>

                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-100">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                                                Name
                                            </th>
                                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                                                Bays
                                            </th>
                                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                                                Rows
                                            </th>
                                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                                                Max Tier
                                            </th>
                                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                                                Facility
                                            </th>
                                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                                                Road Lane
                                            </th>
                                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                                                Status
                                            </th>
                                            <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {blocks.map((block) => (
                                            <tr
                                                key={block.id}
                                                className="border-b hover:bg-gray-50"
                                            >
                                                <td className="px-4 py-3 font-semibold text-gray-900">
                                                    {block.name}
                                                </td>
                                                <td className="px-4 py-3 text-gray-900">
                                                    {block.bay_start} -{' '}
                                                    {block.bay_end}
                                                </td>
                                                <td className="px-4 py-3 text-gray-900">
                                                    {block.row_start} -{' '}
                                                    {block.row_end}
                                                </td>
                                                <td className="px-4 py-3 text-gray-900">
                                                    {block.max_tier}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span
                                                        className={`rounded px-2 py-1 text-xs font-medium ${
                                                            block.facility ===
                                                            'Terminal'
                                                                ? 'bg-blue-100 text-blue-700'
                                                                : 'bg-orange-100 text-orange-700'
                                                        }`}
                                                    >
                                                        {block.facility}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span
                                                        className={`rounded px-2 py-1 text-xs font-medium ${
                                                            block.road_side ===
                                                            'row_start'
                                                                ? 'bg-yellow-100 text-yellow-700'
                                                                : block.road_side ===
                                                                    'row_end'
                                                                  ? 'bg-orange-100 text-orange-700'
                                                                  : 'bg-amber-100 text-amber-700'
                                                        }`}
                                                    >
                                                        {block.road_side ===
                                                        'row_start'
                                                            ? 'Top'
                                                            : block.road_side ===
                                                                'row_end'
                                                              ? 'Bottom'
                                                              : 'Both'}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span
                                                        className={`rounded px-2 py-1 text-xs font-medium ${block.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
                                                    >
                                                        {block.is_active
                                                            ? 'Active'
                                                            : 'Inactive'}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <button
                                                        onClick={() =>
                                                            handleEditClick(
                                                                block,
                                                            )
                                                        }
                                                        className="font-medium text-blue-600 hover:text-blue-800"
                                                    >
                                                        Edit
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex justify-end border-t bg-gray-50 p-6">
                    <button
                        onClick={onClose}
                        className="rounded-lg bg-gray-600 px-4 py-2 text-white transition-colors hover:bg-gray-700"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}
