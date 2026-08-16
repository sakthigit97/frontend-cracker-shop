import { useCallback, useEffect } from "react";
import BulkStepLayout from "./BulkStepLayout";
import BulkSearch from "./BulkSearch";
import BulkProductTable from "./BulkProductTable";
import { bulkOrderStore } from "../../store/bulkOrder.store";
import { useHomeProducts } from "../../store/homeProduct.store";
import { createBulkOrderItem } from "../../utils/bulkPricing";
import BulkOrderFloatingSummary from "./BulkOrderFloatingSummary";
import { useBulkOrderPricing } from "../../hooks/useBulkOrderPricing";
import { useProfileStore } from "../../store/profile.store";

export default function ProductStep() {
    const {
        scheme,
        items,
        search,
        setSearch,
        addItem,
        updateQuantity,
        previousStep,
        nextStep,
    } = bulkOrderStore();

    const { products = [] } = useHomeProducts();

    const {
        profile,
        loadProfile,
    } = useProfileStore();

    useEffect(() => {
        loadProfile();
    }, [loadProfile]);
    const customerState =
        profile?.state?.trim() ?? "";

    const { pricing } = useBulkOrderPricing({
        state: customerState,
    });

    const handleQuantityChange = useCallback(
        (
            productId: string,
            quantity: number
        ) => {
            const existing = items.find(
                (item) =>
                    item.productId === productId
            );

            if (existing) {
                updateQuantity(
                    productId,
                    quantity
                );
                return;
            }

            const product = products.find(
                (item) =>
                    item.id === productId
            );

            if (
                !product ||
                quantity <= 0 ||
                !scheme
            ) {
                return;
            }

            /*
             * Create new bulk item
             */
            const item =
                createBulkOrderItem(
                    product,
                    scheme,
                    quantity
                );

            addItem(item);
        },
        [
            items,
            products,
            scheme,
            addItem,
            updateQuantity,
        ]
    );

    const canContinue =
        items.length > 0;

    if (!scheme) {
        return null;
    }

    return (
        <BulkStepLayout
            title="Choose Products"
            description="Select products and set the required carton quantity."
            previousLabel="Back"
            nextLabel="Continue"
            previousDisabled={false}
            nextDisabled={!canContinue}
            onPrevious={previousStep}
            onNext={nextStep}
        >
            <div className="space-y-3 lg:space-y-4">

                {/* Search */}
                <BulkSearch
                    value={search}
                    onChange={setSearch}
                />

                {/* Products */}
                <BulkProductTable
                    products={products}
                    search={search}
                    scheme={scheme}
                    items={items}
                    onQuantityChange={
                        handleQuantityChange
                    }
                />

                <BulkOrderFloatingSummary
                    items={items}
                    pricing={{
                        cartonBoxCount: pricing.cartonBoxCount,
                        productsTotal: pricing.productTotal,

                        packagingCharge:
                            pricing.packagingCharge,

                        gstAmount:
                            pricing.gstAmount,

                        grandTotal:
                            pricing.grandTotal,

                        packagingPercent:
                            pricing.packagingPercent,

                        gstPercent:
                            pricing.gstPercent,
                    }}
                    onReview={nextStep}
                />
            </div>
        </BulkStepLayout>
    );
}