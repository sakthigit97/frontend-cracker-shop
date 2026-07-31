import { apiFetch } from "./api";

import type {
    BulkOrderResponse,
    BulkOrderDetailsResponse,
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
}

export async function validateBulkAdminCode(
    payload: ValidateAdminCodeRequest
): Promise<ValidateAdminCodeResponse> {
    return apiFetch(
        "/bulk-order/validate-code",
        {
            method: "POST",
            body: JSON.stringify(payload),
        }
    );

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

export async function getBulkOrder(
    bulkOrderId: string
): Promise<BulkOrderDetailsResponse> {

    const response = await apiFetch(
        `/bulk-order/${bulkOrderId}`,
        {
            method: "GET",
        }
    );
    return response.data;
}

export interface BulkOrderListResponse {
    items: {
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
    }[];
    nextCursor?: any;
}

export async function getBulkOrders() {
    const response = await apiFetch("/bulk-order", {
        method: "GET",
    });
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