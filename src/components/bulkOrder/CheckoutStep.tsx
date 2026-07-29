import { useCallback } from "react";

import BulkStepLayout from "./BulkStepLayout";
import AddressSelector from "./AddressSelector";
import BulkPricingCard from "./BulkPricingCard";
import { bulkOrderStore } from "../../store/bulkOrder.store";
import { useBulkOrderPricing } from "../../hooks/useBulkOrderPricing";
import { useBulkAddresses } from "../../hooks/useBulkAddresses";

export default function CheckoutStep() {
    const {
        previousStep,
        nextStep,
    } = bulkOrderStore();

    const {
        pricing,
    } = useBulkOrderPricing();

    const {
        addresses,
        selectedAddress,
        loading,
        selectAddress,
        addNewAddress,
    } = useBulkAddresses();

    const canContinue =
        !!selectedAddress;

    const handleContinue =
        useCallback(() => {

            if (!selectedAddress) {
                return;
            }

            nextStep();

        }, [
            nextStep,
            selectedAddress,
        ]);

    return (

        <BulkStepLayout
            title="Checkout"
            description="Select the delivery address and review your pricing."
            previousLabel="Back"
            nextLabel="Review Order"
            previousDisabled={false}
            nextDisabled={!canContinue}
            onPrevious={previousStep}
            onNext={handleContinue}
        >

            <div className="grid gap-8 xl:grid-cols-[2fr_420px]">

                <AddressSelector
                    addresses={addresses}
                    selectedAddressId={
                        selectedAddress?.id
                    }
                    loading={loading}
                    onSelect={selectAddress}
                    onAddNew={addNewAddress}
                />

                <div className="xl:sticky xl:top-24 xl:h-fit">
                    <BulkPricingCard
                        pricing={pricing}
                    />
                </div>
            </div>
        </BulkStepLayout>

    );

}