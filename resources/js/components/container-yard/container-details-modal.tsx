import { Plug, X, Zap } from 'lucide-react';
import { useEffect, useState } from 'react';
import { containerYardApi } from '@/lib/container-yard-api';
import type { Container } from '@/types/container-yard';

function toBoolean(value: unknown): boolean {
    if (value === null || value === undefined) {
        return false;
    }

    if (typeof value === 'boolean') {
        return value;
    }

    if (typeof value === 'number') {
        return value !== 0;
    }

    if (typeof value === 'string') {
        return ['1', 'true', 'yes', 'on'].includes(value.toLowerCase());
    }

    return !!value;
}

type ContainerDetailsModalProps = {
    container?: Container | null;
    isOpen?: boolean;
    onClose?: () => void;
};

export default function ContainerDetailsModal({
    container = null,
    isOpen = false,
    onClose = () => {},
}: ContainerDetailsModalProps) {
    const [detailedContainer, setDetailedContainer] =
        useState<Container | null>(null);

    useEffect(() => {
        if (!isOpen || !container?.id) {
            // Reset local state when the modal closes, not a derived render value.
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setDetailedContainer(null);

            return;
        }

        // Fetch fresher container detail from the server than what the grid cell held.
        containerYardApi
            .getContainer(container.id)
            .then(setDetailedContainer)
            .catch((err) => {
                console.error('Error loading detailed container:', err);
                setDetailedContainer(container);
            });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, container?.id]);

    if (!isOpen || !container) {
        return null;
    }

    const displayContainer = detailedContainer || container;
    const requiresPower = toBoolean(displayContainer.requires_power);
    const isPowered = toBoolean(displayContainer.is_powered);

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4">
            <div className="max-h-[90vh] w-full max-w-6xl overflow-y-auto rounded-lg bg-white shadow-2xl">
                <div className="sticky top-0 flex items-center justify-between border-b bg-blue-600 p-4 text-white shadow-md">
                    <h2 className="text-xl font-bold">
                        Container: {container.container || 'N/A'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="rounded-lg p-2 transition-colors hover:bg-blue-700"
                    >
                        <X size={24} />
                    </button>
                </div>

                <div className="p-4">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <div>
                            <label className="mb-1 block text-xs font-semibold text-gray-600">
                                Position
                            </label>
                            <div className="rounded bg-gray-100 px-2 py-1 font-mono text-sm">
                                {displayContainer.position || 'N/A'}
                            </div>
                        </div>

                        <div>
                            <label className="mb-1 block text-xs font-semibold text-gray-600">
                                Category
                            </label>
                            <div
                                className={`rounded px-2 py-1 text-xs font-semibold ${
                                    displayContainer.category === 'Import' ||
                                    displayContainer.category === 'IMPRT'
                                        ? 'bg-amber-100 text-amber-900'
                                        : displayContainer.category ===
                                                'Export' ||
                                            displayContainer.category ===
                                                'EXPRT'
                                          ? 'bg-blue-100 text-blue-900'
                                          : displayContainer.category ===
                                                  'Storage' ||
                                              displayContainer.category ===
                                                  'STRGE'
                                            ? 'bg-gray-100 text-gray-900'
                                            : 'bg-red-100 text-red-900'
                                }`}
                            >
                                {displayContainer.category || 'N/A'}
                            </div>
                        </div>

                        <div>
                            <label className="mb-1 block text-xs font-semibold text-gray-600">
                                ISO Type
                            </label>
                            <div className="rounded bg-gray-100 px-2 py-1 text-sm">
                                {displayContainer.iso_type || 'N/A'}
                            </div>
                        </div>

                        <div>
                            <label className="mb-1 block text-xs font-semibold text-gray-600">
                                Dwell Days
                            </label>
                            <div className="rounded bg-gray-100 px-2 py-1 text-sm">
                                {displayContainer.dwell_days ?? 'N/A'}
                            </div>
                        </div>

                        <div>
                            <label className="mb-1 block text-xs font-semibold text-gray-600">
                                Line Operator
                            </label>
                            <div className="rounded bg-gray-100 px-2 py-1 text-sm">
                                {displayContainer.line_op || 'N/A'}
                            </div>
                        </div>

                        <div>
                            <label className="mb-1 block text-xs font-semibold text-gray-600">
                                Condition
                            </label>
                            <div className="rounded bg-gray-100 px-2 py-1 text-sm">
                                {displayContainer.condition || 'N/A'}
                            </div>
                        </div>

                        <div>
                            <label className="mb-1 block text-xs font-semibold text-gray-600">
                                Transit State
                            </label>
                            <div className="rounded bg-gray-100 px-2 py-1 text-sm">
                                {displayContainer.transit_state || 'N/A'}
                            </div>
                        </div>

                        <div>
                            <label className="mb-1 block text-xs font-semibold text-gray-600">
                                POD
                            </label>
                            <div className="overflow-hidden rounded bg-gray-100 px-2 py-1 text-sm text-ellipsis">
                                {displayContainer.pod_place_name || 'N/A'}
                            </div>
                        </div>

                        <div>
                            <label className="mb-1 block text-xs font-semibold text-gray-600">
                                POL
                            </label>
                            <div className="overflow-hidden rounded bg-gray-100 px-2 py-1 text-sm text-ellipsis">
                                {displayContainer.pol_place_name || 'N/A'}
                            </div>
                        </div>

                        <div>
                            <label className="mb-1 block text-xs font-semibold text-gray-600">
                                Inbound Carrier
                            </label>
                            <div className="overflow-hidden rounded bg-gray-100 px-2 py-1 text-sm text-ellipsis">
                                {displayContainer.inbound_carrier_name || 'N/A'}
                            </div>
                        </div>

                        <div>
                            <label className="mb-1 block text-xs font-semibold text-gray-600">
                                Outbound Carrier
                            </label>
                            <div className="overflow-hidden rounded bg-gray-100 px-2 py-1 text-sm text-ellipsis">
                                {displayContainer.outbound_carrier_name ||
                                    'N/A'}
                            </div>
                        </div>

                        <div>
                            <label className="mb-1 block text-xs font-semibold text-gray-600">
                                Shipper
                            </label>
                            <div className="overflow-hidden rounded bg-gray-100 px-2 py-1 text-sm text-ellipsis">
                                {displayContainer.shipper || 'N/A'}
                            </div>
                        </div>

                        <div>
                            <label className="mb-1 block text-xs font-semibold text-gray-600">
                                Consignee
                            </label>
                            <div className="overflow-hidden rounded bg-gray-100 px-2 py-1 text-sm text-ellipsis">
                                {displayContainer.consignee || 'N/A'}
                            </div>
                        </div>

                        <div>
                            <label className="mb-1 block text-xs font-semibold text-gray-600">
                                Time In
                            </label>
                            <div className="rounded bg-gray-100 px-2 py-1 text-sm">
                                {displayContainer.time_in
                                    ? new Date(
                                          displayContainer.time_in,
                                      ).toLocaleString()
                                    : 'N/A'}
                            </div>
                        </div>
                    </div>

                    {displayContainer.notes && (
                        <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-3">
                            <label className="mb-1 block text-xs font-semibold text-gray-600">
                                Notes
                            </label>
                            <div className="text-sm whitespace-pre-wrap text-gray-900">
                                {displayContainer.notes}
                            </div>
                        </div>
                    )}

                    <div className="mt-4 flex items-center gap-6 rounded-lg border border-gray-200 bg-gray-50 p-3">
                        <div className="flex items-center gap-2">
                            <label className="text-xs font-semibold text-gray-600">
                                Requires Power:
                            </label>
                            <Zap
                                size={18}
                                className={
                                    requiresPower
                                        ? 'text-amber-500'
                                        : 'text-gray-300'
                                }
                                strokeWidth={2.5}
                            />
                        </div>

                        <div className="flex items-center gap-2">
                            <label className="text-xs font-semibold text-gray-600">
                                Is Powered:
                            </label>
                            <Plug
                                size={18}
                                className={
                                    isPowered
                                        ? 'text-green-500'
                                        : 'text-gray-300'
                                }
                                strokeWidth={2.5}
                            />
                        </div>
                    </div>

                    <div className="mt-4 flex justify-end border-t pt-4">
                        <button
                            onClick={onClose}
                            className="rounded bg-gray-300 px-4 py-2 text-sm font-semibold text-gray-900 transition-colors hover:bg-gray-400"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
