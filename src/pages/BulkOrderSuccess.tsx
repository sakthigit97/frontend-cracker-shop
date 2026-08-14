import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
    CheckCircle2,
    ClipboardList,
    Home,
    Package,
    AlertCircle,
} from "lucide-react";

import { getBulkOrder } from "../services/bulkOrder.api";
import { formatDateTime } from "../utils/date";

interface OrderInfo {
    orderId: string;
    createdAt: string;
    grandTotal: number;
}

export default function BulkOrderSuccess() {
    const { orderId = "" } = useParams();

    const [loading, setLoading] = useState(true);
    const [order, setOrder] =
        useState<OrderInfo | null>(null);
    const [error, setError] = useState(false);

    useEffect(() => {
        let mounted = true;

        async function load() {
            if (!orderId) {
                setLoading(false);
                setError(true);
                return;
            }

            try {
                setLoading(true);
                setError(false);

                const data =
                    await getBulkOrder(orderId);

                if (!mounted) {
                    return;
                }

                setOrder({
                    orderId: data.orderId,
                    createdAt: data.createdAt,
                    grandTotal:
                        data.pricing.grandTotal,
                });
            } catch {
                if (mounted) {
                    setError(true);
                    setOrder(null);
                }
            } finally {
                if (mounted) {
                    setLoading(false);
                }
            }
        }

        load();

        return () => {
            mounted = false;
        };
    }, [orderId]);

    /*
     * Loading state
     */
    if (loading) {
        return (
            <main className="min-h-[calc(100vh-80px)] bg-gray-50">
                <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
                    <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
                        <div className="animate-pulse p-5 sm:p-8 lg:p-10">

                            {/* Success icon */}
                            <div className="mx-auto h-16 w-16 rounded-full bg-gray-200 sm:h-[72px] sm:w-[72px]" />

                            {/* Title */}
                            <div className="mx-auto mt-6 h-10 max-w-md rounded-lg bg-gray-200" />

                            {/* Description */}
                            <div className="mx-auto mt-4 h-12 max-w-2xl rounded-lg bg-gray-100" />

                            {/* Order summary */}
                            <div className="mx-auto mt-8 h-40 w-full rounded-2xl bg-gray-100 sm:mt-10" />

                            {/* Buttons */}
                            <div className="mt-8 grid gap-4 sm:grid-cols-2">
                                <div className="h-14 rounded-xl bg-gray-100" />
                                <div className="h-14 rounded-xl bg-gray-200" />
                            </div>

                            {/* Next steps */}
                            <div className="mt-8 h-48 w-full rounded-2xl bg-gray-100 sm:mt-10" />
                        </div>
                    </div>
                </div>
            </main>
        );
    }

    /*
     * Error state
     */
    if (error || !order) {
        return (
            <main className="min-h-[calc(100vh-80px)] bg-gray-50">
                <div className="mx-auto flex w-full max-w-6xl items-center justify-center px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
                    <div className="w-full max-w-xl rounded-3xl border border-red-200 bg-white p-6 text-center shadow-sm sm:p-10">

                        <div className="flex justify-center">
                            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
                                <AlertCircle
                                    size={36}
                                    className="text-red-600"
                                />
                            </div>
                        </div>

                        <h1 className="mt-5 text-2xl font-bold text-gray-900 sm:text-3xl">
                            Unable to load order
                        </h1>

                        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-gray-600 sm:text-base">
                            We could not load the bulk order
                            details right now. Please try again
                            or check your bulk orders.
                        </p>

                        <div className="mt-7 grid gap-3 sm:grid-cols-2">
                            <Link
                                to="/bulk-orders"
                                className="flex min-h-12 items-center justify-center gap-2 rounded-xl border border-primary px-5 py-3 font-semibold text-primary transition hover:bg-primary hover:text-white"
                            >
                                <ClipboardList
                                    size={20}
                                />

                                My Bulk Orders
                            </Link>

                            <Link
                                to="/"
                                className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 font-semibold text-white transition hover:opacity-90"
                            >
                                <Home size={20} />

                                Continue Shopping
                            </Link>
                        </div>
                    </div>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-[calc(100vh-80px)] bg-gray-50">
            <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">

                <div className="overflow-hidden rounded-3xl border border-green-200 bg-white shadow-sm">

                    {/* =====================================================
                        SUCCESS HEADER
                    ====================================================== */}
                    <section className="px-4 pb-6 pt-8 sm:px-8 sm:pb-8 sm:pt-10 lg:px-12 lg:pb-10 lg:pt-12">

                        <div className="flex justify-center">
                            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-50 sm:h-[72px] sm:w-[72px]">
                                <CheckCircle2
                                    size={42}
                                    strokeWidth={2}
                                    className="text-green-600 sm:h-12 sm:w-12"
                                />
                            </div>
                        </div>

                        <h1 className="mt-5 text-center text-3xl font-bold tracking-tight text-gray-900 sm:mt-6 sm:text-4xl lg:text-5xl">
                            Bulk Order Submitted
                        </h1>

                        <p className="mx-auto mt-3 max-w-3xl text-center text-sm leading-6 text-gray-600 sm:mt-4 sm:text-base sm:leading-7 lg:text-lg">
                            Thank you for choosing us. Your bulk
                            order has been received successfully.
                            Our sales team will verify your order
                            and contact you shortly.
                        </p>
                    </section>

                    {/* =====================================================
                        ORDER SUMMARY
                    ====================================================== */}
                    <section className="px-4 sm:px-8 lg:px-12">

                        <div className="w-full rounded-2xl border border-gray-200 bg-gray-50 p-4 sm:p-6 lg:p-7">

                            <InfoRow
                                label="Bulk Order ID"
                                value={order.orderId}
                            />

                            <InfoRow
                                label="Order Date"
                                value={formatDateTime(
                                    order.createdAt
                                )}
                            />

                            <InfoRow
                                label="Grand Total"
                                value={`₹${order.grandTotal.toLocaleString(
                                    "en-IN"
                                )}`}
                                highlight
                            />
                        </div>
                    </section>

                    {/* =====================================================
                        ACTION BUTTONS
                    ====================================================== */}
                    <section className="px-4 py-6 sm:px-8 sm:py-8 lg:px-12">

                        <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">

                            <Link
                                to="/bulk-orders"
                                className="flex min-h-14 items-center justify-center gap-2 rounded-xl border border-primary bg-white px-5 py-3.5 text-center font-semibold text-primary transition hover:bg-primary hover:text-white"
                            >
                                <ClipboardList
                                    size={21}
                                />

                                <span>
                                    My Bulk Orders
                                </span>
                            </Link>

                            <Link
                                to="/bulk-order"
                                className="flex min-h-14 items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3.5 text-center font-semibold text-white transition hover:opacity-90"
                            >
                                <Home size={21} />
                                <span>
                                    Continue Shopping
                                </span>
                            </Link>

                        </div>
                    </section>

                    {/* =====================================================
                        WHAT HAPPENS NEXT
                    ====================================================== */}
                    <section className="px-4 pb-6 sm:px-8 sm:pb-8 lg:px-12 lg:pb-12">

                        <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5 sm:p-6 lg:p-7">

                            <div className="flex items-start gap-4 sm:gap-5">

                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 sm:h-11 sm:w-11">
                                    <Package
                                        size={23}
                                        className="text-blue-700"
                                    />
                                </div>

                                <div className="min-w-0 flex-1">

                                    <h2 className="text-lg font-semibold text-blue-900 sm:text-xl">
                                        What happens next?
                                    </h2>

                                    <ul className="mt-4 space-y-3 text-sm leading-6 text-blue-800 sm:text-base">

                                        <li className="flex items-start gap-2">
                                            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-700" />

                                            <span>
                                                Our sales team
                                                will review your
                                                bulk order.
                                            </span>
                                        </li>

                                        <li className="flex items-start gap-2">
                                            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-700" />

                                            <span>
                                                We will contact
                                                you for
                                                confirmation.
                                            </span>
                                        </li>

                                        <li className="flex items-start gap-2">
                                            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-700" />

                                            <span>
                                                Stock availability
                                                will be verified.
                                            </span>
                                        </li>

                                        <li className="flex items-start gap-2">
                                            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-700" />

                                            <span>
                                                Delivery schedule
                                                will be shared
                                                after
                                                confirmation.
                                            </span>
                                        </li>

                                    </ul>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        </main>
    );
}

interface InfoRowProps {
    label: string;
    value: string;
    highlight?: boolean;
}

function InfoRow({
    label,
    value,
    highlight = false,
}: InfoRowProps) {
    return (
        <div className="flex flex-col gap-1 border-b border-gray-200 py-3.5 last:border-none sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:py-4">

            <span className="shrink-0 text-sm text-gray-500 sm:text-base">
                {label}
            </span>

            <span
                className={[
                    "min-w-0 break-words text-left sm:text-right",
                    highlight
                        ? "text-lg font-bold text-gray-900 sm:text-xl"
                        : "font-semibold text-gray-900",
                ].join(" ")}
            >
                {value}
            </span>

        </div>
    );
}