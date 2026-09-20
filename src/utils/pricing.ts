export function isTamilNadu(state?: string) {
    const normalizedState = state?.toLowerCase() ?? "";

    return (
        normalizedState.includes("tamil nadu") ||
        normalizedState.includes("pondicherry") ||
        normalizedState.includes("puducherry")
    );
}

export interface OrderAmountCalculationInput {
    nonComboProductTotal: number;
    comboPackageTotal: number;
    couponDiscount: number;
    additionalDiscount?: number;
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
    appliedAdditionalDiscount: number;
    gstAmount: number;
    grandTotal: number;
}

export function calculateOrderAmounts({
    nonComboProductTotal,
    comboPackageTotal,
    couponDiscount,
    packagingPercent,
    gstPercent,
    additionalDiscount = 0,
    state,
    config,
}: OrderAmountCalculationInput): OrderAmountCalculation {



    const productTotal =
        nonComboProductTotal +
        comboPackageTotal;

    const packagingCharge = Math.round(
        (nonComboProductTotal * packagingPercent) / 100
    );

    const nonComboSubtotal =
        nonComboProductTotal +
        packagingCharge;

    const grossTotal =
        nonComboSubtotal +
        comboPackageTotal;

    const appliedCouponDiscount = Math.min(
        Math.max(couponDiscount, 0),
        grossTotal
    );

    const appliedAdditionalDiscount = Math.min(
        Math.max(additionalDiscount, 0),
        productTotal
    );

    const discountedGrossTotal =
        grossTotal -
        appliedCouponDiscount -
        appliedAdditionalDiscount;

    const disableGstForTN =
        config?.disableGstForTN ?? false;

    const gstDenominator =
        Number(config?.gstDenominator ?? 2);

    const isTN = isTamilNadu(state);
    let gstAmount = 0;

    if (!(isTN && disableGstForTN)) {
        const effectiveGstPercent = gstPercent / gstDenominator;
        gstAmount = Math.round(
            (discountedGrossTotal * effectiveGstPercent) / 100
        );
    }

    const grandTotal =
        discountedGrossTotal +
        gstAmount;

    return {
        packagingCharge,
        nonComboSubtotal,
        grossTotal,
        appliedCouponDiscount,
        appliedAdditionalDiscount,
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