import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { bulkOrderStore } from "../store/bulkOrder.store";
import { useBulkOrderPricing } from "./useBulkOrderPricing";
import { useBulkAddresses } from "./useBulkAddresses";
import { createBulkOrder } from "../services/bulkOrder.api";

export function useBulkOrderSubmit() {

    const navigate = useNavigate();
    const {
        clearAll,
        scheme,
    } = bulkOrderStore();

    const {
        orderItems,
    } = useBulkOrderPricing();

    const {
        selectedAddress,
    } = useBulkAddresses();

    const [loading, setLoading] =
        useState(false);

    const [error, setError] =
        useState("");

    const submitOrder =
        useCallback(async () => {

            if (!selectedAddress) {

                setError(
                    "Please select a delivery address."
                );

                return;

            }

            if (orderItems.length === 0) {

                setError(
                    "Please select at least one product."
                );

                return;

            }

            setLoading(true);

            setError("");

            try {

                const response =
                    await createBulkOrder({
                        schemeId: scheme!.id,
                        address: selectedAddress,
                        items: orderItems,
                    });

                clearAll();
                navigate(
                    `/bulk-order/success/${response.bulkOrderId}`
                );

            } catch (e) {

                console.error(e);

                setError(
                    "Unable to submit bulk order. Please try again."
                );

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

        error,

        submitOrder,

    };

}