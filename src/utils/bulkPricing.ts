import type {
    BulkOrderPricing,
    BulkOrderProduct,
    BulkScheme,
} from "../types/bulkOrder";

import type { Product } from "../types/product";
import { isTamilNadu } from "./pricing";

export interface BulkPricingInput {
    items: BulkOrderProduct[];
    scheme: BulkScheme | null;
    packagingPercent?: number;
    gstPercent?: number;
    state?: string;
    config?: any;
}

export interface BulkValidationResult {
    valid: boolean;
    message?: string;
}


export function calculateBulkProductTotal(
    items?: BulkOrderProduct[]
): number {
    return (items ?? []).reduce(
        (sum, item) =>
            sum + Number(item.total || 0),
        0
    );
}

export function calculateBulkPricing({
    items,
    packagingPercent,
    gstPercent,
    state,
    config,
}: BulkPricingInput): BulkOrderPricing {
    const productTotal =
        calculateBulkProductTotal(items);
    const configuredPackagingPercent =
        Number(
            packagingPercent ??
            config?.packagingPercent ??
            0
        );

    const configuredGstPercent =
        Number(
            gstPercent ??
            config?.gstPercent ??
            0
        );

    const packagingCharge =
        Math.round(
            (productTotal *
                configuredPackagingPercent) /
            100
        );

    const taxableAmount =
        productTotal +
        packagingCharge;

    const disableGstForTN =
        config?.disableGstForTN === true;

    const isTN = isTamilNadu(state);

    const effectiveGstPercent =
        isTN && disableGstForTN
            ? 0
            : configuredGstPercent / 2;

    const gstAmount =
        effectiveGstPercent > 0
            ? Math.round(
                (taxableAmount *
                    effectiveGstPercent) /
                100
            )
            : 0;

    const grandTotal =
        productTotal +
        packagingCharge +
        gstAmount;

    return {
        productTotal,

        packagingPercent:
            configuredPackagingPercent,

        packagingCharge,

        gstPercent:
            effectiveGstPercent,

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
            message:
                "Please select a bulk scheme.",
        };
    }

    if (
        total <
        Number(scheme.minAmount ?? 0)
    ) {
        return {
            valid: false,
            message:
                `Minimum order amount is ₹${Number(
                    scheme.minAmount ?? 0
                ).toLocaleString("en-IN")}.`,
        };
    }

    if (
        Number(scheme.maxAmount ?? 0) > 0 &&
        total >
        Number(scheme.maxAmount)
    ) {
        return {
            valid: false,
            message:
                `Maximum order amount is ₹${Number(
                    scheme.maxAmount
                ).toLocaleString("en-IN")}.`,
        };
    }

    return {
        valid: true,
    };
}

export function calculateBulkUnitPrice(
    product: Product,
    scheme: BulkScheme
): number {
    const basePrice = Number(
        product.bulkOrderBasePrice ?? 0
    );

    if (basePrice <= 0) {
        return 0;
    }

    const adjustmentPercent =
        Number(
            scheme.bulkPriceAdjustmentPercent ??
            0
        );

    if (
        !adjustmentPercent ||
        adjustmentPercent <= 0
    ) {
        return basePrice;
    }

    const adjustmentAmount =
        (basePrice *
            adjustmentPercent) /
        100;

    if (
        scheme.bulkPriceAdjustmentType ===
        "MINUS"
    ) {
        return Math.max(
            0,
            Math.round(
                basePrice -
                adjustmentAmount
            )
        );
    }

    if (
        scheme.bulkPriceAdjustmentType ===
        "PLUS"
    ) {
        return Math.round(
            basePrice +
            adjustmentAmount
        );
    }

    return basePrice;
}

/**
 * Create a bulk-order item from
 * the selected product and scheme.
 */
export function createBulkOrderItem(
    product: Product,
    scheme: BulkScheme,
    quantity: number
): BulkOrderProduct {
    const cartonQty = Number(
        product.cartonQty ?? 0
    );

    if (cartonQty <= 0) {
        throw new Error(
            `${product.name} has an invalid carton quantity.`
        );
    }

    const bulkOrderBasePrice =
        Number(
            product.bulkOrderBasePrice ??
            0
        );

    if (bulkOrderBasePrice <= 0) {
        throw new Error(
            `${product.name} does not have a valid bulk order base price.`
        );
    }

    const unitPrice =
        calculateBulkUnitPrice(
            product,
            scheme
        );

    if (unitPrice <= 0) {
        throw new Error(
            `${product.name} has an invalid bulk order price.`
        );
    }

    return {
        productId: product.id,

        name: product.name,

        image: product.image,

        brand: product.brand,

        categoryId:
            product.categoryId,

        bulkOrderBasePrice,

        cartonQty,

        quantity,

        unitPrice,

        schemePrice:
            unitPrice,

        total:
            quantity *
            cartonQty *
            unitPrice,
    };
}

export function updateBulkOrderItem(
    item: BulkOrderProduct,
    quantity: number
): BulkOrderProduct {
    return {
        ...item,

        quantity,

        total:
            quantity *
            item.cartonQty *
            item.unitPrice,
    };
}