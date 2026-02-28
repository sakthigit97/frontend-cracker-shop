import { apiFetch } from "./api";

export function mergeCartApi(data: {
    guestItems: Record<string, number>;
}) {
    return apiFetch("/cart/merge", {
        method: "POST",
        body: JSON.stringify(data),
    });
}

export function getCartApi() {
    return apiFetch("/cart");
}

export async function forceCartSync(items: Record<string, number>) {
    return apiFetch("/cart/sync", {
        method: "POST",
        body: JSON.stringify({
            items,
            mode: "full",
        }),
    });
}