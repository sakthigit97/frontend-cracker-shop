export function sortProductsBySequence<T extends { sequenceNumber?: number }>(
    products: T[]
) {
    return [...products].sort((a, b) => {
        const aSeq = a.sequenceNumber ?? Number.MAX_SAFE_INTEGER;
        const bSeq = b.sequenceNumber ?? Number.MAX_SAFE_INTEGER;

        return aSeq - bSeq;
    });
}