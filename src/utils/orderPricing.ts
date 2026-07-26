export interface OrderPricingItem {
    price: number;
    quantity: number;
    isComboPackage?: boolean;
}

export interface OrderPricingBreakdown {
    productSubtotal: number;
    nonComboProductTotal: number;
    comboPackageTotal: number;
    hasNonComboProducts: boolean;
    hasComboPackages: boolean;
}

export function calculateOrderPricingBreakdown(
    items: OrderPricingItem[]
): OrderPricingBreakdown {

    let nonComboProductTotal = 0;
    let comboPackageTotal = 0;

    for (const item of items) {
        const lineTotal = item.price * item.quantity;

        if (item.isComboPackage) {
            comboPackageTotal += lineTotal;
        } else {
            nonComboProductTotal += lineTotal;
        }
    }

    return {
        productSubtotal: nonComboProductTotal + comboPackageTotal,
        nonComboProductTotal,
        comboPackageTotal,
        hasNonComboProducts: nonComboProductTotal > 0,
        hasComboPackages: comboPackageTotal > 0,
    };
}