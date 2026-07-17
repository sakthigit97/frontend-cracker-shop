export function isTamilNadu(state?: string) {
    return state?.toLowerCase().includes("tamil nadu");
}

export function calculateOrderAmounts({
    totalAmount,
    chargeableAmount,
    packagingPercent,
    gstPercent,
    state,
    config,
}: {
    totalAmount: number;
    chargeableAmount?: number;
    packagingPercent: number;
    gstPercent: number;
    state?: string;
    config?: any;
}) {

    const chargeableBaseAmount = chargeableAmount ?? totalAmount;
    const packagingCharge = Math.round(
        (chargeableBaseAmount * packagingPercent) / 100
    );
    const disableGstForTN = config?.disableGstForTN ?? false;
    const isTN = isTamilNadu(state);

    let gstAmount = 0;

    if (!(isTN && disableGstForTN)) {
        // Business Rule:
        // Display GST as 18%
        // Calculate GST as 9%
        const effectiveGstPercent = gstPercent / 2;
        gstAmount = Math.round(
            (chargeableBaseAmount * effectiveGstPercent) / 100
        );
    }

    const grandTotal = totalAmount + packagingCharge + gstAmount;
    return {
        packagingCharge,
        gstAmount,
        grandTotal,
    };
}