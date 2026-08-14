import { useCallback } from "react";
import BulkStepLayout from "./BulkStepLayout";
import BulkSearch from "./BulkSearch";
import BulkProductTable from "./BulkProductTable";
import { bulkOrderStore } from "../../store/bulkOrder.store";
import { useHomeProducts } from "../../store/homeProduct.store";
import { createBulkOrderItem } from "../../utils/bulkPricing";

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
    const handleQuantityChange = useCallback(
        (productId: string, quantity: number) => {
            const existing = items.find(
                (x) => x.productId === productId
            );

            if (existing) {
                updateQuantity(productId, quantity);
                return;
            }

            const product = products.find(
                (p) => p.id === productId
            );

            if (!product || quantity <= 0 || !scheme) {
                return;
            }

            const item = createBulkOrderItem(
                product,
                scheme,
                1
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

    const canContinue = items.length > 0;

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

                <BulkSearch
                    value={search}
                    onChange={setSearch}
                />

                <BulkProductTable
                    products={products}
                    search={search}
                    scheme={scheme}
                    items={items}
                    onQuantityChange={handleQuantityChange}
                />
            </div>
        </BulkStepLayout>
    );
}