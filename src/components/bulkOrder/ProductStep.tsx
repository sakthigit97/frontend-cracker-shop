import { useCallback } from "react";
import BulkStepLayout from "./BulkStepLayout";
import BulkSearch from "./BulkSearch";
import BulkProductTable from "./BulkProductTable";
import { bulkOrderStore } from "../../store/bulkOrder.store";
import { useHomeProducts } from "../../store/homeProduct.store";
import { getSchemePrice } from "../../utils/bulkPricing";

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

            if (!product || quantity <= 0) {
                return;
            }

            const unitPrice = getSchemePrice(
                product,
                scheme!.id
            );

            addItem({
                productId: product.id,
                name: product.name,
                cartonQty: Number(product.cartonQty ?? 0),
                quantity: 1,
                unitPrice,
                total: Number(product.cartonQty || 0) * unitPrice,
            });

        },
        [items, products, scheme, addItem, updateQuantity]
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
            <div className="space-y-3 lg:space-y-4">

                <BulkSearch
                    value={search}
                    onChange={setSearch}
                />

                <div className="flex items-center justify-between border-b pb-4">
                    <button
                        type="button"
                        onClick={previousStep}
                        className="rounded-lg border border-gray-300 px-4 py-1.5 text-sm font-medium transition hover:bg-gray-100"                    >
                        Back
                    </button>

                    <button
                        type="button"
                        onClick={nextStep}
                        disabled={!canContinue}
                        className={["rounded-lg px-4 py-1.5 text-sm font-medium text-white transition",
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
            </div>
        </BulkStepLayout>
    );
}