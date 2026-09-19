const DEFAULT_SPARKLER_CATEGORY_ID =
    "cat-91eac5b9-27b8-4bd2-be81-e4ef8702fc63";

export function getBulkProductCounts(
    products: any[],
    sparklerCategoryId?: string
) {
    const sparklerCategory =
        sparklerCategoryId ||
        DEFAULT_SPARKLER_CATEGORY_ID;

    const totalCount = products.reduce(
        (total, product) =>
            total + Number(product.quantity ?? 0),
        0
    );

    const sparklerCount = products.reduce(
        (total, product) => {
            if (
                product.categoryId ===
                sparklerCategory
            ) {
                return (
                    total +
                    Number(product.quantity ?? 0)
                );
            }

            return total;
        },
        0
    );

    const otherCount =
        totalCount - sparklerCount;

    return {
        totalCount,
        sparklerCount,
        otherCount,
    };
}