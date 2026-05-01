export function isTamilNadu(state?: string) {
    return state?.toLowerCase().includes("tamil nadu");
}

export function calculateOrderAmounts({
    totalAmount,
    packagingPercent,
    gstPercent,
    state,
    config,
}: {
    totalAmount: number;
    packagingPercent: number;
    gstPercent: number;
    state?: string;
    config?: any;
}) {
    const packagingCharge = Math.round(
        (totalAmount * packagingPercent) / 100
    );

    const disableGstForTN = config?.disableGstForTN ?? false;
    const isTN = isTamilNadu(state);

    let gstAmount = 0;
    if (!(isTN && disableGstForTN)) {
        gstAmount = Math.round((totalAmount * gstPercent) / 100);
    }

    const grandTotal = totalAmount + packagingCharge + gstAmount;
    return {
        packagingCharge,
        gstAmount,
        grandTotal,
    };
}