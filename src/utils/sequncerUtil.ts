export function sortProductsBySequence<T extends { sequenceNumber?: number }>(
    products: T[]
) {
    return [...products].sort((a, b) => {
        const aSeq = a.sequenceNumber ?? Number.MAX_SAFE_INTEGER;
        const bSeq = b.sequenceNumber ?? Number.MAX_SAFE_INTEGER;
        return aSeq - bSeq;
    });
}

export function sortCategoryBySequence<T extends { sortOrder?: number }>(
    categories: T[]
) {
    return [...categories].sort((a, b) => {
        const aSeq = a.sortOrder ?? Number.MAX_SAFE_INTEGER;
        const bSeq = b.sortOrder ?? Number.MAX_SAFE_INTEGER;
        return aSeq - bSeq;
    });
}


export function sortProductsByCategoryAndSequence<
    T extends {
        categoryId?: string;
        sequenceNumber?: number;
    }
>(
    products: T[],
    categories: {
        id: string;
        sortOrder?: number;
    }[]
): T[] {
    const categoryMap = new Map(
        categories.map((c) => [
            c.id,
            c.sortOrder ?? Number.MAX_SAFE_INTEGER,
        ])
    );

    return [...products].sort((a, b) => {
        const categoryDiff =
            (categoryMap.get(a.categoryId ?? "") ??
                Number.MAX_SAFE_INTEGER) -
            (categoryMap.get(b.categoryId ?? "") ??
                Number.MAX_SAFE_INTEGER);

        if (categoryDiff !== 0) {
            return categoryDiff;
        }

        return (a.sequenceNumber ?? 0) - (b.sequenceNumber ?? 0);
    });
}