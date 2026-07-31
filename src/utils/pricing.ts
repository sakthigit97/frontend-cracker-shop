export function isTamilNadu(state?: string) {
    return state?.toLowerCase().includes("tamil nadu");
}

export interface OrderAmountCalculationInput {
    nonComboProductTotal: number;
    comboPackageTotal: number;
    couponDiscount: number;
    packagingPercent: number;
    gstPercent: number;
    state?: string;
    config?: any;
}

export interface OrderAmountCalculation {
    packagingCharge: number;
    nonComboSubtotal: number;
    grossTotal: number;
    appliedCouponDiscount: number;
    discountedGrossTotal: number;
    gstAmount: number;
    grandTotal: number;
}

export function calculateOrderAmounts({
    nonComboProductTotal,
    comboPackageTotal,
    couponDiscount,
    packagingPercent,
    gstPercent,
    state,
    config,
}: OrderAmountCalculationInput): OrderAmountCalculation {

    const packagingCharge = Math.round(
        (nonComboProductTotal * packagingPercent) / 100
    );

    const nonComboSubtotal = nonComboProductTotal + packagingCharge;
    const grossTotal = nonComboSubtotal + comboPackageTotal;
    const appliedCouponDiscount = Math.min(
        Math.max(couponDiscount, 0),
        grossTotal
    );

    const discountedGrossTotal = grossTotal - appliedCouponDiscount;
    const disableGstForTN = config?.disableGstForTN ?? false;
    const isTN = isTamilNadu(state);
    let gstAmount = 0;
    if (!(isTN && disableGstForTN)) {
        const effectiveGstPercent = gstPercent / 2;
        gstAmount = Math.round(
            (discountedGrossTotal * effectiveGstPercent) / 100
        );
    }

    const grandTotal = discountedGrossTotal + gstAmount;
    return {
        packagingCharge,
        nonComboSubtotal,
        grossTotal,
        appliedCouponDiscount,
        discountedGrossTotal,
        gstAmount,
        grandTotal,
    };
}

export function formatCurrency(amount?: number | null) {
    return new Intl.NumberFormat("en-IN", {
        maximumFractionDigits: 0,
    }).format(amount ?? 0);
}