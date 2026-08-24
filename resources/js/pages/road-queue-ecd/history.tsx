import { Head, router } from '@inertiajs/react';
import { Truck } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import RoadQueueController from '@/actions/App/Http/Controllers/RoadQueueEcd/RoadQueueController';
import { CsvExportButton } from '@/components/road-queue/csv-export-button';
import { HighElapsedTransactionsTable } from '@/components/road-queue/high-elapsed-transactions-table';
import { TatHistoryFilterBar } from '@/components/road-queue/tat-history-filter-bar';
import { TatHistoryTable } from '@/components/road-queue/tat-history-table';
import { TransactionsFilterBar } from '@/components/road-queue/transactions-filter-bar';
import { Card } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { Pagination } from '@/components/ui/pagination';
import PortalLayout from '@/layouts/portal-layout';
import type {
    HighElapsedTransactionRow,
    Paginated,
    RoadQueueEcdHistoryFilters,
    TatHistoryRow,
} from '@/types/road-queue-history';

const categoryOptions = [{ value: 'STRGE', label: 'Storage' }];

type RoadQueueEcdHistoryProps = {
    tatHistory: Paginated<TatHistoryRow>;
    transactions: Paginated<HighElapsedTransactionRow>;
    filters: RoadQueueEcdHistoryFilters;
};

function RoadQueueEcdHistory({
    tatHistory,
    transactions,
    filters,
}: RoadQueueEcdHistoryProps) {
    const [container, setContainer] = useState(filters.tx_container);
    const skipNextDebounce = useRef(false);

    // Changing a filter always resets pagination for both tables to page 1
    // (neither tat_page nor tx_page is part of `filters`, so omitting them
    // here means Laravel's paginator naturally defaults back to page 1).
    function navigate(overrides: Partial<RoadQueueEcdHistoryFilters>) {
        const next = { ...filters, ...overrides };

        router.get(
            RoadQueueController.history.url({
                query: Object.fromEntries(
                    Object.entries(next).filter(([, value]) => value !== ''),
                ),
            }),
            {},
            { preserveState: true, preserveScroll: true, replace: true },
        );
    }

    useEffect(() => {
        if (skipNextDebounce.current) {
            skipNextDebounce.current = false;

            return;
        }

        if (container === filters.tx_container) {
            return;
        }

        const timeout = setTimeout(
            () => navigate({ tx_container: container }),
            400,
        );

        return () => clearTimeout(timeout);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [container]);

    function clearTatFilters() {
        navigate({ tat_shift: '', tat_from: '', tat_to: '' });
    }

    function clearTransactionFilters() {
        skipNextDebounce.current = true;
        setContainer('');
        navigate({ tx_container: '', tx_category: '' });
    }

    // Paginating one table preserves the other table's current page —
    // both are read from server state, not from `filters`.
    function getTatPageUrl(page: number) {
        return RoadQueueController.history.url({
            query: Object.fromEntries(
                Object.entries({
                    ...filters,
                    tat_page: page,
                    tx_page: transactions.current_page,
                }).filter(([, value]) => value !== ''),
            ),
        });
    }

    function getTransactionsPageUrl(page: number) {
        return RoadQueueController.history.url({
            query: Object.fromEntries(
                Object.entries({
                    ...filters,
                    tx_page: page,
                    tat_page: tatHistory.current_page,
                }).filter(([, value]) => value !== ''),
            ),
        });
    }

    return (
        <>
            <Head title="Road Queue ECD — History" />
            <div className="space-y-6 p-4 sm:p-6">
                <PageHeader
                    icon={Truck}
                    title="Road Queue ECD — History"
                    subtitle="TAT history and high-elapsed transactions captured from the terminal operations system."
                />

                <section>
                    <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <h2 className="text-lg font-bold text-neutral-900">
                                TAT History
                            </h2>
                            <p className="text-sm text-neutral-500">
                                Average turnaround time per shift.
                            </p>
                        </div>
                        <CsvExportButton
                            url={RoadQueueController.exportTatHistory.url({
                                query: Object.fromEntries(
                                    Object.entries(filters).filter(
                                        ([, value]) => value !== '',
                                    ),
                                ),
                            })}
                            filename="road-queue-ecd-tat-history.csv"
                        />
                    </div>
                    <Card>
                        <TatHistoryFilterBar
                            filters={{ ...filters, tat_status: '' }}
                            onFilterChange={navigate}
                            onClear={clearTatFilters}
                        />
                        <TatHistoryTable rows={tatHistory.data} />
                        <div className="mt-4 flex items-center justify-between">
                            <p className="text-xs text-neutral-500">
                                Showing {tatHistory.from ?? 0}–
                                {tatHistory.to ?? 0} of {tatHistory.total}
                            </p>
                            <Pagination
                                currentPage={tatHistory.current_page}
                                lastPage={tatHistory.last_page}
                                getPageUrl={getTatPageUrl}
                            />
                        </div>
                    </Card>
                </section>

                <section>
                    <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <h2 className="text-lg font-bold text-neutral-900">
                                High-Elapsed Transactions
                            </h2>
                            <p className="text-sm text-neutral-500">
                                Transactions that stayed elapsed 1 hour or more.
                            </p>
                        </div>
                        <CsvExportButton
                            url={RoadQueueController.exportHighElapsedTransactions.url(
                                {
                                    query: Object.fromEntries(
                                        Object.entries(filters).filter(
                                            ([, value]) => value !== '',
                                        ),
                                    ),
                                },
                            )}
                            filename="road-queue-ecd-high-elapsed-transactions.csv"
                        />
                    </div>
                    <Card>
                        <TransactionsFilterBar
                            container={container}
                            onContainerChange={setContainer}
                            filters={filters}
                            onFilterChange={navigate}
                            onClear={clearTransactionFilters}
                            categoryOptions={categoryOptions}
                        />
                        <HighElapsedTransactionsTable
                            rows={transactions.data}
                            dateColumnLabel="Truck Entered Yard"
                            dateColumnKey="truck_visit_entered_yard"
                            showTruckingCompany
                        />
                        <div className="mt-4 flex items-center justify-between">
                            <p className="text-xs text-neutral-500">
                                Showing {transactions.from ?? 0}–
                                {transactions.to ?? 0} of {transactions.total}
                            </p>
                            <Pagination
                                currentPage={transactions.current_page}
                                lastPage={transactions.last_page}
                                getPageUrl={getTransactionsPageUrl}
                            />
                        </div>
                    </Card>
                </section>
            </div>
        </>
    );
}

RoadQueueEcdHistory.layout = (page: ReactNode) => (
    <PortalLayout>{page}</PortalLayout>
);

export default RoadQueueEcdHistory;
