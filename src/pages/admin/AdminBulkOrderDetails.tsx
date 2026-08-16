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

                <div className="flex items-center gap-3 mb-4">

                    <button
                        onClick={() => navigate(-1)}
                        className="
                            flex
                            items-center
                            justify-center
                            w-9
                            h-9
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

                        Bulk Order Details

                    </h1>

                </div>

                <div className="space-y-2">

                    <div className="flex items-center gap-2">

                        <h1 className="text-base font-semibold text-[var(--color-primary)] break-all">

                            {order.orderId}

                        </h1>

                        <button
                            onClick={() =>
                                navigator.clipboard.writeText(
                                    order.orderId
                                )
                            }
                            className="p-1.5 rounded-md border hover:bg-gray-100"
                        >



                            📋

                        </button>

                    </div>

                    <p className="text-xs text-gray-500">

                        Created on{" "}

                        {new Date(
                            order.createdAt
                        ).toLocaleString(
                            "en-IN"
                        )}

                    </p>

                    <p className="text-xs text-gray-500">

                        Scheme :{" "}

                        <span className="font-semibold">

                            {order.schemeId}

                        </span>

                    </p>

                    <div className="flex flex-wrap items-center gap-2">

                        {canDownloadInvoice && (

                            <Button
                                variant="secondary"
                                onClick={
                                    handleDownloadInvoice
                                }
                            >

                                {downloading

                                    ? "Downloading..."

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
                    transition-all
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

                            {/* Tooltip */}

                            <div
                                className="
                                pointer-events-none
                                invisible
                                absolute
                                left-0
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
                                backgroundColor:
                                    `${STATUS_COLORS[order.status]}20`,
                                color:
                                    STATUS_COLORS[order.status],
                            }}
                        >

                            {STATUS_LABELS[
                                order.status
                            ]}

                        </span>

                    </div>

                </div>

                <div className="h-px bg-gray-100" />
                <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">

                    <div>
                        <span className="text-gray-500">
                            Grand Total
                        </span>{" "}

                        <span className="font-semibold">
                            ₹{order.pricing.grandTotal.toLocaleString("en-IN")}
                        </span>
                    </div>

                    <div>
                        <span className="text-gray-500">
                            Products
                        </span>{" "}

                        <span className="font-semibold">
                            {order.items.length}
                        </span>
                    </div>

                    <div>
                        <span className="text-gray-500">
                            No. of Cartons
                        </span>{" "}

                        <span className="font-semibold">
                            {totalCartons}
                        </span>
                    </div>

                </div>

            </div>
            {/* PRODUCTS */}

            <div className="bg-white border rounded-xl overflow-hidden">

                {/* Header */}
                <div className="px-4 py-4 border-b">
                    <div className="flex items-center gap-2">
                        <h3 className="text-lg font-semibold text-[var(--color-primary)]">
                            Products
                        </h3>

                        <span className="text-sm text-gray-500">
                            {order.items.length} Products
                        </span>
                    </div>
                </div>

                {/* Product Table */}
                <div className="overflow-x-auto">

                    <table className="w-full min-w-[700px] text-sm">

                        <thead>
                            <tr className="bg-gray-50 border-b text-gray-600">
                                <th className="px-4 py-3 text-left font-medium">
                                    PRODUCT NAME
                                </th>

                                <th className="px-4 py-3 text-center font-medium">
                                    CARTON
                                </th>

                                <th className="px-4 py-3 text-center font-medium">
                                    CARTON CONTENT
                                </th>

                                <th className="px-4 py-3 text-center font-medium">
                                    PRICE
                                </th>

                                <th className="px-4 py-3 text-right font-medium">
                                    TOTAL
                                </th>
                            </tr>
                        </thead>

                        <tbody>
                            {order.items.map(
                                (item: any, index: number) => (
                                    <tr
                                        key={
                                            item.productId ||
                                            index
                                        }
                                        className="border-b last:border-b-0 hover:bg-gray-50"
                                    >

                                        {/* Product */}
                                        <td className="px-4 py-4">
                                            <div className="flex items-center gap-3">

                                                <img
                                                    src={
                                                        item.image ||
                                                        defaultImage
                                                    }
                                                    onError={(e) => {
                                                        e.currentTarget.src =
                                                            defaultImage;
                                                    }}
                                                    className="w-12 h-12 rounded-lg object-cover border shrink-0"
                                                    loading="lazy"
                                                    alt={item.name}
                                                />

                                                <span className="font-semibold text-gray-900">
                                                    {item.name}
                                                </span>

                                            </div>
                                        </td>

                                        {/* Carton */}
                                        <td className="px-4 py-4 text-center font-semibold text-gray-900">
                                            {item.quantity}
                                        </td>

                                        {/* Carton Content */}
                                        <td className="px-4 py-4 text-center text-gray-600">
                                            {item.cartonQty}
                                            {item.packUnit
                                                ? ` ${item.packUnit}`
                                                : ""}
                                        </td>

                                        {/* Price */}
                                        <td className="px-4 py-4 text-center font-semibold text-gray-900 whitespace-nowrap">
                                            ₹
                                            {Number(
                                                item.schemePrice
                                            ).toLocaleString(
                                                "en-IN"
                                            )}
                                        </td>

                                        {/* Total */}
                                        <td className="px-4 py-4 text-right font-bold text-gray-900 whitespace-nowrap">
                                            ₹
                                            {Number(
                                                item.total
                                            ).toLocaleString(
                                                "en-IN"
                                            )}
                                        </td>

                                    </tr>
                                )
                            )}
                        </tbody>

                    </table>

                </div>
            </div>

            {/* ADDRESS + PRICING */}

            <div className="grid md:grid-cols-2 gap-4">

                <div className="bg-white border rounded-xl p-4">

                    <h3 className="font-semibold mb-3">

                        Delivery Address

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

                            {order.address.state}

                        </p>

                        <p>

                            {order.address.pincode}

                        </p>

                    </div>

                </div>

                <div className="bg-white border rounded-xl p-4">

                    <h3 className="font-semibold mb-3">

                        Pricing Summary

                    </h3>

                    <div className="space-y-3 text-sm">

                        <div className="flex justify-between">

                            <span>

                                Product Total

                            </span>

                            <span>

                                ₹{Number(order.pricing.productTotal).toLocaleString("en-IN")}

                            </span>

                        </div>


                        <div className="flex justify-between">
                            <span>
                                No. of Cartons
                            </span>{" "}

                            <span className="">
                                {totalCartons}
                            </span>
                        </div>

                        <div className="flex justify-between">

                            <span>

                                Packaging ({order.pricing.packagingPercent}%)

                            </span>

                            <span>

                                ₹{Number(order.pricing.packagingCharge).toLocaleString("en-IN")}

                            </span>

                        </div>

                        {order.pricing.gstAmount > 0 && (

                            <div className="flex justify-between">
                                GST ({order.pricing.gstPercent}%)

                                <span>

                                    ₹{Number(order.pricing.gstAmount).toLocaleString("en-IN")}

                                </span>

                            </div>
                        )}


                        <div className="border-t pt-3 flex justify-between font-bold text-[var(--color-primary)]">

                            <span>

                                Grand Total

                            </span>

                            <span>

                                ₹{Number(order.pricing.grandTotal).toLocaleString("en-IN")}

                            </span>

                        </div>

                    </div>

                </div>

            </div>

            {order.remarks && (

                <div className="bg-white border rounded-xl p-4">

                    <h3 className="font-semibold mb-2">

                        Remarks

                    </h3>

                    <p className="text-sm whitespace-pre-wrap">

                        {order.remarks}

                    </p>

                </div>

            )}

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
                                                        ? new Date(
                                                            updatedAt
                                                        ).toLocaleString(
                                                            "en-IN"
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
                        {canAdjust && (
                            <Button
                                variant="secondary"
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