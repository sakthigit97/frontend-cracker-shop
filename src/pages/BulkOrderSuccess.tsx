import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
    CheckCircle2,
    ClipboardList,
    Home,
    Package,
} from "lucide-react";

import { getBulkOrder } from "../services/bulkOrder.api";

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

    useEffect(() => {
        async function load() {
            try {
                const data = await getBulkOrder(orderId);
                setOrder({
                    orderId: data.orderId,
                    createdAt: data.createdAt,
                    grandTotal: data.pricing.grandTotal,
                });
            } finally {
                setLoading(false);
            }
        }

        if (orderId) {
            load();
        }
    }, [orderId]);

    if (loading) {
        return (
            <div className="container mx-auto max-w-4xl px-4 py-20">

                <div className="h-96 animate-pulse rounded-3xl bg-gray-100" />

            </div>
        );
    }

    return (
        <div className="container mx-auto max-w-4xl px-4 py-12">

            <div className="rounded-3xl border border-green-200 bg-white p-10 shadow-sm">

                <div className="flex justify-center">

                    <CheckCircle2
                        size={72}
                        className="text-green-600"
                    />

                </div>

                <h1 className="mt-6 text-center text-4xl font-bold">

                    Bulk Order Submitted

                </h1>

                <p className="mx-auto mt-4 max-w-2xl text-center text-gray-600">

                    Thank you for choosing us.

                    Your bulk order has been received successfully.

                    Our sales team will verify your order and
                    contact you shortly.

                </p>

                {order && (

                    <div className="mx-auto mt-10 max-w-xl rounded-2xl border bg-gray-50 p-6">

                        <InfoRow
                            label="Bulk Order ID"
                            value={order.orderId}
                        />

                        <InfoRow
                            label="Order Date"
                            value={new Date(
                                order.createdAt
                            ).toLocaleString()}
                        />

                        <InfoRow
                            label="Grand Total"
                            value={`₹${order.grandTotal.toLocaleString(
                                "en-IN"
                            )}`}
                        />

                    </div>

                )}

                <div className="mt-10 grid gap-4 sm:grid-cols-2">

                    <Link
                        to="/bulk-orders"
                        className="flex items-center justify-center gap-2 rounded-xl border border-primary px-6 py-4 font-semibold text-primary transition hover:bg-primary hover:text-white"
                    >

                        <ClipboardList size={20} />

                        My Bulk Orders

                    </Link>

                    <Link
                        to="/"
                        className="flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-4 font-semibold text-white transition hover:opacity-90"
                    >

                        <Home size={20} />

                        Continue Shopping

                    </Link>

                </div>

                <div className="mt-12 rounded-2xl border border-blue-200 bg-blue-50 p-6">

                    <div className="flex items-start gap-4">

                        <Package
                            className="text-blue-700"
                            size={26}
                        />

                        <div>

                            <h3 className="font-semibold text-blue-900">

                                What happens next?

                            </h3>

                            <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-blue-800">

                                <li>
                                    Our sales team will review
                                    your bulk order.
                                </li>

                                <li>
                                    We will contact you for
                                    confirmation.
                                </li>

                                <li>
                                    Stock availability will be
                                    verified.
                                </li>

                                <li>
                                    Delivery schedule will be
                                    shared after confirmation.
                                </li>

                            </ul>

                        </div>

                    </div>

                </div>

            </div>

        </div>
    );
}

interface InfoRowProps {
    label: string;
    value: string;
}

function InfoRow({
    label,
    value,
}: InfoRowProps) {
    return (
        <div className="flex justify-between border-b py-3 last:border-none">

            <span className="text-gray-500">
                {label}
            </span>

            <span className="font-semibold">
                {value}
            </span>

        </div>
    );
}