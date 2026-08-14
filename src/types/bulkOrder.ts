import { BULK_ORDER_STEPS } from "../constants/bulkOrderSteps";

export type BulkOrderStep = (typeof BULK_ORDER_STEPS)[keyof typeof BULK_ORDER_STEPS];

export type BulkSchemeId = string;

export interface BulkScheme {
    schemeId: BulkSchemeId;
    schemeName: string;
    minAmount: number;
    maxAmount: number;
    isAdminApprovalRequired: boolean;
    bulkPriceAdjustmentPercent?: number;
    bulkPriceAdjustmentType?: "PLUS" | "MINUS";
    isActive: boolean;
    sortOrder: number;
}

export interface BulkOrderDetailsResponse {
    orderId: string;
    createdAt: string;
    status: string;
    schemeName: string;
    schemeId: BulkSchemeId;
    address: BulkOrderAddress;
    items: BulkOrderProduct[];
    pricing: BulkOrderPricing;
    remarks?: string;
    statusHistory?: any;
}

export interface BulkOrderAdjustRequestItem {
    productId: string;
    quantity: number;
    cartonQty?: number;
}

export interface BulkOrderAdjustResponse {
    orderId: string;
    items: BulkOrderProduct[];
    pricing: BulkOrderPricing;
    updatedAt: number;
}

export interface BulkOrderAdjustRequest {
    orderId: string;
    items: BulkOrderAdjustRequestItem[];
}

export interface BulkOrderProduct {
    productId: string;
    name: string;
    image?: string;
    brand?: string;
    categoryId?: string;
    bulkOrderBasePrice: number;
    cartonQty: number;
    unitPrice: number;
    schemePrice?: number;
    quantity: number;
    total: number;
}

export interface BulkOrderAddress {
    id?: string;
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
    items: CreateBulkOrderItem[];
}

export interface BulkOrderResponse {
    orderId: string;
    pricing: BulkOrderPricing;
}

export interface CreateBulkOrderItem {
    productId: string;
    quantity: number;
}

export interface BulkOrderAddProduct {
    productId: string;
    name: string;
    image?: string;
    brand?: string;
    categoryId?: string;
    bulkOrderBasePrice: number;
    cartonQty: number;
    unitPrice: number;
    schemePrice?: number;
}