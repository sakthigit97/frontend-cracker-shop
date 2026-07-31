import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { bulkOrderStore } from "../store/bulkOrder.store";
import { useBulkOrderPricing } from "./useBulkOrderPricing";
import { createBulkOrder } from "../services/bulkOrder.api";
import { useAlert } from "../store/alert.store";


export function useBulkOrderSubmit() {

    const navigate = useNavigate();
    const { address: selectedAddress } = bulkOrderStore();
    const { showAlert } = useAlert();

    const {
        clearAll,
        scheme,
    } = bulkOrderStore();

    const {
        orderItems,
        pricing,
    } = useBulkOrderPricing();
    const [loading, setLoading] = useState(false);

    const submitOrder =
        useCallback(async () => {
            if (!selectedAddress) {
                showAlert({
                    type: "error",
                    message: "Please select a delivery address."
                });
                return;
            }

            if (orderItems.length === 0) {
                showAlert({
                    type: "error",
                    message: "Please select at least one product."
                });
                return;
            }

            if (pricing.productTotal < scheme!.minAmount) {
                showAlert({
                    type: "error",
                    message: `Minimum order amount for ${scheme!.name} is ₹${scheme!.minAmount}.`
                });
                return;
            }

            if (
                scheme!.maxAmount > 0 &&
                pricing.productTotal > scheme!.maxAmount
            ) {
                showAlert({
                    type: "error",
                    message: `Maximum order amount for ${scheme!.name} is ₹${scheme!.maxAmount}.`
                });
                return;
            }

            setLoading(true);
            try {

                const response =
                    await createBulkOrder({
                        schemeId: scheme!.id,
                        address: selectedAddress,
                        items: orderItems.map(item => ({
                            productId: item.productId,
                            quantity: item.quantity,
                        })),
                    });
                clearAll();
                navigate(
                    `/bulk-order/success/${response.orderId}`
                );

            } catch (e) {
                console.error(e);
                showAlert({
                    type: "error",
                    message: "Unable to submit bulk order. Please try again."
                });
            } finally {
                setLoading(false);
            }

        }, [
            selectedAddress,
            orderItems,
            scheme!.id,
            navigate,
            clearAll,
        ]);

    return {
        loading,
        submitOrder,
    };
}