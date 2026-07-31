import BulkStepLayout from "./BulkStepLayout";
import BulkPricingCard from "./BulkPricingCard";
import BulkReviewSummary from "./BulkReviewSummary";
import { bulkOrderStore } from "../../store/bulkOrder.store";
import { useBulkOrderPricing } from "../../hooks/useBulkOrderPricing";
import { useBulkOrderSubmit } from "../../hooks/useBulkOrderSubmit";

export default function ReviewStep() {

    const {
        previousStep,
    } = bulkOrderStore();

    const {
        pricing,
        orderItems,
    } = useBulkOrderPricing();
    const { address: selectedAddress } = bulkOrderStore();

    const {
        loading,
        error,
        submitOrder,
    } = useBulkOrderSubmit();

    if (!selectedAddress) {
        return null;
    }

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
            nextDisabled={loading}
            onPrevious={previousStep}
            onNext={submitOrder}
        >
            <div className="grid gap-8 xl:grid-cols-[2fr_420px]">

                <BulkReviewSummary
                    address={selectedAddress}
                    items={orderItems}
                />

                <div className="space-y-5 xl:sticky xl:top-24 xl:h-fit">
                    <BulkPricingCard
                        pricing={pricing}
                        packagingPercent={pricing.packagingPercent}
                        gstPercent={pricing.gstPercent}
                    />

                    {error && (
                        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                            {error}
                        </div>
                    )}

                    <div className="rounded-xl border border-green-200 bg-green-50 p-4">

                        <h4 className="font-semibold text-green-800">
                            Before placing your order
                        </h4>

                        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-green-700">

                            <li>
                                Product prices are net bulk prices.
                            </li>

                            <li>
                                Packaging charge (3%) and GST (18%) are included in the final total.
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