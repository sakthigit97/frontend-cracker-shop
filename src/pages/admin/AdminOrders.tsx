import { useEffect, useMemo, useState } from "react";
import Button from "../../components/ui/Button";
import {
    STATUS_LABELS,
    STATUS_ORDER,
    STATUS_COLORS,
} from "../../utils/orderStatus";
import { useAdminOrdersStore, } from "../../store/adminOrders.store";
import { useDebounce } from "../../utils/useDebounce";
import ProductSkeleton from "../../components/product/ProductSkeleton";
import { useNavigate } from "react-router-dom";
import { formatDateTime } from "../../utils/date";
import { useAuth } from "../../store/auth.store";


const DATE_OPTIONS = [
    { label: "All", value: "all" },
    { label: "Today", value: "today" },
    { label: "Last 7 Days", value: "7" },
    { label: "Last 30 Days", value: "30" },
] as const;
type DateRange = "all" | "today" | "7" | "30";

export default function AdminOrders() {
    const [status, setStatus] = useState("ORDER_PLACED");
    const [stateFilter, setStateFilter] = useState<
        "ALL" | "TN" | "OTHER"
    >("ALL");
    const [dateRange, setDateRange] = useState<DateRange>("all");
    const [orderIdInput, setOrderIdInput] = useState("");
    const debouncedOrderId = useDebounce(orderIdInput.trim(), 500);
    const navigate = useNavigate();
    const { user } = useAuth();

    const {
        filters,
        data,
        loading,
        setFilters,
        fetchInitial,
        fetchMore,
    } = useAdminOrdersStore();

    useEffect(() => {
        setFilters({
            status,
            dateRange,
            orderId: debouncedOrderId || undefined,
        });
    }, [
        status,
        dateRange,
        debouncedOrderId,
        setFilters,
    ]);

    const key = useMemo(
        () =>
            JSON.stringify({
                status: filters.status,
                dateRange: filters.dateRange,
                orderId: filters.orderId || null,
            }),
        [filters]
    );

    function getCustomerName(address?: string) {
        if (!address) return "-";

        const firstLine = address.split("\n")[0]?.trim() ?? "";

        return firstLine;
    }

    const orders = useMemo(() => {
        let list = [...(data[key]?.items || [])];

        if (stateFilter === "TN") {
            list = list.filter(
                (o) =>
                    o.deliveryState?.toLowerCase() ===
                    "tamil nadu"
            );
        }

        if (stateFilter === "OTHER") {
            list = list.filter(
                (o) => o.deliveryState && o.deliveryState.toLowerCase() !== "tamil nadu"
            );
        }

        return list.sort(
            (a, b) =>
                Number(b.createdAt) -
                Number(a.createdAt)
        );
    }, [data, key, stateFilter]);

    const cursor = data[key]?.nextCursor;
    const isLoading = loading[key];

    useEffect(() => {
        fetchInitial(true);
    }, [key, fetchInitial]);

    if (orders.length === 0 && isLoading) {
        return (<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
                <ProductSkeleton key={i} />
            ))}
        </div>);
    }

    return (
        <div className="space-y-6">
            {/* HEADER */}
            <div>
                <div className="flex items-center gap-3 mb-4">

                    {user?.role !== "STAFF" && (
                        <button
                            onClick={() => navigate(-1)}
                            className="
                flex items-center justify-center
                w-9 h-9
                rounded-full
                bg-[var(--color-primary)]
                text-white
                shadow-sm
                hover:scale-105
                active:scale-95
                transition-all
            "
                        >
                            ←
                        </button>
                    )}

                    <h1 className="text-xl md:text-2xl font-semibold text-[var(--color-primary)]">
                        Orders
                    </h1>

                </div>
            </div>

            {/* FILTERS */}
            <div className="flex flex-wrap gap-3">
                <input
                    placeholder="Search Order ID"
                    value={orderIdInput}
                    onChange={(e) => setOrderIdInput(e.target.value)}
                    className="border px-3 py-2 rounded text-sm w-full sm:w-56"
                />

                <select
                    value={dateRange}
                    onChange={(e) => setDateRange(e.target.value as DateRange)}
                    className="border px-3 py-2 rounded text-sm"
                >
                    {DATE_OPTIONS.map((d) => (
                        <option key={d.value} value={d.value}>
                            {d.label}
                        </option>
                    ))}
                </select>


                <select
                    value={stateFilter}
                    onChange={(e) =>
                        setStateFilter(
                            e.target.value as "ALL" | "TN" | "OTHER"
                        )
                    }
                    className="border px-3 py-2 rounded text-sm"
                >
                    <option value="ALL">All States</option>
                    <option value="TN">Tamil Nadu</option>
                    <option value="OTHER">Other States</option>
                </select>

            </div>

            {/* STATUS FILTER */}
            <div className="flex gap-2 overflow-x-auto pb-1">
                {STATUS_ORDER.map((s) => (
                    <button
                        key={s}
                        onClick={() => setStatus(s)}
                        className={`px-4 py-2 rounded-full text-sm whitespace-nowrap
                            ${status === s
                                ? "bg-[var(--color-primary)] text-white"
                                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                            }`}
                    >
                        {STATUS_LABELS[s]}
                    </button>
                ))}
            </div>

            {/* ORDERS LIST */}
            <div className="bg-white border rounded-xl divide-y">
                {orders.map((o) => (
                    <div
                        key={o.orderId}
                        className="p-4 hover:bg-gray-50 transition"
                    >
                        <div className="flex items-start gap-3">

                            {/* LEFT CONTENT */}
                            <div className="flex-1 min-w-0">

                                <div className="space-y-2">

                                    <p
                                        className="
                                            font-semibold
                                            text-sm
                                            whitespace-nowrap
                                            overflow-x-auto
                                            scrollbar-hide
                                            "
                                    >
                                        {o.orderId}
                                    </p>

                                    <span
                                        className="inline-flex text-xs font-semibold px-2.5 py-1 rounded-full"
                                        style={{
                                            backgroundColor: `${STATUS_COLORS[o.status]}20`,
                                            color: STATUS_COLORS[o.status],
                                        }}
                                    >
                                        {STATUS_LABELS[o.status]}
                                    </span>

                                </div>

                                {/* Customer */}
                                <p className="text-sm mt-2 font-medium">
                                    👤 {getCustomerName(o.address)}
                                </p>

                                {/* Mobile */}
                                <p className="text-xs text-gray-500 mt-1">
                                    📱 {o.userId}
                                </p>

                                {/* State */}
                                <p className="text-xs text-gray-500 mt-1">
                                    📍 {o.deliveryState || "-"}
                                </p>

                                {/* Bottom Row */}
                                <div className="flex justify-between items-center mt-3">

                                    <div>

                                        <p className="text-xs text-gray-500">
                                            {formatDateTime(o.createdAt)}
                                        </p>

                                        <p className="text-xs text-gray-500 mt-1">
                                            🛒 {o.items?.length ?? 0} Items
                                        </p>

                                    </div>

                                    <div className="text-right">

                                        <p className="font-semibold">
                                            ₹{o.finalPayable}
                                        </p>

                                        <p className="text-xs text-gray-500">
                                            {o.paymentMode}
                                        </p>

                                    </div>

                                </div>

                            </div>

                            {/* Arrow */}
                            <button
                                onClick={() =>
                                    navigate(
                                        user?.role === "STAFF"
                                            ? `/staff/orders/${o.orderId}`
                                            : `/admin/orders/${o.orderId}`
                                    )
                                }
                                className="
                                    shrink-0
                                    w-9
                                    h-9
                                    rounded-full
                                    border
                                    flex
                                    items-center
                                    justify-center
                                    hover:bg-gray-100
                                    mt-1
                                    "
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="w-5 h-5 text-gray-500"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    strokeWidth={2}
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M9 5l7 7-7 7"
                                    />
                                </svg>
                            </button>

                        </div>
                    </div>
                ))}

                {orders.length === 0 && !isLoading && (
                    <div className="py-16 flex items-center justify-center">
                        <div className="text-center max-w-sm w-full">
                            <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center">
                                <svg
                                    className="h-6 w-6 text-gray-400"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    strokeWidth={2}
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M9 13h6m-3-3v6m9-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                    />
                                </svg>
                            </div>

                            <h2 className="text-sm font-semibold text-gray-800">
                                No orders to display
                            </h2>

                            <p className="mt-1 text-xs text-gray-500">
                                There are no orders matching the selected status or date range.
                            </p>

                            <p className="mt-2 text-xs text-gray-400">
                                Try changing the filters or searching with a different order ID.
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {cursor && (
                <div className="text-center">
                    <Button
                        variant="outline"
                        disabled={isLoading}
                        onClick={fetchMore}
                    >
                        {isLoading ? "Loading…" : "Load More"}
                    </Button>
                </div>
            )}
        </div>
    );
}