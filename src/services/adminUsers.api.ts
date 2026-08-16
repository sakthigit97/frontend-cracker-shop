import { apiFetch } from "./api";

export interface GetAdminUsersParams {
    search?: string;
    cursor?: string;
    limit?: number;
}

export interface UpdateAdminUserRequest {
    name?: string;
    role?: string;
    address?: string;
    city?: string;
    state?: string;
    pincode?: string;
}

export interface AdminUser {
    mobile: string;
    name?: string;
    email?: string;
    address?: string;
    city?: string;
    state?: string;
    pincode?: string;
    role?: string;
    referralCode?: string;
}

export interface GetAdminUsersResponse {
    items: AdminUser[];
    nextCursor?: string;
}

export async function getAdminUsers(
    params: GetAdminUsersParams = {}
): Promise<GetAdminUsersResponse> {
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

    const queryString = query.toString();

    return apiFetch(
        `/admin/users${queryString ? `?${queryString}` : ""}`,
        {
            method: "GET",
        }
    );
}

export async function deleteUser(
    mobile: string
) {
    return apiFetch(`/admin/users/${mobile}`, {
        method: "DELETE",
    });
}


export async function updateAdminUser(
    mobile: string,
    payload: UpdateAdminUserRequest
) {
    return apiFetch(
        `/admin/users/${encodeURIComponent(mobile)}`,
        {
            method: "PATCH",
            body: JSON.stringify(payload),
    }
    );
}