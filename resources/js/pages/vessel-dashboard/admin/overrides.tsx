import { Head, router } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import VesselAdminLayout from '@/layouts/vessel-admin-layout';
import type { DashboardData, Vessel } from '@/types/vessel-dashboard';

const OVERRIDE_FIELDS = [
    {
        key: 'total_planned_discharge',
        label: 'Total Planned Discharge',
        group: 'discharge',
    },
    {
        key: 'discharge_plan_fcl_20ft',
        label: 'Discharge FCL 20FT',
        group: 'discharge',
    },
    {
        key: 'discharge_plan_fcl_40ft',
        label: 'Discharge FCL 40FT',
        group: 'discharge',
    },
    {
        key: 'discharge_plan_mty_20ft',
        label: 'Discharge MTY 20FT',
        group: 'discharge',
    },
    {
        key: 'discharge_plan_mty_40ft',
        label: 'Discharge MTY 40FT',
        group: 'discharge',
    },
    {
        key: 'total_planned_loading_wi',
        label: 'Total Planned Loading',
        group: 'loading',
    },
    { key: 'load_plan_fcl_20ft', label: 'Loading FCL 20FT', group: 'loading' },
    { key: 'load_plan_fcl_40ft', label: 'Loading FCL 40FT', group: 'loading' },
    {
        key: 'load_plan_empty_20ft',
        label: 'Loading MTY 20FT',
        group: 'loading',
    },
    {
        key: 'load_plan_empty_40ft',
        label: 'Loading MTY 40FT',
        group: 'loading',
    },
] as const;

type OverrideKey = (typeof OVERRIDE_FIELDS)[number]['key'];

const LOADING_SUB_FIELDS: OverrideKey[] = [
    'load_plan_fcl_20ft',
    'load_plan_fcl_40ft',
    'load_plan_empty_20ft',
    'load_plan_empty_40ft',
];

function OverrideForm({
    vessel,
    onSaved,
    onCancel,
}: {
    vessel: Vessel;
    onSaved: () => void;
    onCancel: () => void;
}) {
    const initial = Object.fromEntries(
        OVERRIDE_FIELDS.map((f) => [f.key, String(vessel[f.key] ?? '')]),
    ) as Record<OverrideKey, string>;
    const [values, setValues] = useState(initial);
    const [saving, setSaving] = useState(false);

    const loadingSubFields = OVERRIDE_FIELDS.filter((f) =>
        LOADING_SUB_FIELDS.includes(f.key),
    );

    const autoSum = (vals: Record<OverrideKey, string>) =>
        LOADING_SUB_FIELDS.reduce((sum, k) => sum + (Number(vals[k]) || 0), 0);

    const handleChange = (key: OverrideKey, value: string) => {
        setValues((prev) => {
            const next = { ...prev, [key]: value };

            if (LOADING_SUB_FIELDS.includes(key)) {
                next.total_planned_loading_wi = String(autoSum(next));
            }

            return next;
        });
    };

    const handleSave = () => {
        setSaving(true);
        const body: Record<string, string | number | null> = {
            ob_ib_id: vessel.ob_ib_id,
        };
        OVERRIDE_FIELDS.filter((f) => f.group === 'loading').forEach((f) => {
            body[f.key] = values[f.key] === '' ? null : Number(values[f.key]);
        });
        router.post('/vessel-dashboard/admin/overrides', body, {
            preserveScroll: true,
            onFinish: () => setSaving(false),
            onSuccess: onSaved,
        });
    };

    const handleRemove = () => {
        setSaving(true);
        router.delete(
            `/vessel-dashboard/admin/overrides/${encodeURIComponent(vessel.ob_ib_id)}`,
            {
                preserveScroll: true,
                onFinish: () => setSaving(false),
                onSuccess: onSaved,
            },
        );
    };

    return (
        <div className="mt-3 rounded-xl border border-slate-700 bg-slate-800 p-6">
            <p className="mb-4 text-xs text-slate-400">
                Leave blank to use the live query value.
            </p>
            <p className="mb-2 text-xs font-bold tracking-widest text-cyan-400 uppercase">
                Loading
            </p>
            <div className="mb-3 grid grid-cols-2 gap-3">
                {loadingSubFields.map((f) => (
                    <label key={f.key} className="flex flex-col gap-1">
                        <span className="text-xs tracking-wider text-slate-400 uppercase">
                            {f.label}
                        </span>
                        <input
                            type="number"
                            min="0"
                            value={values[f.key]}
                            onChange={(e) =>
                                handleChange(f.key, e.target.value)
                            }
                            placeholder="Live data"
                            className="rounded-md border border-slate-600 bg-slate-900 px-3 py-1.5 text-sm text-white focus:border-cyan-500 focus:outline-none"
                        />
                    </label>
                ))}
            </div>
            <label className="mb-5 flex flex-col gap-1">
                <span className="text-xs tracking-wider text-slate-400 uppercase">
                    Total Planned Loading
                </span>
                <input
                    type="number"
                    readOnly
                    value={autoSum(values)}
                    className="cursor-not-allowed rounded-md border border-slate-700 bg-slate-900/60 px-3 py-1.5 text-sm font-bold text-cyan-300"
                />
            </label>
            <div className="flex gap-3">
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex-1 rounded-lg bg-cyan-600 py-2 text-sm font-bold tracking-widest text-white uppercase hover:bg-cyan-500 disabled:opacity-50"
                >
                    {saving ? 'Saving…' : 'Save Override'}
                </button>
                {vessel.has_override && (
                    <button
                        onClick={handleRemove}
                        disabled={saving}
                        className="rounded-lg bg-red-900/60 px-4 py-2 text-sm font-bold tracking-widest text-red-300 uppercase hover:bg-red-800"
                    >
                        Remove
                    </button>
                )}
                <button
                    onClick={onCancel}
                    className="rounded-lg bg-slate-700 px-4 py-2 text-sm font-bold tracking-widest text-slate-300 uppercase hover:bg-slate-600"
                >
                    Cancel
                </button>
            </div>
        </div>
    );
}

