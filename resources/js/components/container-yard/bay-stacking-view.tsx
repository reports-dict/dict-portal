import { Plug, Zap } from 'lucide-react';
import { MAX_TIERS, parsePosition } from '@/lib/position-parser';
import type { Block, Container } from '@/types/container-yard';

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

function truncateTo24Chars(text: string | null | undefined): string {
    if (!text) {
        return '';
    }

    return text.length > 15 ? text.substring(0, 15) : text;
}

function getCategoryColor(category: string | null | undefined): string {
    switch (category) {
        case 'Import':
        case 'IMPRT':
            return 'bg-amber-700';
        case 'Export':
        case 'EXPRT':
            return 'bg-blue-500';
        case 'Storage':
        case 'STRGE':
            return 'bg-gray-500';
        case 'Transship':
        case 'TRSHP':
            return 'bg-red-400';
        default:
            return 'bg-gray-400';
    }
}

function getCategoryLabel(category: string | null | undefined): string {
    switch (category) {
        case 'Import':
        case 'IMPRT':
            return 'Import';
        case 'Export':
        case 'EXPRT':
            return 'Export';
        case 'Storage':
        case 'STRGE':
            return 'Storage';
        case 'Transship':
        case 'TRSHP':
            return 'Transship';
        default:
            return 'Unknown';
    }
}

/**
 * A container is hanging if it's in tier 2+ and there's no container in the tier directly below it.
 */
function isContainerHanging(
    containersByPosition: Map<string, Container>,
    row: string,
    tier: number,
): boolean {
    if (tier <= 1) {
        return false;
    }

    return !containersByPosition.has(`${row}-${tier - 1}`);
}

type BayStackingViewProps = {
    blockName?: string;
    bayNumber?: number;
    containers?: Container[];
    block?: Block | null;
    onContainerClick?: (container: Container) => void;
    onClose?: () => void;
};

