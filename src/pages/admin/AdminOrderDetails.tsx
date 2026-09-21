import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FaDownload } from "react-icons/fa";
import {
    STATUS_LABELS,
    STATUS_COLORS,
    STATUS_ORDER,
} from "../../utils/orderStatus";
import { apiFetch } from "../../services/api";
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
import { refreshOrderAmount, restoreOrderApi } from "../../services/order.api";
import { useOrdersStore } from "../../store/orders.store";
import { sortProductsBySequence } from "../../utils/sequncerUtil";
import { formatCurrency } from "../../utils/pricing";
import { formatDateTime } from "../../utils/date";
import { useAuth } from "../../store/auth.store";
import { getProductCounts } from "../../utils/productCounts";
import { uploadFilesToS3 } from "../../utils/uploadToS3";
import { getPincodeLocation } from "../../utils/pincode";

export default function AdminOrderDetails() {
    const { orderId = "" } = useParams();
    const navigate = useNavigate();
    const { showAlert } = useAlert();
    const location = useLocation();
    const { user } = useAuth();
    const [downloading, setDownloading] = useState(false);
    const [downloadingPackingList, setDownloadingPackingList] = useState(false);
    const { cache, fetchOrder, loading, updateOrder } = useAdminOrderDetailsStore();
    const updateOrderListCache = useAdminOrdersStore((s) => s.updateOrderInCache);
    const [showConfirm, setShowConfirm] = useState(false);
    const [pendingPayload, setPendingPayload] = useState<{
        status?: string;
        adminComment?: string;
        mobile: string;
        amount: string;
        paymentAccountId?: string;
    } | null>(null);
    const config = useConfigStore((s) => s.config);
    const [selectedStatus, setSelectedStatus] = useState("");
    const [comment, setComment] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [restoring, setRestoring] = useState(false);
    const [discountType, setDiscountType] =
        useState<"FLAT" | "PERCENTAGE">("FLAT");

    const [discountValue, setDiscountValue] =
        useState("");

    const [showDiscountConfirm, setShowDiscountConfirm] =
        useState(false);

    const [discountSubmitting, setDiscountSubmitting] =
        useState(false);

    const [selectedPaymentAccountIds, setSelectedPaymentAccountIds] =
        useState<string[]>([]);

    const [selectedPaymentAccountId, setSelectedPaymentAccountId] =
        useState("");

    const [customPaymentAccountId, setCustomPaymentAccountId] =
        useState("");

    const [generatedPaymentMessage, setGeneratedPaymentMessage] =
        useState("");

    const [refreshingAmount, setRefreshingAmount] =
        useState(false);

    const [showRefreshAmountConfirm, setShowRefreshAmountConfirm] =
        useState(false);

    const [copyingPaymentMessage, setCopyingPaymentMessage] =
        useState(false);
    const [uploadingInvoice, setUploadingInvoice] = useState(false);
    const [invoiceFileInputKey, setInvoiceFileInputKey] = useState(0);
    const [isEditingAddress, setIsEditingAddress] = useState(false);
    const [savingAddress, setSavingAddress] = useState(false);
    const [loadingPincode, setLoadingPincode] = useState(false);
    const [userChitBalance, setUserChitBalance] = useState(0);
    const [loadingChitBalance, setLoadingChitBalance] = useState(false);
    const [showChitConfirm, setShowChitConfirm] = useState(false);
    const [applyingChitBalance, setApplyingChitBalance] = useState(false);
    const [revertingChitBalance, setRevertingChitBalance] = useState(false);

    const [addressForm, setAddressForm] = useState({
        fullName: "",
        mobile: "",
        addressLine1: "",
        addressLine2: "",
        city: "",
        district: "",
        state: "",
        pincode: "",
    });

    const clearOrdersCache = useOrdersStore((s) => s.clear);
    const clearAdminOrdersCache = useAdminOrdersStore((s) => s.clear);
    const order = cache[orderId];
    const paymentAccounts =
        Array.isArray(config?.paymentAccounts)
            ? config.paymentAccounts
            : [];

    const getPaymentAccountLabel = (account: any) => {
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

        lines.push(`Order ID: ${order.orderId}`);

        lines.push(
            `Total: ₹${Number(
                order.finalPayable ?? order.grandTotal ?? 0
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
            "👉 Please share your payment screenshot with us to start dispatch."
        );

        lines.push(
            `Track here: ${website}`
        );

        return lines.join("\n");
    };

    const handleRefreshOrderAmount = async () => {
        if (!order || refreshingAmount) {
            return;
        }

        try {
            setRefreshingAmount(true);

            await refreshOrderAmount(order.orderId);

            clearOrdersCache();
            clearAdminOrdersCache();

            await fetchOrder(order.orderId, {
                force: true,
            });

            setShowRefreshAmountConfirm(false);

            showAlert({
                type: "success",
                message: "Order amount refreshed successfully.",
                duration: 2000,
            });
        } catch (error: any) {
            console.error(
                "Refresh order amount failed:",
                error
            );

            showAlert({
                type: "error",
                message:
                    error?.message ||
                    "Unable to refresh order amount.",
            });
        } finally {
            setRefreshingAmount(false);
        }
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
    const packagingPercent = config?.packagingPercent ?? 0;
    const gstPercent = config?.gstPercent ?? 0;
    const disableGstForTN = config?.disableGstForTN || false;
    const website = config?.website || 'https://www.sivakasicrackers.co.in';

    const isTamilNadu =
        order?.address?.toLowerCase().includes("tamil nadu") ||
        order?.address?.toLowerCase().includes("pondicherry") ||
        order?.address?.toLowerCase().includes("puducherry");

    const sortedItems = useMemo(
        () => sortProductsBySequence(order?.items ?? []),
        [order?.items]
    );

    const {
        totalCount,
        sparklerCount,
        otherCount,
    } = getProductCounts(
        sortedItems,
        config?.sparklerCategory
    );

    const parseOrderAddress = (addressString: string) => {
        const lines = addressString
            .split("\n")
            .map((line) => line.trim())
            .filter(Boolean);

        if (lines.length === 0) {
            return {
                fullName: "",
                mobile: "",
                addressLine1: "",
                addressLine2: "",
                city: "",
                district: "",
                state: "",
                pincode: "",
            };
        }

        const fullName = lines[0] || "";
        const mobile = lines[1] || "";
        const addressLine1 = lines[2] || "";

        let addressLine2 = "";
        let locationLine = "";

        if (lines.length >= 5) {
            addressLine2 = lines[3] || "";
            locationLine = lines[4] || "";
        } else {
            locationLine = lines[3] || "";
        }

        const locationMatch = locationLine.match(
            /^(.+?),\s*(.*?),\s*(.+?)\s*-\s*(\d{6})$/
        );

        if (!locationMatch) {
            return {
                fullName,
                mobile,
                addressLine1,
                addressLine2,
                city: "",
                district: "",
                state: "",
                pincode: "",
            };
        }

        return {
            fullName,
            mobile,
            addressLine1,
            addressLine2,
            city: locationMatch[1].trim(),
            district: locationMatch[2].trim(),
            state: locationMatch[3].trim(),
            pincode: locationMatch[4].trim(),
        };
    };

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
        if (!order) return;

        setComment(order.adminComment || "");
        setSelectedStatus(order.status);

        const savedPaymentAccountId =
            String(order.paymentAccountId ?? "").trim();

        if (!savedPaymentAccountId) {
            setSelectedPaymentAccountId("");
            setCustomPaymentAccountId("");
            return;
        }

        const matchingAccount = paymentAccounts.find(
            (account: any) => {
                const creditedTo =
                    account.type === "BANK"
                        ? account.accountNumber || ""
                        : account.upiId ||
                        account.mobileNumber ||
                        "";

                return creditedTo === savedPaymentAccountId;
            }
        );

        if (matchingAccount) {
            setSelectedPaymentAccountId(
                savedPaymentAccountId
            );
            setCustomPaymentAccountId("");
        } else {
            setSelectedPaymentAccountId("CUSTOM");
            setCustomPaymentAccountId(
                savedPaymentAccountId
            );
        }
    }, [order, config?.paymentAccounts]);

    useEffect(() => {
        if (!order?.userId) {
            setUserChitBalance(0);
            return;
        }

        let cancelled = false;

        const loadUserChitBalance = async () => {
            try {
                setLoadingChitBalance(true);

                const response = await apiFetch(
                    `/admin/users/${encodeURIComponent(order.userId)}`,
                    {
                        method: "GET",
                    },
                    import.meta.env.VITE_API_BASE_URL_V1
                );

                if (cancelled) {
                    return;
                }

                const userData =
                    response?.data ??
                    response?.item ??
                    response;

                const chitBalance = Number(
                    userData?.chitBalance ?? 0
                );

                setUserChitBalance(
                    Number.isFinite(chitBalance) && chitBalance > 0
                        ? chitBalance
                        : 0
                );
            } catch (error) {
                if (cancelled) {
                    return;
                }

                console.error(
                    "Failed to fetch user chit balance:",
                    error
                );

                setUserChitBalance(0);
            } finally {
                if (!cancelled) {
                    setLoadingChitBalance(false);
                }
            }
        };

        loadUserChitBalance();

        return () => {
            cancelled = true;
        };
    }, [order?.userId]);


    useEffect(() => {
        if (!order) return;

        const parsedAddress = parseOrderAddress(order.address || "");

        setAddressForm(parsedAddress);
    }, [order]);


    useEffect(() => {
        if (!isEditingAddress) return;

        const pincode = addressForm.pincode.replace(/\D/g, "");

        if (pincode.length !== 6) {
            return;
        }

        let cancelled = false;

        const loadPincodeLocation = async () => {
            try {
                setLoadingPincode(true);

                const location = await getPincodeLocation(pincode);

                if (cancelled) return;

                if (location) {
                    setAddressForm((previous) => ({
                        ...previous,
                        pincode: location.pincode,
                        city: location.city,
                        district: location.district,
                        state: location.state,
                    }));
                }
            } catch (error) {
                console.error("Pincode lookup failed:", error);
            } finally {
                if (!cancelled) {
                    setLoadingPincode(false);
                }
            }
        };

        loadPincodeLocation();

        return () => {
            cancelled = true;
        };
    }, [addressForm.pincode, isEditingAddress]);

    const isTerminal = order?.status === "DISPATCHED" || order?.status === "CANCELLED";
    const canAdjust = STATUS_ORDER.indexOf(order?.status) < STATUS_ORDER.indexOf("ORDER_PACKED");
    const canApplyDiscount =
        order?.status === "ORDER_PLACED" ||
        order?.status === "ORDER_CONFIRMED";

    const canDownloadInvoice = STATUS_ORDER.indexOf(order?.status) >=
        STATUS_ORDER.indexOf("PAYMENT_CONFIRMED") &&
        order.status !== "CANCELLED";

    const isCancelled = order?.status === "CANCELLED";
    const currentIndex = STATUS_ORDER.indexOf(order?.status);

    const canUploadInvoice =
        STATUS_ORDER.indexOf(order?.status) >=
        STATUS_ORDER.indexOf("PAYMENT_CONFIRMED") &&
        order?.status !== "CANCELLED";

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

    const isPaymentConfirmed =
        selectedStatus === "PAYMENT_CONFIRMED";

    const updateOrderAddress = async (
        orderId: string,
        address: {
            fullName: string;
            mobile: string;
            addressLine1: string;
            addressLine2?: string;
            city: string;
            district?: string;
            state: string;
            pincode: string;
        }
    ) => {
        return apiFetch(
            `/admin/orders/${orderId}/address`,
            {
                method: "PUT",
                body: JSON.stringify({
                    address,
                }),
            },
            import.meta.env.VITE_API_BASE_URL_V1
        );
    };


    const handleSaveAddress = async () => {
        if (!order || savingAddress) return;

        try {
            setSavingAddress(true);

            await updateOrderAddress(order.orderId, {
                fullName: addressForm.fullName.trim(),
                mobile: addressForm.mobile.trim(),
                addressLine1: addressForm.addressLine1.trim(),
                addressLine2: addressForm.addressLine2.trim(),
                city: addressForm.city.trim(),
                district: addressForm.district.trim(),
                state: addressForm.state.trim(),
                pincode: addressForm.pincode.replace(/\D/g, ""),
            });

            setIsEditingAddress(false);

            await fetchOrder(order.orderId, {
                force: true,
            });

            showAlert({
                type: "success",
                message: "Address updated successfully.",
                duration: 2000,
            });
        } catch (error: any) {
            console.error("Update order address failed:", error);

            showAlert({
                type: "error",
                message:
                    error?.message ||
                    "Unable to update address.",
            });
        } finally {
            setSavingAddress(false);
        }
    };

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

    const handleDownloadBill = async () => {
        try {
            const response = await apiFetch(
                `/orders/${order.orderId}/invoice`,
                {
                    method: "GET",
                },
                import.meta.env.VITE_API_BASE_URL_V1
            );

            const billUrl =
                response?.data?.url ??
                response?.url;

            if (!billUrl) {
                throw new Error(
                    "Bill URL was not returned."
                );
            }

            const link = document.createElement("a");
            link.href = billUrl;
            link.download = `bill-${order.orderId}.pdf`;
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error: any) {
            console.error(
                "Download bill failed:",
                error
            );

            showAlert({
                type: "error",
                message:
                    error?.message ||
                    "Unable to download bill.",
            });
        }
    };

    const handleUploadInvoice = async (
        event: React.ChangeEvent<HTMLInputElement>
    ) => {
        const file = event.target.files?.[0];

        if (!file) return;

        if (file.type !== "application/pdf") {
            alert("Please select a PDF file.");
            setInvoiceFileInputKey((prev) => prev + 1);
            return;
        }

        try {
            setUploadingInvoice(true);

            const presignResponse = await apiFetch(
                `/admin/orders/${order.orderId}/invoice/presign`,
                {
                    method: "POST",
                },
                import.meta.env.VITE_API_BASE_URL_V1
            );

            const uploadUrl =
                presignResponse?.data?.uploadUrl ??
                presignResponse?.uploadUrl;

            if (!uploadUrl) {
                console.error(
                    "Invoice presign response:",
                    presignResponse
                );

                throw new Error(
                    "Invoice upload URL was not returned."
                );
            }

            await uploadFilesToS3(
                [
                    {
                        uploadUrl,
                    },
                ],
                [file]
            );

            showAlert({
                type: "success",
                message: "Invoice uploaded successfully.",
            });
            setInvoiceFileInputKey((prev) => prev + 1);
        } catch (error: any) {
            console.error("Invoice upload failed:", error);
            showAlert({
                type: "error",
                message: "Unable to upload invoice."
            });
            setInvoiceFileInputKey((prev) => prev + 1);
        } finally {
            setUploadingInvoice(false);
        }
    };

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

    const handleApplyDiscount = () => {
        if (!order || discountSubmitting) {
            return;
        }

        const value = Number(discountValue);

        if (
            discountValue.trim() === "" ||
            !Number.isFinite(value)
        ) {
            showAlert({
                type: "error",
                message: "Please enter a valid discount value.",
            });
            return;
        }

        if (value < 0) {
            showAlert({
                type: "error",
                message: "Discount cannot be negative.",
            });
            return;
        }

        const productTotal = Number(order.totalProductAmount ?? 0);

        if (discountType === "PERCENTAGE") {
            if (value > 100) {
                showAlert({
                    type: "error",
                    message:
                        "Percentage discount cannot exceed 100%.",
                });
                return;
            }
        }

        if (discountType === "FLAT") {
            if (value > productTotal) {
                showAlert({
                    type: "error",
                    message:
                        "Flat discount cannot exceed the product total.",
                });
                return;
            }
        }

        setShowDiscountConfirm(true);
    };

    const handleConfirmApplyDiscount = async () => {
        if (!order || discountSubmitting) {
            return;
        }

        const value = Number(discountValue);

        try {
            setShowDiscountConfirm(false);
            setDiscountSubmitting(true);

            await apiFetch(
                `/admin/orders/${encodeURIComponent(
                    order.orderId
                )}/discount`,
                {
                    method: "PUT",
                    body: JSON.stringify({
                        discountType,
                        discountValue: value,
                    }),
                },
                import.meta.env.VITE_API_BASE_URL_V1
            );

            await fetchOrder(order.orderId, {
                force: true,
            });

            updateOrderListCache(order.orderId, {
                additionalDiscount:
                    discountType === "PERCENTAGE"
                        ? undefined
                        : value,
                additionalDiscountType: discountType,
                additionalDiscountValue: value,
            });

            setDiscountValue("");
            showAlert({
                type: "success",
                message: "Additional discount applied successfully.",
                duration: 2000,
            });
        } catch (err: any) {
            console.error(
                "Failed to apply additional discount",
                err
            );

            showAlert({
                type: "error",
                message:
                    err?.message ||
                    "Failed to apply additional discount.",
            });
        } finally {
            setDiscountSubmitting(false);
        }
    };

    const handleRevertChitBalance = async () => {
        if (
            !order ||
            Number(order.chitAmount ?? 0) <= 0 ||
            revertingChitBalance
        ) {
            return;
        }

        const revertedChitAmount = Number(
            order.chitAmount ?? 0
        );

        try {
            setRevertingChitBalance(true);

            await apiFetch(
                `/admin/orders/${encodeURIComponent(
                    order.orderId
                )}/revert-chit-balance`,
                {
                    method: "POST",
                },
                import.meta.env.VITE_API_BASE_URL_V1
            );

            // Immediately add the reverted amount back to the UI balance
            setUserChitBalance((previous) =>
                previous + revertedChitAmount
            );

            await fetchOrder(order.orderId, {
                force: true,
            });

            showAlert({
                type: "success",
                message: "Chit balance reverted successfully.",
                duration: 2000,
            });
        } catch (error: any) {
            console.error(
                "Revert chit balance failed:",
                error
            );

            showAlert({
                type: "error",
                message:
                    error?.message ||
                    "Unable to revert chit balance.",
            });
        } finally {
            setRevertingChitBalance(false);
        }
    };

    const handleApplyChitBalance = () => {
        if (!order || userChitBalance <= 0) {
            return;
        }

        const finalPayable = Number(
            order.finalPayable ?? 0
        );

        if (finalPayable <= 0) {
            showAlert({
                type: "error",
                message: "No payable amount available for this order.",
            });
            return;
        }

        const applicableChitAmount = Math.min(
            userChitBalance,
            finalPayable
        );

        if (applicableChitAmount <= 0) {
            return;
        }

        setShowChitConfirm(true);
    };

    const handleConfirmApplyChitBalance = async () => {
        if (!order || userChitBalance <= 0 || applyingChitBalance) {
            return;
        }

        try {
            setApplyingChitBalance(true);
            setShowChitConfirm(false);
            const appliedChitAmount = Math.min(
                userChitBalance,
                Number(order.finalPayable ?? 0)
            );

            await apiFetch(
                `/admin/orders/${encodeURIComponent(
                    order.orderId
                )}/apply-chit-balance`,
                {
                    method: "POST",
                    body: JSON.stringify({
                        chitAmount: appliedChitAmount,
                    }),
                },
                import.meta.env.VITE_API_BASE_URL_V1
            );

            setUserChitBalance((previous) =>
                Math.max(0, previous - appliedChitAmount)
            );

            await fetchOrder(order.orderId, {
                force: true,
            });

            showAlert({
                type: "success",
                message: "Chit balance applied successfully.",
                duration: 2000,
            });
        } catch (error: any) {
            console.error(
                "Apply chit balance failed:",
                error
            );

            showAlert({
                type: "error",
                message:
                    error?.message ||
                    "Unable to apply chit balance.",
            });
        } finally {
            setApplyingChitBalance(false);
        }
    };

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
    const paymentAccountId =
        selectedPaymentAccountId === "CUSTOM"
            ? customPaymentAccountId.trim()
            : selectedPaymentAccountId;

    const canSubmit =
        (
            selectedStatus !== order.status ||
            comment.trim().length > 0
        ) &&
        (
            !isPaymentConfirmed ||
            paymentAccountId.length > 0
        );

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
                                onClick={() => {
                                    const isStaff = user?.role === "STAFF";
                                    const detailsPath = isStaff
                                        ? `/staff/orders/${order.orderId}`
                                        : `/admin/orders/${order.orderId}`;

                                    const adjustPath = isStaff
                                        ? `/staff/orders/${order.orderId}/adjust`
                                        : `/admin/orders/${order.orderId}/adjust`;

                                    navigate(adjustPath, {
                                        state: {
                                            order,
                                            canAdjustConfirmed:
                                                user?.role === "ADMIN" ||
                                                user?.role === "STAFF",
                                            returnPath: detailsPath,
                                        },
                                    });
                                }}
                            >
                                Adjust Order
                            </Button>
                        )}

                        <Button
                            type="button"
                            variant="outline"
                            className="px-3 py-1.5 text-xs whitespace-nowrap"
                            disabled={refreshingAmount}
                            onClick={() => setShowRefreshAmountConfirm(true)}
                        >
                            {refreshingAmount
                                ? "Refreshing..."
                                : "Refresh Amount"}
                        </Button>

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

                    <table className="w-full min-w-[820px] text-sm">

                        <thead className="sticky top-0 z-10 bg-gray-50">

                            <tr className="border-b border-gray-200">

                                <th className="px-4 py-3 text-left font-semibold text-gray-700">
                                    Product
                                </th>

                                <th className="px-4 py-3 text-center font-semibold text-gray-700">
                                    Unit
                                </th>

                                <th className="px-4 py-3 text-center font-semibold text-gray-700">
                                    Qty
                                </th>

                                <th className="px-4 py-3 text-right font-semibold text-gray-700">
                                    MRP
                                </th>

                                <th className="px-4 py-3 text-right font-semibold text-gray-700">
                                    Price
                                </th>

                                <th className="px-4 py-3 text-center font-semibold text-gray-700">
                                    Discount
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

                                    const packUnit = item.packUnit?.trim();

                                    const hasPack =
                                        packQuantity > 0 &&
                                        Boolean(packUnit);

                                    return (
                                        <tr
                                            key={
                                                item.productId ||
                                                idx
                                            }
                                            className="align-middle hover:bg-gray-50"
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

                                                            <p className="font-semibold text-gray-900">
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

                                            {/* Pack */}
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
                                                        {packQuantity}{" "}
                                                        {packUnit}
                                                    </span>
                                                ) : (
                                                    <span className="text-gray-400">
                                                        -
                                                    </span>
                                                )}

                                            </td>

                                            {/* Qty */}
                                            <td className="px-4 py-3 text-center">

                                                <span className="font-medium text-gray-800">
                                                    {item.quantity}
                                                </span>

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
                                                        -
                                                    </span>
                                                )}

                                            </td>

                                            {/* Offer Price */}
                                            <td className="px-4 py-3 text-right whitespace-nowrap">

                                                <span className="font-semibold text-[var(--color-primary)]">
                                                    ₹{formatCurrency(item.price)}
                                                </span>

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
                                                        font-semibold
                                                        text-green-700
                                                        text-xs
                                                    ">
                                                        {item.discountText}
                                                    </span>
                                                ) : (
                                                    <span className="text-gray-400">
                                                        -
                                                    </span>
                                                )}

                                            </td>

                                        </tr>
                                    );
                                }
                            )}

                        </tbody>

                    </table>

                </div>

            </div>


            {(user?.role === "ADMIN" ||
                user?.role === "STAFF") &&
                canApplyDiscount && (
                    <div className="bg-white border border-gray-300 rounded-xl p-5">
                        <div className="mb-4">
                            <h3 className="text-lg font-semibold">
                                Additional Discount
                            </h3>

                            <p className="text-sm text-gray-500 mt-1">
                                Apply a discount to the product total.
                                Packaging and GST will be recalculated
                                automatically.
                            </p>
                            <p className="text-sm text-gray-500 mt-1">
                                To remove an existing discount, enter <strong>0</strong> and submit
                                the update.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-[180px_1fr_auto] gap-3 items-end">

                            {/* Discount Type */}
                            <div>
                                <label className="text-xs text-gray-500 block mb-1">
                                    Discount Type
                                </label>

                                <select
                                    value={discountType}
                                    onChange={(e) =>
                                        setDiscountType(
                                            e.target.value as
                                            | "FLAT"
                                            | "PERCENTAGE"
                                        )
                                    }
                                    disabled={discountSubmitting}
                                    className="
                            w-full
                            border
                            rounded-lg
                            px-3
                            py-2
                            text-sm
                            bg-white
                        "
                                >
                                    <option value="FLAT">
                                        Flat (₹)
                                    </option>

                                    <option value="PERCENTAGE">
                                        Percentage (%)
                                    </option>
                                </select>
                            </div>

                            {/* Discount Value */}
                            <div>
                                <label className="text-xs text-gray-500 block mb-1">
                                    Discount Value
                                </label>

                                <input
                                    type="number"
                                    min="0"
                                    max={
                                        discountType === "PERCENTAGE"
                                            ? 100
                                            : Number(
                                                order.totalProductAmount ??
                                                0
                                            )
                                    }
                                    step="0.01"
                                    value={discountValue}
                                    onChange={(e) => {
                                        const value =
                                            e.target.value;

                                        if (value === "") {
                                            setDiscountValue("");
                                            return;
                                        }

                                        const numericValue =
                                            Number(value);

                                        if (
                                            !Number.isFinite(
                                                numericValue
                                            ) ||
                                            numericValue < 0
                                        ) {
                                            return;
                                        }

                                        if (
                                            discountType ===
                                            "PERCENTAGE" &&
                                            numericValue > 100
                                        ) {
                                            return;
                                        }

                                        if (
                                            discountType === "FLAT" &&
                                            numericValue >
                                            Number(
                                                order.totalProductAmount ??
                                                0
                                            )
                                        ) {
                                            return;
                                        }

                                        setDiscountValue(value);
                                    }}
                                    disabled={discountSubmitting}
                                    placeholder={
                                        discountType === "PERCENTAGE"
                                            ? "0 - 100"
                                            : "Enter amount"
                                    }
                                    className="
                            w-full
                            border
                            rounded-lg
                            px-3
                            py-2
                            text-sm
                        "
                                />
                            </div>

                            {/* Apply */}
                            <Button
                                type="button"
                                disabled={
                                    discountSubmitting ||
                                    discountValue.trim() === ""
                                }
                                onClick={handleApplyDiscount}
                            >
                                {discountSubmitting
                                    ? "Applying..."
                                    : "Apply Discount"}
                            </Button>
                        </div>
                    </div>
                )}

            {/* ADDRESS + ORDER SUMMARY */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch">
                <div className="rounded-xl border bg-white p-5 h-full">
                    <div className="flex items-center justify-between gap-3 mb-4">
                        <h3 className="font-semibold text-[var(--color-primary)]">
                            Address
                        </h3>

                        {!isTerminal && !isEditingAddress && (
                            <Button
                                type="button"
                                variant="outline"
                                className="px-3 py-1.5 text-xs whitespace-nowrap"
                                onClick={() => {
                                    setAddressForm(
                                        parseOrderAddress(order.address || "")
                                    );
                                    setIsEditingAddress(true);
                                }}
                            >
                                Edit Address
                            </Button>
                        )}
                    </div>

                    {!isEditingAddress ? (
                        <p className="text-sm whitespace-pre-line">
                            {order.address}
                        </p>
                    ) : (
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs text-gray-500 block mb-1">
                                        Full Name
                                    </label>

                                    <input
                                        type="text"
                                        value={addressForm.fullName}
                                        onChange={(e) =>
                                            setAddressForm((previous) => ({
                                                ...previous,
                                                fullName: e.target.value,
                                            }))
                                        }
                                        className="w-full border rounded-lg px-3 py-2 text-sm"
                                    />
                                </div>

                                <div>
                                    <label className="text-xs text-gray-500 block mb-1">
                                        Mobile
                                    </label>

                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        value={addressForm.mobile}
                                        onChange={(e) =>
                                            setAddressForm((previous) => ({
                                                ...previous,
                                                mobile: e.target.value.replace(/\D/g, ""),
                                            }))
                                        }
                                        className="w-full border rounded-lg px-3 py-2 text-sm"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-xs text-gray-500 block mb-1">
                                    Address Line 1
                                </label>

                                <input
                                    type="text"
                                    value={addressForm.addressLine1}
                                    onChange={(e) =>
                                        setAddressForm((previous) => ({
                                            ...previous,
                                            addressLine1: e.target.value,
                                        }))
                                    }
                                    className="w-full border rounded-lg px-3 py-2 text-sm"
                                />
                            </div>

                            <div>
                                <label className="text-xs text-gray-500 block mb-1">
                                    Address Line 2
                                </label>

                                <input
                                    type="text"
                                    value={addressForm.addressLine2}
                                    onChange={(e) =>
                                        setAddressForm((previous) => ({
                                            ...previous,
                                            addressLine2: e.target.value,
                                        }))
                                    }
                                    className="w-full border rounded-lg px-3 py-2 text-sm"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs text-gray-500 block mb-1">
                                        Pincode
                                    </label>

                                    <div className="relative">
                                        <input
                                            type="text"
                                            inputMode="numeric"
                                            maxLength={6}
                                            value={addressForm.pincode}
                                            onChange={(e) => {
                                                const pincode =
                                                    e.target.value
                                                        .replace(/\D/g, "")
                                                        .slice(0, 6);

                                                setAddressForm((previous) => ({
                                                    ...previous,
                                                    pincode,
                                                    city: "",
                                                    district: "",
                                                    state: "",
                                                }));
                                            }}
                                            className="w-full border rounded-lg px-3 py-2 text-sm"
                                        />

                                        {loadingPincode && (
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                                                Loading...
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs text-gray-500 block mb-1">
                                        City
                                    </label>

                                    <input
                                        type="text"
                                        value={addressForm.city}
                                        readOnly
                                        className="w-full border rounded-lg px-3 py-2 text-sm bg-gray-50"
                                    />
                                </div>

                                <div>
                                    <label className="text-xs text-gray-500 block mb-1">
                                        District
                                    </label>

                                    <input
                                        type="text"
                                        value={addressForm.district}
                                        readOnly
                                        className="w-full border rounded-lg px-3 py-2 text-sm bg-gray-50"
                                    />
                                </div>

                                <div>
                                    <label className="text-xs text-gray-500 block mb-1">
                                        State
                                    </label>

                                    <input
                                        type="text"
                                        value={addressForm.state}
                                        readOnly
                                        className="w-full border rounded-lg px-3 py-2 text-sm bg-gray-50"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 pt-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    disabled={savingAddress}
                                    onClick={() => {
                                        setIsEditingAddress(false);
                                        setAddressForm(
                                            parseOrderAddress(order.address || "")
                                        );
                                    }}
                                >
                                    Cancel
                                </Button>

                                <Button
                                    type="button"
                                    disabled={savingAddress || loadingPincode}
                                    onClick={handleSaveAddress}
                                >
                                    {savingAddress ? "Saving..." : "Save Address"}
                                </Button>
                            </div>
                        </div>
                    )}
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

                                {sparklerCount > 0 ? (
                                    <div className="text-xs text-gray-500 space-y-0.5">
                                        <p>
                                            Total Products: {totalCount}
                                        </p>
                                        <p>
                                            Sparklers: {sparklerCount}
                                        </p>
                                        <p>
                                            Other Products: {otherCount}
                                        </p>
                                    </div>
                                ) : (
                                    <p className="text-xs text-gray-500">
                                        Total Products: {totalCount}
                                    </p>
                                )}
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

                        {/* Additional Discount */}
                        {(order.additionalDiscount ?? 0) > 0 && (
                            <div className="flex justify-between text-green-600 font-medium">
                                <span>
                                    Additional Discount{" "}
                                    {order.additionalDiscountType === "PERCENTAGE"
                                        ? `(${order.additionalDiscountValue}%)`
                                        : `(Flat ₹${order.additionalDiscountValue})`}
                                </span>

                                <span>
                                    -₹{formatCurrency(order.additionalDiscount)}
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


                        {/* Wallet Applied */}
                        {Number(order.walletUsed ?? 0) > 0 && (
                            <div className="flex justify-between text-green-700 font-medium">
                                <span>Wallet Applied</span>

                                <span>
                                    - ₹{formatCurrency(order.walletUsed)}
                                </span>
                            </div>
                        )}

                        {/* Chit Applied */}
                        {Number(order.chitAmount ?? 0) > 0 && (
                            <div className="flex justify-between items-center text-green-700 font-medium">
                                <div className="flex items-center gap-3">
                                    <span>Chit Balance Applied</span>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="px-2.5 py-1 text-xs"
                                        disabled={revertingChitBalance}
                                        onClick={handleRevertChitBalance}
                                    >
                                        {revertingChitBalance
                                            ? "Reverting..."
                                            : "Revert"}
                                    </Button>
                                </div>

                                <span>
                                    - ₹{formatCurrency(order.chitAmount)}
                                </span>
                            </div>
                        )}
                        {(
                            Number(order.walletUsed ?? 0) > 0 ||
                            Number(order.chitAmount ?? 0) > 0
                        ) && (
                                <>
                                    <div className="border-t my-4" />

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

                        {/* Chit Balance */}
                        {userChitBalance > 0 && (
                            <>
                                <div className="border-t my-4" />

                                <div className="flex justify-between items-center">
                                    <div>
                                        <p className="font-semibold text-gray-700">
                                            Chit Balance Available
                                        </p>

                                        <p className="text-xs text-gray-500">
                                            Available for this user
                                        </p>
                                    </div>

                                    <span className="font-semibold text-green-700">
                                        ₹{formatCurrency(userChitBalance)}
                                    </span>
                                </div>

                                <div className="mt-3 flex justify-end">
                                    <Button
                                        type="button"
                                        className="px-3 py-1.5 text-xs"
                                        disabled={
                                            loadingChitBalance ||
                                            applyingChitBalance ||
                                            Number(order.finalPayable ?? 0) <= 0
                                        }
                                        onClick={handleApplyChitBalance}
                                    >
                                        {applyingChitBalance
                                            ? "Applying..."
                                            : "Apply Chit Balance"}
                                    </Button>
                                </div>
                            </>
                        )}

                    </div>

                </div>
            </div>

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
                                const status = history.toStatus ?? history.status;
                                const updatedBy = history.changedBy ?? history.by;
                                const updatedAt = history.changedAt ?? history.at;

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
                                                    {updatedBy}
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

            {canUploadInvoice && (
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                    <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">

                        {/* Bill Info */}
                        <div className="flex items-start gap-4 min-w-0">
                            <div className="
                    flex h-11 w-11 shrink-0 items-center justify-center
                    rounded-xl
                    bg-red-50
                    text-red-600
                    border border-red-100
                ">
                                <svg
                                    className="h-5 w-5"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="1.8"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M7 3h8l4 4v14H7a2 2 0 01-2-2V5a2 2 0 012-2z"
                                    />
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M15 3v5h5"
                                    />
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M9 13h6M9 17h4"
                                    />
                                </svg>
                            </div>

                            <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                    <h3 className="text-base font-semibold text-gray-900">
                                        Bill
                                    </h3>

                                    <span className="
                                        inline-flex items-center
                                        rounded-full
                                        bg-green-50
                                        px-2 py-0.5
                                        text-[10px]
                                        font-semibold
                                        text-green-700
                                        border border-green-100
                                    ">
                                        PDF
                                    </span>
                                </div>

                                <p className="text-sm text-gray-500 mt-1">
                                    Upload or download the bill for this order.
                                </p>

                                <p className="text-xs text-gray-400 mt-1.5">
                                    Order ID:
                                    <span className="ml-1 font-medium text-gray-600">
                                        {order.orderId}
                                    </span>
                                </p>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex w-full sm:w-auto items-center gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleDownloadBill}
                                className="
                        flex-1 sm:flex-none
                        px-4 py-2
                        text-sm
                        font-medium
                    "
                            >
                                <span className="flex items-center justify-center gap-2">
                                    <FaDownload size={13} />
                                    Download Bill
                                </span>
                            </Button>

                            <label
                                htmlFor={`invoice-upload-${invoiceFileInputKey}`}
                                className={`
                        inline-flex flex-1 sm:flex-none
                        items-center justify-center
                        gap-2
                        px-4 py-2
                        rounded-lg
                        text-sm
                        font-medium
                        transition
                        ${uploadingInvoice
                                        ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                                        : "bg-black text-white hover:bg-gray-800 cursor-pointer"
                                    }
                    `}
                            >
                                <svg
                                    className="h-4 w-4"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M12 16V4"
                                    />
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M8 8l4-4 4 4"
                                    />
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M5 20h14"
                                    />
                                </svg>

                                {uploadingInvoice
                                    ? "Uploading..."
                                    : "Upload Bill"}
                            </label>

                            <input
                                key={invoiceFileInputKey}
                                id={`invoice-upload-${invoiceFileInputKey}`}
                                type="file"
                                accept="application/pdf,.pdf"
                                className="hidden"
                                disabled={uploadingInvoice}
                                onChange={handleUploadInvoice}
                            />
                        </div>
                    </div>
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
                            onChange={(e) => {
                                const status = e.target.value;

                                setSelectedStatus(status);

                                if (status !== "PAYMENT_CONFIRMED") {
                                    setSelectedPaymentAccountId("");
                                    setCustomPaymentAccountId("");
                                }
                            }}
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

                {isPaymentConfirmed && (
                    <div>
                        <label className="text-xs text-gray-500 block mb-1">
                            Payment Credited To
                        </label>

                        <select
                            value={selectedPaymentAccountId}
                            onChange={(e) => {
                                setSelectedPaymentAccountId(e.target.value);

                                if (e.target.value !== "CUSTOM") {
                                    setCustomPaymentAccountId("");
                                }
                            }}
                            disabled={submitting}
                            className="w-full border rounded-lg px-3 py-2 text-sm bg-white"
                        >
                            <option value="">
                                Select Payment Account
                            </option>

                            {paymentAccounts.map(
                                (account: any, index: number) => {
                                    const accountId =
                                        account.id || String(index);

                                    const label =
                                        account.type === "BANK"
                                            ? `${account.bankName || "Bank"} - ${account.accountNumber || accountId}`
                                            : `${getPaymentAccountLabel(account)} - ${account.upiId ||
                                            account.mobileNumber ||
                                            accountId
                                            }`;

                                    return (
                                        <option
                                            key={accountId}
                                            value={
                                                account.type === "BANK"
                                                    ? account.accountNumber || ""
                                                    : account.upiId ||
                                                    account.mobileNumber ||
                                                    ""
                                            }
                                        >
                                            {label}
                                        </option>
                                    );
                                }
                            )}

                            <option value="CUSTOM">
                                Custom Account ID
                            </option>
                        </select>

                        {selectedPaymentAccountId === "CUSTOM" && (
                            <input
                                type="text"
                                value={customPaymentAccountId}
                                onChange={(e) =>
                                    setCustomPaymentAccountId(e.target.value)
                                }
                                disabled={submitting}
                                placeholder="Enter Account ID"
                                className="w-full border rounded-lg px-3 py-2 text-sm mt-2"
                            />
                        )}
                    </div>
                )}

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
                            amount: order.totalAmount || 0,
                            paymentAccountId:
                                isPaymentConfirmed
                                    ? paymentAccountId
                                    : undefined,
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

            <ConfirmDialog
                open={showRefreshAmountConfirm}
                title="Refresh Order Amount?"
                description="Are you sure you want to refresh this order amount? The current product prices and discounts will be recalculated using the latest values."
                confirmText="Yes, Refresh"
                cancelText="Cancel"
                loading={refreshingAmount}
                onConfirm={handleRefreshOrderAmount}
                onCancel={() => {
                    if (refreshingAmount) {
                        return;
                    }

                    setShowRefreshAmountConfirm(false);
                }}
            />

            <ConfirmDialog
                open={showDiscountConfirm}
                title="Apply Discount?"
                description={
                    discountType === "PERCENTAGE"
                        ? `Are you sure you want to apply a ${discountValue}% discount to this order?`
                        : `Are you sure you want to apply a ₹${Number(
                            discountValue || 0
                        ).toLocaleString("en-IN")} discount to this order?`
                }
                confirmText="Yes, Apply Discount"
                cancelText="Cancel"
                onConfirm={handleConfirmApplyDiscount}
                onCancel={() => {
                    if (discountSubmitting) {
                        return;
                    }

                    setShowDiscountConfirm(false);
                }}
            />
            <ConfirmDialog
                open={showChitConfirm}
                title="Apply Chit Balance?"
                description={`Are you sure you want to apply ₹${formatCurrency(
                    Math.min(
                        userChitBalance,
                        Number(order.finalPayable ?? 0)
                    )
                )} from the user's chit balance to this order? The final payable amount will be reduced by this amount.`}
                confirmText="Yes, Apply"
                cancelText="Cancel"
                loading={applyingChitBalance}
                onConfirm={handleConfirmApplyChitBalance}
                onCancel={() => {
                    if (applyingChitBalance) {
                        return;
                    }

                    setShowChitConfirm(false);
                }}
            />
        </div>
    );
}