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
    return apiFetch(
        `/bulk-order/${bulkOrderId}`,
        {
            method: "GET",
        }
    );

}

export interface BulkOrderListResponse {
    items: {
        orderId: string;
        createdAt: string;
        grandTotal: number;
        totalBoxes: number;
        status: string;
    }[];
}

export async function getBulkOrders(): Promise<BulkOrderListResponse> {
    return {
        items: [],
    };
}