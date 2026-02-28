import { apiFetch } from "./api";

export const deactivateProduct = (productId: string) =>
    apiFetch(`/admin/products/${productId}/deactivate`, {
        method: "PATCH",
    });

export const getPresignedUrls = async (
    files: File[],
    productId?: string
) => {
    return apiFetch("/admin/products/presign", {
        method: "POST",
        body: JSON.stringify({
            files: files.map((f) => ({
                name: f.name,
                type: f.type,
            })),
            productId,
        }),
    });
};

export const createProduct = async (payload: any) => {
    return apiFetch("/admin/product", {
        method: "POST",
        body: JSON.stringify(payload),
    });
};

export const getAdminProduct = async (productId: string) => {
    return apiFetch(`/admin/products/${productId}`);
};

export const updateAdminProduct = async (
    productId: string,
    payload: {
        name?: string;
        price?: number;
        quantity?: number;
        brandId?: string;
        categoryId?: string;
        imageUrls?: string[];
        videoUrl?: string;
        description?: string;
        searchText?: string;
        isActive?: "true" | "false";
    }
) => {
    return apiFetch(`/admin/products/${productId}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
    });
};

export const getBulkImportUploadUrl = (fileName: string) => {
    return apiFetch("/admin/products/import/upload-url", {
        method: "POST",
        body: JSON.stringify({ fileName }),
    });
};

export const validateBulkImport = (importId: string) => {
    return apiFetch("/admin/products/import/validate", {
        method: "POST",
        body: JSON.stringify({ importId }),
    });
};

export const confirmBulkImport = (importId: string) => {
    return apiFetch("/admin/products/import/confirm", {
        method: "POST",
        body: JSON.stringify({ importId }),
    });
};

export async function deleteProduct(productId: string) {
    return apiFetch(`/admin/products/${productId}`, {
        method: "DELETE",
    });
}
