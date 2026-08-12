import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { bulkOrderStore } from "../store/bulkOrder.store";
import { useBulkOrderPricing } from "./useBulkOrderPricing";
import { createBulkOrder } from "../services/bulkOrder.api";
import { useAlert } from "../store/alert.store";
import { validateSchemeAmount } from "../utils/bulkPricing";

export function useBulkOrderSubmit() {
    const navigate = useNavigate();

    const {
        address: selectedAddress,
        items: orderItems,
        scheme,
        adminCode,
        adminCodeVerified,
        clearAll,
    } = bulkOrderStore();

    const { showAlert } = useAlert();

    const { pricing } =
        useBulkOrderPricing({
            state:
                selectedAddress?.state ??
                "",
        });

    const [loading, setLoading] =
        useState(false);

    const submitOrder =
        useCallback(async () => {
            if (loading) {
                return;
            }

            if (!scheme) {
                showAlert({
                    type: "error",
                    message:
                        "Please select a bulk order scheme.",
                });
                return;
            }

            if (!selectedAddress) {
                showAlert({
                    type: "error",
                    message:
                        "Please select a delivery address.",
                });
                return;
            }

            if (orderItems.length === 0) {
                showAlert({
                    type: "error",
                    message:
                        "Please select at least one product.",
                });
                return;
            }

            if (
                !selectedAddress.pincode ||
                !/^\d{6}$/.test(
                    selectedAddress.pincode
                )
            ) {
                showAlert({
                    type: "error",
                    message:
                        "Please select a valid delivery pincode.",
                });
                return;
            }

            if (!selectedAddress.state) {
                showAlert({
                    type: "error",
                    message:
                        "Unable to determine the delivery state. Please verify the pincode.",
                });
                return;
            }

            if (
                scheme.isAdminApprovalRequired
            ) {
                if (
                    !adminCode.trim()
                ) {
                    showAlert({
                        type: "error",
                        message:
                            "Please enter the admin code.",
                    });
                    return;
                }

                if (
                    !adminCodeVerified
                ) {
                    showAlert({
                        type: "error",
                        message:
                            "Please verify the admin code before placing this order.",
                    });
                    return;
                }
            }

            const schemeValidation =
                validateSchemeAmount(
                    scheme,
                    pricing.productTotal
                );

            if (
                !schemeValidation.valid
            ) {
                showAlert({
                    type: "error",
                    message:
                        schemeValidation.message ??
                        "Bulk order amount is outside the allowed range.",
                });
                return;
            }

            setLoading(true);

            try {
                const response =
                    await createBulkOrder({
                        schemeId:
                            scheme.schemeId,

                        adminCode:
                            scheme.isAdminApprovalRequired
                                ? adminCode.trim()
                                : undefined,

                        address:
                            selectedAddress,

                        items:
                            orderItems.map(
                                (item) => ({
                                    productId:
                                        item.productId,
                                    quantity:
                                        item.quantity,
                                })
                            ),
                    });

                clearAll();

                navigate(
                    `/bulk-order/success/${response.orderId}`
                );
            } catch (error) {
                console.error(
                    "Bulk order submission failed:",
                    error
                );

                showAlert({
                    type: "error",
                    message:
                        error instanceof Error &&
                            error.message
                            ? error.message
                            : "Unable to submit bulk order. Please try again.",
                });
            } finally {
                setLoading(false);
            }
        }, [
            loading,
            scheme,
            selectedAddress,
            orderItems,
            adminCode,
            adminCodeVerified,
            pricing.productTotal,
            showAlert,
            clearAll,
            navigate,
        ]);

    return {
        loading,
        submitOrder,
    };
}