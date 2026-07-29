import type {
    BulkOrderPricing,
    BulkOrderProduct,
    BulkScheme,
} from "../types/bulkOrder";

export interface BulkPricingInput {
    items: BulkOrderProduct[];
    scheme: BulkScheme | null;
    packagingPercent?: number;
    gstPercent?: number;
}

export interface BulkValidationResult {
    valid: boolean;
    message?: string;
}

export function calculateBulkProductTotal(
    items: BulkOrderProduct[]
): number {
    return items.reduce(
        (sum, item) => sum + Number(item.total || 0),
        0
    );
}

export function calculateBulkPricing({
    items,
    packagingPercent = 3,
    gstPercent = 18,
}: BulkPricingInput): BulkOrderPricing {

    const productTotal = calculateBulkProductTotal(items);

    const packagingCharge = Math.round(
        (productTotal * packagingPercent) / 100
    );

    const taxableAmount =
        productTotal + packagingCharge;

    const gstAmount = Math.round(
        (taxableAmount * gstPercent) / 100
    );

    const grandTotal =
        productTotal +
        packagingCharge +
        gstAmount;

    return {
        productTotal,
        packagingPercent,
        packagingCharge,
        gstPercent,
        gstAmount,
        grandTotal,
    };
}

export function validateSchemeAmount(
    scheme: BulkScheme | null,
    total: number
): BulkValidationResult {

    if (!scheme) {
        return {
            valid: false,
            message: "Please select a bulk scheme.",
        };
    }

    if (total < scheme.minAmount) {
        return {
            valid: false,
            message: `Minimum order amount is ₹${scheme.minAmount.toLocaleString(
                "en-IN"
            )}.`,
        };
    }

    if (
        scheme.maxAmount &&
        total > scheme.maxAmount
    ) {
        return {
            valid: false,
            message: `Maximum order amount is ₹${scheme.maxAmount.toLocaleString(
                "en-IN"
            )}.`,
        };
    }

    return {
        valid: true,
    };
}

export function getSchemePrice(
    product: any,
    schemeId: string
): number {

    switch (schemeId) {

        case "SCHEME1":
            return Number(product.scheme1Price || 0);

        case "SCHEME2":
            return Number(product.scheme2Price || 0);

        case "SCHEME3":
            return Number(product.scheme3Price || 0);

        case "SCHEME4":
            return Number(product.scheme4Price || 0);

        default:
            return 0;
    }

}

export function createBulkOrderItem(
    product: any,
    schemeId: string,
    quantity: number
): BulkOrderProduct {

    const unitPrice = getSchemePrice(
        product,
        schemeId
    );

    return {

        productId: product.id,

        name: product.name,

        image: product.image,

        brand: product.brandName,

        categoryId: product.categoryId,

        bulkQty: Number(product.bulkQty || 0),

        quantity,

        unitPrice,

        total: quantity * unitPrice,

    };
}

export function updateBulkOrderItem(
    item: BulkOrderProduct,
    quantity: number
): BulkOrderProduct {

    return {

        ...item,

        quantity,

        total: quantity * item.unitPrice,

    };
}