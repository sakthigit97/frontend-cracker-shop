import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ProductForm from "../../components/admin/AdminProductForm";
import type { ProductFormData } from "../../components/admin/AdminProductForm";
import { useMetaStore } from "../../store/meta.store";
import { useAlert } from "../../store/alert.store";

import {
    getAdminProduct,
    updateAdminProduct,
    getPresignedUrls,
} from "../../services/adminProducts.api";

import { uploadFilesToS3 } from "../../utils/uploadToS3";
import ProductSkeleton from "../../components/product/ProductSkeleton";

export default function AdminEditProduct() {
    const { productId } = useParams();
    const navigate = useNavigate();
    const { showAlert } = useAlert();
    const { brands, categories, load } = useMetaStore();
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [existingImages, setExistingImages] = useState<string[]>([]);
    const [form, setForm] = useState<ProductFormData | null>(null);
    const [initialData, setInitialData] = useState<any>(null);

    useEffect(() => {
        load();
    }, []);

    useEffect(() => {
        if (!productId) return;

        const loadProduct = async () => {
            try {
                const data = await getAdminProduct(productId);
                setExistingImages(data.imageUrls || []);

                const formData: ProductFormData = {
                    name: data.name || "",
                    price: String(data.price || ""),
                    quantity: Number(data.quantity ?? 0),
                    brandId: data.brandId || "",
                    categoryId: data.categoryId || "",
                    description: data.description || "",
                    isActive: data.isActive === "true",
                    images: [],
                    videoUrl: data.videoUrl || "",
                };

                setForm(formData);
                setInitialData({
                    ...formData,
                    imageUrls: data.imageUrls || [],
                });
            } catch {
                showAlert({
                    type: "error",
                    message: "Failed to load product",
                });
                navigate("/admin/products");
            } finally {
                setFetching(false);
            }
        };

        loadProduct();
    }, [productId]);

    const brandName = useMemo(() => {
        return brands.find((b) => b.id === form?.brandId)?.name || "";
    }, [brands, form?.brandId]);

    const categoryName = useMemo(() => {
        return categories.find((c) => c.id === form?.categoryId)?.name || "";
    }, [categories, form?.categoryId]);

    if (fetching) {
        return (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                    <ProductSkeleton key={i} />
                ))}
            </div>
        );
    }

    if (!form) return null;
    const hasChanges = () => {
        if (!initialData) return false;

        if (
            initialData.name !== form.name ||
            initialData.price !== form.price ||
            initialData.quantity !== form.quantity ||
            initialData.brandId !== form.brandId ||
            initialData.categoryId !== form.categoryId ||
            initialData.description !== form.description ||
            initialData.videoUrl !== form.videoUrl ||
            initialData.isActive !== form.isActive
        ) {
            return true;
        }

        if (
            JSON.stringify(initialData.imageUrls) !==
            JSON.stringify(existingImages)
        ) {
            return true;
        }

        if (form.images.length > 0) return true;

        return false;
    };

    const handleSubmit = async () => {
        if (!productId) return;

        if (!hasChanges()) {
            showAlert({
                type: "info",
                message: "No changes to save",
            });
            return;
        }

        if (
            !form.name ||
            !form.price ||
            !form.brandId ||
            !form.categoryId ||
            !form.description
        ) {
            showAlert({
                type: "error",
                message: "Please fill all required fields",
            });
            return;
        }

        if (Number(form.price) <= 0) {
            showAlert({
                type: "error",
                message: "Price must be greater than 0",
            });
            return;
        }

        if (form.quantity < 0) {
            showAlert({
                type: "error",
                message: "Quantity cannot be negative",
            });
            return;
        }

        if (form.description.trim().length < 10) {
            showAlert({
                type: "error",
                message: "Description must be at least 10 characters",
            });
            return;
        }

        if (existingImages.length + form.images.length === 0) {
            showAlert({
                type: "error",
                message: "At least one product image is required",
            });
            return;
        }

        try {
            setLoading(true);

            let newImageUrls: string[] = [];

            if (form.images.length > 0) {
                const presign = await getPresignedUrls(form.images, productId);

                await uploadFilesToS3(presign.uploads, form.images);

                newImageUrls = presign.uploads.map((u: any) => u.fileUrl);
            }

            const searchText = [form.name, brandName, categoryName]
                .join(" ")
                .toLowerCase();

            await updateAdminProduct(productId, {
                name: form.name.trim(),
                price: Number(form.price),
                quantity: Number(form.quantity),
                brandId: form.brandId,
                categoryId: form.categoryId,
                description: form.description,
                videoUrl: form.videoUrl,
                isActive: form.isActive ? "true" : "false",
                searchText,
                imageUrls: [...existingImages, ...newImageUrls],
            });

            showAlert({
                type: "success",
                message: "Product updated successfully",
            });

            navigate("/admin/products");
        } catch (err: any) {
            showAlert({
                type: "error",
                message: err?.message || "Update failed",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-3xl">
            <h1 className="text-xl font-semibold mb-4">Edit Product</h1>

            <ProductForm
                value={form}
                brands={brands}
                categories={categories}
                loading={loading}
                existingImages={existingImages}
                onRemoveImage={(url) =>
                    setExistingImages((imgs) => imgs.filter((i) => i !== url))
                }
                onChange={setForm}
                onSubmit={handleSubmit}
                onCancel={() => navigate("/admin/products")}
            />
        </div>
    );
}