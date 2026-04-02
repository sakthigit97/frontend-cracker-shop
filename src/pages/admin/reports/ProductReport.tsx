import { useEffect, useState } from "react";
import { useProductReportStore } from "../../../store/adminProductReport.store";
import Button from "../../../components/ui/Button";

export default function ProductReport() {
    const { data, loading, fetch } = useProductReportStore();

    const [range, setRange] = useState("7d");
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");

    useEffect(() => {
        fetch(range);
    }, [range]);

    const applyCustom = () => {
        if (!fromDate || !toDate) return;
        fetch(undefined, fromDate, toDate);
    };

    return (
        <div className="space-y-8">

            <div className="flex justify-between items-center">
                <h1 className="text-xl font-semibold">Product Report</h1>

                <div className="flex gap-2">
                    <Filter active={range === "7d"} onClick={() => setRange("7d")}>
                        7 Days
                    </Filter>
                    <Filter active={range === "30d"} onClick={() => setRange("30d")}>
                        30 Days
                    </Filter>
                </div>
            </div>

            <div className="bg-white border rounded-xl p-4 flex flex-wrap gap-3 items-end">
                <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="border px-2 py-1 rounded" />
                <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="border px-2 py-1 rounded" />

                <Button onClick={applyCustom}>Apply</Button>

                <Button
                    variant="outline"
                    onClick={() => {
                        setFromDate("");
                        setToDate("");
                        setRange("7d");
                        fetch("7d");
                    }}
                >
                    Reset
                </Button>
            </div>

            {(data?.insights ?? []).length > 0 && (
                <div className="bg-blue-50 border rounded-xl p-4">
                    <h2 className="font-semibold mb-2">Insights</h2>
                    {data?.insights.map((i: string, idx: number) => (
                        <p key={idx} className="text-sm">• {i}</p>
                    ))}
                </div>
            )}

            <Section title="💰 Revenue Leaders" items={data?.revenueLeaders} />
            <Section title="📦 High Demand" items={data?.highDemand} />
            <Section title="⚠️ Underperforming" items={data?.underPerforming} />
            {loading && <p className="text-sm text-gray-500">Loading...</p>}
        </div>
    );
}

function Filter({ active, children, ...props }: any) {
    return (
        <button
            {...props}
            className={`px-3 py-1 rounded ${active ? "bg-[var(--color-primary)] text-white" : "bg-gray-100"
                }`}
        >
            {children}
        </button>
    );
}

function Section({ title, items }: any) {
    if (!items || items.length === 0) return null;

    return (
        <div className="bg-white border rounded-xl p-5">
            <h2 className="font-semibold mb-4">{title}</h2>

            {/* SCROLL SUPPORT */}
            <div className="max-h-[300px] overflow-y-auto space-y-2 pr-2">
                {items.map((p: any) => (
                    <div key={p.productId} className="flex justify-between border rounded p-3">
                        <div>
                            <p className="font-medium">{p.name}</p>
                            <p className="text-xs text-gray-500">
                                Qty: {p.quantity}
                            </p>
                        </div>
                        <p className="font-semibold text-[var(--color-primary)]">
                            ₹{p.revenue}
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );
}