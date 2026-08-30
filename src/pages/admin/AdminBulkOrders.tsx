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

    const [dateRange, setDateRange] =
        useState<DateRange>("all");

    const [orderIdInput, setOrderIdInput] =
        useState("");

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
            orderId:
                debouncedOrderId || undefined,
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
                orderId:
                    filters.orderId || null,
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

    const cursor = data[key]?.nextCursor;
    const isLoading = loading[key];

    useEffect(() => {
        fetchInitial(true);
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
        <div className="space-y-6 w-full min-w-0">

            {/* HEADER */}

            <div className="w-full min-w-0">
                <div className="flex items-center gap-3 mb-4">
                    <button
                        onClick={() =>
                            navigate(-1)
                        }
                        className="
                            flex
                            items-center
                            justify-center
                            w-9
                            h-9
                            shrink-0
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

                    <h1 className="
                        text-xl
                        md:text-2xl
                        font-semibold
                        text-[var(--color-primary)]
                    ">
                        Bulk Orders
                    </h1>
                </div>
            </div>

            {/* FILTERS */}

            <div
                className="
                    flex
                    flex-col
                    sm:flex-row
                    sm:flex-wrap
                    gap-3
                    w-full
                    min-w-0
                "
            >
                <input
                    placeholder="Search Bulk Order ID"
                    value={orderIdInput}
                    onChange={(e) =>
                        setOrderIdInput(
                            e.target.value
                        )
                    }
                    className="
                        border
                        px-3
                        py-2
                        rounded
                        text-sm
                        w-full
                        sm:w-56
                        min-w-0
                        bg-white
                    "
                />

                <select
                    value={dateRange}
                    onChange={(e) =>
                        setDateRange(
                            e.target.value as DateRange
                        )
                    }
                    className="
                        border
                        px-3
                        py-2
                        rounded
                        text-sm
                        w-full
                        sm:w-auto
                        bg-white
                    "
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
                    className="
                        border
                        px-3
                        py-2
                        rounded
                        text-sm
                        w-full
                        sm:w-auto
                        bg-white
                    "
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

            <div
                className="
                    flex
                    gap-2
                    overflow-x-auto
                    pb-1
                    w-full
                    min-w-0
                    scrollbar-hide
                "
            >
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
                            shrink-0
                            transition-colors
                            ${status === s
                                ? "bg-[var(--color-primary)] text-white"
                                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                            }
                        `}
                    >
                        {STATUS_LABELS[s]}
                    </button>
                ))}
            </div>

            {/* LIST */}

            <div
                className="
                    bg-white
                    border
                    rounded-xl
                    divide-y
                    overflow-hidden
                    w-full
                    min-w-0
                "
            >

                {orders.map((order) => (
                    <div
                        key={order.orderId}
                        className="
            relative
            p-5
            w-full
            min-w-0
        "
                    >
                        {/* VIEW BUTTON */}
                        <button
                            onClick={(e) => {
                                e.stopPropagation();

                                navigate(
                                    user?.role === "STAFF"
                                        ? `/staff/bulk-orders/${order.orderId}`
                                        : `/admin/bulk-orders/${order.orderId}`
                                );
                            }}
                            className="
                absolute
                top-4
                right-4
                flex
                items-center
                justify-center
                w-9
                h-9
                shrink-0
                rounded-full
                border
                border-gray-300
                bg-white
                hover:bg-gray-50
                active:bg-gray-100
                transition-colors
                z-10
            "
                            aria-label={`View order ${order.orderId}`}
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

                        {/* ORDER INFORMATION */}
                        <div className="pr-14 min-w-0">

                            {/* ORDER ID + STATUS */}
                            <div>
                                <p
                                    className="
                        font-semibold
                        text-sm
                        whitespace-nowrap
                        overflow-x-auto
                        scrollbar-hide
                    "
                                >
                                    {order.orderId}
                                </p>

                                <span
                                    className="
                        inline-flex
                        text-xs
                        font-semibold
                        px-2.5
                        py-1
                        rounded-full
                        mt-2
                    "
                                    style={{
                                        backgroundColor:
                                            `${STATUS_COLORS[order.status]}20`,
                                        color:
                                            STATUS_COLORS[order.status],
                                    }}
                                >
                                    {STATUS_LABELS[order.status]}
                                </span>
                            </div>

                            {/* CUSTOMER */}
                            <p className="text-sm mt-2 font-medium truncate">
                                👤 {order.address?.fullName || order.userName || "-"}
                            </p>

                            {/* MOBILE */}
                            <p className="text-xs text-gray-500 mt-1">
                                📱 {order.userId || order.mobile || "-"}
                            </p>

                            {/* CITY + STATE */}
                            <p className="text-xs text-gray-500 mt-1 truncate">
                                📍{" "}
                                {order.address?.city || "-"},{" "}
                                {order.address?.state || "-"}
                            </p>

                            {/* BOTTOM ROW */}
                            <div className="flex justify-between items-center mt-3">

                                {/* DATE + ITEMS */}
                                <div>
                                    <p className="text-xs text-gray-500">
                                        {formatDateTime(order.createdAt)}
                                    </p>

                                    <p className="text-xs text-gray-500 mt-1">
                                        🛒 {order.items?.length ?? 0} Items
                                    </p>
                                </div>

                                {/* TOTAL */}
                                <div className="text-right">
                                    <p className="font-semibold">
                                        ₹
                                        {formatCurrency(
                                            order.pricing?.grandTotal ?? 0
                                        )}
                                    </p>

                                    {order.paymentMode && (
                                        <p className="text-xs text-gray-500">
                                            {order.paymentMode}
                                        </p>
                                    )}
                                </div>

                            </div>
                        </div>
                    </div>
                ))}

                {/* EMPTY STATE */}

                {orders.length === 0 &&
                    !isLoading && (
                        <div className="
                            py-16
                            px-4
                            flex
                            justify-center
                        ">
                            <div className="
                                text-center
                                max-w-sm
                            ">
                                <h2 className="
                                    text-sm
                                    font-semibold
                                ">
                                    No Bulk Orders
                                </h2>

                                <p className="
                                    text-xs
                                    text-gray-500
                                    mt-1
                                ">
                                    No bulk orders found
                                    for the selected
                                    filters.
                                </p>
                            </div>
                        </div>
                    )}
            </div>

            {/* LOAD MORE */}

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