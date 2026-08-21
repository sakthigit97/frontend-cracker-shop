import { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";

import {
    STATUS_COLORS,
    STATUS_LABELS,
    STATUS_ORDER,
} from "../../utils/orderStatus";

import Button from "../../components/ui/Button";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import ProductSkeleton from "../../components/product/ProductSkeleton";
import EmptyState from "../../components/ui/EmptyState";
import defaultImage from "../../assets/default-image.png";
import { useAlert } from "../../store/alert.store";
import { useConfigStore } from "../../store/config.store";
import { downloadBulkInvoice } from "../../utils/pdf/downloadBulkInvoice";
import { FaDownload } from "react-icons/fa";
import { downloadBulkStaffPackingList } from "../../utils/pdf/downloadBulkStaffPackingList";

import {
    useAdminBulkOrderDetailsStore,
} from "../../store/adminBulkOrderDetails.store";
import { formatDateTime } from "../../utils/date";

export default function AdminBulkOrderDetails() {

    const { orderId = "" } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { showAlert } = useAlert();
    const config = useConfigStore(s => s.config);
    const {
        cache,
        loading,
        fetchOrder,
        loaded,
        updateOrder,
    } = useAdminBulkOrderDetailsStore();

    const order = cache[orderId];
    const [selectedStatus, setSelectedStatus] = useState("");
    const [comment, setComment] = useState("");
    const [downloading, setDownloading] = useState(false);
    const [downloadingPackingList, setDownloadingPackingList] =
        useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [pendingPayload, setPendingPayload] =
        useState<{
            status?: string;
            adminComment?: string;
        } | null>(null);

    const [selectedPaymentAccountIds, setSelectedPaymentAccountIds] =
        useState<string[]>([]);

    const [generatedPaymentMessage, setGeneratedPaymentMessage] =
        useState("");

    const [copyingPaymentMessage, setCopyingPaymentMessage] =
        useState(false);

    const paymentAccounts =
        Array.isArray(config?.paymentAccounts)
            ? config.paymentAccounts
            : [];

    const getPaymentAccountLabel = (
        account: any
    ) => {
        if (account.type === "BANK") {
            return account.bankName || "Bank Account";
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
    const generatePaymentMessage = () => {
        const lines: string[] = [];

        lines.push(
            `🎉 Your ${config?.companyName || "Sivakasi Pyro Park"} Order is Confirmed!`
        );

        lines.push(
            `Order ID: ${order.orderId}`
        );

        lines.push(
            `Total: ₹${Number(
                order.pricing?.grandTotal ?? 0
            ).toLocaleString("en-IN")}`
        );

        lines.push("");

        lines.push("Pay via Bank Transfer:");
        lines.push("Payment Details:");
        lines.push("");

        const selectedAccounts =
            paymentAccounts.filter(
                (account: any, index: number) => {
                    const accountId =
                        account.id || String(index);

                    return selectedPaymentAccountIds.includes(
                        accountId
                    );
                }
            );

        selectedAccounts.forEach(
            (account: any, index: number) => {
                if (index > 0) {
                    lines.push("");
                }

                if (account.type === "BANK") {
                    lines.push(
                        account.bankName || "Bank"
                    );

                    lines.push(
                        `Name: ${account.bankUserName || ""}`
                    );

                    lines.push(
                        `A/C No: ${account.accountNumber || ""}`
                    );

                    lines.push(
                        `IFSC: ${account.ifsc || ""} (${account.accountType === "SAVINGS"
                            ? "Savings A/C"
                            : "Current A/C"
                        })`
                    );

                    return;
                }

                const paymentName =
                    account.type === "GPAY"
                        ? "GPay"
                        : account.type === "PHONEPE"
                            ? "PhonePe"
                            : account.type === "PAYTM"
                                ? "Paytm"
                                : account.type;

                lines.push(paymentName);

                if (account.mobileNumber) {
                    lines.push(
                        `Mobile: ${account.mobileNumber}`
                    );
                }

                if (account.upiId) {
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
            "Track here: https://www.sivasicrackers.co.in"
        );

        return lines.join("\n");
    };

    useEffect(() => {

        const shouldForce =
            (location.state as any)
                ?.forceRefresh === true;

        fetchOrder(
            orderId,
            {
                force: shouldForce,
            }
        );

        if (shouldForce) {

            navigate(
                location.pathname,
                {
                    replace: true,
                }
            );

        }

    }, [
        orderId,
        fetchOrder,
        navigate,
        location.pathname,
        location.state,]);

    useEffect(() => {

        if (!order) return;

        setSelectedStatus(
            order.status
        );

        setComment(
            order.adminComment || ""
        );

    }, [order]);

    const isTerminal = order?.status === "DISPATCHED" || order?.status === "CANCELLED";
    const canDownloadInvoice =
        STATUS_ORDER.indexOf(order?.status) >=
        STATUS_ORDER.indexOf("PAYMENT_CONFIRMED") &&
        order.status !== "CANCELLED";

    const canAdjust = STATUS_ORDER.indexOf(order?.status) < STATUS_ORDER.indexOf("ORDER_PACKED");
    const currentIndex = order
        ? STATUS_ORDER.indexOf(order.status)
        : -1;
    const nextStatus =
        currentIndex >= 0 &&
            currentIndex < STATUS_ORDER.length - 1
            ? STATUS_ORDER[currentIndex + 1]
            : null;

    const availableStatuses = [
        order?.status,
        ...(nextStatus ? [nextStatus] : []),
        ...(order?.status !== "CANCELLED"
            ? ["CANCELLED"]
            : []),
    ];

    async function handleDownloadPackingList() {
        if (
            downloadingPackingList ||
            !order ||
            !config
        ) {
            return;
        }

        try {
            setDownloadingPackingList(true);

            await new Promise((resolve) =>
                setTimeout(resolve, 0)
            );

            await downloadBulkStaffPackingList(
                order,
                config
            );
        } catch (err: any) {
            showAlert({
                type: "error",
                message:
                    err?.message ||
                    "Unable to download packing list",
            });
        } finally {
            setDownloadingPackingList(false);
        }
    }

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
                message:
                    "Payment message copied",
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

    async function handleDownloadInvoice() {

        if (
            downloading ||
            !order ||
            !config
        ) {

            return;

        }

        try {

            setDownloading(true);
            await new Promise((resolve) => setTimeout(resolve, 0));

            await downloadBulkInvoice(
                order,
                config
            );

        } catch (err: any) {

            showAlert({

                type: "error",

                message:
                    err.message ||
                    "Unable to download invoice",

            });

        } finally {

            setDownloading(false);

        }

    }

    if (loading && !loaded) {

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

    if (loaded && !order) {

        return (

            <div className="min-h-[60vh] flex items-center justify-center">

                <div className="bg-white border rounded-xl p-8 text-center max-w-sm w-full">

                    <>
                        <button
                            onClick={() => navigate(-1)}
                            className="mb-5 ..."
                        >
                            ← Back
                        </button>

                        <EmptyState
                            title="Bulk Order not found"
                            description="Try another Bulk Order."
                        />

                    </>

                </div>

            </div>

        );

    }

    const canSubmit =
        !!order &&
        (
            selectedStatus !== order.status ||
            comment !== (order.adminComment || "")
        );

    const totalCartons = order
        ? order.items.reduce(
            (sum: number, item: any) =>
                sum + Number(item.quantity ?? 0),
            0
        )
        : 0;

    if (!order) return;
    return (

        <div className="space-y-6">

            <div className="bg-white border rounded-xl p-4 space-y-3">

                {/* Header */}
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

                    <h1 className="
            text-xl
            md:text-2xl
            font-semibold
            text-[var(--color-primary)]
        ">
                        Bulk Order Details
                    </h1>

                </div>

                {/* Order ID */}
                <div className="space-y-2">

                    <div className="flex items-center gap-2">

                        <h1 className="
                            text-base
                            font-semibold
                            text-[var(--color-primary)]
                            break-all
                        ">
                            {order.orderId}
                        </h1>

                        <button
                            onClick={() => {
                                navigator.clipboard.writeText(
                                    order.orderId
                                );

                                showAlert({
                                    type: "success",
                                    message: "Order ID copied",
                                });
                            }}
                            className="
                                p-1.5
                                rounded-md
                                border
                                hover:bg-gray-100
                                active:bg-gray-200
                            "
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

                    <div className="
                        flex
                        flex-wrap
                        items-center
                        gap-x-4
                        gap-y-1
                    ">

                        <p className="text-xs text-gray-500">
                            Created on{" "}
                            {formatDateTime(
                                order.createdAt
                            )}
                        </p>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap items-center gap-2">

                        {canAdjust && (
                            <Button
                                variant="outline"
                                className="px-3 py-1.5 text-xs"
                                disabled={!canAdjust || submitting}
                                onClick={() =>
                                    navigate(
                                        `/admin/bulk-orders/${order.orderId}/adjust`,
                                        {
                                            state: {
                                                order,
                                                isAdmin: true,
                                            },
                                        }
                                    )
                                }
                            >
                                Adjust Order
                            </Button>
                        )}

                        {canDownloadInvoice && (
                            <Button
                                variant="secondary"
                                className="px-3 py-1.5 text-xs"
                                onClick={handleDownloadInvoice}
                            >
                                {downloading
                                    ? "Downloading Invoice..."
                                    : "Download Invoice"}
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

                        {/* Status */}
                        <span
                            className="
                    inline-flex
                    items-center
                    text-xs
                    font-semibold
                    px-3
                    py-1
                    rounded-full
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

                </div>

                {/* Bulk Order Summary */}
                <div className="
        flex
        flex-wrap
        items-center
        gap-8
        border-t
        pt-4
    ">

                    <div className="text-sm">
                        <span className="text-gray-500">
                            Grand Total
                        </span>{" "}
                        <span className="font-semibold text-gray-900">
                            ₹
                            {Number(
                                order.pricing?.grandTotal ?? 0
                            ).toLocaleString("en-IN")}
                        </span>
                    </div>

                    <div className="text-sm">
                        <span className="text-gray-500">
                            Products
                        </span>{" "}
                        <span className="font-semibold text-gray-900">
                            {order.items?.length ?? 0}
                        </span>
                    </div>

                    <div className="text-sm">
                        <span className="text-gray-500">
                            No. of Cartons
                        </span>{" "}
                        <span className="font-semibold text-gray-900">
                            {totalCartons}
                        </span>
                    </div>

                </div>

            </div>

            {/* ============================================================
             * PRODUCTS
             * Same table-style layout as the retail Admin Order Details.
             * Only bulk-order columns/data are retained.
             * ============================================================ */}
            <div className="w-full overflow-hidden rounded-xl border border-gray-200 bg-white">

                <div className="max-h-[420px] overflow-y-auto overflow-x-auto">

                    <table className="w-full min-w-[760px] text-sm">

                        <thead className="sticky top-0 z-10 bg-gray-50">

                            <tr className="border-b border-gray-200">

                                <th className="px-4 py-3 text-left font-semibold text-gray-700">
                                    Product
                                </th>

                                <th className="px-4 py-3 text-center font-semibold text-gray-700">
                                    Carton
                                </th>

                                <th className="px-4 py-3 text-center font-semibold text-gray-700">
                                    Carton Content
                                </th>

                                <th className="px-4 py-3 text-right font-semibold text-gray-700">
                                    Price
                                </th>

                                <th className="px-4 py-3 text-right font-semibold text-gray-700">
                                    Amount
                                </th>

                            </tr>

                        </thead>

                        <tbody className="divide-y divide-gray-100">

                            {order.items.map(
                                (item: any, index: number) => {

                                    const cartonQty =
                                        Number(item.cartonQty ?? 0);

                                    const packUnit =
                                        item.packUnit?.trim();

                                    const hasPack =
                                        cartonQty > 0 &&
                                        Boolean(packUnit);

                                    return (
                                        <tr
                                            key={
                                                item.productId ||
                                                index
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
                                                        <p className="font-semibold text-gray-900">
                                                            {item.name}
                                                        </p>
                                                    </div>

                                                </div>

                                            </td>

                                            {/* Carton */}
                                            <td className="px-4 py-3 text-center">
                                                <span className="font-medium text-gray-800">
                                                    {item.quantity}
                                                </span>
                                            </td>

                                            {/* Carton Content */}
                                            <td className="px-4 py-3 text-center">

                                                {hasPack ? (
                                                    <span
                                                        className="
                                                            inline-flex
                                                            whitespace-nowrap
                                                            rounded-full
                                                            bg-gray-100
                                                            px-2.5
                                                            py-1
                                                            text-xs
                                                            font-medium
                                                            text-gray-700
                                                        "
                                                    >
                                                        {cartonQty}{"/"}
                                                        {packUnit}
                                                    </span>
                                                ) : (
                                                    <span className="text-gray-400">
                                                        -
                                                    </span>
                                                )}

                                            </td>

                                            {/* Price */}
                                            <td className="px-4 py-3 text-right whitespace-nowrap">
                                                <span className="font-medium text-gray-700">
                                                    ₹
                                                    {Number(
                                                        item.schemePrice ?? 0
                                                    ).toLocaleString("en-IN")}
                                                </span>
                                            </td>

                                            {/* Amount */}
                                            <td className="px-4 py-3 text-right whitespace-nowrap">
                                                <span className="font-semibold text-gray-900">
                                                    ₹
                                                    {Number(
                                                        item.total ?? 0
                                                    ).toLocaleString("en-IN")}
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

            {/* ============================================================
             * ADDRESS / ORDER SUMMARY
             * ============================================================ */}
            <div className="grid md:grid-cols-2 gap-4">

                {/* Address */}
                <div className="bg-white border border-gray-300 rounded-xl p-5">

                    <h3 className="text-lg font-semibold mb-4">
                        Address
                    </h3>

                    <div className="text-sm space-y-1">

                        <p className="font-medium">
                            {order.address.fullName}
                        </p>

                        <p>
                            {order.address.mobile}
                        </p>

                        <p>
                            {order.address.addressLine1}
                        </p>

                        {order.address.addressLine2 && (
                            <p>
                                {order.address.addressLine2}
                            </p>
                        )}

                        <p>
                            {order.address.city},{" "}
                            {order.address.state} -{" "}
                            {order.address.pincode}
                        </p>

                    </div>

                </div>

                {/* Order Summary */}
                <div className="bg-white border border-gray-300 rounded-xl p-5">

                    <div className="flex items-center justify-between gap-4 mb-5">

                        <h2 className="text-lg font-semibold">
                            Order Summary
                        </h2>

                    </div>

                    <div className="space-y-3 text-sm">

                        <div className="flex justify-between gap-4">
                            <span>
                                Product Total
                            </span>

                            <span>
                                ₹
                                {Number(
                                    order.pricing.productTotal
                                ).toLocaleString("en-IN")}
                            </span>
                        </div>

                        <div className="flex justify-between gap-4">
                            <span>
                                No. of Cartons
                            </span>

                            <span>
                                {totalCartons}
                            </span>
                        </div>

                        <div className="flex justify-between gap-4">
                            <span>
                                Packaging ({order.pricing.packagingPercent}%)
                            </span>

                            <span>
                                ₹
                                {Number(
                                    order.pricing.packagingCharge
                                ).toLocaleString("en-IN")}
                            </span>
                        </div>

                        {order.pricing.gstAmount > 0 && (
                            <div className="flex justify-between gap-4">

                                <span>
                                    GST ({order.pricing.gstPercent}%)
                                </span>

                                <span>
                                    ₹
                                    {Number(
                                        order.pricing.gstAmount
                                    ).toLocaleString("en-IN")}
                                </span>

                            </div>
                        )}

                        <div className="border-t pt-4 flex justify-between gap-4 font-bold text-[var(--color-primary)]">

                            <span>
                                Grand Total
                            </span>

                            <span>
                                ₹
                                {Number(
                                    order.pricing.grandTotal
                                ).toLocaleString("en-IN")}
                            </span>

                        </div>

                    </div>

                </div>

            </div>

            {/* ============================================================
             * ORDER HISTORY
             * ============================================================ */}
            {order.statusHistory?.length > 0 && (
                <div className="bg-white border border-gray-300 rounded-xl p-5">

                    <h3 className="text-lg font-semibold text-[var(--color-primary)] mb-4">
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
                                    history.toStatus ??
                                    history.status;

                                const updatedBy =
                                    history.changedBy ??
                                    history.by;

                                const updatedAt =
                                    history.changedAt ??
                                    history.at;

                                return (
                                    <div
                                        key={index}
                                        className="
                                            flex
                                            gap-4
                                            items-start
                                            border-l-2
                                            border-gray-200
                                            pl-4
                                            relative
                                        "
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

            {order.remarks && (
                <div className="bg-white border border-gray-300 rounded-xl p-4">

                    <h3 className="font-semibold mb-2">
                        Remarks
                    </h3>

                    <p className="text-sm whitespace-pre-wrap">
                        {order.remarks}
                    </p>

                </div>
            )}

            {paymentAccounts.length > 0 && (
                <div className="bg-white border rounded-xl p-5 space-y-4">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-800">
                            Payment Message
                        </h3>

                        <p className="text-xs text-gray-500 mt-1">
                            Select the payment account(s) to include
                            in the customer payment message.
                        </p>
                    </div>

                    <div className="space-y-2">
                        {paymentAccounts.map(
                            (account: any, index: number) => {
                                const accountId =
                                    account.id || String(index);

                                const selected =
                                    selectedPaymentAccountIds.includes(
                                        accountId
                                    );

                                return (
                                    <label
                                        key={accountId}
                                        className={`flex items-center gap-3 border rounded-lg p-3 cursor-pointer ${selected
                                            ? "border-[var(--color-primary)] bg-gray-50"
                                            : "border-gray-200"
                                            }`}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={selected}
                                            onChange={() => {
                                                setSelectedPaymentAccountIds(
                                                    (previous) =>
                                                        previous.includes(
                                                            accountId
                                                        )
                                                            ? previous.filter(
                                                                (id) =>
                                                                    id !==
                                                                    accountId
                                                            )
                                                            : [
                                                                ...previous,
                                                                accountId,
                                                            ]
                                                );

                                                setGeneratedPaymentMessage(
                                                    ""
                                                );
                                            }}
                                        />

                                        <div>
                                            <p className="text-sm font-medium">
                                                {getPaymentAccountLabel(
                                                    account
                                                )}
                                            </p>

                                            {account.type === "BANK" ? (
                                                <p className="text-xs text-gray-500">
                                                    {account.bankUserName ||
                                                        ""}{" "}
                                                    {account.accountNumber
                                                        ? `• ${account.accountNumber}`
                                                        : ""}
                                                </p>
                                            ) : (
                                                <p className="text-xs text-gray-500">
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

                            setGeneratedPaymentMessage(
                                generatePaymentMessage()
                            );
                        }}
                    >
                        Generate Payment Message
                    </Button>

                    {generatedPaymentMessage && (
                        <div className="space-y-3">
                            <div className="flex items-center justify-between gap-3">
                                <p className="text-sm font-medium">
                                    Message Preview
                                </p>

                                <Button
                                    type="button"
                                    variant="outline"
                                    disabled={
                                        copyingPaymentMessage
                                    }
                                    onClick={
                                        handleCopyPaymentMessage
                                    }
                                >
                                    {copyingPaymentMessage
                                        ? "Copying..."
                                        : "Copy Message"}
                                </Button>
                            </div>

                            <div className="rounded-xl border bg-gray-50 p-4 max-h-[420px] overflow-y-auto">
                                <pre className="whitespace-pre-wrap break-words text-sm leading-6 font-sans text-gray-700">
                                    {generatedPaymentMessage}
                                </pre>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {!isTerminal && (

                <div className="bg-white border rounded-xl p-4 space-y-4">

                    <h3 className="text-sm font-semibold">
                        Admin Actions
                    </h3>

                    <div>

                        <label className="text-xs text-gray-500 block mb-1">

                            Update Status

                        </label>

                        <select
                            value={selectedStatus}
                            onChange={(e) =>
                                setSelectedStatus(e.target.value)
                            }
                            className="w-full appearance-none border rounded-lg px-3 py-2 pr-10 text-sm bg-white"
                        >
                            {availableStatuses.map((status) => (
                                <option
                                    key={status}
                                    value={status}
                                >
                                    {STATUS_LABELS[status] ?? status}
                                </option>
                            ))}
                        </select>

                    </div>

                    <div>

                        <label className="text-xs text-gray-500 block mb-1">
                            Admin Comment
                        </label>

                        <textarea
                            rows={4}
                            value={comment}
                            onChange={(e) =>
                                setComment(
                                    e.target.value
                                )
                            }
                            className="
                                w-full
                                border
                                rounded-lg
                                px-3
                                py-2
                                text-sm
                                resize-none
                            "
                            placeholder="Enter comment..."
                        />

                    </div>

                    <div className="flex flex-wrap justify-end gap-2">

                        <Button
                            disabled={
                                !canSubmit ||
                                submitting
                            }
                            onClick={() => {
                                setPendingPayload({
                                    status:
                                        selectedStatus,
                                    adminComment:
                                        comment,
                                });

                                setShowConfirm(
                                    true
                                );
                            }}
                        >
                            {submitting
                                ? "Updating..."
                                : "Update Order"}
                        </Button>

                    </div>

                </div>

            )}

            {isTerminal && (

                <div className="bg-white border rounded-xl p-4">

                    <p className="text-xs text-gray-500">

                        This bulk order has reached a terminal state and cannot be modified.

                    </p>

                </div>

            )}

            <ConfirmDialog

                open={showConfirm}

                title="Update Bulk Order?"

                description="Are you sure you want to update this bulk order?"

                confirmText="Yes, Update"

                cancelText="Cancel"

                onConfirm={async () => {

                    if (
                        !pendingPayload ||
                        submitting
                    ) {

                        return;

                    }

                    setShowConfirm(
                        false
                    );

                    setSubmitting(
                        true
                    );

                    try {
                        if (!order) return;

                        await updateOrder(
                            order.orderId,
                            pendingPayload
                        );

                        await fetchOrder(
                            order.orderId,
                            {
                                force: true,
                            }
                        );

                        showAlert({
                            type: "success",
                            message:
                                "Bulk Order updated successfully.",
                            duration: 1500,
                        });

                    } catch (err: any) {

                        showAlert({

                            type: "error",

                            message:
                                err?.message ||
                                "Failed to update bulk order.",

                        });

                    } finally {

                        setSubmitting(
                            false
                        );

                        setPendingPayload(
                            null
                        );

                    }

                }}

                onCancel={() => {

                    setShowConfirm(
                        false
                    );

                    setPendingPayload(
                        null
                    );

                }}

            />

        </div>

    );

}