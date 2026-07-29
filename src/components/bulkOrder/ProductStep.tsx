import { useCallback, useMemo } from "react";

import BulkStepLayout from "./BulkStepLayout";
import BulkSearch from "./BulkSearch";
import BulkProductTable from "./BulkProductTable";
import BulkSummaryBar from "./BulkSummaryBar";
import { bulkOrderStore } from "../../store/bulkOrder.store";
import { useHomeProducts } from "../../store/homeProduct.store";
import { calculateBulkPricing } from "../../utils/bulkPricing";

export default function ProductStep() {
    const {
        scheme,
        items,
        search,
        setSearch,
        updateQuantity,
        previousStep,
        nextStep,
    } = bulkOrderStore();

    const { products = [] } = useHomeProducts();
    const pricing = useMemo(
        () =>
            calculateBulkPricing({
                items,
                scheme,
            }),
        [items, scheme]
    );

    const totalBoxes = useMemo(
        () =>
            items.reduce(
                (sum: number, item) => sum + item.quantity,
                0
            ),
        [items]
    );

    const handleQuantityChange = useCallback(
        (productId: string, quantity: number) => {
            updateQuantity(productId, quantity);
        },
        [updateQuantity]
    );

    const canContinue = items.length > 0;

    if (!scheme) {
        return null;
    }

    return (
        <BulkStepLayout
            title="Select Products"
            description="Choose products and quantities for your bulk order."
            previousLabel="Back"
            nextLabel="Continue"
            previousDisabled={false}
            nextDisabled={!canContinue}
            onPrevious={previousStep}
            onNext={nextStep}
        >
            <div className="space-y-6">

                <BulkSearch
                    value={search}
                    onChange={setSearch}
                />

                <div className="flex items-center justify-between border-b pb-4">
                    <button
                        type="button"
                        onClick={previousStep}
                        className="rounded-lg border border-gray-300 px-5 py-2 font-medium transition hover:bg-gray-100"
                    >
                        Back
                    </button>

                    <button
                        type="button"
                        onClick={nextStep}
                        disabled={!canContinue}
                        className={[
                            "rounded-lg px-5 py-2 font-medium text-white transition",
                            canContinue
                                ? "bg-primary hover:opacity-90"
                                : "cursor-not-allowed bg-gray-300",
                        ].join(" ")}
                    >
                        Continue
                    </button>
                </div>

                <BulkProductTable
                    products={products}
                    search={search}
                    schemeId={scheme.id}
                    items={items}
                    onQuantityChange={handleQuantityChange}
                />

                <BulkSummaryBar
                    selectedProducts={items.length}
                    totalBoxes={totalBoxes}
                    pricing={pricing}
                    disabled={!canContinue}
                    onContinue={nextStep}
                />

            </div>
        </BulkStepLayout>
    );
}