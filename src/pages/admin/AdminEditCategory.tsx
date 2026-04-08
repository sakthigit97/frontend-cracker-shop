import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Button from "../../components/ui/Button";
import { useAlert } from "../../store/alert.store";

import {
    getCategoryById,
    updateCategory,
    getCategoryImagePresign,
} from "../../services/adminCategories.api";

import { uploadFilesToS3 } from "../../utils/uploadToS3";
import { useAdminCategoriesStore } from "../../store/adminCategories.store";

const MAX_IMAGE_SIZE = 2 * 1024 * 1024;

export default function AdminEditCategory() {
    const navigate = useNavigate();
    const { showAlert } = useAlert();
    const { categoryId } = useParams<{ categoryId: string }>();
    const clearCache = useAdminCategoriesStore((s) => s.clearCache);

    const [fetching, setFetching] = useState(true);
    const [loading, setLoading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    const [form, setForm] = useState({
        name: "",
        isActive: true,
        imageUrl: "",
        newImage: null as File | null,
    });

    const [original, setOriginal] = useState({
        name: "",
        isActive: true,
        imageUrl: "",
    });

    useEffect(() => {
        if (!categoryId) return;

        const loadCategory = async () => {
            try {
                const res = await getCategoryById(categoryId);

                const loaded = {
                    name: res.name || "",
                    isActive: res.isActive ?? true,
                    imageUrl: res.imageUrl || "",
                };

                setForm({ ...loaded, newImage: null });
                setOriginal(loaded);
            } catch (err: any) {
                showAlert({
                    type: "error",
                    message: err?.message || "Failed to load category",
                });
                navigate("/admin/categories");
            } finally {
                setFetching(false);
            }
        };

        loadCategory();
    }, [categoryId]);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > MAX_IMAGE_SIZE) {
            showAlert({
                type: "error",
                message: "Image must be less than 2MB",
            });
            return;
        }

        setForm((prev) => ({
            ...prev,
            newImage: file,
        }));
        e.target.value = "";
    };

    const previewImage = useMemo(() => {
        if (form.newImage) return URL.createObjectURL(form.newImage);
        return form.imageUrl;
    }, [form.newImage, form.imageUrl]);

    const hasChanges = useMemo(() => {
        if (form.name.trim() !== original.name.trim()) return true;
        if (form.isActive !== original.isActive) return true;
        if (form.newImage) return true;
        return false;
    }, [form, original]);

    const handleUpdate = async () => {
        if (!categoryId) return;

        if (!form.name.trim()) {
            showAlert({ type: "error", message: "Category name is required" });
            return;
        }

        if (!hasChanges) {
            showAlert({ type: "error", message: "No changes to update" });
            return;
        }

        try {
            setLoading(true);

            let finalImageUrl = form.imageUrl;

            if (form.newImage) {
                const presign = await getCategoryImagePresign({
                    fileName: form.newImage.name,
                    contentType: form.newImage.type,
                    categoryId,
                });

                await uploadFilesToS3(
                    [{ uploadUrl: presign.uploadUrl }],
                    [form.newImage]
                );

                finalImageUrl = presign.fileUrl;
            }

            await updateCategory(categoryId, {
                name: form.name.trim(),
                imageUrl: finalImageUrl,
                isActive: form.isActive,
            });

            showAlert({
                type: "success",
                message: "Category updated successfully",
            });

            clearCache();
            navigate("/admin/categories");
        } catch (err: any) {
            showAlert({
                type: "error",
                message: err?.message || "Failed to update category",
            });
        } finally {
            setLoading(false);
        }
    };

    if (fetching) {
        return (
            <div className="flex justify-center px-4">
                <div className="w-full max-w-5xl">
                    <div className="bg-white border border-gray-200 rounded-2xl p-6 md:p-8 space-y-6">
                        <div className="h-6 w-40 bg-gray-200 rounded animate-pulse" />
                        <div className="h-10 bg-gray-100 rounded animate-pulse" />
                        <div className="h-24 bg-gray-100 rounded animate-pulse" />
                        <div className="h-10 bg-gray-100 rounded animate-pulse" />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex justify-center px-4">
            <div className="w-full max-w-5xl">
                <div className="bg-white border border-gray-200 rounded-2xl p-6 md:p-8 space-y-6 shadow-sm">

                    {/* Header */}
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <button
                                onClick={() => navigate(-1)}
                                className="w-9 h-9 flex items-center justify-center rounded-full bg-[var(--color-primary)] text-white hover:scale-105 active:scale-95 transition"
                            >
                                ←
                            </button>

                            <h1 className="text-xl md:text-2xl font-semibold text-[var(--color-primary)]">
                                Edit Category
                            </h1>
                        </div>

                        <p className="text-sm text-gray-500">
                            Update category details
                        </p>
                    </div>

                    {/* Name */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium">
                            Category Name
                        </label>
                        <input
                            className="border border-gray-300 rounded-lg p-3 w-full"
                            value={form.name}
                            onChange={(e) =>
                                setForm((p) => ({
                                    ...p,
                                    name: e.target.value,
                                }))
                            }
                        />
                    </div>

                    {/* Image */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium">
                            Category Image
                        </label>

                        <div className="flex flex-col sm:flex-row gap-4 border rounded-xl p-4 bg-gray-50">
                            <img
                                src={previewImage}
                                className="h-20 w-20 rounded-lg object-cover border"
                            />

                            <div className="flex-1">
                                <p className="text-sm font-medium">
                                    {form.newImage
                                        ? "New Image Selected"
                                        : "Current Image"}
                                </p>
                                <p className="text-xs text-gray-500">
                                    Max 2MB · 1 image
                                </p>
                            </div>

                            <input
                                ref={fileInputRef}
                                type="file"
                                className="hidden"
                                onChange={handleImageChange}
                            />

                            <Button
                                variant="outline"
                                onClick={() =>
                                    fileInputRef.current?.click()
                                }
                            >
                                Change Image
                            </Button>
                        </div>
                    </div>

                    {/* Active */}
                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            checked={form.isActive}
                            onChange={(e) =>
                                setForm((p) => ({
                                    ...p,
                                    isActive: e.target.checked,
                                }))
                            }
                        />
                        <span className="text-sm">
                            Active Category
                        </span>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col sm:flex-row sm:justify-end gap-3 pt-4 border-t">
                        <Button
                            variant="outline"
                            className="w-full sm:w-auto"
                            onClick={() => navigate("/admin/categories")}
                        >
                            Cancel
                        </Button>

                        <Button
                            className="w-full sm:w-auto"
                            onClick={handleUpdate}
                            disabled={loading || !hasChanges}
                        >
                            {loading
                                ? "Updating..."
                                : hasChanges
                                    ? "Update Category"
                                    : "No Changes"}
                        </Button>
                    </div>

                </div>
            </div>
        </div>
    );
}