export default function BayStackingView({
    blockName = '',
    bayNumber = 1,
    containers = [],
    block = null,
    onContainerClick = () => {},
    onClose = () => {},
}: BayStackingViewProps) {
    const rows = block
        ? Array.from(
              {
                  length:
                      block.row_end.charCodeAt(0) -
                      block.row_start.charCodeAt(0) +
                      1,
              },
              (_, i) => String.fromCharCode(block.row_start.charCodeAt(0) + i),
          )
        : ['A', 'B', 'C', 'D', 'E', 'F'];

    const containersByPosition = new Map<string, Container>();

    containers.forEach((container) => {
        const parsed = parsePosition(container.position);

        if (parsed && parsed.block === blockName && parsed.bay === bayNumber) {
            containersByPosition.set(`${parsed.row}-${parsed.tier}`, container);
        }
    });

    const hangingContainers: string[] = [];
    containersByPosition.forEach((_container, key) => {
        const [row, tier] = key.split('-');

        if (isContainerHanging(containersByPosition, row, parseInt(tier))) {
            hangingContainers.push(key);
        }
    });
    const totalHangingContainers = hangingContainers.length;

    return (
        <div className="mb-6 rounded-lg bg-white p-6 shadow-md">
            {/* Header with Back Button */}
            <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <h2 className="text-2xl font-bold text-gray-900">
                        {blockName} - Row {bayNumber}
                    </h2>
                    {totalHangingContainers > 0 && (
                        <span className="inline-flex animate-pulse items-center gap-1 rounded-full border border-red-300 bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
                            <span>⚠️</span>
                            <span>
                                {totalHangingContainers} hanging container
                                {totalHangingContainers !== 1 ? 's' : ''}
                            </span>
                        </span>
                    )}
                </div>
                <button
                    onClick={onClose}
                    className="rounded-lg bg-gray-200 px-4 py-2 font-semibold text-gray-900 transition-colors hover:bg-gray-300"
                >
                    ← Back
                </button>
            </div>

            {/* Grid Container */}
            <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300 bg-gray-50">
                    <thead>
                        <tr>
                            <th className="w-16 border border-gray-300 bg-gray-200 px-4 py-3 font-semibold text-gray-900">
                                Tier
                            </th>
                            {rows.map((row) => (
                                <th
                                    key={row}
                                    className="border border-gray-300 bg-gray-200 px-8 py-3 text-center font-semibold text-gray-900"
                                >
                                    {row}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {Array.from(
                            { length: MAX_TIERS },
                            (_, i) => MAX_TIERS - i,
                        ).map((tier) => (
                            <tr key={tier}>
                                <td className="w-16 border border-gray-300 bg-gray-200 px-4 py-3 text-center font-semibold text-gray-900">
                                    {tier}
                                </td>
                                {rows.map((row) => {
                                    const key = `${row}-${tier}`;
                                    const container =
                                        containersByPosition.get(key);

                                    return (
                                        <td
                                            key={key}
                                            className="h-28 border border-gray-300 bg-gray-100 p-2"
                                        >
                                            {container ? (
                                                <button
                                                    onClick={() =>
                                                        onContainerClick(
                                                            container,
                                                        )
                                                    }
                                                    className={`relative flex h-full w-full cursor-pointer items-center justify-center rounded ${getCategoryColor(
                                                        container.category,
                                                    )} p-2 text-white transition-opacity hover:opacity-90 ${
                                                        isContainerHanging(
                                                            containersByPosition,
                                                            row,
                                                            tier,
                                                        )
                                                            ? 'ring-2 ring-red-500 ring-inset'
                                                            : ''
                                                    }`}
                                                    title={`${container.container} - ${getCategoryLabel(container.category)}${
                                                        isContainerHanging(
                                                            containersByPosition,
                                                            row,
                                                            tier,
                                                        )
                                                            ? ' - ⚠️ HANGING CONTAINER'
                                                            : ''
                                                    }`}
                                                >
                                                    {/* Power Indicators */}
                                                    <div className="absolute top-1 left-1 flex flex-col gap-0.5">
                                                        <div
                                                            className={`rounded p-0.5 ${toBoolean(container.requires_power) ? 'bg-amber-500' : 'bg-gray-300'}`}
                                                        >
                                                            <Zap
                                                                size={12}
                                                                className="text-white"
                                                                strokeWidth={
                                                                    2.5
                                                                }
                                                            />
                                                        </div>
                                                        <div
                                                            className={`rounded p-0.5 ${toBoolean(container.is_powered) ? 'bg-green-500' : 'bg-gray-300'}`}
                                                        >
                                                            <Plug
                                                                size={12}
                                                                className="text-white"
                                                                strokeWidth={
                                                                    2.5
                                                                }
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="text-center">
                                                        <div className="truncate text-xs font-bold">
                                                            {
                                                                container.container
                                                            }
                                                        </div>
                                                        <div className="mt-1 text-xs">
                                                            {getCategoryLabel(
                                                                container.category,
                                                            )}
                                                        </div>
                                                        <div className="mt-1 text-xs opacity-90">
                                                            {container.iso_type ||
                                                                'N/A'}
                                                        </div>
                                                        {container.line_op && (
                                                            <div className="mt-0.5 text-xs opacity-75">
                                                                {
                                                                    container.line_op
                                                                }
                                                            </div>
                                                        )}
                                                        {(container.category ===
                                                            'Export' ||
                                                            container.category ===
                                                                'EXPRT') &&
                                                            container.shipper && (
                                                                <div
                                                                    className="mt-1 truncate text-xs opacity-85"
                                                                    title={
                                                                        container.shipper
                                                                    }
                                                                >
                                                                    {truncateTo24Chars(
                                                                        container.shipper,
                                                                    )}
                                                                </div>
                                                            )}
                                                        {(container.category ===
                                                            'Import' ||
                                                            container.category ===
                                                                'IMPRT') &&
                                                            container.consignee && (
                                                                <div
                                                                    className="mt-1 truncate text-xs opacity-85"
                                                                    title={
                                                                        container.consignee
                                                                    }
                                                                >
                                                                    {truncateTo24Chars(
                                                                        container.consignee,
                                                                    )}
                                                                </div>
                                                            )}
                                                    </div>
                                                </button>
                                            ) : null}
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Legend */}
            <div className="mt-6 flex flex-wrap justify-center gap-6 rounded-lg border border-gray-200 bg-gray-50 p-4">
                <div className="flex items-center gap-2">
                    <div className="h-4 w-4 rounded bg-amber-700"></div>
                    <span className="text-sm text-gray-700">Import</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="h-4 w-4 rounded bg-blue-500"></div>
                    <span className="text-sm text-gray-700">Export</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="h-4 w-4 rounded bg-gray-500"></div>
                    <span className="text-sm text-gray-700">Storage</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="h-4 w-4 rounded bg-red-400"></div>
                    <span className="text-sm text-gray-700">Transship</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="h-4 w-4 rounded border-2 border-red-500 bg-white"></div>
                    <span className="text-sm text-gray-700">
                        Hanging Container
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="rounded bg-amber-500 p-0.5">
                        <Zap
                            size={12}
                            className="text-white"
                            strokeWidth={2.5}
                        />
                    </div>
                    <span className="text-sm text-gray-700">
                        Requires Power
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="rounded bg-green-500 p-0.5">
                        <Plug
                            size={12}
                            className="text-white"
                            strokeWidth={2.5}
                        />
                    </div>
                    <span className="text-sm text-gray-700">Is Powered</span>
                </div>
            </div>
        </div>
    );
}
