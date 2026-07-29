import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
    ArrowLeft,
    Calendar,
    CreditCard,
    MapPin,
    Package,
    Truck,
} from "lucide-react";

import { getBulkOrder } from "../services/bulkOrder.api";

interface BulkOrderDetails {
    orderId: string;
    createdAt: string;
    status: string;
    schemeName: string;
    address: {
        fullName: string;
        mobile: string;
        addressLine1: string;
        addressLine2?: string;
        city: string;
        state: string;
        pincode: string;
    };
    products: {
        productId: string;
        name: string;
        quantity: number;
        bulkQty: number;
        unitPrice: number;
        total: number;
    }[];
    pricing: {
        productTotal: number;
        packagingCharge: number;
        gstAmount: number;
        grandTotal: number;
    };
    remarks?: string;
}

export default function BulkOrderDetails() {

    const { orderId = "" } = useParams();

    const [loading, setLoading] = useState(true);

    const [order, setOrder] = useState<any | null>(null);

    useEffect(() => {

        async function load() {

            try {

                const data =
                    await getBulkOrder(orderId);

                setOrder(data);

            } finally {

                setLoading(false);

            }

        }

        load();

    }, [orderId]);

    if (loading) {

        return (

            <div className="container mx-auto max-w-7xl px-4 py-10">

                <div className="h-96 animate-pulse rounded-3xl bg-gray-100" />

            </div>

        );

    }

    if (!order) {

        return (

            <div className="container mx-auto py-20 text-center">

                Order not found.

            </div>

        );

    }

    return (

        <div className="container mx-auto max-w-7xl px-4 py-10">

            <Link
                to="/bulk-orders"
                className="mb-8 inline-flex items-center gap-2 text-primary"
            >

                <ArrowLeft size={18} />

                Back to Bulk Orders

            </Link>

            <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

                <div>

                    <h1 className="text-3xl font-bold">

                        {order.orderId}

                    </h1>

                    <div className="mt-2 flex items-center gap-2 text-gray-500">

                        <Calendar size={16} />

                        {new Date(order.createdAt).toLocaleString()}

                    </div>

                </div>

                <span className="rounded-full bg-yellow-100 px-4 py-2 font-semibold text-yellow-800">

                    {order.status}

                </span>

            </div>

            <div className="grid gap-8 xl:grid-cols-[2fr_420px]">

                <div className="space-y-8">

                    <div className="rounded-2xl border bg-white">

                        <div className="border-b px-6 py-5">

                            <h3 className="flex items-center gap-2 text-lg font-semibold">

                                <MapPin size={20} />

                                Delivery Address

                            </h3>

                        </div>

                        <div className="space-y-2 p-6">

                            <div className="font-semibold">

                                {order.address.fullName}

                            </div>

                            <div>{order.address.addressLine1}</div>

                            {order.address.addressLine2 && (
                                <div>{order.address.addressLine2}</div>
                            )}

                            <div>

                                {order.address.city},{" "}
                                {order.address.state}

                            </div>

                            <div>

                                {order.address.pincode}

                            </div>

                            <div>

                                {order.address.mobile}

                            </div>

                        </div>

                    </div>

                    <div className="rounded-2xl border bg-white">

                        <div className="border-b px-6 py-5">

                            <h3 className="flex items-center gap-2 text-lg font-semibold">

                                <Package size={20} />

                                Products

                            </h3>

                        </div>

                        <div className="divide-y">

                            {order.products.map((item: any) => (

                                <div
                                    key={item.productId}
                                    className="flex items-center justify-between p-6"
                                >

                                    <div>

                                        <div className="font-semibold">

                                            {item.name}

                                        </div>

                                        <div className="text-sm text-gray-500">

                                            {item.quantity} Boxes

                                        </div>

                                        <div className="text-sm text-gray-500">

                                            Box Qty : {item.bulkQty}

                                        </div>

                                    </div>

                                    <div className="text-right">

                                        <div>

                                            ₹{item.unitPrice.toLocaleString("en-IN")} / Box

                                        </div>

                                        <div className="mt-2 text-lg font-bold">

                                            ₹{item.total.toLocaleString("en-IN")}

                                        </div>

                                    </div>

                                </div>

                            ))}

                        </div>

                    </div>

                </div>

                <div className="space-y-6 xl:sticky xl:top-24 xl:h-fit">

                    <div className="rounded-2xl border bg-white">

                        <div className="border-b px-6 py-5">

                            <h3 className="flex items-center gap-2 text-lg font-semibold">

                                <CreditCard size={20} />

                                Pricing

                            </h3>

                        </div>

                        <div className="space-y-4 p-6">

                            <Row
                                label="Products Total"
                                value={order.pricing.productTotal}
                            />

                            <Row
                                label="Packaging"
                                value={order.pricing.packagingCharge}
                            />

                            <Row
                                label="GST"
                                value={order.pricing.gstAmount}
                            />

                            <hr />

                            <Row
                                label="Grand Total"
                                value={order.pricing.grandTotal}
                                bold
                            />

                        </div>

                    </div>

                    <div className="rounded-2xl border bg-white">

                        <div className="border-b px-6 py-5">

                            <h3 className="flex items-center gap-2 text-lg font-semibold">

                                <Truck size={20} />

                                Order Details

                            </h3>

                        </div>

                        <div className="space-y-4 p-6">

                            <Info
                                label="Scheme"
                                value={order.schemeName}
                            />

                            <Info
                                label="Status"
                                value={order.status}
                            />

                            {order.remarks && (

                                <Info
                                    label="Admin Remarks"
                                    value={order.remarks}
                                />

                            )}

                        </div>

                    </div>

                </div>

            </div>

        </div>

    );

}

function Row({
    label,
    value,
    bold = false,
}: {
    label: string;
    value: number;
    bold?: boolean;
}) {
    return (
        <div className="flex justify-between">
            <span className={bold ? "font-semibold" : ""}>
                {label}
            </span>
            <span className={bold ? "font-semibold text-lg" : ""}>
                ₹{value.toLocaleString("en-IN")}
            </span>
        </div>
    );
}

function Info({
    label,
    value,
}: {
    label: string;
    value: string;
}) {
    return (
        <div>
            <div className="text-sm text-gray-500">
                {label}
            </div>
            <div className="mt-1 font-semibold">
                {value}
            </div>
        </div>
    );
}