import { useEffect, useMemo, useState } from "react";
import Button from "../../components/ui/Button";
import ProductSkeleton from "../../components/product/ProductSkeleton";
import { useNavigate } from "react-router-dom";
import { useDebounce } from "../../utils/useDebounce";
import {
    STATUS_LABELS,
    STATUS_ORDER,
    STATUS_COLORS,
} from "../../utils/orderStatus";
import { useAdminBulkOrdersStore } from "../../store/adminBulkOrders.store";
import { formatCurrency } from "../../utils/pricing";
import { useAuth } from "../../store/auth.store";
import { formatDateTime } from "../../utils/date";

const DATE_OPTIONS = [
    { label: "All", value: "all" },
    { label: "Today", value: "today" },
    { label: "Last 7 Days", value: "7" },
    { label: "Last 30 Days", value: "30" },
] as const;

type DateRange = "all" | "today" | "7" | "30";

export default function AdminBulkOrders() {

    const navigate = useNavigate();
    const { user } = useAuth();
    const [status, setStatus] = useState("ORDER_PLACED");
    const [stateFilter, setStateFilter] = useState<
        "ALL" | "TN" | "OTHER"
    >("ALL");
    const [dateRange, setDateRange] = useState<DateRange>("all");
    const [orderIdInput, setOrderIdInput] = useState("");
    const debouncedOrderId = useDebounce(
        orderIdInput.trim(),
        500
    );

    const {
        filters,
        data,
        loading,
        setFilters,
        fetchInitial,
        fetchMore,
    } = useAdminBulkOrdersStore();

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

    const orders = useMemo(() => {

        let list = [
            ...(data[key]?.items || []),
        ];


        if (stateFilter === "TN") {
            list = list.filter(
                (order) =>
                    order.deliveryState?.toLowerCase() ===
                    "tamil nadu"
            );
        }

        if (stateFilter === "OTHER") {
            list = list.filter(
                (order) =>
                    order.deliveryState &&
                    order.deliveryState.toLowerCase() !==
                    "tamil nadu"
            );
        }

        return list.sort(
            (a, b) =>
                Number(b.createdAt) -
                Number(a.createdAt)
        );

    }, [data, key, stateFilter]);
    console.log(orders)

    const cursor = data[key]?.nextCursor;
    const isLoading = loading[key];

    useEffect(() => {
        fetchInitial();
    }, [key]);

    if (isLoading && orders.length === 0) {

        return (

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

                {Array.from({
                    length: 6,
                }).map((_, i) => (
                    <ProductSkeleton key={i} />
                ))}

            </div>

        );

    }

    return (

        <div className="space-y-6">

            {/* HEADER */}

            <div>

                <div className="flex items-center gap-3 mb-4">

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

                    <h1 className="text-xl md:text-2xl font-semibold text-[var(--color-primary)]">

                        Bulk Orders

                    </h1>

                </div>

            </div>

            {/* FILTERS */}

            <div className="flex flex-wrap gap-3">

                <input
                    placeholder="Search Bulk Order ID"
                    value={orderIdInput}
                    onChange={(e) =>
                        setOrderIdInput(
                            e.target.value
                        )
                    }
                    className="border px-3 py-2 rounded text-sm w-full sm:w-56"
                />

                <select
                    value={dateRange}
                    onChange={(e) =>
                        setDateRange(
                            e.target.value as DateRange
                        )
                    }
                    className="border px-3 py-2 rounded text-sm"
                >

                    {DATE_OPTIONS.map((d) => (

                        <option
                            key={d.value}
                            value={d.value}
                        >
                            {d.label}
                        </option>

                    ))}

                </select>
                <select
                    value={stateFilter}
                    onChange={(e) =>
                        setStateFilter(
                            e.target.value as
                            | "ALL"
                            | "TN"
                            | "OTHER"
                        )
                    }
                    className="border px-3 py-2 rounded text-sm"
                >
                    <option value="ALL">
                        All States
                    </option>

                    <option value="TN">
                        Tamil Nadu
                    </option>

                    <option value="OTHER">
                        Other States
                    </option>
                </select>

            </div>

            {/* STATUS */}

            <div className="flex gap-2 overflow-x-auto pb-1">

                {STATUS_ORDER.map((s) => (

                    <button
                        key={s}
                        onClick={() =>
                            setStatus(s)
                        }
                        className={`
                            px-4
                            py-2
                            rounded-full
                            text-sm
                            whitespace-nowrap
                            ${status === s
                                ? "bg-[var(--color-primary)] text-white"
                                : "bg-gray-100 text-gray-700 hover:bg-gray-200"}
                        `}
                    >

                        {STATUS_LABELS[s]}

                    </button>

                ))}

            </div>

            {/* LIST */}

            <div className="bg-white border rounded-xl divide-y">

                {orders.map((order) => (

                    <div
                        key={order.orderId}
                        className="p-4 flex items-center justify-between gap-4"
                    >

                        {/* LEFT */}

                        <div className="min-w-[220px]">

                            <p className="font-medium text-sm">

                                {order.orderId}

                            </p>

                            <p className="text-xs text-gray-500 mt-1">

                                {formatDateTime(
                                    order.createdAt
                                )}

                            </p>

                            <p className="text-xs text-gray-500 mt-1">

                                Scheme : {order.schemeId}

                            </p>

                            <p className="text-xs text-gray-500">

                                {order.items?.length ?? 0} Products

                            </p>

                        </div>

                        {/* CENTER */}

                        <div className="hidden sm:block">

                            <p className="text-sm font-semibold">

                                ₹{formatCurrency(
                                    order.pricing.grandTotal
                                )}

                            </p>

                        </div>

                        {/* RIGHT */}

                        <div className="flex items-center gap-3">

                            <span
                                className="text-xs font-semibold px-2.5 py-1 rounded-full"
                                style={{
                                    backgroundColor:
                                        `${STATUS_COLORS[order.status]}20`,
                                    color:
                                        STATUS_COLORS[order.status],
                                }}
                            >

                                {STATUS_LABELS[order.status]}

                            </span>

                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(
                                        user?.role === "STAFF" ?
                                            `/staff/bulk-orders/${order.orderId}`
                                            : `/admin/bulk-orders/${order.orderId}`
                                    );
                                }}
                                className="
                                    flex
                                    items-center
                                    justify-center
                                    h-9
                                    w-9
                                    rounded-full
                                    border
                                    border-gray-200
                                    hover:bg-gray-100
                                "
                            >

                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-5 w-5 text-gray-500"
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

                    <div className="py-16 flex justify-center">

                        <div className="text-center">

                            <h2 className="text-sm font-semibold">

                                No Bulk Orders

                            </h2>

                            <p className="text-xs text-gray-500 mt-2">

                                No bulk orders found for the selected filters.

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

                        {isLoading
                            ? "Loading..."
                            : "Load More"}

                    </Button>

                </div>

            )}

        </div>

    );

}