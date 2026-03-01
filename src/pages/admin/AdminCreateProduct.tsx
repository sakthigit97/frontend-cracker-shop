import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import ProductForm from "../../components/admin/AdminProductForm";
import type { ProductFormData } from "../../components/admin/AdminProductForm";
import { useMetaStore } from "../../store/meta.store";
import { useAlert } from "../../store/alert.store";
import {
    createProduct,
    getPresignedUrls,
} from "../../services/adminProducts.api";
import { uploadFilesToS3 } from "../../utils/uploadToS3";
import { useAdminProductsStore } from "../../store/adminProducts.store";

export default function AdminCreateProduct() {
    const navigate = useNavigate();
    const { brands, categories, load } = useMetaStore();
    const [loading, setLoading] = useState(false);
    const { showAlert } = useAlert();

    const [form, setForm] = useState<ProductFormData>({
        name: "",
        price: "",
        quantity: "",
        brandId: "",
        categoryId: "",
        isActive: true,
        images: [],
        videoUrl: "",
        description: "",
    });

    useEffect(() => {
        load();
    }, []);

    const handleSubmit = async () => {
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

        if (Number(form.quantity) <= 0) {
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

        if (!form.images || form.images.length === 0) {
            showAlert({
                type: "error",
                message: "Please upload at least one product image",
            });
            return;
        }

        const brandName = brands.find((b) => b.id === form.brandId)?.name || "";
        const categoryName = categories.find((c) => c.id === form.categoryId)?.name || "";

        const searchText = [form.name, brandName, categoryName]
            .join(" ")
            .toLowerCase();

        try {
            setLoading(true);

            const presignRes = await getPresignedUrls(form.images);
            await uploadFilesToS3(presignRes.uploads, form.images);
            await createProduct({
                productId: presignRes.productId,
                name: form.name.trim(),
                price: Number(form.price),
                quantity: Number(form.quantity),
                brandId: form.brandId,
                categoryId: form.categoryId,
                imageUrls: presignRes.uploads.map((u: any) => u.fileUrl),
                videoUrl: form.videoUrl,
                description: form.description,
                searchText,
                isActive: form.isActive ? "true" : "false",
            });

            showAlert({
                type: "success",
                message: "Product created successfully",
            });

            useAdminProductsStore.getState().clearCache();
            navigate("/admin/products");
        } catch (err: any) {
            showAlert({
                type: "error",
                message: err?.message || "Failed to create product",
            });
        } finally {
            setLoading(false);
        }
    };
    return (
        <div className="flex justify-center">
            <div className="w-full max-w-4xl">
                <div className="bg-white border rounded-2xl p-6 space-y-6">

                    <div>
                        <h1 className="text-xl font-semibold">Add Product</h1>
                        <p className="text-sm text-gray-500 mt-1">
                            Create a new product
                        </p>
                    </div>

                    <ProductForm
                        value={form}
                        brands={brands}
                        categories={categories}
                        loading={loading}
                        onChange={setForm}
                        onSubmit={handleSubmit}
                        onCancel={() => navigate("/admin/products")}
                    />

                </div>
            </div>
        </div>
    );
}