import { BULK_ORDER_STEPS } from "../constants/bulkOrderSteps";
export type BulkOrderStep = (typeof BULK_ORDER_STEPS)[keyof typeof BULK_ORDER_STEPS];

export type BulkSchemeId =
    | "SCHEME1"
    | "SCHEME2"
    | "SCHEME3"
    | "SCHEME4";

export interface BulkScheme {
    id: BulkSchemeId;
    name: string;
    description: string;
    minAmount: number;
    maxAmount: number;
    requireAdminCode: boolean;
}

export interface BulkOrderResponse {
    bulkOrderId: string;
    status: string;
    createdAt: string;
}

export interface BulkOrderDetailsResponse {
    orderId: string;
    createdAt: string;
    status: string;

    schemeName: string;

    address: BulkOrderAddress;

    products: BulkOrderProduct[];

    pricing: BulkOrderPricing;

    remarks?: string;
}

export interface BulkOrderProduct {
    productId: string;
    name: string;
    image?: string;
    brand?: string;
    categoryId?: string;
    bulkQty: number;
    quantity: number;
    unitPrice: number;
    total: number;
}

export interface BulkOrderAddress {
    id: string;
    fullName: string;
    mobile: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    pincode: string;
}

export interface BulkOrderPricing {

    productTotal: number;

    packagingPercent: number;

    packagingCharge: number;

    gstPercent: number;

    gstAmount: number;

    grandTotal: number;

}

export interface BulkOrderState {

    step: BulkOrderStep;

    scheme: BulkScheme | null;

    adminCode: string;

    adminCodeVerified: boolean;

    items: BulkOrderProduct[];

    address: BulkOrderAddress | null;

    pricing: BulkOrderPricing;

    loading: boolean;

    search: string;

}

export interface ValidateBulkCodeRequest {

    code: string;

    schemeId: BulkSchemeId;

}

export interface CreateBulkOrderRequest {

    schemeId: BulkSchemeId;

    adminCode?: string;

    address: BulkOrderAddress;

    items: BulkOrderProduct[];

}

export interface BulkOrderResponse {

    bulkOrderId: string;

    status: string;

    createdAt: string;

}