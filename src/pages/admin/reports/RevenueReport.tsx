import { useEffect, useState } from "react";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
} from "recharts";
import { useAdminRevenueStore } from "../../../store/adminRevenue.store";
import ProductSkeleton from "../../../components/product/ProductSkeleton";
import Button from "../../../components/ui/Button";
import EmptyState from "../../../components/ui/EmptyState";

export default function RevenueReport() {
    const { data, loading, error, fetch } =
        useAdminRevenueStore();

    const [range, setRange] = useState("7d");
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");

    useEffect(() => {
        fetch(range);
    }, [range]);

    const handleCustomFilter = () => {
        if (!fromDate || !toDate) return;
        fetch(undefined, fromDate, toDate);
    };

    if (loading && !data) {
        return (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <ProductSkeleton key={i} />
                ))}
            </div>
        );
    }

    if (error) {
        return (
            <div className="py-20 text-center">
                <p className="text-red-500 mb-4">
                    Failed to load revenue data
                </p>
                <Button onClick={() => fetch(range)}>
                    Retry
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="flex flex-wrap justify-between gap-4 items-center">
                <h1 className="text-xl font-semibold">
                    Revenue Report
                </h1>

                <div className="flex gap-2">
                    <button
                        onClick={() => setRange("7d")}
                        className={`px-3 py-1 rounded ${range === "7d"
                            ? "bg-[var(--color-primary)] text-white"
                            : "bg-gray-100"
                            }`}
                    >
                        7 Days
                    </button>

                    <button
                        onClick={() => setRange("30d")}
                        className={`px-3 py-1 rounded ${range === "30d"
                            ? "bg-[var(--color-primary)] text-white"
                            : "bg-gray-100"
                            }`}
                    >
                        30 Days
                    </button>
                </div>
            </div>
            <div className="bg-white border rounded-xl p-4 sm:p-5 shadow-sm">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">

                    {/* 🔹 Date Inputs */}
                    <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">

                        {/* From */}
                        <div className="flex flex-col text-sm w-full sm:w-auto">
                            <label className="text-gray-500 mb-1">From</label>
                            <input
                                type="date"
                                value={fromDate}
                                onChange={(e) => setFromDate(e.target.value)}
                                className="border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                            />
                        </div>

                        {/* To */}
                        <div className="flex flex-col text-sm w-full sm:w-auto">
                            <label className="text-gray-500 mb-1">To</label>
                            <input
                                type="date"
                                value={toDate}
                                onChange={(e) => setToDate(e.target.value)}
                                className="border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                            />
                        </div>

                    </div>

                    {/* 🔹 Actions */}
                    <div className="flex gap-2 w-full sm:w-auto">
                        <Button
                            onClick={handleCustomFilter}
                            className="w-full sm:w-auto"
                        >
                            Apply
                        </Button>

                        <Button
                            variant="outline"
                            onClick={() => {
                                setFromDate("");
                                setToDate("");
                                setRange("7d");
                                fetch("7d");
                            }}
                            className="w-full sm:w-auto"
                        >
                            Reset
                        </Button>
                    </div>

                </div>
            </div>

            {data && data.trend.length > 0 ? (
                <>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <StatCard label="Revenue" value={`₹${data.totalRevenue}`} />
                        <StatCard label="Orders" value={data.totalOrders} />
                        <StatCard label="Avg Order" value={`₹${data.avgOrderValue}`} />
                        <StatCard label="Growth" value={`${data.growth.toFixed(1)}%`} />
                    </div>

                    <div className="bg-white rounded-xl border p-5">
                        <h2 className="font-semibold mb-4">Revenue Trend</h2>
                        <div className="h-[300px]">
                            <ResponsiveContainer>
                                <LineChart data={data.trend}>
                                    <XAxis dataKey="date" />
                                    <YAxis />
                                    <Tooltip />
                                    <Line dataKey="revenue" stroke="#6366f1" />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </>
            ) : (
                <div className="bg-white border rounded-xl p-10 text-center">
                    <EmptyState
                        title="No records found"
                        description="No revenue data for selected filters"
                    />
                </div>
            )}
        </div>
    );
}

function StatCard({ label, value }: any) {
    return (
        <div className="bg-white rounded-xl border p-4 text-center">
            <p className="text-xs text-gray-500">{label}</p>
            <p className="text-2xl font-bold text-[var(--color-primary)]">
                {value}
            </p>
        </div>
    );
}