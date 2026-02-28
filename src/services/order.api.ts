import { apiFetch } from "./api";

export async function createOrderApi(payload: {
    address: any;
}) {
    return apiFetch("/orders", {
        method: "POST",
        body: JSON.stringify(payload),
    });
}

export async function getMyOrdersApi(
    limit = 10,
    cursor?: string
) {
    const params = new URLSearchParams();
    params.append("limit", String(limit));
    if (cursor) params.append("cursor", cursor);
    return apiFetch(`/orders?${params.toString()}`);
}

export async function cancelOrderApi(orderId: string) {
    return apiFetch(`/orders/${orderId}/cancel`, {
        method: "PUT",
    });
}

export async function adjustOrderApi(
    orderId: string,
    items: { productId: string; quantity: number }[]
) {
    const res = await apiFetch(`/orders/${orderId}/adjust`, {
        method: "PUT",
        body: JSON.stringify({ items }),
    });
    const order =
        res?.order?.order ??
        res?.order ??
        res;

    if (!order?.orderId) {
        throw new Error("Invalid adjust order response");
    }
    return order;
}