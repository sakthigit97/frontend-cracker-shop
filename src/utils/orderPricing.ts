export interface OrderPricingProduct {
    price: number;
    quantity: number;
    isComboPackage?: boolean;
}
export interface OrderPricingBreakdown {
    subtotal: number;
    normalAmount: number;
    comboAmount: number;
    eligibleChargeAmount: number;
    hasNormalItems: boolean;
    hasComboItems: boolean;
}

export function calculateOrderPricingBreakdown(
    products: OrderPricingProduct[]
): OrderPricingBreakdown {

    let subtotal = 0;
    let normalAmount = 0;
    let comboAmount = 0;

    for (const product of products) {
        const lineTotal = product.price * product.quantity;
        subtotal += lineTotal;
        if (product.isComboPackage) {
            comboAmount += lineTotal;
        } else {
            normalAmount += lineTotal;
        }
    }

    return {
        subtotal,
        normalAmount,
        comboAmount,
        eligibleChargeAmount: normalAmount,
        hasNormalItems: normalAmount > 0,
        hasComboItems: comboAmount > 0,
    };
}