import {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from "react";
import { Loader2 } from "lucide-react";

import BulkStepLayout from "./BulkStepLayout";
import BulkPricingCard from "./BulkPricingCard";
import BulkReviewSummary from "./BulkReviewSummary";

import { bulkOrderStore } from "../../store/bulkOrder.store";
import { useBulkOrderPricing } from "../../hooks/useBulkOrderPricing";
import { validateSchemeAmount } from "../../utils/bulkPricing";
import { useAlert } from "../../store/alert.store";
import { useBulkOrderSubmit } from "../../hooks/useBulkOrderSubmit";
import { useConfigStore } from "../../store/config.store";

export default function ReviewStep() {
    const {
        previousStep,
        scheme,
        address: selectedAddress,
        items,
    } = bulkOrderStore();

    const { showAlert } = useAlert();

    const {
        refreshConfig,
    } = useConfigStore();

    const [configRefreshing, setConfigRefreshing] =
        useState(true);

    useEffect(() => {
        let mounted = true;

        const loadLatestConfig = async () => {
            setConfigRefreshing(true);

            try {
                await refreshConfig();
            } catch (error) {
                console.error(
                    "Failed to refresh bulk order config:",
                    error
                );
            } finally {
                if (mounted) {
                    setConfigRefreshing(false);
                }
            }
        };

        loadLatestConfig();

        return () => {
            mounted = false;
        };
    }, [refreshConfig]);

    const {
        pricing,
        orderItems,
        pricingReady,
    } = useBulkOrderPricing({
        state: selectedAddress?.state ?? "",
    });

    const {
        loading,
        submitOrder,
    } = useBulkOrderSubmit();

    const schemeValidation = useMemo(() => {
        return validateSchemeAmount(
            scheme,
            pricing.grandTotal
        );
    }, [
        scheme,
        pricing.grandTotal,
    ]);

    const hasItems =
        items.length > 0;

    const hasAddress =
        !!selectedAddress;

    const hasValidPincode =
        !!selectedAddress?.pincode &&
        selectedAddress.pincode.length === 6;

    const canSubmit =
        !configRefreshing &&
        pricingReady &&
        !loading &&
        hasItems &&
        hasAddress &&
        hasValidPincode &&
        schemeValidation.valid;

    const handleSubmit = useCallback(() => {
        if (loading) {
            return;
        }

        if (configRefreshing || !pricingReady) {
            showAlert({
                type: "error",
                message:
                    "Pricing configuration is still loading. Please wait a moment.",
            });

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

        if (!hasItems) {
            showAlert({
                type: "error",
                message:
                    "Please select at least one product.",
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

        if (
            !selectedAddress.pincode ||
            selectedAddress.pincode.length !== 6
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

        if (!schemeValidation.valid) {
            showAlert({
                type: "error",
                message:
                    schemeValidation.message ??
                    "Bulk order amount is outside the allowed range.",
            });

            return;
        }

        submitOrder();
    }, [
        loading,
        configRefreshing,
        pricingReady,
        scheme,
        hasItems,
        selectedAddress,
        schemeValidation,
        showAlert,
        submitOrder,
    ]);

    if (!selectedAddress) {
        return null;
    }

    if (
        configRefreshing ||
        !pricingReady
    ) {
        return (
            <BulkStepLayout
                title="Review Order"
                description="Preparing your order summary..."
                previousLabel="Back"
                nextLabel="Loading..."
                previousDisabled={true}
                nextDisabled={true}
                onPrevious={previousStep}
                onNext={() => undefined}
            >
                <div className="flex min-h-[320px] items-center justify-center px-4">
                    <div className="flex max-w-sm flex-col items-center text-center">
                        <Loader2
                            size={34}
                            className="animate-spin text-primary"
                        />

                        <p className="mt-4 text-base font-semibold text-gray-900">
                            Preparing your order summary
                        </p>

                        <p className="mt-1 text-sm leading-6 text-gray-500">
                            Loading the latest pricing and tax configuration...
                        </p>
                    </div>
                </div>
            </BulkStepLayout>
        );
    }

    const hasPackaging =  pricing.packagingCharge > 0;
    const hasGst = pricing.gstAmount > 0;
    const includedCharges: string[] = [];

    if (hasGst) {
        includedCharges.push("GST");
    }

    if (hasPackaging) {
        includedCharges.push(
            "Packaging Charges"
        );
    }

    const chargesDescription =
        includedCharges.length === 0
            ? "Final payable amount."
            : includedCharges.length === 1
                ? `${includedCharges[0]} is included in the final total.`
                : `${includedCharges.join(
                    " and "
                )} are included in the final total.`;

    return (
        <BulkStepLayout
            title="Review Order"
            description="Verify your delivery address, selected products and pricing before placing your order."
            previousLabel="Back"
            nextLabel={
                loading
                    ? "Placing Order..."
                    : "Place Bulk Order"
            }
            previousDisabled={loading}
            nextDisabled={!canSubmit}
            onPrevious={previousStep}
            onNext={handleSubmit}
        >
            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
                {/* Left */}
                <div className="min-w-0">
                    <BulkReviewSummary
                        address={selectedAddress}
                        items={orderItems}
                    />

                    {/* Below products */}
                    <div className="mt-6 rounded-xl border border-green-200 bg-green-50 p-4">
                        <h4 className="font-semibold text-green-800">
                            Before placing your order
                        </h4>

                        <ul className="mt-3 space-y-2 text-sm text-green-700">
                            <li>• Carton contents, GST, and prices may vary at the time of dispatch. Any difference in the final amount will be adjusted accordingly, and the balance will be collected from or refunded to the customer.</li>
                            <li>
                                • Product prices are net bulk prices.
                            </li>
                            <li>
                                • {chargesDescription}
                            </li>
                            
                            <li>
                                • Transportation charges are not included in the order total and must be paid by the customer.
                            </li>
                            <li>
                                • Our sales team will contact you after receiving your order.
                            </li>
                            <li>
                                • Your order will be processed after confirmation.
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Right */}
                <div className="min-w-0 xl:sticky xl:top-24 xl:h-fit">
                    <BulkPricingCard pricing={pricing} />
                </div>
            </div>
        </BulkStepLayout>
    );
}