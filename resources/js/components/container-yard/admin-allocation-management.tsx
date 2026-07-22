import { Pencil, Plus, Save, Search, Trash2, X, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { ApiError } from '@/lib/container-yard-api';
import type { Allocation } from '@/types/container-yard';

type AllocationFormData = Partial<Allocation>;

const EMPTY_FORM: AllocationFormData = {
    service: '',
    discharge_port: '',
    iso_basic_length: '',
    reefer_type: '',
    location: '',
};

type AdminAllocationManagementProps = {
    isOpen: boolean;
    onClose: () => void;
    allocations?: Allocation[];
    onAllocationCreate: (data: AllocationFormData) => Promise<unknown>;
    onAllocationUpdate: (
        id: number,
        data: AllocationFormData,
    ) => Promise<unknown>;
    onAllocationDelete: (id: number) => Promise<unknown>;
};

export default function AdminAllocationManagement({
    isOpen,
    onClose,
    allocations,
    onAllocationCreate,
    onAllocationUpdate,
    onAllocationDelete,
}: AdminAllocationManagementProps) {
    const [editingAllocation, setEditingAllocation] = useState<number | null>(
        null,
    );
    const [isCreating, setIsCreating] = useState(false);
    const [formData, setFormData] = useState<AllocationFormData>(EMPTY_FORM);
    const [searchTerm, setSearchTerm] = useState('');
    const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!isOpen) {
            // Reset local form state when the modal closes, not a derived render value.
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setEditingAllocation(null);
            setIsCreating(false);
            setFormData(EMPTY_FORM);
            setSearchTerm('');
            setDeleteConfirmId(null);
            setError('');
        }
    }, [isOpen]);

    const filteredAllocations = (allocations || []).filter((a) => {
        if (!searchTerm) {
            return true;
        }

        const term = searchTerm.toLowerCase();

        return (
            (a.service || '').toLowerCase().includes(term) ||
            (a.discharge_port || '').toLowerCase().includes(term) ||
            (a.location || '').toLowerCase().includes(term) ||
            (a.iso_basic_length || '').toLowerCase().includes(term) ||
            (a.reefer_type || '').toLowerCase().includes(term)
        );
    });

    const handleEdit = (allocation: Allocation) => {
        setEditingAllocation(allocation.id);
        setIsCreating(false);
        setFormData({
            service: allocation.service || '',
            discharge_port: allocation.discharge_port || '',
            iso_basic_length: allocation.iso_basic_length || '',
            reefer_type: allocation.reefer_type || '',
            location: allocation.location || '',
        });
        setError('');
    };

    const handleCreate = () => {
        setIsCreating(true);
        setEditingAllocation(null);
        setFormData(EMPTY_FORM);
        setError('');
    };

    const handleCancel = () => {
        setEditingAllocation(null);
        setIsCreating(false);
        setFormData(EMPTY_FORM);
        setError('');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.location?.trim()) {
            setError('Location is required.');

            return;
        }

        setSaving(true);
        setError('');

        try {
            if (isCreating) {
                await onAllocationCreate(formData);
            } else if (editingAllocation !== null) {
                await onAllocationUpdate(editingAllocation, formData);
            }

            handleCancel();
        } catch (err) {
            setError(
                err instanceof ApiError
                    ? err.message
                    : 'Failed to save. Please try again.',
            );
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: number) => {
        setSaving(true);

        try {
            await onAllocationDelete(id);
            setDeleteConfirmId(null);
        } catch {
            setError('Failed to delete allocation.');
        } finally {
            setSaving(false);
        }
    };

    if (!isOpen) {
        return null;
    }

    const showForm = isCreating || editingAllocation !== null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="flex max-h-[90vh] w-full max-w-4xl flex-col rounded-2xl bg-white shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between border-b px-6 py-4">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">
                            Allocation Management
                        </h2>
                        <p className="text-sm text-gray-500">
                            {(allocations || []).length} allocation
                            {(allocations || []).length !== 1 ? 's' : ''} total
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="rounded-lg p-2 transition-colors hover:bg-gray-100"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Toolbar */}
                <div className="flex items-center gap-3 border-b bg-gray-50 px-6 py-3">
                    <div className="relative max-w-xs flex-1">
                        <Search
                            size={16}
                            className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400"
                        />
                        <input
                            type="text"
                            placeholder="Search allocations..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full rounded-lg border border-gray-200 py-2 pr-3 pl-9 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                    </div>
                    {!showForm && (
                        <button
                            onClick={handleCreate}
                            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
                        >
                            <Plus size={16} />
                            Add Allocation
                        </button>
                    )}
                </div>

                {error && (
                    <div className="mx-6 mt-3 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
                        {error}
                    </div>
                )}

                {/* Create / Edit Form */}
                {showForm && (
                    <form
                        onSubmit={handleSubmit}
                        className="border-b bg-blue-50 px-6 py-4"
                    >
                        <h3 className="mb-3 text-sm font-semibold text-blue-800">
                            {isCreating ? 'New Allocation' : 'Edit Allocation'}
                        </h3>
                        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                            <div>
                                <label className="mb-1 block text-xs font-medium text-gray-600">
                                    Service
                                </label>
                                <input
                                    type="text"
                                    value={formData.service ?? ''}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            service: e.target.value,
                                        })
                                    }
                                    placeholder="e.g. AEX1"
                                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="mb-1 block text-xs font-medium text-gray-600">
                                    Discharge Port
                                </label>
                                <input
                                    type="text"
                                    value={formData.discharge_port ?? ''}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            discharge_port: e.target.value,
                                        })
                                    }
                                    placeholder="e.g. SGSIN"
                                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="mb-1 block text-xs font-medium text-gray-600">
                                    ISO Basic Length
                                </label>
                                <input
                                    type="text"
                                    value={formData.iso_basic_length ?? ''}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            iso_basic_length: e.target.value,
                                        })
                                    }
                                    placeholder="e.g. 20 / 40"
                                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="mb-1 block text-xs font-medium text-gray-600">
                                    Reefer Type
                                </label>
                                <input
                                    type="text"
                                    value={formData.reefer_type ?? ''}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            reefer_type: e.target.value,
                                        })
                                    }
                                    placeholder="e.g. REEFER / DRY"
                                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="mb-1 block text-xs font-medium text-gray-600">
                                    Location{' '}
                                    <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.location ?? ''}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            location: e.target.value,
                                        })
                                    }
                                    placeholder="e.g. Block A"
                                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                />
                            </div>
                        </div>
                        <div className="mt-3 flex gap-2">
                            <button
                                type="submit"
                                disabled={saving}
                                className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
                            >
                                <Save size={14} />
                                {saving ? 'Saving...' : 'Save'}
                            </button>
                            <button
                                type="button"
                                onClick={handleCancel}
                                className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                            >
                                <XCircle size={14} />
                                Cancel
                            </button>
                        </div>
                    </form>
                )}

                {/* Table */}
                <div className="flex-1 overflow-auto">
                    <table className="w-full text-sm">
                        <thead className="sticky top-0 bg-gray-50">
                            <tr>
                                <th className="border-b px-4 py-3 text-left font-semibold text-gray-600">
                                    Service
                                </th>
                                <th className="border-b px-4 py-3 text-left font-semibold text-gray-600">
                                    Discharge Port
                                </th>
                                <th className="border-b px-4 py-3 text-left font-semibold text-gray-600">
                                    ISO Length
                                </th>
                                <th className="border-b px-4 py-3 text-left font-semibold text-gray-600">
                                    Reefer Type
                                </th>
                                <th className="border-b px-4 py-3 text-left font-semibold text-gray-600">
                                    Location
                                </th>
                                <th className="border-b px-4 py-3 text-right font-semibold text-gray-600">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredAllocations.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={6}
                                        className="py-10 text-center text-gray-400"
                                    >
                                        {searchTerm
                                            ? 'No allocations match your search.'
                                            : 'No allocations yet. Click "Add Allocation" to create one.'}
                                    </td>
                                </tr>
                            ) : (
                                filteredAllocations.map((allocation) => (
                                    <tr
                                        key={allocation.id}
                                        className={`border-b transition-colors hover:bg-gray-50 ${editingAllocation === allocation.id ? 'bg-blue-50' : ''}`}
                                    >
                                        <td className="px-4 py-3 font-medium text-gray-900">
                                            {allocation.service || (
                                                <span className="text-gray-300">
                                                    —
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-gray-700">
                                            {allocation.discharge_port || (
                                                <span className="text-gray-300">
                                                    —
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-gray-700">
                                            {allocation.iso_basic_length || (
                                                <span className="text-gray-300">
                                                    —
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-gray-700">
                                            {allocation.reefer_type || (
                                                <span className="text-gray-300">
                                                    —
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 font-semibold text-indigo-700">
                                            {allocation.location}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            {deleteConfirmId ===
                                            allocation.id ? (
                                                <div className="flex items-center justify-end gap-2">
                                                    <span className="text-xs text-gray-500">
                                                        Delete?
                                                    </span>
                                                    <button
                                                        onClick={() =>
                                                            handleDelete(
                                                                allocation.id,
                                                            )
                                                        }
                                                        disabled={saving}
                                                        className="rounded bg-red-600 px-2 py-1 text-xs text-white hover:bg-red-700 disabled:opacity-50"
                                                    >
                                                        Yes
                                                    </button>
                                                    <button
                                                        onClick={() =>
                                                            setDeleteConfirmId(
                                                                null,
                                                            )
                                                        }
                                                        className="rounded bg-gray-200 px-2 py-1 text-xs text-gray-700 hover:bg-gray-300"
                                                    >
                                                        No
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="flex items-center justify-end gap-1">
                                                    <button
                                                        onClick={() =>
                                                            handleEdit(
                                                                allocation,
                                                            )
                                                        }
                                                        className="rounded-lg p-1.5 text-blue-600 transition-colors hover:bg-blue-50"
                                                        title="Edit"
                                                    >
                                                        <Pencil size={14} />
                                                    </button>
                                                    <button
                                                        onClick={() =>
                                                            setDeleteConfirmId(
                                                                allocation.id,
                                                            )
                                                        }
                                                        className="rounded-lg p-1.5 text-red-500 transition-colors hover:bg-red-50"
                                                        title="Delete"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
