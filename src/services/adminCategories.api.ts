import { apiFetch } from "./api";

export interface CategoryFilters {
    search?: string;
    isActive?: string;
    limit?: number;
    cursor?: string;
}

export const getAdminCategories = (params: CategoryFilters) => {
    const qs = new URLSearchParams(
        Object.entries(params)
            .filter(([, v]) => v !== undefined && v !== "")
            .map(([k, v]) => [k, String(v)])
    ).toString();

    return apiFetch(`/admin/categories?${qs}`);
};

export const createCategory = (payload: {
    name: string;
    imageUrl?: string;
    sortOrder?: number;
    isActive: boolean;
}) => {
    return apiFetch("/admin/categories", {
        method: "POST",
        body: JSON.stringify(payload),
    });
};

export const getCategoryImagePresign = (payload: {
    fileName: string;
    contentType: string;
    categoryId?: string;
}) => {
    return apiFetch("/admin/categories/presign-image", {
        method: "POST",
        body: JSON.stringify(payload),
    });
};

export async function updateCategoryStatus(
    categoryId: string,
    isActive: boolean
) {
    return apiFetch(`/admin/categories/${categoryId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ isActive }),
    });
}

export async function getCategoryById(categoryId: string) {
    return apiFetch(`/admin/categories/${categoryId}`);
}

export async function updateCategory(categoryId: string, body: any) {
    return apiFetch(`/admin/categories/${categoryId}`, {
        method: "PUT",
        body: JSON.stringify(body),
    });
}

export async function deleteCategory(categoryId: string) {
    return apiFetch(`/admin/categories/${categoryId}`, {
        method: "DELETE",
    });
}
