export function sortProductsBySequence<
    T extends {
        sequenceNumber?: number;
        isRetailOnly?: boolean;
    }
>(
    products: T[],
    isRetail = false
): T[] {
    const filteredProducts = isRetail
        ? products.filter(
            (product) =>
                product.isRetailOnly === true
        )
        : products;

    return [...filteredProducts].sort(
        (a, b) => {
            const aSeq =
                a.sequenceNumber ??
                Number.MAX_SAFE_INTEGER;

            const bSeq =
                b.sequenceNumber ??
                Number.MAX_SAFE_INTEGER;

            return aSeq - bSeq;
        }
    );
}


export function sortCategoryBySequence<
    T extends {
        sortOrder?: number;
    }
>(
    categories: T[]
) {
    return [...categories].sort(
        (a, b) => {
            const aSeq =
                a.sortOrder ??
                Number.MAX_SAFE_INTEGER;

            const bSeq =
                b.sortOrder ??
                Number.MAX_SAFE_INTEGER;

            return aSeq - bSeq;
        }
    );
}


export function sortProductsByCategoryAndSequence<
    T extends {
        categoryId?: string;
        sequenceNumber?: number;
        isRetailOnly?: boolean;
    }
>(
    products: T[],
    categories: {
        id: string;
        sortOrder?: number;
    }[],
    isRetail = false
): T[] {

    const categoryMap = new Map(
        categories.map((c) => [
            c.id,
            c.sortOrder ??
            Number.MAX_SAFE_INTEGER,
        ])
    );

    const filteredProducts = isRetail
        ? products.filter(
            (product) =>
                product.isRetailOnly === true
        )
        : products;

    return [...filteredProducts].sort(
        (a, b) => {

            const categoryDiff =
                (
                    categoryMap.get(
                        a.categoryId ?? ""
                    ) ??
                    Number.MAX_SAFE_INTEGER
                ) -
                (
                    categoryMap.get(
                        b.categoryId ?? ""
                    ) ??
                    Number.MAX_SAFE_INTEGER
                );

            if (categoryDiff !== 0) {
                return categoryDiff;
            }

            return (
                (a.sequenceNumber ?? 0) -
                (b.sequenceNumber ?? 0)
            );
        }
    );
}