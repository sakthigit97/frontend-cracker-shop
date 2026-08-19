import { apiFetch } from "./api";

import type {
    BulkOrderAdjustRequestItem,
    BulkOrderAdjustResponse,
    BulkOrderDetailsResponse,
    BulkOrderResponse,
    BulkSchemeId,
    CreateBulkOrderRequest,
} from "../types/bulkOrder";

export interface ValidateAdminCodeRequest {
    schemeId: BulkSchemeId;
    code: string;
}

export interface ValidateAdminCodeResponse {
    valid: boolean;
    message?: string;
    schemeId?: string;
    success?: boolean;
}

export async function restoreBulkOrder(
    orderId: string
) {
    return apiFetch(
        "/bulk-orders/restore",
        {
            method: "POST",
            body: JSON.stringify({
                orderId,
            }),
        }
    );
}

export async function validateBulkAdminCode(
    payload: ValidateAdminCodeRequest
): Promise<ValidateAdminCodeResponse> {
    const response = await apiFetch(
        "/bulk-order/validate-code",
        {
            method: "POST",
            body: JSON.stringify(payload),
        }
    );
    return response.data;
}

export async function createBulkOrder(
    payload: CreateBulkOrderRequest
): Promise<BulkOrderResponse> {
    return apiFetch(
        "/bulk-order",
        {
            method: "POST",
            body: JSON.stringify(payload),
        }
    );
}

export async function adjustBulkOrder(
    orderId: string,
    items: BulkOrderAdjustRequestItem[]
): Promise<BulkOrderAdjustResponse> {
    return apiFetch(
        `/bulk-order/${orderId}/adjust`,
        {
            method: "PUT",
            body: JSON.stringify({
                items,
            }),
        }
    );
}

export async function getBulkOrder(
    bulkOrderId: string
): Promise<BulkOrderDetailsResponse> {
    const response =
        await apiFetch(
            `/bulk-order/${bulkOrderId}`,
            {
                method: "GET",
            }
        );

    return response.data;
}

export interface BulkOrderListItem {
    orderId: string;
    status: string;
    schemeId: string;
    createdAt: number;
    pricing: {
        grandTotal: number;
    };
    items: {
        productId: string;
        quantity: number;
    }[];
    customer?: {
        name?: string;
        mobile?: string;
    };
}

export interface BulkOrderListResponse {
    items: BulkOrderListItem[];
    nextCursor?: any;
}

export async function getBulkOrders(): Promise<BulkOrderListResponse> {
    const response =
        await apiFetch(
            "/bulk-order",
            {
                method: "GET",
            }
        );

    return response.data;
}

export async function cancelBulkOrder(
    bulkOrderId: string
): Promise<{ message: string }> {
    return apiFetch(
        `/bulk-order/${bulkOrderId}/cancel`,
        {
            method: "PUT",
        }
    );
}