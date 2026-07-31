import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../components/ui/Button";
import ProductSkeleton from "../components/product/ProductSkeleton";
import {
    ORDER_STATUS_CONFIG,
    STATUS_ORDER,
} from "../utils/orderStatus";
import { useBulkOrderHistoryStore } from "../store/bulkOrderHistory.store";
import { formatCurrency } from "../utils/pricing";

export default function BulkOrders() {
    const navigate = useNavigate();
    const {
        orders,
        fetchingOrders,
        fetchOrders,
    } = useBulkOrderHistoryStore();
    const [sortBy, setSortBy] = useState("latest");
    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);

    function formatDate(ts: number) {
        return new Date(ts).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    }

    const STATUS_PRIORITY = STATUS_ORDER.reduce((acc, status, index) => {
        acc[status] = index;
        return acc;
    }, {} as Record<string, number>);

    const sortedOrders = useMemo(() => {
        const list = [...orders];
        switch (sortBy) {
            case "latest": return list.sort((a, b) => b.createdAt - a.createdAt);
            case "oldest": return list.sort((a, b) => a.createdAt - b.createdAt);
            case "active":
                return list.filter((o) => o.status !== "CANCELLED").sort(
                    (a, b) =>
                        STATUS_PRIORITY[a.status] -
                        STATUS_PRIORITY[b.status]
                );

            case "cancelled":
                return list.filter((o) => o.status === "CANCELLED").sort((a, b) => b.createdAt - a.createdAt);
            default:
                return list;
        }
    }, [orders, sortBy]);

    if (fetchingOrders && orders.length === 0) {
        return (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                    <ProductSkeleton key={i} />
                ))}
            </div>
        );
    }

    if (!fetchingOrders && orders.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center text-center py-20 px-4">
                <div className="text-6xl mb-4">📦</div>

                <h2 className="text-xl font-semibold text-[var(--color-primary)] mb-2">
                    No Bulk Orders Yet
                </h2>

                <p className="text-sm text-[var(--color-muted)] max-w-md mb-6">
                    You haven't placed any bulk orders yet.
                </p>

                <Button onClick={() => navigate("/bulk-order")}>
                    Create Bulk Order
                </Button>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto px-4 py-6">
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
                    My Bulk Orders
                </h1>
            </div>

            <div className="flex justify-end mb-5">
                <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="border rounded-lg px-3 py-2 text-sm bg-white"
                >
                    <option value="latest">Latest Orders</option>
                    <option value="oldest">Oldest Orders</option>
                    <option value="active">Active Orders</option>
                    <option value="cancelled">Cancelled Orders</option>
                </select>
            </div>

            <div className="flex flex-col gap-5">
                {sortedOrders.map((order) => {
                    const statusConfig = ORDER_STATUS_CONFIG[order.status] || {
                        label: order.status.replaceAll("_", " "),
                        className: "bg-gray-100 text-gray-700",
                    };

                    return (
                        <div
                            key={order.orderId}
                            className="
                                bg-[var(--color-surface)]
                                border
                                rounded-2xl
                                p-5
                                shadow-sm
                                hover:shadow-md
                                transition
                            "
                        >
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                <div>
                                    <p className="text-sm text-[var(--color-muted)]">
                                        Bulk Order ID
                                    </p>

                                    <p className="font-semibold">
                                        {order.orderId}
                                    </p>

                                    <p className="text-xs text-[var(--color-muted)] mt-1">
                                        Placed on {formatDate(order.createdAt)}
                                    </p>

                                    <p className="text-xs text-[var(--color-muted)] mt-1">
                                        Scheme : {order.schemeId}
                                    </p>
                                </div>

                                <div className="flex flex-col items-start md:items-center gap-2">

                                    <span
                                        className={`
                                            text-xs
                                            font-semibold
                                            px-4
                                            py-1.5
                                            rounded-full
                                            ${statusConfig.className}
                                        `}
                                    >
                                        {statusConfig.label}
                                    </span>

                                    <p className="text-sm text-[var(--color-muted)]">
                                        {order.items.length} Products
                                    </p>

                                </div>

                                <div className="flex flex-col md:items-end gap-2">

                                    <p className="text-xl font-bold text-[var(--color-primary)]">
                                        ₹{formatCurrency(order.pricing.grandTotal)}
                                    </p>

                                    <Button
                                        variant="secondary"
                                        onClick={() =>
                                            navigate(
                                                `/bulk-orders/${order.orderId}`
                                            )
                                        }
                                    >
                                        View Details
                                    </Button>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}