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