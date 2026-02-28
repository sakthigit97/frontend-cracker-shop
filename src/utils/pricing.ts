export function getDiscountPercent(
    price?: number,
    originalPrice?: number
) {
    if (!price || !originalPrice) return null;
    if (originalPrice <= price) return null;

    return Math.round(
        ((originalPrice - price) / originalPrice) * 100
    );
}
