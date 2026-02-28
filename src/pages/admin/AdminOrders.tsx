import { useEffect, useMemo, useState } from "react";
import Button from "../../components/ui/Button";
import {
    STATUS_LABELS,
    STATUS_ORDER,
    STATUS_COLORS,
} from "../../utils/orderStatus";
import { useAdminOrdersStore } from "../../store/adminOrders.store";
import { useDebounce } from "../../utils/useDebounce";
import ProductSkeleton from "../../components/product/ProductSkeleton";

const DATE_OPTIONS = [
    { label: "Today", value: "today" },
    { label: "Last 7 Days", value: "7" },
    { label: "Last 30 Days", value: "30" },
] as const;
type DateRange = "today" | "7" | "30";

export default function AdminOrders() {
    const [status, setStatus] = useState("ORDER_PLACED");
    const [dateRange, setDateRange] = useState<DateRange>("today");
    const [orderIdInput, setOrderIdInput] = useState("");
    const debouncedOrderId = useDebounce(orderIdInput, 500);

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
    }, [status, dateRange, debouncedOrderId]);

    const key = useMemo(
        () =>
            JSON.stringify({
                status: filters.status,
                dateRange: filters.dateRange,
                orderId: filters.orderId || null,
            }),
        [filters]
    );

    const orders = data[key]?.items || [];
    const cursor = data[key]?.nextCursor;
    const isLoading = loading[key];

    useEffect(() => {
        fetchInitial();
    }, [key]);

    if (!orders && isLoading) {
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
                <h1 className="text-xl font-bold text-[var(--color-primary)]">
                    Orders
                </h1>
                <p className="text-sm text-gray-500">
                    View and manage customer orders
                </p>
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
                        className="p-4 flex items-center justify-between gap-4"
                    >
                        {/* LEFT */}
                        <div className="min-w-[160px]">
                            <p className="font-medium text-sm">{o.orderId}</p>
                            <p className="text-xs text-gray-500">
                                {new Date(o.createdAt).toLocaleDateString("en-IN")}
                            </p>
                            <p className="text-xs text-gray-500">
                                {o.items?.length ?? 0} items
                            </p>
                        </div>

                        {/* MIDDLE */}
                        <div className="hidden sm:block">
                            <p className="text-sm font-medium">₹{o.totalAmount}</p>
                            <p className="text-xs text-gray-500">
                                {o.paymentMode || "OFFLINE"}
                            </p>
                        </div>

                        {/* RIGHT */}
                        <div className="flex items-center gap-3">
                            <span
                                className="text-xs font-semibold px-2.5 py-1 rounded-full"
                                style={{
                                    backgroundColor: `${STATUS_COLORS[o.status]}20`,
                                    color: STATUS_COLORS[o.status],
                                }}
                            >
                                {STATUS_LABELS[o.status]}
                            </span>

                            {/* ARROW ICON ONLY */}
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    window.location.href = `/admin/orders/${o.orderId}`;
                                }}
                                className="
                                    flex items-center justify-center
                                    h-8 w-8 sm:h-9 sm:w-9
                                    rounded-full
                                    border sm:border
                                    border-gray-200
                                    hover:bg-gray-100
                                    shrink-0
                                "
                                aria-label="View order details"
                            >

                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500"
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