import { useEffect, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import {
    ArrowLeft,
    FileText,
    MapPin,
    Package,
    Phone,
    ReceiptIndianRupee,
    User,
} from "lucide-react";

import Button from "../components/ui/Button";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import type { BulkOrderProduct } from "../types/bulkOrder";
import { useAlert } from "../store/alert.store";
import { useBulkOrderHistoryStore } from "../store/bulkOrderHistory.store";
import { useConfigStore } from "../store/config.store";
import defaultImage from "../assets/default-image.png";
import { formatCurrency } from "../utils/pricing";
import { downloadBulkInvoice } from "../utils/pdf/downloadBulkInvoice";
import { ORDER_STATUS_CONFIG } from "../utils/orderStatus";
import { formatDateTime } from "../utils/date";
const TERMINAL_STATUS = "CANCELLED";

const CANCELLABLE_STATUSES = [
    "ORDER_PLACED",
    "ORDER_CONFIRMED",
    "PAYMENT_CONFIRMED",
];

export default function BulkOrderDetails() {
    const navigate = useNavigate();
    const { orderId } = useParams();
    const location = useLocation();
    const config = useConfigStore((s) => s.config);

    const gstPercentage = config?.gstPercent ?? 0;

    const packagePercent = config?.packagingPercent ?? 0;

    const { order, fetchingOrder, cancelling, fetchOrder, cancelOrder } =
        useBulkOrderHistoryStore();

    const { showAlert } = useAlert();

    const [showCancelConfirm, setShowCancelConfirm] = useState(false);

    const [downloading, setDownloading] = useState(false);
    useEffect(() => {
        if (!orderId) {
            return;
        }

        const forceRefresh =
            (
                location.state as {
                    forceRefresh?: boolean;
                } | null
            )?.forceRefresh === true;

        fetchOrder(orderId, forceRefresh);

        if (forceRefresh) {
            navigate(location.pathname, {
                replace: true,
            });
        }
    }, [orderId, fetchOrder, navigate, location.pathname, location.state]);

    async function handleCancel() {
        if (!order) return;

        try {
            await cancelOrder(order.orderId);

            showAlert({
                type: "success",
                message: "Bulk Order Cancelled Successfully",
                duration: 1500,
            });

            navigate("/bulk-orders", {
                replace: true,
            });
        } catch (err: any) {
            showAlert({
                type: "error",
                message: err.message ?? "Unable to cancel bulk order.",
            });
        } finally {
            setShowCancelConfirm(false);
        }
    }

    async function handleDownloadInvoice() {
        if (!order || !config || downloading) {
            return;
        }

        setDownloading(true);

        try {
            await new Promise((resolve) => setTimeout(resolve, 0));

            await downloadBulkInvoice(order, config);
        } catch (err: any) {
            showAlert({
                type: "error",
                message: err.message || "Unable to download invoice",
            });
        } finally {
            setDownloading(false);
        }
    }

    if (fetchingOrder) {
        return (
            <div className="mx-auto w-full max-w-6xl px-4 py-5 sm:px-6 sm:py-6 lg:px-8">
                <div className="space-y-4">
                    <div className="h-12 animate-pulse rounded-2xl bg-gray-100" />

                    <div className="h-56 animate-pulse rounded-2xl bg-gray-100" />

                    <div className="h-40 animate-pulse rounded-2xl bg-gray-100" />

                    <div className="h-72 animate-pulse rounded-2xl bg-gray-100" />
                </div>
            </div>
        );
    }

    if (!order) {
        return (
            <div className="mx-auto flex min-h-[60vh] w-full max-w-6xl items-center justify-center px-4">
                <div className="text-center">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
                        <Package size={26} className="text-gray-500" />
                    </div>

                    <h2 className="mt-4 text-lg font-semibold text-gray-900">
                        Bulk Order not found
                    </h2>

                    <p className="mt-1 text-sm text-gray-500">
                        We couldn't find the requested bulk order.
                    </p>

                    <div className="mt-5">
                        <Button onClick={() => navigate("/bulk-orders")}>
                            Back to Bulk Orders
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    const STATUS_KEYS = Object.keys(ORDER_STATUS_CONFIG);

    const currentIndex = STATUS_KEYS.indexOf(order.status);

    const isCancelled = order.status === TERMINAL_STATUS;

    const canCancel = CANCELLABLE_STATUSES.includes(order.status);

    const canDownloadInvoice = [
        "PAYMENT_CONFIRMED",
        "ORDER_PACKED",
        "DISPATCHED",
    ].includes(order.status);

    const canAdjust = order.status === "ORDER_PLACED";

    const totalQuantity = order.items.reduce(
        (total: number, item: BulkOrderProduct) => total + item.quantity,
        0
    );

    const isTamilNadu = order.address?.state
        ?.toLowerCase()
        .includes("tamil nadu");

    const deliveryText = isTamilNadu ? "3–5 working days" : "7–10 working days";

    return (
        <div className="mx-auto w-full max-w-6xl px-4 py-5 sm:px-6 sm:py-6 lg:px-8">
            <div className="mb-5">
                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={() => navigate(-1)}
                        aria-label="Go back"
                        className="
              flex h-10 w-10 shrink-0
              items-center justify-center
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
                        <h1 className="text-xl font-bold text-[var(--color-primary)] sm:text-2xl">
                            Bulk Order Details
                        </h1>

                        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[var(--color-muted)] sm:text-sm">
                            <span className="font-medium text-gray-700">{order.orderId}</span>

                            <span className="hidden sm:inline">•</span>

                            <span>
                                Scheme:{" "}
                                <span className="font-medium text-gray-700">
                                    {order.schemeId}
                                </span>
                            </span>

                            <span className="hidden sm:inline">•</span>

                            <span>{formatDateTime(order.createdAt)}</span>
                        </div>
                    </div>
                </div>
            </div>

            {isCancelled && (
                <section className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 sm:px-5">
                    <div className="flex items-start gap-3">
                        <div className="mt-0.5 shrink-0 rounded-full bg-red-100 p-1.5 text-red-600">
                            <Package size={16} />
                        </div>

                        <div>
                            <p className="font-semibold text-red-700">Bulk Order Cancelled</p>

                            <p className="mt-0.5 text-sm text-red-600">
                                This bulk order has been cancelled and will not be processed
                                further.
                            </p>
                        </div>
                    </div>
                </section>
            )}

            {!isCancelled && (
                <section className="mb-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
                    <div className="mb-4">
                        <h2 className="text-base font-semibold text-gray-900 sm:text-lg">
                            Order Tracking
                        </h2>

                        <p className="mt-0.5 text-xs text-gray-500">
                            Current order progress
                        </p>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                        {STATUS_KEYS.map((statusKey, index) => {
                            const status = ORDER_STATUS_CONFIG[statusKey];

                            let indicatorClass = "border-gray-200 bg-white text-gray-400";

                            let cardClass = "border-gray-200 bg-gray-50";

                            let helperText = "";

                            if (index <= currentIndex) {
                                indicatorClass = "border-green-500 bg-green-500 text-white";

                                cardClass = "border-green-100 bg-green-50";
                            } else if (index === currentIndex + 1) {
                                indicatorClass =
                                    "border-yellow-400 bg-yellow-400 text-gray-900";

                                cardClass = "border-yellow-100 bg-yellow-50";

                                helperText = "Pending";
                            }

                            return (
                                <div
                                    key={statusKey}
                                    className={`
                      rounded-xl
                      border
                      p-3
                      ${cardClass}
                    `}
                                >
                                    <div className="flex items-center gap-3">
                                        <div
                                            className={`
                          flex h-8 w-8 shrink-0
                          items-center justify-center
                          rounded-full
                          border
                          text-xs font-semibold
                          ${indicatorClass}
                        `}
                                        >
                                            {index + 1}
                                        </div>

                                        <div className="min-w-0">
                                            <p
                                                className={`
                            text-sm font-medium
                            ${index <= currentIndex
                                                        ? "text-gray-900"
                                                        : "text-gray-500"
                                                    }
                          `}
                                            >
                                                {status.label}
                                            </p>

                                            {helperText && (
                                                <p className="mt-0.5 text-[11px] font-semibold text-amber-600">
                                                    {helperText}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    <div className="mt-4 rounded-xl border border-yellow-200 bg-yellow-50 px-4 py-3">
                        <p className="text-sm text-yellow-800">
                            Expected Delivery:
                            <span className="ml-1 font-semibold">{deliveryText}</span>
                        </p>
                    </div>
                </section>
            )}

            <section className="mb-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
                <div className="grid gap-5 md:grid-cols-3">
                    {/* Customer */}

                    <div>
                        <SectionTitle icon={<User size={17} />} title="Customer Details" />

                        <div className="mt-3 grid gap-3 sm:grid-cols-2 md:grid-cols-1 lg:grid-cols-2">
                            <InfoItem
                                icon={<User size={15} />}
                                label="Name"
                                value={order.address?.fullName || "-"}
                            />

                            <InfoItem
                                icon={<Phone size={15} />}
                                label="Mobile"
                                value={order.address?.mobile || "-"}
                            />
                        </div>
                    </div>

                    {/* Order */}

                    <div>
                        <SectionTitle
                            icon={<ReceiptIndianRupee size={17} />}
                            title="Order Information"
                        />

                        <div className="mt-3 grid gap-3">
                            <InfoItem label="Scheme" value={order.schemeId || "-"} />
                        </div>
                    </div>

                    {/* Address */}
                    <div>
                        <SectionTitle
                            icon={<MapPin size={17} />}
                            title="Delivery Address"
                        />

                        <div className="mt-3">
                            <p className="text-sm leading-6 text-gray-900">
                                {[
                                    order.address?.addressLine1,
                                    order.address?.addressLine2,
                                    order.address?.city,
                                    order.address?.state,
                                    order.address?.pincode,
                                ]
                                    .filter(Boolean)
                                    .join(", ") || "-"}
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {order.statusHistory?.length > 0 && (
                <section className="mb-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
                    <SectionTitle icon={<FileText size={17} />} title="Order History" />

                    <div className="mt-4 max-h-[360px] overflow-y-auto pr-1">
                        <div className="space-y-4">
                            {[...order.statusHistory]
                                .sort((a, b) => (b.changedAt ?? b.at) - (a.changedAt ?? a.at))
                                .map((history, index) => {
                                    const status = history.toStatus ?? history.status;

                                    const updatedBy = history.changedBy ?? history.by;

                                    const updatedAt = history.changedAt ?? history.at;

                                    return (
                                        <div
                                            key={index}
                                            className="relative border-l-2 border-gray-200 pl-4"
                                        >
                                            <div className="absolute -left-[7px] top-1 h-3 w-3 rounded-full bg-[var(--color-primary)]" />

                                            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                                                <p className="font-medium text-gray-900">
                                                    {ORDER_STATUS_CONFIG[status]?.label ??
                                                        status?.replaceAll("_", " ")}
                                                </p>

                                                <span className="text-xs text-gray-500">
                                                    {formatDateTime(updatedAt)}
                                                </span>
                                            </div>

                                            <p className="mt-1 text-sm text-gray-500">
                                                Changed By:{" "}
                                                {updatedBy?.startsWith("ADMIN")
                                                    ? "Admin"
                                                    : updatedBy?.replace("USER#", "")}
                                            </p>

                                            {history.comment && (
                                                <div className="mt-2 rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-600">
                                                    {history.comment}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                        </div>
                    </div>
                </section>
            )}

            <section className="mb-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
                {/* Products Header */}
                <div className="mb-4">
                    <SectionTitle icon={<Package size={18} />} title="Products" />

                    <p className="mt-1 text-xs text-gray-500">
                        {order.items.length}{" "}
                        {order.items.length === 1 ? "Product" : "Products"} •{" "}
                        {totalQuantity} Qty
                    </p>
                </div>

                <div className="overflow-hidden rounded-xl border border-gray-200">
                    <div className="hidden lg:block max-h-[420px] overflow-x-auto overflow-y-auto">
                        <table className="w-full min-w-[760px] border-collapse">
                            {/* Sticky Header */}
                            <thead className="sticky top-0 z-10 bg-gray-50">
                                <tr className="border-b border-gray-200">
                                    <th
                                        className="
                                px-5
                                py-3
                                text-left
                                text-xs
                                font-medium
                                uppercase
                                tracking-wide
                                text-gray-600
                                bg-gray-50
                            "
                                    >
                                        Product
                                    </th>

                                    <th
                                        className="
                                w-[130px]
                                px-4
                                py-3
                                text-center
                                text-xs
                                font-medium
                                uppercase
                                tracking-wide
                                text-gray-600
                                bg-gray-50
                            "
                                    >
                                        Carton
                                    </th>

                                    <th
                                        className="
                                w-[170px]
                                px-4
                                py-3
                                text-center
                                text-xs
                                font-medium
                                uppercase
                                tracking-wide
                                text-gray-600
                                bg-gray-50
                            "
                                    >
                                        Carton Content
                                    </th>

                                    <th
                                        className="
                                w-[130px]
                                px-4
                                py-3
                                text-right
                                text-xs
                                font-medium
                                uppercase
                                tracking-wide
                                text-gray-600
                                bg-gray-50
                            "
                                    >
                                        Price
                                    </th>

                                    <th
                                        className="
                                w-[160px]
                                px-5
                                py-3
                                text-right
                                text-xs
                                font-medium
                                uppercase
                                tracking-wide
                                text-gray-600
                                bg-gray-50
                            "
                                    >
                                        Total
                                    </th>
                                </tr>
                            </thead>

                            <tbody>
                                {order.items.map((item: BulkOrderProduct) => (
                                    <tr
                                        key={item.productId}
                                        className="
                                    border-b
                                    border-gray-100
                                    last:border-b-0
                                    transition-colors
                                    hover:bg-gray-50
                                "
                                    >

                                        <td className="px-5 py-3">
                                            <div className="flex min-w-0 items-center gap-3">
                                                <img
                                                    src={item.image || defaultImage}
                                                    alt={item.name}
                                                    onError={(event) => {
                                                        event.currentTarget.onerror = null;

                                                        event.currentTarget.src = defaultImage;
                                                    }}
                                                    className="
                                                h-12
                                                w-12
                                                shrink-0
                                                rounded-lg
                                                border
                                                border-gray-200
                                                bg-white
                                                object-contain
                                                p-1
                                            "
                                                    loading="lazy"
                                                />

                                                <div className="min-w-0">
                                                    <p
                                                        className="
                                                    truncate
                                                    text-sm
                                                    font-semibold
                                                    text-gray-900
                                                "
                                                        title={item.name}
                                                    >
                                                        {item.name}
                                                    </p>

                                                    {item.brand && (
                                                        <p className="mt-0.5 text-xs text-gray-500">
                                                            {item.brand}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </td>


                                        <td className="px-4 py-3 text-center">
                                            <span className="text-sm font-medium text-gray-800">
                                                {item.quantity}
                                            </span>
                                        </td>


                                        <td className="px-4 py-3 text-center">
                                            <span className="whitespace-nowrap text-sm text-gray-600">
                                                {item.cartonQty} {item.packUnit}
                                            </span>
                                        </td>


                                        <td className="px-4 py-3 text-right">
                                            <span className="whitespace-nowrap text-sm font-semibold text-gray-800">
                                                ₹{formatCurrency(item.schemePrice)}
                                            </span>
                                        </td>


                                        <td className="px-5 py-3 text-right">
                                            <span className="whitespace-nowrap text-lg font-bold text-gray-900">
                                                ₹{formatCurrency(item.total)}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="lg:hidden max-h-[500px] overflow-y-auto divide-y divide-gray-100">
                        {order.items.map((item: BulkOrderProduct) => (
                            <div key={item.productId} className="p-4">
                                <div className="flex min-w-0 items-center gap-3">
                                    <img
                                        src={item.image || defaultImage}
                                        alt={item.name}
                                        onError={(event) => {
                                            event.currentTarget.onerror = null;

                                            event.currentTarget.src = defaultImage;
                                        }}
                                        className="
                                    h-12
                                    w-12
                                    shrink-0
                                    rounded-lg
                                    border
                                    border-gray-200
                                    bg-white
                                    object-contain
                                    p-1
                                    sm:h-14
                                    sm:w-14
                                "
                                        loading="lazy"
                                    />

                                    <div className="min-w-0 flex-1">
                                        <p
                                            className="
                                        truncate
                                        text-sm
                                        font-semibold
                                        text-gray-900
                                        sm:text-base
                                    "
                                            title={item.name}
                                        >
                                            {item.name}
                                        </p>

                                        {item.brand && (
                                            <p className="mt-0.5 text-xs text-gray-500">
                                                {item.brand}
                                            </p>
                                        )}
                                    </div>

                                    <div className="shrink-0 text-right">
                                        <p className="text-lg font-bold text-gray-900">
                                            ₹{formatCurrency(item.total)}
                                        </p>
                                    </div>
                                </div>

                                <div
                                    className="
                                mt-4
                                grid
                                grid-cols-3
                                gap-3
                                border-t
                                border-gray-100
                                pt-3
                            "
                                >
                                    {/* Carton */}

                                    <div className="min-w-0">
                                        <p
                                            className="
                                        text-[11px]
                                        font-medium
                                        uppercase
                                        tracking-wide
                                        text-gray-500
                                    "
                                        >
                                            Carton
                                        </p>

                                        <p className="mt-1 text-sm font-medium text-gray-800">
                                            {item.quantity}
                                        </p>
                                    </div>

                                    {/* Carton Content */}

                                    <div className="min-w-0">
                                        <p
                                            className="
                                        text-[11px]
                                        font-medium
                                        uppercase
                                        tracking-wide
                                        text-gray-500
                                    "
                                        >
                                            Carton Content
                                        </p>

                                        <p className="mt-1 whitespace-nowrap text-sm font-medium text-gray-700">
                                            {item.cartonQty} {item.packUnit}
                                        </p>
                                    </div>

                                    {/* Price */}

                                    <div className="min-w-0 text-right">
                                        <p
                                            className="
                                        text-[11px]
                                        font-medium
                                        uppercase
                                        tracking-wide
                                        text-gray-500
                                    "
                                        >
                                            Price
                                        </p>

                                        <p className="mt-1 whitespace-nowrap text-sm font-semibold text-gray-800">
                                            ₹{formatCurrency(item.schemePrice)}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="mt-4 border-t border-gray-200 pt-4">
                    <div className="mb-3 flex items-center gap-2">
                        <div className="rounded-lg bg-primary/10 p-2 text-primary">
                            <ReceiptIndianRupee size={17} />
                        </div>

                        <div>
                            <h3 className="font-semibold text-gray-900">Pricing Summary</h3>

                            <p className="text-xs text-gray-500">Final order calculation</p>
                        </div>
                    </div>

                    <div className="space-y-2.5 text-sm">
                        <PriceRow
                            label="Products Total"
                            value={order.pricing.productTotal}
                        />

                        <PriceRow
                            isPrice={false}
                            label="Cartonbox Total"
                            value={order.pricing.cartonBoxCount}
                        />

                        {(order.pricing?.packagingCharge ?? 0) > 0 && (
                            <PriceRow
                                label={`Packaging Charge (${packagePercent}%)`}
                                value={order.pricing.packagingCharge}
                            />
                        )}

                        {(order.pricing?.gstAmount ?? 0) > 0 && (
                            <PriceRow
                                label={`GST (${gstPercentage}%)`}
                                value={order.pricing.gstAmount}
                            />
                        )}

                        <div className="my-3 border-t border-dashed border-gray-300" />

                        <div className="flex items-end justify-between gap-4">
                            <div>
                                <p className="font-semibold text-gray-900">Grand Total</p>

                                <p className="mt-0.5 text-xs text-gray-500">
                                    Inclusive of applicable charges
                                </p>
                            </div>

                            <span className="whitespace-nowrap text-xl font-bold text-[var(--color-primary)]">
                                ₹{formatCurrency(order.pricing.grandTotal)}
                            </span>
                        </div>
                    </div>
                </div>
            </section>

            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
                {canDownloadInvoice && (
                    <Button variant="secondary" onClick={handleDownloadInvoice}>
                        {downloading ? "Downloading..." : "Download Invoice"}
                    </Button>
                )}

                {canCancel && (
                    <Button
                        disabled={cancelling}
                        onClick={() => setShowCancelConfirm(true)}
                        className="bg-red-500 text-white hover:bg-red-600"
                    >
                        {cancelling ? "Cancelling..." : "Cancel Order"}
                    </Button>
                )}

                {canAdjust && (
                    <Button
                        variant="secondary"
                        onClick={() =>
                            navigate(`/bulk-orders/${order.orderId}/adjust`, {
                                state: {
                                    order,
                                    isAdmin: false,
                                },
                            })
                        }
                    >
                        Adjust Order
                    </Button>
                )}
            </div>

            <ConfirmDialog
                open={showCancelConfirm}
                title="Cancel Bulk Order?"
                message={
                    <>
                        Are you sure you want to cancel this bulk order?
                        <br />
                        <span className="font-medium text-red-500">
                            This action cannot be undone.
                        </span>
                    </>
                }
                confirmText="Yes, Cancel"
                cancelText="No"
                loading={cancelling}
                onCancel={() => setShowCancelConfirm(false)}
                onConfirm={handleCancel}
            />
        </div>
    );
}

interface SectionTitleProps {
    icon: React.ReactNode;
    title: string;
}

function SectionTitle({ icon, title }: SectionTitleProps) {
    return (
        <div className="flex items-center gap-2">
            <div className="rounded-lg bg-primary/10 p-2 text-primary">{icon}</div>

            <h2 className="font-semibold text-gray-900">{title}</h2>
        </div>
    );
}

interface InfoItemProps {
    label: string;
    value: string;
    icon?: React.ReactNode;
}

function InfoItem({ label, value, icon }: InfoItemProps) {
    return (
        <div className="min-w-0">
            <p className="flex items-center gap-1.5 text-xs font-medium text-gray-500">
                {icon}
                {label}
            </p>

            <p className="mt-0.5 break-words text-sm text-gray-900">{value}</p>
        </div>
    );
}

interface PriceRowProps {
    isPrice?: boolean;
    label: string;
    value: number;
}

function PriceRow({ isPrice = true, label, value }: PriceRowProps) {
    return (
        <div className="flex items-center justify-between gap-4">
            <span className="text-gray-600">{label}</span>

            <span className="shrink-0 font-medium text-gray-900">
                {isPrice ? "₹" : ""} {formatCurrency(value)}
            </span>
        </div>
    );
}
