import { Head, Link } from '@inertiajs/react';
import { ArrowRight } from 'lucide-react';
import type { ReactNode } from 'react';
import { Card } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import PortalLayout from '@/layouts/portal-layout';
import { portalModules } from '@/lib/modules';

function Home() {
    return (
        <div className="min-h-full bg-neutral-50 px-4 py-6 sm:px-6 sm:py-10">
            <Head title="DICT Portal" />

            <PageHeader
                title="Modules"
                subtitle="Pick a module to get started."
            />

            <div className="mt-6 grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-4 sm:mt-8">
                {portalModules.map((module) => {
                    const Icon = module.icon;

                    return (
                        <Link
                            key={module.href}
                            href={module.href}
                            className="group rounded-lg focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-50 focus-visible:outline-none"
                        >
                            <Card interactive className="flex h-full flex-col">
                                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-600 transition-colors group-hover:bg-brand-100 group-focus-visible:bg-brand-100">
                                    <Icon className="h-5 w-5" />
                                </div>
                                <h2 className="mb-1 font-semibold text-neutral-900">
                                    {module.name}
                                </h2>
                                <p className="flex-1 text-sm text-neutral-500">
                                    {module.description}
                                </p>
                                <div className="mt-4 flex justify-end">
                                    <ArrowRight className="h-4 w-4 translate-x-0 text-brand-600 opacity-100 transition-all duration-150 sm:-translate-x-1 sm:opacity-0 sm:group-hover:translate-x-0 sm:group-hover:opacity-100 sm:group-focus-visible:translate-x-0 sm:group-focus-visible:opacity-100" />
                                </div>
                            </Card>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}

Home.layout = (page: ReactNode) => <PortalLayout>{page}</PortalLayout>;

export default Home;
