import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FaDownload } from "react-icons/fa";
import {
    STATUS_LABELS,
    STATUS_COLORS,
    STATUS_ORDER,
} from "../../utils/orderStatus";
import { useAdminOrderDetailsStore } from "../../store/adminOrderDetails.store";
import Button from "../../components/ui/Button";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import ProductSkeleton from "../../components/product/ProductSkeleton";
import { useAlert } from "../../store/alert.store";
import { useLocation } from "react-router-dom";
import EmptyState from "../../components/ui/EmptyState";
import defaultImage from "../../assets/default-image.png";
import { downloadInvoice } from "../../utils/pdf/downloadInvoice";
import { downloadStaffPackingList } from "../../utils/pdf/staffInvoice";
import { useConfigStore } from "../../store/config.store";
import { useAdminOrdersStore } from "../../store/adminOrders.store";
import { restoreOrderApi } from "../../services/order.api";
import { useOrdersStore } from "../../store/orders.store";
import { sortProductsBySequence } from "../../utils/sequncerUtil";
import { formatCurrency } from "../../utils/pricing";
import { formatDateTime } from "../../utils/date";
import { useAuth } from "../../store/auth.store";

export default function AdminOrderDetails() {
    const { orderId = "" } = useParams();
    const navigate = useNavigate();
    const { showAlert } = useAlert();
    const location = useLocation();
    const [downloading, setDownloading] = useState(false);
    const [downloadingPackingList, setDownloadingPackingList] = useState(false);
    const { cache, fetchOrder, loading, updateOrder } = useAdminOrderDetailsStore();
    const updateOrderListCache = useAdminOrdersStore((s) => s.updateOrderInCache);
    const [showConfirm, setShowConfirm] = useState(false);
    const { user } = useAuth();
    const [pendingPayload, setPendingPayload] = useState<{
        status?: string;
        adminComment?: string;
        mobile: string;
        amount: string;
    } | null>(null);
    const config = useConfigStore((s) => s.config);
    const [selectedStatus, setSelectedStatus] = useState("");
    const [comment, setComment] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [restoring, setRestoring] = useState(false);
    const clearOrdersCache = useOrdersStore((s) => s.clear);
    const clearAdminOrdersCache = useAdminOrdersStore((s) => s.clear);
    const [
        selectedPaymentAccountIds,
        setSelectedPaymentAccountIds,
    ] = useState<string[]>([]);

    const [
        generatedPaymentMessage,
        setGeneratedPaymentMessage,
    ] = useState("");

    const [
        copyingPaymentMessage,
        setCopyingPaymentMessage,
    ] = useState(false);

    const order = cache[orderId];
    const packagingPercent = config?.packagingPercent ?? 0;
    const gstPercent = config?.gstPercent ?? 0;
    const disableGstForTN = config?.disableGstForTN || false;

    const isTamilNadu = order?.address
        ?.toLowerCase()
        .includes("tamil nadu");

    const totalQuantity =
        order?.items?.reduce(
            (total: number, item: any) => total + item.quantity,
            0
        ) ?? 0;

    const sortedItems = useMemo(
        () => sortProductsBySequence(order?.items ?? []),
        [order?.items]
    );

    useEffect(() => {
        const shouldForce = (location.state as any)?.forceRefresh === true;
        fetchOrder(orderId, { force: shouldForce });
        if (shouldForce) {
            navigate(location.pathname, { replace: true });
        }
    }, [
        orderId,
        fetchOrder,
        navigate,
        location.pathname,
        location.state,
    ]);

    useEffect(() => {
        if (order) {
            setComment("");
            setSelectedStatus(order.status);
        }
    }, [order]);

    const isTerminal = order?.status === "DISPATCHED" || order?.status === "CANCELLED";
    const canAdjust = STATUS_ORDER.indexOf(order?.status) < STATUS_ORDER.indexOf("ORDER_PACKED");
    const canDownloadInvoice = STATUS_ORDER.indexOf(order?.status) >=
        STATUS_ORDER.indexOf("PAYMENT_CONFIRMED") &&
        order.status !== "CANCELLED";

    

    const isCancelled = order?.status === "CANCELLED";
    const currentIndex = STATUS_ORDER.indexOf(order?.status);
    const companyName = config?.companyName || 'Sivakaasi Pyro Park';
    const paymentAccounts =
        Array.isArray(config?.paymentAccounts)
            ? config.paymentAccounts
            : [];

    const finalPayableAmount =
        Number(order?.finalPayable ?? 0) > 0
            ? Number(order.finalPayable)
            : Number(order?.grandTotal ?? 0);

    const generatePaymentMessage = () => {
        const lines: string[] = [];

        lines.push(
            `🎉 Your ${companyName} Order is Confirmed!`
        );

        lines.push(
            `Order ID: ${order.orderId}`
        );

        lines.push(
            `Total: ₹${formatCurrency(
                finalPayableAmount
            )}`
        );

        lines.push("");

        lines.push(
            "Pay via Bank Transfer:"
        );

        lines.push(
            "Payment Details:"
        );

        lines.push("");

        /*
         * Only include the payment accounts
         * selected by the admin.
         */
        const selectedAccounts =
            paymentAccounts.filter(
                (
                    account: any,
                    index: number
                ) => {
                    const accountId =
                        account.id ||
                        String(index);

                    return selectedPaymentAccountIds.includes(
                        accountId
                    );
                }
            );

        selectedAccounts.forEach(
            (
                account: any,
                index: number
            ) => {
                if (index > 0) {
                    lines.push("");
                }

                if (
                    account.type ===
                    "BANK"
                ) {
                    lines.push(
                        account.bankName ||
                        "Bank"
                    );

                    lines.push(
                        `Name: ${account.bankUserName ||
                        ""
                        }`
                    );

                    lines.push(
                        `A/C No: ${account.accountNumber ||
                        ""
                        }`
                    );

                    lines.push(
                        `IFSC: ${account.ifsc} (${account.accountType === "SAVINGS"
                            ? "Savings A/C"
                            : "Current A/C"
                        })`
                    );

                    return;
                }

                const paymentName =
                    account.type ===
                        "GPAY"
                        ? "GPay"
                        : account.type ===
                            "PHONEPE"
                            ? "PhonePe"
                            : account.type ===
                                "PAYTM"
                                ? "Paytm"
                                : account.type;

                lines.push(
                    paymentName
                );

                if (
                    account.mobileNumber
                ) {
                    lines.push(
                        `Mobile: ${account.mobileNumber}`
                    );
                }

                if (
                    account.upiId
                ) {
                    lines.push(
                        `UPI ID: ${account.upiId}`
                    );
                }
            }
        );

        lines.push("");

        lines.push(
            "👉 Please share your payment screenshot here to start dispatch."
        );

        lines.push(
            `Track here: ${config?.website}`
        );

        return lines.join("\n");
    };

    const handleCopyPaymentMessage = async () => {
        if (!generatedPaymentMessage) {
            showAlert({
                type: "error",
                message:
                    "Please generate the payment message first.",
            });

            return;
        }

        try {
            setCopyingPaymentMessage(true);

            await navigator.clipboard.writeText(
                generatedPaymentMessage
            );

            showAlert({
                type: "success",
                message: "Payment message copied",
                duration: 1500,
            });
        } catch (error) {
            console.error(
                "Copy payment message failed:",
                error
            );

            showAlert({
                type: "error",
                message:
                    "Unable to copy payment message.",
            });
        } finally {
            setCopyingPaymentMessage(false);
        }
    };

    const nextStatus =
        currentIndex >= 0 &&
            currentIndex < STATUS_ORDER.length - 1
            ? STATUS_ORDER[currentIndex + 1]
            : null;

    const availableStatuses = [
        order?.status,
        ...(nextStatus ? [nextStatus] : []),
        ...(order?.status !== "CANCELLED" ? ["CANCELLED"] : []),
    ];

    async function handleRestore() {
        try {
            setRestoring(true);

            await restoreOrderApi(order.orderId);

            clearOrdersCache();
            clearAdminOrdersCache();

            await fetchOrder(order.orderId, {
                force: true,
            });

            showAlert({
                type: "success",
                message: "Order Reopened Successfully",
                duration: 1500,
            });

            navigate("/admin/orders", {
                replace: true,
            });
        } catch (err: any) {
            showAlert({
                type: "error",
                message:
                    err.message ||
                    "Unable to reopen order",
            });
        } finally {
            setRestoring(false);
        }
    }

    async function handleDownloadPackingList() {
        if (downloadingPackingList || !order) return;

        try {
            setDownloadingPackingList(true);

            await new Promise((resolve) =>
                setTimeout(resolve, 0)
            );

            await downloadStaffPackingList({
                order,
                config,
            });
        } catch (err: any) {
            showAlert({
                type: "error",
                message:
                    err.message ||
                    "Unable to download packing list",
            });
        } finally {
            setDownloadingPackingList(false);
        }
    }

    const getPaymentAccountLabel = (
        account: any
    ) => {
        if (account.type === "BANK") {
            return (
                account.bankName ||
                "Bank Account"
            );
        }

        if (account.type === "GPAY") {
            return "GPay";
        }

        if (account.type === "PHONEPE") {
            return "PhonePe";
        }

        if (account.type === "PAYTM") {
            return "Paytm";
        }

        return "Payment Account";
    };

    async function handleDownloadInvoice() {
        if (downloading) return;

        try {
            setDownloading(true);
            await new Promise((resolve) => setTimeout(resolve, 0));

            await downloadInvoice({
                order,
                config,
            });
        } catch (err: any) {
            showAlert({
                type: "error",
                message: err.message || "Unable to download invoice",
            });
        } finally {
            setDownloading(false);
        }
    }

    if (!order && loading) {
        return (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                    <ProductSkeleton key={i} />
                ))}
            </div>
        );
    }

    if (!order) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="bg-white border rounded-xl p-8 text-center max-w-sm w-full">
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
                                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                        </svg>
                    </div>

                    <EmptyState
                        title="Order not found"
                        description="Try explore other order."
                    />
                    <p className="mt-1 text-xs text-gray-500">
                        The order you are trying to view does not exist or may have been removed.
                    </p>
                </div>
            </div>
        );
    }

    const canSubmit =
        selectedStatus !== order.status ||
        comment.trim().length > 0;
    return (
        <div className="space-y-6">
            <div className="bg-white border rounded-xl p-4 space-y-3">

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
                        Order Details
                    </h1>
                </div>

                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <h1 className="text-base font-semibold text-[var(--color-primary)] break-all">
                            {order.orderId}
                        </h1>

                        <button
                            onClick={() => {
                                navigator.clipboard.writeText(order.orderId);
                                showAlert({
                                    type: "success",
                                    message: "Order ID copied"
                                });
                            }}

                            className="p-1.5 rounded-md border hover:bg-gray-100 active:bg-gray-200"
                            aria-label="Copy Order ID"
                            title="Copy Order ID"
                        >
                            <svg
                                className="h-4 w-4 text-gray-500"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={2}
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2M16 8h2a2 2 0 012 2v8a2 2 0 01-2 2h-8a2 2 0 01-2-2v-2"
                                />
                            </svg>
                        </button>

                    </div>

                    <p className="text-xs text-gray-500">
                        Created on {formatDateTime(order.createdAt)}
                    </p>

                    <div className="flex flex-wrap items-center gap-2">
                        {canAdjust && (
                            <Button
                                variant="outline"
                                className="px-3 py-1.5 text-xs"
                                disabled={!canAdjust || submitting}
                                onClick={() =>
                                    navigate(
                                        user?.role === "STAFF"
                                            ? `/staff/orders/${order.orderId}/adjust`
                                            : `/admin/orders/${order.orderId}/adjust`,
                                        {
                                            state: {
                                                order,
                                                isAdmin: user?.role !== "STAFF",
                                            },
                                        }
                                    )
                                }
                            >
                                Adjust Order
                            </Button>
                        )}

                        {isCancelled && (
                            <Button
                                disabled={restoring}
                                onClick={handleRestore}
                                className="bg-green-600 hover:bg-green-700 text-white"
                            >
                                {restoring ? "Reopening..." : "Reopen Order"}
                            </Button>
                        )}

                        {canDownloadInvoice && (
                            <Button
                                variant="secondary"
                                className="px-3 py-1.5 text-xs"
                                onClick={handleDownloadInvoice}
                            >
                                {downloading ? " Downloading Invoice..." : " Download Invoice"}
                            </Button>
                        )}

                        <div className="relative group">
                            <button
                                type="button"
                                onClick={handleDownloadPackingList}
                                disabled={downloadingPackingList}
                                aria-label="Download packing list"
                                className="
                flex
                h-10
                w-10
                items-center
                justify-center
                rounded-lg
                border
                border-gray-300
                bg-white
                text-gray-700
                transition
                hover:bg-gray-100
                hover:text-[var(--color-primary)]
                disabled:cursor-not-allowed
                disabled:opacity-50
            "
                            >
                                <FaDownload
                                    size={15}
                                    className={
                                        downloadingPackingList
                                            ? "animate-pulse"
                                            : ""
                                    }
                                />
                            </button>

                            <div
                                className="
                                    pointer-events-none
                                    invisible
                                    absolute
                                    right-0
                                    top-full
                                    z-50
                                    mt-2
                                    whitespace-nowrap
                                    rounded-md
                                    bg-gray-900
                                    px-3
                                    py-2
                                    text-xs
                                    font-medium
                                    text-white
                                    opacity-0
                                    shadow-lg
                                    transition-all
                                    duration-150
                                    group-hover:visible
                                    group-hover:opacity-100
                                "
                            >
                                Download Packing List
                            </div>
                        </div>

                        <span
                            className="inline-flex items-center text-xs font-semibold px-3 py-1 rounded-full"
                            style={{
                                backgroundColor: `${STATUS_COLORS[order.status]}20`,
                                color: STATUS_COLORS[order.status],
                            }}
                        >
                            {STATUS_LABELS[order.status]}
                        </span>
                    </div>
                </div>
            </div>
            {/* ITEMS */}

            <div className="w-full overflow-hidden rounded-xl border border-gray-200 bg-white">

                {/* Scroll only the product table */}
                <div className="max-h-[420px] overflow-y-auto overflow-x-auto">

                    <table className="w-full min-w-[900px] table-fixed text-sm">

                        <colgroup>
                            <col className="w-[32%]" />
                            <col className="w-[13%]" />
                            <col className="w-[11%]" />
                            <col className="w-[12%]" />
                            <col className="w-[12%]" />
                            <col className="w-[8%]" />
                            <col className="w-[12%]" />
                        </colgroup>

                        <thead className="sticky top-0 z-10 bg-gray-50">

                            <tr className="border-b border-gray-200">

                                <th className="px-4 py-3 text-left font-semibold text-gray-700">
                                    Product
                                </th>

                                <th className="px-4 py-3 text-center font-semibold text-gray-700">
                                    Unit
                                </th>

                                <th className="px-4 py-3 text-right font-semibold text-gray-700">
                                    MRP
                                </th>

                                <th className="px-4 py-3 text-center font-semibold text-gray-700">
                                    Discount
                                </th>

                                <th className="px-4 py-3 text-right font-semibold text-gray-700">
                                    Offer Price
                                </th>

                                <th className="px-4 py-3 text-center font-semibold text-gray-700">
                                    Qty
                                </th>

                                <th className="px-4 py-3 text-right font-semibold text-gray-700">
                                    Total
                                </th>

                            </tr>

                        </thead>

                        <tbody className="divide-y divide-gray-100">

                            {sortedItems.map(
                                (item: any, idx: number) => {

                                    const packQuantity =
                                        Number(
                                            item.packQuantity ?? 0
                                        );

                                    const packUnit =
                                        item.packUnit?.trim();

                                    const hasPack =
                                        packQuantity > 0 &&
                                        Boolean(packUnit);

                                    return (
                                        <tr
                                            key={
                                                item.productId ||
                                                idx
                                            }
                                            className="
                                    align-middle
                                    hover:bg-gray-50
                                "
                                        >

                                            {/* Product */}
                                            <td className="px-4 py-3">

                                                <div className="flex min-w-0 items-center gap-3">

                                                    <img
                                                        src={
                                                            item.image ||
                                                            defaultImage
                                                        }
                                                        onError={(e) => {
                                                            e.currentTarget.onerror =
                                                                null;

                                                            e.currentTarget.src =
                                                                defaultImage;
                                                        }}
                                                        className="
                                                h-12
                                                w-12
                                                shrink-0
                                                rounded-lg
                                                border
                                                object-cover
                                            "
                                                        loading="lazy"
                                                        alt={item.name}
                                                    />

                                                    <div className="min-w-0">

                                                        <div className="flex flex-wrap items-center gap-2">

                                                            <p className="font-semibold text-gray-900 truncate">
                                                                {item.name}
                                                            </p>

                                                            {item.isComboPackage && (
                                                                <span className="
                                                        shrink-0
                                                        rounded-full
                                                        bg-blue-100
                                                        px-2
                                                        py-0.5
                                                        text-[10px]
                                                        font-semibold
                                                        text-blue-700
                                                    ">
                                                                    Combo
                                                                </span>
                                                            )}

                                                        </div>

                                                    </div>

                                                </div>

                                            </td>

                                            {/* Unit */}
                                            <td className="px-4 py-3 text-center">

                                                {hasPack ? (
                                                    <span className="
                                            inline-flex
                                            whitespace-nowrap
                                            rounded-full
                                            bg-gray-100
                                            px-2.5
                                            py-1
                                            text-xs
                                            font-medium
                                            text-gray-700
                                        ">
                                                        {packQuantity}/{packUnit}
                                                    </span>
                                                ) : (
                                                    <span className="text-gray-400">
                                                        -
                                                    </span>
                                                )}

                                            </td>

                                            {/* MRP */}
                                            <td className="px-4 py-3 text-right whitespace-nowrap">

                                                {item.originalPrice &&
                                                    item.originalPrice > item.price ? (
                                                    <span className="font-medium text-gray-400 line-through">
                                                        ₹{formatCurrency(item.originalPrice)}
                                                    </span>
                                                ) : (
                                                    <span className="text-gray-400">
                                                        ₹{formatCurrency(item.price)}
                                                    </span>
                                                )}

                                            </td>

                                            {/* Discount */}
                                            <td className="px-4 py-3 text-center whitespace-nowrap">

                                                {item.discountText ? (
                                                    <span className="
                                                        inline-flex
                                                        rounded-full
                                                        bg-green-100
                                                        px-2
                                                        py-0.5
                                                        text-xs
                                                        font-semibold
                                                        text-green-700
                                                    ">
                                                        {item.discountText}
                                                    </span>
                                                ) : (
                                                    <span className="text-gray-400">
                                                        NET RATE
                                                    </span>
                                                )}

                                            </td>

                                            {/* Offer Price */}
                                            <td className="px-4 py-3 text-right whitespace-nowrap">

                                                <span className="font-semibold text-[var(--color-primary)]">
                                                    ₹{formatCurrency(item.price)}
                                                </span>

                                            </td>

                                            {/* Qty */}
                                            <td className="px-4 py-3 text-center">

                                                <span className="font-medium text-gray-800">
                                                    {item.quantity}
                                                </span>

                                            </td>

                                            {/* Total */}
                                            <td className="px-4 py-3 text-right whitespace-nowrap">

                                                <span className="font-semibold text-gray-900">
                                                    ₹{formatCurrency(item.total)}
                                                </span>

                                            </td>

                                        </tr>
                                    );
                                }
                            )}

                        </tbody>

                    </table>

                </div>

            </div>


            {/* ADDRESS + ORDER SUMMARY */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch">
                <div className="rounded-xl border bg-white p-5 h-full">
                    <h3 className="font-semibold text-[var(--color-primary)] mb-4">
                        Address
                    </h3>
                    <p className="text-sm whitespace-pre-line">{order.address}</p>
                </div>

                <div className="rounded-xl border bg-white p-5 h-full">

                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-[var(--color-primary)]">
                            Order Summary
                        </h3>

                    </div>

                    <div className="space-y-2 text-sm">

                        <div className="flex justify-between items-start">
                            <div>
                                <p>Products Total</p>
                                <p className="text-xs text-gray-500">
                                    {order.items.length} Products • {totalQuantity} Qty
                                </p>
                            </div>

                            <span>
                                ₹{formatCurrency(order.totalProductAmount)}
                            </span>
                        </div>

                        {(order.comboPackageTotal ?? 0) > 0 && (
                            <div className="flex justify-between items-center text-gray-600">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span>Combo Packages</span>

                                    <span
                                        className="
                                        rounded-full
                                        bg-green-100
                                        text-green-700
                                        text-[10px]
                                        font-medium
                                        px-2
                                        py-0.5
                                    "
                                    >
                                        Inclusive Of Packaging Charges
                                    </span>
                                </div>

                                <span>
                                    ₹{formatCurrency(order.comboPackageTotal)}
                                </span>
                            </div>
                        )}

                        {/* Non Combo Products */}
                        {(order.nonComboProductTotal ?? 0) > 0 && (
                            <div className="flex justify-between text-gray-600">
                                <span>Non Combo Products</span>
                                <span>
                                    ₹{formatCurrency(order.nonComboProductTotal)}
                                </span>
                            </div>
                        )}

                        {/* Packaging */}
                        {(order.packagingCharge ?? 0) > 0 && (
                            <div className="flex justify-between text-gray-600">
                                <span>
                                    Packaging Charge ({packagingPercent}%)
                                </span>
                                <span>
                                    ₹{formatCurrency(order.packagingCharge)}
                                </span>
                            </div>
                        )}

                        {/* Coupon */}
                        {(order.couponDiscount ?? 0) > 0 && (
                            <>
                                <div className="flex justify-between font-medium pt-2 border-t">
                                    <span>Amount Before Discount</span>

                                    <span>
                                        ₹{formatCurrency(order.amountBeforeDiscount)}
                                    </span>
                                </div>

                                <div className="flex justify-between text-green-600 font-medium">
                                    <span>
                                        Coupon Savings{" "}
                                        {order.couponType === "PERCENTAGE"
                                            ? `(${order.couponValue}%)`
                                            : `(Flat ₹${order.couponValue})`}
                                    </span>

                                    <span>
                                        -₹{formatCurrency(order.couponDiscount)}
                                    </span>
                                </div>

                                <div className="flex justify-between font-medium">
                                    <span>Amount After Discount</span>

                                    <span>
                                        ₹{formatCurrency(order.amountAfterDiscount)}
                                    </span>
                                </div>
                            </>
                        )}

                        {/* GST */}
                        {(order.gstAmount ?? 0) > 0 && (
                            <div className="flex justify-between text-gray-600">
                                <span>
                                    GST ({gstPercent}%)
                                </span>

                                <span>
                                    ₹{formatCurrency(order.gstAmount)}
                                </span>
                            </div>
                        )}

                        {/* Grand Total */}
                        <div className="border-t my-4" />

                        <div className="flex justify-between items-center">
                            <div>
                                <p className="font-semibold text-[var(--color-primary)]">
                                    Grand Total
                                </p>

                                <p className="text-xs text-gray-500">
                                    {disableGstForTN && isTamilNadu
                                        ? "Inclusive of Packaging Charges"
                                        : "Inclusive of GST & Packaging Charges"}
                                </p>
                            </div>

                            <span className="text-xl font-bold text-[var(--color-primary)]">
                                ₹{formatCurrency(order.grandTotal)}
                            </span>
                        </div>

                        {/* Wallet */}
                        {(order.walletUsed ?? 0) > 0 && (
                            <>
                                <div className="border-t my-4" />

                                <div className="flex justify-between text-green-700 font-medium">
                                    <span>Wallet Applied</span>

                                    <span>
                                        - ₹{formatCurrency(order.walletUsed)}
                                    </span>
                                </div>

                                {/* Amount Payable */}
                                <div className="flex justify-between items-center">
                                    <div>
                                        <p className="font-semibold text-[var(--color-primary)]">
                                            Amount Payable
                                        </p>

                                        <p className="text-xs text-gray-500">
                                            Amount to be paid
                                        </p>
                                    </div>

                                    <span className="text-xl font-bold text-[var(--color-primary)]">
                                        ₹{formatCurrency(order.finalPayable)}
                                    </span>
                                </div>
                            </>
                        )}
                    </div>

                </div>
            </div>

            {/* ORDER HISTORY */}

            {order.statusHistory?.length > 0 && (
                <div className="bg-white border rounded-xl p-5">
                    <h3 className="font-semibold text-[var(--color-primary)] mb-4">
                        Order History
                    </h3>

                    <div className="space-y-4">
                        {[...(order.statusHistory || [])]
                            .sort(
                                (a, b) =>
                                    (b.changedAt ?? b.at) -
                                    (a.changedAt ?? a.at)
                            )
                            .map((history: any, index: number) => {
                                const status =
                                    history.toStatus ?? history.status;

                                const updatedBy =
                                    history.changedBy ?? history.by;

                                const updatedAt =
                                    history.changedAt ?? history.at;

                                return (
                                    <div
                                        key={index}
                                        className="flex gap-4 items-start border-l-2 border-gray-200 pl-4 relative"
                                    >
                                        <div
                                            className="
                                    absolute
                                    -left-[7px]
                                    top-1
                                    w-3
                                    h-3
                                    rounded-full
                                    bg-[var(--color-primary)]
                                "
                                        />

                                        <div className="flex-1">
                                            <div
                                                className="
                                        flex
                                        flex-col
                                        sm:flex-row
                                        sm:items-center
                                        sm:justify-between
                                        gap-1
                                    "
                                            >
                                                <p className="font-medium">
                                                    {STATUS_LABELS[status] ??
                                                        status?.replaceAll(
                                                            "_",
                                                            " "
                                                        )}
                                                </p>

                                                <span className="text-xs text-gray-500">
                                                    {updatedAt
                                                        ? formatDateTime(
                                                            updatedAt
                                                        )
                                                        : "-"}
                                                </span>
                                            </div>

                                            {updatedBy && (
                                                <p className="text-sm text-gray-500 mt-1">
                                                    Changed By :{" "}
                                                    {updatedBy.startsWith(
                                                        "ADMIN"
                                                    )
                                                        ? "Admin"
                                                        : updatedBy.replace(
                                                            "USER#",
                                                            ""
                                                        )}
                                                </p>
                                            )}

                                            {history.comment && (
                                                <div className="mt-2 rounded-lg bg-gray-50 p-2 text-sm text-gray-600">
                                                    {history.comment}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                    </div>
                </div>
            )}


            {/* =================================================
                * PAYMENT MESSAGE
                * ================================================= */}

            {paymentAccounts.length > 0 && (
                <div className="border border-gray-200 rounded-xl p-4 space-y-4">
                    <div>
                        <p className="text-sm font-semibold text-gray-800">
                            Payment Message
                        </p>

                        <p className="text-xs text-gray-500 mt-1">
                            Select the payment account(s) to include
                            in the customer payment message.
                        </p>
                    </div>

                    {/* -----------------------------------------
         * PAYMENT ACCOUNT SELECTION
         * ----------------------------------------- */}

                    <div className="space-y-2">
                        {paymentAccounts.map(
                            (
                                account: any,
                                index: number
                            ) => {
                                const accountId =
                                    account.id ||
                                    String(index);

                                const isSelected =
                                    selectedPaymentAccountIds.includes(
                                        accountId
                                    );

                                const accountName =
                                    getPaymentAccountLabel(
                                        account
                                    );

                                return (
                                    <label
                                        key={accountId}
                                        className={`
                                flex
                                items-center
                                gap-3
                                rounded-lg
                                border
                                px-3
                                py-3
                                cursor-pointer
                                transition
                                ${isSelected
                                                ? "border-[var(--color-primary)] bg-gray-50"
                                                : "border-gray-200"
                                            }
                            `}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={
                                                isSelected
                                            }
                                            onChange={() => {
                                                setSelectedPaymentAccountIds(
                                                    (previous) => {
                                                        if (
                                                            previous.includes(
                                                                accountId
                                                            )
                                                        ) {
                                                            return previous.filter(
                                                                (id) =>
                                                                    id !==
                                                                    accountId
                                                            );
                                                        }

                                                        return [
                                                            ...previous,
                                                            accountId,
                                                        ];
                                                    }
                                                );

                                                /*
                                                 * Selected accounts changed,
                                                 * so previous generated message
                                                 * is no longer valid.
                                                 */
                                                setGeneratedPaymentMessage(
                                                    ""
                                                );
                                            }}
                                            className="
                                    h-4
                                    w-4
                                    shrink-0
                                "
                                        />

                                        <div className="min-w-0">
                                            <p className="text-sm font-medium text-gray-800">
                                                {accountName}
                                            </p>

                                            {account.type ===
                                                "BANK" && (
                                                    <p className="text-xs text-gray-500 mt-0.5">
                                                        {account.bankUserName ||
                                                            ""}
                                                        {account.bankUserName &&
                                                            account.accountNumber
                                                            ? " • "
                                                            : ""}
                                                        {account.accountNumber ||
                                                            ""}
                                                    </p>
                                                )}

                                            {account.type !==
                                                "BANK" && (
                                                    <p className="text-xs text-gray-500 mt-0.5">
                                                        {account.upiId ||
                                                            account.mobileNumber ||
                                                            ""}
                                                    </p>
                                                )}
                                        </div>
                                    </label>
                                );
                            }
                        )}
                    </div>

                    {/* -----------------------------------------
         * SELECTED COUNT
         * ----------------------------------------- */}

                    {selectedPaymentAccountIds.length >
                        0 && (
                            <div className="flex items-center justify-between">
                                <p className="text-xs text-gray-500">
                                    {
                                        selectedPaymentAccountIds.length
                                    }{" "}
                                    account
                                    {selectedPaymentAccountIds.length >
                                        1
                                        ? "s"
                                        : ""}{" "}
                                    selected
                                </p>

                                <button
                                    type="button"
                                    onClick={() => {
                                        setSelectedPaymentAccountIds(
                                            []
                                        );

                                        setGeneratedPaymentMessage(
                                            ""
                                        );
                                    }}
                                    className="
                        text-xs
                        font-medium
                        text-red-600
                        hover:text-red-700
                    "
                                >
                                    Clear Selection
                                </button>
                            </div>
                        )}

                    {/* -----------------------------------------
         * GENERATE MESSAGE
         * ----------------------------------------- */}

                    <Button
                        type="button"
                        disabled={
                            selectedPaymentAccountIds.length ===
                            0
                        }
                        onClick={() => {
                            if (
                                selectedPaymentAccountIds.length ===
                                0
                            ) {
                                showAlert({
                                    type: "error",
                                    message:
                                        "Please select at least one payment account.",
                                });

                                return;
                            }

                            const message =
                                generatePaymentMessage();

                            if (!message) {
                                showAlert({
                                    type: "error",
                                    message:
                                        "Unable to generate payment message.",
                                });

                                return;
                            }

                            setGeneratedPaymentMessage(
                                message
                            );
                        }}
                        className="w-full sm:w-auto"
                    >
                        Generate Payment Message
                    </Button>

                    {/* -----------------------------------------
         * MESSAGE PREVIEW
         * ----------------------------------------- */}

                    {generatedPaymentMessage && (
                        <div className="space-y-3">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                <p className="text-sm font-medium text-gray-700">
                                    Message Preview
                                </p>

                                <button
                                    type="button"
                                    onClick={
                                        handleCopyPaymentMessage
                                    }
                                    disabled={
                                        copyingPaymentMessage
                                    }
                                    className="
                                        inline-flex
                                        items-center
                                        justify-center
                                        gap-2
                                        rounded-lg
                                        border
                                        border-gray-300
                                        bg-white
                                        px-3
                                        py-2
                                        text-sm
                                        font-medium
                                        text-gray-700
                                        transition
                                        hover:bg-gray-100
                                        active:bg-gray-200
                                        disabled:cursor-not-allowed
                                        disabled:opacity-50
                                    "
                                >
                                    <svg
                                        className="h-4 w-4"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                        strokeWidth={2}
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2M16 8h2a2 2 0 012 2v8a2 2 0 01-2 2h-8a2 2 0 01-2-2v-2"
                                        />
                                    </svg>

                                    {copyingPaymentMessage
                                        ? "Copying..."
                                        : "Copy Message"}
                                </button>
                            </div>

                            <div
                                className="
                                    rounded-xl
                                    border
                                    bg-gray-50
                                    p-4
                                    max-h-[420px]
                                    overflow-y-auto
                                "
                            >
                                <pre
                                    className="
                                        whitespace-pre-wrap
                                        break-words
                                        text-sm
                                        leading-6
                                        text-gray-700
                                        font-sans
                                    "
                                >
                                    {
                                        generatedPaymentMessage
                                    }
                                </pre>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ADMIN ACTIONS */}

            <div className="bg-white border rounded-xl p-4 space-y-4">
                <h3 className="text-sm font-semibold">Admin Actions</h3>

                <div>
                    <label className="text-xs text-gray-500 block mb-1">
                        Update Status
                    </label>

                    <div className="relative">
                        <select
                            value={selectedStatus}
                            onChange={(e) => setSelectedStatus(e.target.value)}
                            className="w-full appearance-none border rounded-lg px-3 py-2 pr-10 text-sm bg-white"
                        >
                            {availableStatuses.map((status) => (
                                <option key={status} value={status}>
                                    {STATUS_LABELS[status] ?? status}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div>
                    <label className="text-xs text-gray-500 block mb-1">
                        Admin Comment
                    </label>
                    <textarea
                        rows={3}
                        value={(selectedStatus != 'ORDER_PLACED') ? comment : ''}
                        onChange={(e) => setComment(e.target.value)}
                        className="w-full border rounded px-3 py-2 text-sm"
                    />
                </div>

                <Button
                    disabled={!canSubmit || submitting}
                    onClick={() => {
                        if (!canSubmit) return;
                        setPendingPayload({
                            status: selectedStatus !== order.status
                                ? selectedStatus
                                : undefined,
                            adminComment: comment.trim() || undefined,
                            mobile: order.userId || '',
                            amount: order.totalAmount || 0
                        });
                        setShowConfirm(true);
                    }}
                >
                    Submit
                </Button>
            </div>

            {isTerminal && (
                <p className="text-xs text-gray-500">
                    This order is completed and cannot be modified.
                </p>
            )}
            <ConfirmDialog
                open={showConfirm}
                title="Confirm update?"
                description="Are you sure you want to update this order?"
                confirmText="Yes, update"
                cancelText="Cancel"
                onConfirm={async () => {
                    if (!pendingPayload || submitting) return;

                    setShowConfirm(false);
                    setSubmitting(true);

                    try {
                        await updateOrder(
                            order.orderId,
                            pendingPayload
                        );
                        showAlert({
                            type: "success",
                            message: "Order updated successfully",
                            duration: 1500,
                        });

                        setSelectedStatus(
                            pendingPayload.status ?? selectedStatus
                        );

                        updateOrderListCache(order.orderId, {
                            status: pendingPayload.status ?? order.status,
                            adminComment:
                                pendingPayload.adminComment ??
                                order.adminComment,
                        });
                        await fetchOrder(orderId, { force: true });
                    } catch (err: any) {
                        showAlert({
                            type: "error",
                            message: err?.message || "Failed to update order",
                        });
                    } finally {
                        setSubmitting(false);
                        setPendingPayload(null);
                    }
                }}
                onCancel={() => {
                    setShowConfirm(false);
                    setPendingPayload(null);
                }}
            />
        </div>
    );
}