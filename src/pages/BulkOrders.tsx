import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Package, ChevronRight } from "lucide-react";

import { getBulkOrders } from "../services/bulkOrder.api";

interface BulkOrderListItem {
    orderId: string;
    createdAt: string;
    grandTotal: number;
    totalBoxes: number;
    status: string;
}

const statusColors: Record<string, string> = {
    PENDING: "bg-yellow-100 text-yellow-800",
    CONFIRMED: "bg-blue-100 text-blue-800",
    PROCESSING: "bg-indigo-100 text-indigo-800",
    SHIPPED: "bg-purple-100 text-purple-800",
    DELIVERED: "bg-green-100 text-green-800",
    CANCELLED: "bg-red-100 text-red-800",
};

export default function BulkOrders() {
    const [orders, setOrders] = useState<BulkOrderListItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            try {
                const response = await getBulkOrders();
                setOrders(response.items);
            } finally {
                setLoading(false);
            }
        }

        load();
    }, []);

    if (loading) {
        return (
            <div className="container mx-auto max-w-6xl px-4 py-10 space-y-4">
                {[1, 2, 3, 4].map((i) => (
                    <div
                        key={i}
                        className="h-28 animate-pulse rounded-2xl bg-gray-100"
                    />
                ))}
            </div>
        );
    }

    return (
        <div className="container mx-auto max-w-6xl px-4 py-10">

            <h1 className="mb-8 text-3xl font-bold">
                My Bulk Orders
            </h1>

            {!orders.length && (
                <div className="rounded-2xl border border-dashed border-gray-300 py-20 text-center">

                    <Package
                        className="mx-auto text-gray-400"
                        size={50}
                    />

                    <h2 className="mt-5 text-xl font-semibold">
                        No Bulk Orders Yet
                    </h2>

                    <p className="mt-2 text-gray-500">
                        Your submitted bulk orders will appear here.
                    </p>

                    <Link
                        to="/bulk-order"
                        className="mt-6 inline-flex rounded-xl bg-primary px-6 py-3 font-semibold text-white"
                    >
                        Create Bulk Order
                    </Link>

                </div>
            )}

            <div className="space-y-5">

                {orders.map((order) => (

                    <Link
                        key={order.orderId}
                        to={`/bulk-orders/${order.orderId}`}
                        className="block rounded-2xl border border-gray-200 bg-white p-6 transition hover:border-primary hover:shadow"
                    >

                        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

                            <div>

                                <div className="font-semibold text-lg">
                                    {order.orderId}
                                </div>

                                <div className="mt-2 text-sm text-gray-500">
                                    {new Date(order.createdAt).toLocaleString()}
                                </div>

                            </div>

                            <div className="grid grid-cols-2 gap-8 lg:flex lg:items-center">

                                <div>

                                    <div className="text-xs text-gray-500">
                                        Boxes
                                    </div>

                                    <div className="font-semibold">
                                        {order.totalBoxes}
                                    </div>

                                </div>

                                <div>

                                    <div className="text-xs text-gray-500">
                                        Total
                                    </div>

                                    <div className="font-semibold">
                                        ₹{order.grandTotal.toLocaleString("en-IN")}
                                    </div>

                                </div>

                                <div>

                                    <span
                                        className={`rounded-full px-3 py-1 text-xs font-semibold ${statusColors[order.status] ??
                                            "bg-gray-100 text-gray-700"
                                            }`}
                                    >
                                        {order.status}
                                    </span>

                                </div>

                                <ChevronRight
                                    className="text-gray-400"
                                    size={22}
                                />

                            </div>

                        </div>

                    </Link>

                ))}

            </div>

        </div>
    );
}