export default function Overrides() {
    const [vessels, setVessels] = useState<Vessel[]>([]);
    const [editing, setEditing] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchVessels = async () => {
        setLoading(true);
        const res = await fetch('/vessel-dashboard/api/data');
        const data: DashboardData = await res.json();
        setVessels(data.vessels || []);
        setLoading(false);
    };

    useEffect(() => {
        // Initial fetch of the external vessel data source.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        fetchVessels();
    }, []);

    return (
        <VesselAdminLayout title="Vessel Overrides">
            <Head title="Vessel Dashboard — Overrides" />
            <h2 className="mb-6 text-2xl font-bold text-white">
                Vessel Overrides
            </h2>

            {loading ? (
                <p className="text-slate-500">Loading vessels…</p>
            ) : !vessels.length ? (
                <p className="text-slate-500">No active vessel visits.</p>
            ) : (
                <div className="flex flex-col gap-4">
                    {vessels.map((vessel) => (
                        <div
                            key={vessel.ob_ib_id}
                            className="rounded-xl border border-slate-700 bg-slate-800 p-5"
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <h3 className="text-lg font-extrabold text-white">
                                        {vessel.vessel_name}
                                    </h3>
                                    <span className="text-xs text-slate-400">
                                        SVC {vessel.service} · OPR{' '}
                                        {vessel.line_op}
                                    </span>
                                    {vessel.has_override && (
                                        <span className="rounded border border-amber-700 bg-amber-900/50 px-2 py-0.5 text-xs font-bold text-amber-300">
                                            Override Active
                                        </span>
                                    )}
                                </div>
                                <button
                                    onClick={() =>
                                        setEditing(
                                            editing === vessel.ob_ib_id
                                                ? null
                                                : vessel.ob_ib_id,
                                        )
                                    }
                                    className="rounded-lg bg-slate-700 px-4 py-1.5 text-sm font-bold tracking-widest text-slate-200 uppercase hover:bg-slate-600"
                                >
                                    {editing === vessel.ob_ib_id
                                        ? 'Close'
                                        : 'Edit Planned'}
                                </button>
                            </div>
                            <div className="mt-2 grid grid-cols-4 gap-4 text-sm text-slate-400">
                                <span>
                                    Discharge Planned:{' '}
                                    <b className="text-blue-300">
                                        {vessel.total_planned_discharge}
                                    </b>
                                </span>
                                <span>
                                    Discharged:{' '}
                                    <b className="text-green-300">
                                        {vessel.total_discharged_count}
                                    </b>
                                </span>
                                <span>
                                    Loading Planned:{' '}
                                    <b className="text-blue-300">
                                        {vessel.total_planned_loading_wi}
                                    </b>
                                </span>
                                <span>
                                    Loaded:{' '}
                                    <b className="text-green-300">
                                        {vessel.total_loaded_count}
                                    </b>
                                </span>
                            </div>
                            {editing === vessel.ob_ib_id && (
                                <OverrideForm
                                    vessel={vessel}
                                    onSaved={() => {
                                        fetchVessels();
                                        setEditing(null);
                                    }}
                                    onCancel={() => setEditing(null)}
                                />
                            )}
                        </div>
                    ))}
                </div>
            )}
        </VesselAdminLayout>
    );
}
