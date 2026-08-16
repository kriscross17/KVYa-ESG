import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    LineChart,
    Line,
} from "recharts";

const COLORS = [
    "#1d4ed8",
    "#16a34a",
    "#ca8a04",
    "#dc2626",
    "#7c3aed",
    "#0891b2",
];

// Default number of entries to show on crowded bar/line x-axes before truncating.
const DEFAULT_LIMIT = 10;

function shortName(name) {
    return name.length > 15 ? name.slice(0, 15) + "…" : name;
}

// Sorts by `sortKey` (desc) and keeps only the top `limit` entries.
// Returns { data, hiddenCount } so callers can show a "+N more" note.
function limitEntries(data, sortKey, limit) {
    const sorted = [...data].sort((a, b) => b[sortKey] - a[sortKey]);
    const visible = sorted.slice(0, limit);
    const hiddenCount = sorted.length - visible.length;
    return { data: visible, hiddenCount };
}

function TruncationNote({ hiddenCount, label }) {
    if (hiddenCount <= 0) return null;
    return (
        <p className="text-xs text-slate-400 text-center mt-1">
            Showing top {label} — {hiddenCount} more not shown.
        </p>
    );
}

export function EnergyConsumptionChart({ submissions, limit = DEFAULT_LIMIT }) {
    const approved = submissions.filter((s) => s.status === "Approved");
    const raw = approved.map((s) => ({
        name: shortName(s.postOffice),
        electricity: Number(s.buildingData.electricityConsumptionKwh) || 0,
        renewable: Number(s.buildingData.renewableEnergyKwh) || 0,
    }));

    if (raw.length === 0) {
        return (
            <EmptyChart message="No approved submissions yet to show energy data." />
        );
    }

    const { data, hiddenCount } = limitEntries(raw, "electricity", limit);

    return (
        <div>
            <ResponsiveContainer width="100%" height={300}>
                <BarChart
                    data={data}
                    margin={{ top: 5, right: 20, left: 0, bottom: 60 }}
                >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                        dataKey="name"
                        angle={-30}
                        textAnchor="end"
                        interval={0}
                        height={70}
                        tick={{ fontSize: 12 }}
                    />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Legend />
                    <Bar
                        dataKey="electricity"
                        name="Electricity(kWh)"
                        fill="#1d4ed8"
                    />
                    <Bar
                        dataKey="renewable"
                        name="Renewable(kWh)"
                        fill="#16a34a"
                    />
                </BarChart>
            </ResponsiveContainer>
            <TruncationNote hiddenCount={hiddenCount} label={data.length} />
        </div>
    );
}

export function WaterWasteChart({ submissions, limit = DEFAULT_LIMIT }) {
    const approved = submissions.filter((s) => s.status === "Approved");
    const raw = approved.map((s) => ({
        name: shortName(s.postOffice),
        water: Number(s.buildingData.waterUsageKl) || 0,
        waste: Number(s.buildingData.wasteGeneratedKg) || 0,
    }));

    if (raw.length === 0) {
        return (
            <EmptyChart message="No approved submissions yet to show water & waste data." />
        );
    }

    const { data, hiddenCount } = limitEntries(raw, "water", limit);

    return (
        <div>
            <ResponsiveContainer width="100%" height={300}>
                <BarChart
                    data={data}
                    margin={{ top: 5, right: 20, left: 0, bottom: 60 }}
                >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                        dataKey="name"
                        angle={-30}
                        textAnchor="end"
                        interval={0}
                        height={70}
                        tick={{ fontSize: 12 }}
                    />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="water" name="Water (KL)" fill="#0891b2" />
                    <Bar dataKey="waste" name="Waste (kg)" fill="#ca8a04" />
                </BarChart>
            </ResponsiveContainer>
            <TruncationNote hiddenCount={hiddenCount} label={data.length} />
        </div>
    );
}

export function GenderDiversityChart({ submissions }) {
    const approved = submissions.filter((s) => s.status === "Approved");
    const totalFemale = approved.reduce(
        (sum, s) => sum + (Number(s.operationalData.femaleEmployees) || 0),
        0,
    );
    const totalEmployees = approved.reduce(
        (sum, s) => sum + (Number(s.operationalData.totalEmployees) || 0),
        0,
    );
    const totalMale = Math.max(0, totalEmployees - totalFemale);

    if (totalEmployees === 0) {
        return (
            <EmptyChart message="No employee data from approved submissions yet." />
        );
    }

    const data = [
        { name: "Female", value: totalFemale },
        { name: "Male", value: totalMale },
    ];

    return (
        <ResponsiveContainer width="100%" height={300}>
            <PieChart>
                <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    dataKey="value"
                    label={({ name, percent }) =>
                        `${name}: ${(percent * 100).toFixed(0)}%`
                    }
                >
                    {data.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                </Pie>
                <Tooltip />
                <Legend />
            </PieChart>
        </ResponsiveContainer>
    );
}

export function DigitalAdoptionChart({ submissions, limit = DEFAULT_LIMIT }) {
    const approved = submissions.filter((s) => s.status === "Approved");
    const raw = approved.map((s) => ({
        name: shortName(s.postOffice),
        digital: Number(s.operationalData.digitalTransactionsPercent) || 0,
    }));

    if (raw.length === 0) {
        return (
            <EmptyChart message="No approved submissions yet to show digital adoption." />
        );
    }

    const { data, hiddenCount } = limitEntries(raw, "digital", limit);

    return (
        <div>
            <ResponsiveContainer width="100%" height={300}>
                <LineChart
                    data={data}
                    margin={{ top: 5, right: 20, left: 0, bottom: 60 }}
                >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                        dataKey="name"
                        angle={-30}
                        textAnchor="end"
                        interval={0}
                        height={70}
                        tick={{ fontSize: 12 }}
                    />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Legend />
                    <Line
                        type="monotone"
                        dataKey="digital"
                        name="Digital Transactions (%)"
                        stroke="#7c3aed"
                        strokeWidth={2}
                    />
                </LineChart>
            </ResponsiveContainer>
            <TruncationNote hiddenCount={hiddenCount} label={data.length} />
        </div>
    );
}

export function StatusDistributionChart({ submissions }) {
    const counts = {};
    submissions.forEach((s) => {
        counts[s.status] = (counts[s.status] || 0) + 1;
    });

    const data = Object.entries(counts).map(([name, value]) => ({
        name,
        value,
    }));

    if (data.length === 0) {
        return <EmptyChart message="No submissions yet." />;
    }

    return (
        <ResponsiveContainer width="100%" height={300}>
            <PieChart>
                <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                >
                    {data.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                </Pie>
                <Tooltip />
                <Legend />
            </PieChart>
        </ResponsiveContainer>
    );
}

function EmptyChart({ message }) {
    return (
        <div className="h-[300px] flex items-center justify-center bg-slate-50 rounded-xl border border-slate-200">
            <p className="text-slate-500 text-center px-4">{message}</p>
        </div>
    );
}


