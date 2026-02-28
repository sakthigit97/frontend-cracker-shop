import { apiFetch } from "./api";
export interface AdminBrand {
    brandId: string;
    name: string;
    logoUrl: string;
    isActive: boolean;
    createdAt: string;
}

export interface ListBrandsResponse {
    items: AdminBrand[];
    nextCursor?: string;
}

export async function getAdminBrands(params: {
    search?: string;
    isActive?: "" | "true" | "false";
    limit?: number;
    cursor?: string;
}): Promise<ListBrandsResponse> {
    const query = new URLSearchParams();

    if (params.search) query.set("search", params.search);
    if (params.isActive) query.set("isActive", params.isActive);
    if (params.limit) query.set("limit", String(params.limit));
    if (params.cursor) query.set("cursor", params.cursor);

    return apiFetch(`/admin/brands?${query.toString()}`);
}

export async function getBrandById(brandId: string): Promise<AdminBrand> {
    return apiFetch(`/admin/brands/${brandId}`);
}

export async function createBrand(input: {
    name: string;
    logoUrl: string;
    isActive: boolean;
}) {
    return apiFetch(`/admin/brands`, {
        method: "POST",
        body: JSON.stringify(input),
    });
}

export async function updateBrand(
    brandId: string,
    input: {
        name: string;
        logoUrl: string;
        isActive: boolean;
    }
) {
    return apiFetch(`/admin/brands/${brandId}`, {
        method: "PUT",
        body: JSON.stringify(input),
    });
}

export async function updateBrandStatus(
    brandId: string,
    isActive: boolean
) {
    return apiFetch(`/admin/brands/${brandId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ isActive }),
    });
}

export async function deleteBrand(brandId: string) {
    return apiFetch(`/admin/brands/${brandId}`, {
        method: "DELETE",
    });
}

export async function getBrandLogoPresign(input: {
    fileName: string;
    contentType: string;
    brandId?: string;
}): Promise<{
    uploadUrl: string;
    fileUrl: string;
    brandId: string;
}> {
    return apiFetch(`/admin/brands/presign-logo`, {
        method: "POST",
        body: JSON.stringify(input),
    });
}