import { apiFetch } from "./api";

export interface AdminBulkOrdersParams {
    status?: string;
    fromDate?: number;
    toDate?: number;
    limit?: number;
    cursor?: string | null;
    orderId?: string;
}

export async function getAdminBulkOrders(
    params: AdminBulkOrdersParams
) {
    const query = new URLSearchParams();

    if (params.status) {
        query.set("status", params.status);
    }

    if (params.fromDate) {
        query.set(
            "fromDate",
            String(params.fromDate)
        );
    }

    if (params.toDate) {
        query.set(
            "toDate",
            String(params.toDate)
        );
    }

    if (params.limit) {
        query.set(
            "limit",
            String(params.limit)
        );
    }

    if (params.cursor) {
        query.set(
            "cursor",
            params.cursor
        );
    }

    if (params.orderId?.trim()) {
        query.set(
            "orderId",
            params.orderId.trim()
        );
    }

    const response = await apiFetch(
        `/admin/bulk-orders?${query.toString()}`
    );
    return response.data;
}

export async function getAdminBulkOrderById(
    orderId: string
) {
    const response = await apiFetch(
        `/admin/bulk-orders/${orderId}`
    );
    return response.data;
}

export async function updateAdminBulkOrder(
    orderId: string,
    payload: {
        status?: string;
        adminComment?: string;
    }
) {
    return await apiFetch(
        `/admin/bulk-orders/${orderId}/status`,
        {
            method: "PUT",
            body: JSON.stringify(payload),
        }
    );
}

export async function cancelAdminBulkOrder(
    orderId: string
) {
    return await apiFetch(
        `/admin/bulk-orders/${orderId}/cancel`,
        {
            method: "POST",
        }
    );
}