import { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
    ArrowLeft,
    ChevronDown,
    ClipboardList,
    Package,
} from "lucide-react";

import Button from "../components/ui/Button";
import {
    ORDER_STATUS_CONFIG,
    STATUS_ORDER,
} from "../utils/orderStatus";
import { useBulkOrderHistoryStore } from "../store/bulkOrderHistory.store";
import { formatCurrency } from "../utils/pricing";
import { formatDateTime } from "../utils/date";
import { useConfigStore } from "../store/config.store";

export default function BulkOrders() {
    const navigate = useNavigate();
    const location = useLocation();

    const {
        orders,
        fetchingOrders,
        fetchOrders,
    } = useBulkOrderHistoryStore();

    const [sortBy, setSortBy] =
        useState("latest");


    const config = useConfigStore(
        (state) => state.config
    );

    const companyName =
        config?.companyName ??
        "Sivakaasi Pyro Park";

    useEffect(() => {
        fetchOrders();
    }, [
        fetchOrders,
        location.key,
    ]);
    const STATUS_PRIORITY = useMemo(
        () =>
            STATUS_ORDER.reduce(
                (acc, status, index) => {
                    acc[status] = index;
                    return acc;
                },
                {} as Record<string, number>
            ),
        []
    );

    /*
     * Sorted / filtered orders
     */
    const sortedOrders = useMemo(() => {
        const list = [...orders];

        switch (sortBy) {
            case "latest":
                return list.sort(
                    (a, b) =>
                        b.createdAt -
                        a.createdAt
                );

            case "oldest":
                return list.sort(
                    (a, b) =>
                        a.createdAt -
                        b.createdAt
                );

            case "active":
                return list
                    .filter(
                        (order) =>
                            order.status !==
                            "CANCELLED"
                    )
                    .sort(
                        (a, b) =>
                            (STATUS_PRIORITY[
                                a.status
                            ] ?? 999) -
                            (STATUS_PRIORITY[
                                b.status
                            ] ?? 999)
                    );

            case "cancelled":
                return list
                    .filter(
                        (order) =>
                            order.status ===
                            "CANCELLED"
                    )
                    .sort(
                        (a, b) =>
                            b.createdAt -
                            a.createdAt
                    );

            default:
                return list;
        }
    }, [
        orders,
        sortBy,
        STATUS_PRIORITY,
    ]);

    /*
     * Loading state
     */
    if (
        fetchingOrders &&
        orders.length === 0
    ) {
        return (
            <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
                <div className="space-y-3">
                    {Array.from({
                        length: 5,
                    }).map((_, index) => (
                        <OrderSkeleton
                            key={index}
                        />
                    ))}
                </div>
            </div>
        );
    }

    /*
     * Empty state
     */
    if (
        !fetchingOrders &&
        orders.length === 0
    ) {
        return (
            <div className="mx-auto flex min-h-[60vh] w-full max-w-6xl items-center justify-center px-4 py-10 sm:px-6 lg:px-8">
                <div className="w-full max-w-md text-center">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                        <ClipboardList
                            size={30}
                            className="text-gray-500"
                        />
                    </div>

                    <h2 className="mt-5 text-xl font-semibold text-[var(--color-primary)]">
                        No Bulk Orders Yet
                    </h2>

                    <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[var(--color-muted)]">
                        You haven't placed any
                        bulk orders yet.
                    </p>

                    <div className="mt-5">
                        <Button
                            onClick={() =>
                                navigate(
                                    "/bulk-order"
                                )
                            }
                        >
                            Create Bulk Order
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="mx-auto w-full max-w-6xl px-4 py-5 sm:px-6 sm:py-7 lg:px-8">
            {/* =====================================================
                HEADER
            ====================================================== */}
            <div className="mb-5 flex flex-col gap-4 sm:mb-6 sm:flex-row sm:items-center sm:justify-between">
                {/* Page title */}
                <div className="flex min-w-0 items-center gap-3">
                    <button
                        type="button"
                        onClick={() =>
                            navigate(-1)
                        }
                        aria-label="Go back"
                        className="
                            flex h-10 w-10
                            shrink-0
                            items-center
                            justify-center
                            rounded-full
                            bg-[var(--color-primary)]
                            text-white
                            shadow-sm
                            transition
                            hover:scale-105
                            active:scale-95
                        "
                    >
                        <ArrowLeft size={19} />
                    </button>

                    <div className="min-w-0">
                        <h1 className="truncate text-2xl font-semibold text-[var(--color-primary)] sm:text-3xl">
                            My Bulk Orders
                        </h1>

                        <p className="mt-0.5 text-sm text-[var(--color-muted)]">
                            View and manage your
                            bulk orders
                        </p>
                    </div>
                </div>

                {/* Sort */}
                <div className="relative shrink-0">
                    <select
                        value={sortBy}
                        onChange={(event) =>
                            setSortBy(
                                event.target.value
                            )
                        }
                        aria-label="Sort bulk orders"
                        className="
                            h-10
                            w-full
                            appearance-none
                            rounded-lg
                            border
                            border-gray-300
                            bg-white
                            px-3
                            pr-9
                            text-sm
                            text-gray-800
                            outline-none
                            transition
                            focus:border-[var(--color-primary)]
                            sm:w-44
                        "
                    >
                        <option value="latest">
                            Latest Orders
                        </option>

                        <option value="oldest">
                            Oldest Orders
                        </option>

                        <option value="active">
                            Active Orders
                        </option>

                        <option value="cancelled">
                            Cancelled Orders
                        </option>
                    </select>

                    <ChevronDown
                        size={16}
                        className="
                            pointer-events-none
                            absolute
                            right-3
                            top-1/2
                            -translate-y-1/2
                            text-gray-500
                        "
                    />
                </div>
            </div>

            <div className="mb-4 rounded-xl border border-yellow-200 bg-yellow-50 px-4 py-3 sm:mb-5">
                <p className="text-sm leading-5 text-yellow-800">
                    Orders can be adjusted
                    until they are confirmed
                    by {companyName}.
                </p>
            </div>


            {/* =====================================================
                ORDER LIST
            ====================================================== */}
            <div className="space-y-3">
                {sortedOrders.map((order) => {
                    const statusConfig =
                        ORDER_STATUS_CONFIG[
                        order.status
                        ] || {
                            label: order.status.replaceAll(
                                "_",
                                " "
                            ),
                            className:
                                "bg-gray-100 text-gray-700",
                        };

                    return (
                        <article
                            key={order.orderId}
                            className="
                                group
                                overflow-hidden
                                rounded-xl
                                border
                                border-gray-200
                                bg-white
                                px-4
                                py-4
                                shadow-sm
                                transition-all
                                hover:-translate-y-[1px]
                                hover:border-gray-300
                                hover:shadow-md
                                sm:px-5
                            "
                        >
                            <div
                                className="
                                    grid
                                    gap-4
                                    md:grid-cols-[minmax(0,1fr)_160px_150px_130px]
                                    md:items-center
                                "
                            >
                                {/* =================================================
                                    ORDER INFO
                                ================================================== */}
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2">
                                        <Package
                                            size={17}
                                            className="shrink-0 text-gray-400"
                                        />

                                        <span className="text-xs text-[var(--color-muted)]">
                                            Bulk Order
                                        </span>
                                    </div>

                                    <p className="mt-1 truncate text-base font-semibold text-gray-900 sm:text-lg">
                                        {order.orderId}
                                    </p>

                                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[var(--color-muted)]">
                                        <span>
                                            Placed on{" "}
                                            {formatDateTime(
                                                order.createdAt
                                            )}
                                        </span>

                                        <span className="hidden text-gray-300 sm:inline">
                                            •
                                        </span>

                                        <span>
                                            Scheme:{" "}
                                            {
                                                order.schemeId
                                            }
                                        </span>
                                    </div>
                                </div>

                                {/* =================================================
                                    STATUS
                                ================================================== */}
                                <div className="flex items-center justify-between md:flex-col md:justify-center md:gap-2">
                                    <span
                                        className={`
                                            inline-flex
                                            items-center
                                            justify-center
                                            rounded-full
                                            px-3.5
                                            py-1.5
                                            text-xs
                                            font-semibold
                                            whitespace-nowrap
                                            ${statusConfig.className}
                                        `}
                                    >
                                        {
                                            statusConfig.label
                                        }
                                    </span>

                                    <span className="text-sm text-[var(--color-muted)]">
                                        {
                                            order.items
                                                .length
                                        }{" "}
                                        {order.items
                                            .length ===
                                            1
                                            ? "Product"
                                            : "Products"}
                                    </span>
                                </div>

                                {/* =================================================
                                    ORDER TOTAL
                                ================================================== */}
                                <div className="border-t border-gray-100 pt-3 md:border-0 md:pt-0">
                                    <p className="text-xs text-[var(--color-muted)] md:text-right">
                                        Order Total
                                    </p>

                                    <p className="mt-0.5 whitespace-nowrap text-lg font-bold text-[var(--color-primary)] sm:text-xl md:text-right">
                                        ₹
                                        {formatCurrency(
                                            order
                                                .pricing
                                                .grandTotal
                                        )}
                                    </p>
                                </div>

                                {/* =================================================
                                    VIEW DETAILS
                                ================================================== */}
                                <div className="flex justify-start md:justify-end">
                                    <Button
                                        variant="secondary"
                                        onClick={() =>
                                            navigate(
                                                `/bulk-orders/${order.orderId}`
                                            )
                                        }
                                        className="
                                            shrink-0
                                            whitespace-nowrap
                                            px-4
                                            py-2.5
                                            text-sm
                                        "
                                    >
                                        View Details
                                    </Button>
                                </div>
                            </div>
                        </article>
                    );
                })}
            </div>
        </div>
    );
}

/* ============================================================
   ORDER SKELETON
============================================================ */

function OrderSkeleton() {
    return (
        <div className="animate-pulse rounded-xl border border-gray-200 bg-white px-4 py-4 shadow-sm sm:px-5">
            <div
                className="
                    grid
                    gap-4
                    md:grid-cols-[minmax(0,1fr)_160px_150px_130px]
                    md:items-center
                "
            >
                {/* Order info */}
                <div className="min-w-0">
                    <div className="h-3 w-20 rounded bg-gray-200" />

                    <div className="mt-2 h-5 w-56 max-w-full rounded bg-gray-200" />

                    <div className="mt-2 h-3 w-72 max-w-full rounded bg-gray-100" />
                </div>

                {/* Status */}
                <div className="flex justify-between md:flex-col md:items-center md:gap-2">
                    <div className="h-7 w-28 rounded-full bg-gray-200" />

                    <div className="h-4 w-20 rounded bg-gray-100" />
                </div>

                {/* Amount */}
                <div className="border-t border-gray-100 pt-3 md:border-0 md:pt-0">
                    <div className="md:ml-auto md:w-fit">
                        <div className="h-3 w-20 rounded bg-gray-100" />

                        <div className="mt-2 h-6 w-24 rounded bg-gray-200" />
                    </div>
                </div>

                {/* Button */}
                <div className="flex justify-start md:justify-end">
                    <div className="h-10 w-28 rounded-lg bg-gray-200" />
                </div>
            </div>
        </div>
    );
}