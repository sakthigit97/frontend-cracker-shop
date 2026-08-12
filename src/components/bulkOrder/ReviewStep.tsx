import { useCallback, useMemo } from "react";
import BulkStepLayout from "./BulkStepLayout";
import BulkPricingCard from "./BulkPricingCard";
import BulkReviewSummary from "./BulkReviewSummary";
import { bulkOrderStore } from "../../store/bulkOrder.store";
import { useBulkOrderPricing } from "../../hooks/useBulkOrderPricing";
import { useBulkOrderSubmit } from "../../hooks/useBulkOrderSubmit";
import { validateSchemeAmount } from "../../utils/bulkPricing";
import { useAlert } from "../../store/alert.store";

export default function ReviewStep() {
    const {
        previousStep,
        scheme,
        address: selectedAddress,
        items,
    } = bulkOrderStore();

    const { showAlert } = useAlert();

    const {
        pricing,
        orderItems,
    } = useBulkOrderPricing({
        state: selectedAddress?.state ?? "",
    });

    const {
        loading,
        submitOrder,
    } = useBulkOrderSubmit();

    const schemeValidation = useMemo(
        () =>
            validateSchemeAmount(
                scheme,
                pricing.productTotal
            ),
        [
            scheme,
            pricing.productTotal,
        ]
    );

    const hasItems =
        items.length > 0;

    const hasAddress =
        !!selectedAddress;

    const hasValidPincode =
        !!selectedAddress?.pincode &&
        selectedAddress.pincode.length === 6;

    const canSubmit =
        !loading &&
        hasItems &&
        hasAddress &&
        hasValidPincode &&
        schemeValidation.valid;

    const handleSubmit = useCallback(() => {
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

    const hasPackaging =
        pricing.packagingCharge > 0;

    const hasGst =
        pricing.gstAmount > 0;

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
            <div className="grid gap-8 xl:grid-cols-[2fr_420px]">
                <BulkReviewSummary
                    address={selectedAddress}
                    items={orderItems}
                />

                <div className="space-y-5 xl:sticky xl:top-24 xl:h-fit">
                    <BulkPricingCard
                        pricing={pricing}
                    />

                    <div className="rounded-xl border border-green-200 bg-green-50 p-4">
                        <h4 className="font-semibold text-green-800">
                            Before placing your order
                        </h4>

                        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-green-700">
                            <li>
                                Product prices are net bulk prices.
                            </li>

                            <li>
                                {chargesDescription}
                            </li>

                            <li>
                                Our sales team will contact you after receiving your order.
                            </li>

                            <li>
                                Your order will be processed after confirmation.
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </BulkStepLayout>
    );
}