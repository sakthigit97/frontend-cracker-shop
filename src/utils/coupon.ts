export function calculateCouponDiscount({
    amountBeforeDiscount,
    couponType,
    couponValue,
}: {
    amountBeforeDiscount: number;
    couponType?: string | null;
    couponValue?: number | null;
}) {
    if (!couponType || !couponValue)
        return 0;

    if (couponType === "PERCENTAGE") {
        return Math.min(
            Math.round(
                amountBeforeDiscount *
                couponValue /
                100
            ),
            amountBeforeDiscount
        );
    }

    return Math.min(
        couponValue,
        amountBeforeDiscount
    );
}