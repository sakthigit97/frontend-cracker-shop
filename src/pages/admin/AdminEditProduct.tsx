import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import EditProductForm from "../../components/admin/EditProductForm";
import type { ProductFormData } from "../../components/admin/AdminProductForm";
import { useMetaStore } from "../../store/meta.store";
import { useAlert } from "../../store/alert.store";
import { useAdminProductsStore } from "../../store/adminProducts.store";

type EditableImage = {
    id: string;
    preview: string;
    url?: string;
    file?: File;
};

import {
    getAdminProduct,
    updateAdminProduct,
    getPresignedUrls,
    deleteProductImages,
} from "../../services/adminProducts.api";

import { uploadFilesToS3 } from "../../utils/uploadToS3";
import ProductSkeleton from "../../components/product/ProductSkeleton";

export default function AdminEditProduct() {
    const { productId } = useParams();
    const navigate = useNavigate();
    const { showAlert } = useAlert();
    const { brands, categories, load, packageTags, aiTags } = useMetaStore();
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [images, setImages] = useState<EditableImage[]>([]);
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
                setImages(
                    (data.imageUrls || []).map((url: string, index: number) => ({
                        id: `existing-${index}`,
                        url,
                        preview: url,
                    }))
                );

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
                    packageTagIds: data.packageTagIds || [],
                    aiTags: data.aiTags || []
                };

                setForm(formData);
                setInitialData({
                    ...formData,
                    imageUrls: data.imageUrls || [],
                    packageTagIds: data.packageTagIds || [],
                    aiTags: data.aiTags || []
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
            <div className="flex justify-center px-4">
                <div className="w-full max-w-5xl">
                    <div className="bg-white border border-gray-200 rounded-2xl p-6 md:p-8">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {Array.from({ length: 6 }).map((_, i) => (
                                <ProductSkeleton key={i} />
                            ))}
                        </div>
                    </div>
                </div>
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

        const currentImageState = images.map(i => i.url ?? i.id);
        if (
            JSON.stringify(initialData.imageUrls) !==
            JSON.stringify(currentImageState)
        ) {
            return true;
        }

        if (
            JSON.stringify(initialData.packageTagIds || []) !==
            JSON.stringify(form.packageTagIds || [])
        ) {
            return true;
        }

        if (
            JSON.stringify(initialData.aiTags || []) !==
            JSON.stringify(form.aiTags || [])
        ) {
            return true;
        }

        if (images.some(i => i.file))
            return true;

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

        if (images.length === 0) {
            showAlert({
                type: "error",
                message: "At least one product image is required",
            });
            return;
        }

        try {
            setLoading(true);

            const existingImageUrls = images
                .filter(i => i.url)
                .map(i => i.url!);

            const removedImages = initialData.imageUrls.filter(
                (url: string) => !existingImageUrls.includes(url)
            );

            let newImageUrls: string[] = [];

            const newFiles = images
                .filter(i => i.file)
                .map(i => i.file!);

            if (newFiles.length > 0) {
                const presign = await getPresignedUrls(newFiles, productId);

                await uploadFilesToS3(
                    presign.uploads,
                    newFiles
                );

                newImageUrls = presign.uploads.map(
                    (u: any) => u.fileUrl
                );
            }

            let uploadedIndex = 0;
            const finalImageUrls = images.map(image => {
                if (image.url) {
                    return image.url;
                }
                return newImageUrls[uploadedIndex++];
            });

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
                imageUrls: finalImageUrls,
                packageTagIds: form.packageTagIds || [],
                aiTags: form.aiTags || [],
            });

            if (removedImages.length > 0) {
                await deleteProductImages(removedImages);
            }

            showAlert({
                type: "success",
                message: "Product updated successfully",
            });

            useAdminProductsStore.getState().clearCache();
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
        <div className="flex justify-center px-4">
            <div className="w-full max-w-5xl">
                <div className="bg-white border border-gray-200 rounded-2xl p-6 md:p-8 space-y-6 shadow-sm">

                    {/* Header */}
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <button
                                onClick={() => navigate(-1)}
                                className="
                                    w-9 h-9 flex items-center justify-center
                                    rounded-full
                                    bg-[var(--color-primary)]
                                    text-white
                                    hover:scale-105 active:scale-95 transition
                                "
                            >
                                ←
                            </button>

                            <h1 className="text-xl md:text-2xl font-semibold text-[var(--color-primary)]">
                                Edit Product
                            </h1>
                        </div>

                        <p className="text-sm text-gray-500">
                            Update product details
                        </p>
                    </div>

                    {/* Form */}
                    <EditProductForm
                        value={form}
                        brands={brands}
                        categories={categories}
                        loading={loading}
                        packageTags={packageTags}
                        aiTags={aiTags}
                        images={images}
                        setImages={setImages}
                        onChange={setForm}
                        onSubmit={handleSubmit}
                        onCancel={() => navigate("/admin/products")}
                    />

                </div>
            </div>
        </div>
    );
}