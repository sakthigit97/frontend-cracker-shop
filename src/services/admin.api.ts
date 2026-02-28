import { apiFetch } from "./api";
export interface AdminOrdersParams {
    status?: string;
    fromDate?: number;
    toDate?: number;
    limit?: number;
    cursor?: string | null;
    orderId?: string;
}

export async function getAdminDashboard() {
    return await apiFetch("/admin/dashboard");
}

export async function getAdminOrders(params: AdminOrdersParams) {
    const query = new URLSearchParams();

    if (params.status) query.set("status", params.status);
    if (params.fromDate) query.set("fromDate", String(params.fromDate));
    if (params.toDate) query.set("toDate", String(params.toDate));
    if (params.limit) query.set("limit", String(params.limit));
    if (params.cursor) query.set("cursor", params.cursor);
    if (params.orderId) query.set("orderId", params.orderId);

    const res = await apiFetch(`/admin/orders?${query.toString()}`);
    return res;
}

export async function getAdminOrderById(orderId: string) {
    return await apiFetch(`/admin/orders/${orderId}`);
}

export async function updateAdminOrder(
    orderId: string,
    payload: {
        status?: string;
        adminComment?: string;
    }
) {
    return apiFetch(`/admin/orders/${orderId}`, {
        method: "PUT",
        body: JSON.stringify(payload),
    });
}
