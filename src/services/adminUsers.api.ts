import { apiFetch } from "./api";
export async function getAdminUsers(params: {
    search?: string;
    cursor?: string;
    limit?: number;
}) {
    const query = new URLSearchParams();

    if (params.search?.trim()) {
        query.append("search", params.search.trim());
    }

    if (params.cursor) {
        query.append("cursor", params.cursor);
    }

    if (params.limit) {
        query.append("limit", String(params.limit));
    }

    return apiFetch(`/admin/users?${query.toString()}`, {
        method: "GET",
    });
}

export async function deleteUser(mobile: string) {
    return apiFetch(`/admin/users/${mobile}`, {
        method: "DELETE",
    });
}