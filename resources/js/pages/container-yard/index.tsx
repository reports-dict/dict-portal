import { Head, Link, usePage } from '@inertiajs/react';
import {
    Container as ContainerIcon,
    Grid3x3,
    Package,
    Search,
    Settings,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import AdminAllocationManagement from '@/components/container-yard/admin-allocation-management';
import AdminBlockManagement from '@/components/container-yard/admin-block-management';
import BaySelector from '@/components/container-yard/bay-selector';
import BayStackingView from '@/components/container-yard/bay-stacking-view';
import BlockGridSelector from '@/components/container-yard/block-grid-selector';
import ContainerDetailsModal from '@/components/container-yard/container-details-modal';
import { Button } from '@/components/ui/button';
import { FullscreenButton } from '@/components/ui/fullscreen-button';
import { PageHeader } from '@/components/ui/page-header';
import { useBlocks } from '@/hooks/use-blocks';
import { useContainers } from '@/hooks/use-containers';
import { useFullscreen } from '@/hooks/use-fullscreen';
import PortalLayout from '@/layouts/portal-layout';
import { containerYardApi } from '@/lib/container-yard-api';
import { hasModulePermission } from '@/lib/permissions';
import type { Allocation, Block, Container } from '@/types/container-yard';

function ContainerYard() {
    const { isFullscreen, toggle } = useFullscreen();
    const { permittedModules } = usePage<{
        permittedModules: string[] | null;
    }>().props;
    const canManageBlocks = hasModulePermission(
        permittedModules,
        'container-yard-blocks',
    );
    const canManageAllocations = hasModulePermission(
        permittedModules,
        'container-yard-allocations',
    );
    const [selectedBlock, setSelectedBlock] = useState('');
    const {
        containers,
        loading: containersLoading,
        error: containersError,
    } = useContainers(selectedBlock || null);
    const { blocks } = useBlocks();

    const [selectedContainer, setSelectedContainer] =
        useState<Container | null>(null);
    const [selectedBay, setSelectedBay] = useState<{
        block: string;
        bay: number;
        blockObj: Block;
    } | null>(null);
    const [selectedBayFromDropdown, setSelectedBayFromDropdown] = useState<
        number | null
    >(null);
    const [detailedViewBlock, setDetailedViewBlock] = useState<string | null>(
        null,
    );
    const [showAdminMenu, setShowAdminMenu] = useState(false);
    const [showBlockManagement, setShowBlockManagement] = useState(false);
    const [showAllocationManagement, setShowAllocationManagement] =
        useState(false);
    const [allocations, setAllocations] = useState<Allocation[]>([]);

    useEffect(() => {
        if (!showAllocationManagement) {
            return;
        }

        // Loading the allocation list for the management modal, triggered by opening it.
        containerYardApi
            .getAllocations({ per_page: 200 })
            .then((res) => setAllocations(res.data || []))
            .catch(console.error);
    }, [showAllocationManagement]);

    const handleBlockSelect = (blockName: string) => {
        if (detailedViewBlock === blockName) {
            setDetailedViewBlock(null);
            setSelectedBlock('');
            setSelectedBayFromDropdown(null);
        } else {
            setDetailedViewBlock(blockName);
            setSelectedBlock(blockName);
            setSelectedBayFromDropdown(null);
        }
    };

    const handleBaySelect = (bay: number) => {
        const block = blocks.find((b) => b.name === detailedViewBlock);

        if (block) {
            setSelectedBay({ block: block.name, bay, blockObj: block });
            setSelectedBayFromDropdown(bay);
        }
    };

    return (
        <div className="min-h-full bg-neutral-50">
            <Head title="Container Yard" />

            {/* Main Content */}
            <main className="w-full px-3 py-4 sm:px-4 lg:px-6 lg:py-6">
                <PageHeader
                    title="Container Yard"
                    subtitle="Container tracking and yard visualization"
                    icon={ContainerIcon}
                    actions={
                        <>
                            <Link
                                href="/container-yard/search"
                                className="flex items-center gap-2 rounded-lg border border-brand-200 bg-brand-50 px-4 py-2 font-medium text-brand-700 transition-colors hover:bg-brand-100"
                            >
                                <Search size={18} />
                                <span>Quick Search</span>
                            </Link>

                            {(canManageBlocks || canManageAllocations) && (
                                <div className="relative">
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        onClick={() =>
                                            setShowAdminMenu(!showAdminMenu)
                                        }
                                        title="Settings"
                                    >
                                        <Settings size={18} />
                                    </Button>

                                    {showAdminMenu && (
                                        <div className="absolute right-0 z-50 mt-2 w-56 rounded-lg border border-neutral-200 bg-white py-1 shadow-lg">
                                            {canManageBlocks && (
                                                <button
                                                    onClick={() => {
                                                        setShowBlockManagement(
                                                            true,
                                                        );
                                                        setShowAdminMenu(false);
                                                    }}
                                                    className="flex w-full items-center gap-3 px-4 py-2 text-sm text-neutral-700 transition-colors hover:bg-brand-50"
                                                >
                                                    <Grid3x3 size={16} />
                                                    Manage Blocks
                                                </button>
                                            )}
                                            {canManageAllocations && (
                                                <button
                                                    onClick={() => {
                                                        setShowAllocationManagement(
                                                            true,
                                                        );
                                                        setShowAdminMenu(false);
                                                    }}
                                                    className="flex w-full items-center gap-3 px-4 py-2 text-sm text-neutral-700 transition-colors hover:bg-brand-50"
                                                >
                                                    <Package size={16} />
                                                    Manage Allocations
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}

                            <FullscreenButton
                                variant="light"
                                isFullscreen={isFullscreen}
                                onToggle={toggle}
                            />
                        </>
                    }
                />

                <div className="mt-6">
                    {containersError && (
                        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">
                            Error loading containers: {containersError}
                        </div>
                    )}

                    {containersLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <p className="text-gray-600">
                                Loading containers...
                            </p>
                        </div>
                    ) : (
                        <>
                            {/* Block and Bay Selectors */}
                            <div className="mb-6 flex flex-col gap-4 md:flex-row md:gap-6">
                                <div className="flex-1">
                                    <BlockGridSelector
                                        blocks={blocks}
                                        detailedViewBlock={detailedViewBlock}
                                        onBlockSelect={handleBlockSelect}
                                    />
                                </div>

                                {detailedViewBlock && (
                                    <div className="flex-1">
                                        <BaySelector
                                            block={blocks.find(
                                                (b) =>
                                                    b.name ===
                                                    detailedViewBlock,
                                            )}
                                            selectedBay={
                                                selectedBayFromDropdown
                                            }
                                            onBaySelect={handleBaySelect}
                                        />
                                    </div>
                                )}
                            </div>

                            {selectedBay && (
                                <BayStackingView
                                    blockName={selectedBay.block}
                                    bayNumber={selectedBay.bay}
                                    block={selectedBay.blockObj}
                                    containers={containers}
                                    onClose={() => setSelectedBay(null)}
                                    onContainerClick={setSelectedContainer}
                                />
                            )}

                            {!detailedViewBlock && containers.length > 0 && (
                                <div className="rounded-lg bg-white p-12 text-center shadow-md">
                                    <ContainerIcon
                                        className="mx-auto mb-4 text-gray-400"
                                        size={48}
                                    />
                                    <p className="mb-2 text-lg font-semibold text-gray-900">
                                        Select a block and bay to view details
                                    </p>
                                    <p className="text-gray-600">
                                        Use the dropdowns above to select a
                                        block and bay
                                    </p>
                                </div>
                            )}

                            {!selectedBay &&
                                detailedViewBlock &&
                                containers.length > 0 && (
                                    <div className="rounded-lg bg-white p-12 text-center shadow-md">
                                        <ContainerIcon
                                            className="mx-auto mb-4 text-gray-400"
                                            size={48}
                                        />
                                        <p className="mb-2 text-lg font-semibold text-gray-900">
                                            Select a bay to view stacking
                                            details
                                        </p>
                                        <p className="text-gray-600">
                                            Use the bay dropdown to select a bay
                                        </p>
                                    </div>
                                )}

                            {containers.length === 0 && (
                                <div className="rounded-lg bg-white p-12 text-center shadow-md">
                                    <Package
                                        className="mx-auto mb-4 text-gray-400"
                                        size={48}
                                    />
                                    <p className="mb-2 text-lg font-semibold text-gray-900">
                                        No containers found
                                    </p>
                                    <p className="text-gray-600">
                                        Add containers to the system to get
                                        started
                                    </p>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </main>

            {/* Modals */}
            {selectedContainer && (
                <ContainerDetailsModal
                    container={selectedContainer}
                    isOpen={true}
                    onClose={() => setSelectedContainer(null)}
                />
            )}

            {showBlockManagement && (
                <AdminBlockManagement
                    isOpen={true}
                    onClose={() => setShowBlockManagement(false)}
                    blocks={blocks}
                    onBlockCreate={async (data) => {
                        try {
                            await containerYardApi.createBlock(data);
                            window.location.reload();
                        } catch (error) {
                            console.error('Failed to create block:', error);
                        }
                    }}
                    onBlockUpdate={async (id, data) => {
                        try {
                            await containerYardApi.updateBlock(id, data);
                            window.location.reload();
                        } catch (error) {
                            console.error('Failed to update block:', error);
                        }
                    }}
                />
            )}

            {showAllocationManagement && (
                <AdminAllocationManagement
                    isOpen={true}
                    onClose={() => setShowAllocationManagement(false)}
                    allocations={allocations}
                    onAllocationCreate={async (data) => {
                        await containerYardApi.createAllocation(data);
                        const res = await containerYardApi.getAllocations({
                            per_page: 200,
                        });
                        setAllocations(res.data || []);
                    }}
                    onAllocationUpdate={async (id, data) => {
                        await containerYardApi.updateAllocation(id, data);
                        const res = await containerYardApi.getAllocations({
                            per_page: 200,
                        });
                        setAllocations(res.data || []);
                    }}
                    onAllocationDelete={async (id) => {
                        await containerYardApi.deleteAllocation(id);
                        setAllocations((prev) =>
                            prev.filter((a) => a.id !== id),
                        );
                    }}
                />
            )}
        </div>
    );
}

ContainerYard.layout = (page: ReactNode) => <PortalLayout>{page}</PortalLayout>;

export default ContainerYard;
