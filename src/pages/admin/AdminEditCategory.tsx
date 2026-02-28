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

                setForm({
                    ...loaded,
                    newImage: null,
                });

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
        if (form.newImage) {
            return URL.createObjectURL(form.newImage);
        }
        return form.imageUrl;
    }, [form.newImage, form.imageUrl]);

    useEffect(() => {
        if (!form.newImage) return;

        const url = URL.createObjectURL(form.newImage);
        return () => URL.revokeObjectURL(url);
    }, [form.newImage]);

    const hasChanges = useMemo(() => {
        if (form.name.trim() !== original.name.trim()) return true;
        if (form.isActive !== original.isActive) return true;
        if (form.newImage) return true;
        return false;
    }, [form, original]);
    const handleUpdate = async () => {
        if (!categoryId) return;

        if (!form.name.trim()) {
            showAlert({
                type: "error",
                message: "Category name is required",
            });
            return;
        }

        if (!hasChanges) {
            showAlert({
                type: "error",
                message: "No changes to update",
            });
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
            <div className="max-w-2xl space-y-6">
                <div className="h-6 w-40 bg-gray-200 rounded animate-pulse" />
                <div className="space-y-2">
                    <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
                    <div className="h-10 w-full bg-gray-100 border rounded-lg animate-pulse" />
                </div>
                <div className="space-y-2">
                    <div className="h-4 w-36 bg-gray-200 rounded animate-pulse" />

                    <div className="flex items-center gap-4 border rounded-xl p-4">
                        <div className="h-20 w-20 bg-gray-100 border rounded-lg animate-pulse" />
                        <div className="flex-1 space-y-2">
                            <div className="h-4 w-40 bg-gray-200 rounded animate-pulse" />
                            <div className="h-3 w-52 bg-gray-100 rounded animate-pulse" />
                        </div>
                        <div className="h-9 w-24 bg-gray-200 rounded-lg animate-pulse" />
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="h-4 w-4 bg-gray-200 rounded animate-pulse" />
                    <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
                </div>
                <div className="flex gap-3">
                    <div className="h-10 w-40 bg-gray-200 rounded-xl animate-pulse" />
                    <div className="h-10 w-28 bg-gray-100 border rounded-xl animate-pulse" />
                </div>
            </div>
        );
    }
    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            {/* Page Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-900">
                        Edit Category
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Update category name, image and status
                    </p>
                </div>
            </div>

            {/* Main Card */}
            <div className="bg-white border rounded-2xl shadow-sm p-6 space-y-6">
                {/* Category Name */}
                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                        Category Name
                    </label>
                    <input
                        className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-black/20"
                        value={form.name}
                        onChange={(e) =>
                            setForm((p) => ({
                                ...p,
                                name: e.target.value,
                            }))
                        }
                    />
                </div>

                {/* Category Image */}
                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                        Category Image
                    </label>

                    <div className="flex flex-col sm:flex-row sm:items-center gap-4 border rounded-xl p-4 bg-gray-50">
                        {/* Preview */}
                        <div className="flex-shrink-0">
                            {previewImage ? (
                                <img
                                    src={previewImage}
                                    alt="Category"
                                    className="h-20 w-20 rounded-xl object-cover border bg-white"
                                />
                            ) : (
                                <div className="h-20 w-20 flex items-center justify-center border rounded-xl text-xs text-gray-400 bg-white">
                                    No Image
                                </div>
                            )}
                        </div>

                        {/* Info */}
                        <div className="flex-1">
                            <p className="text-sm font-semibold text-gray-800">
                                {form.newImage ? "New Image Selected" : "Current Image"}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                                Only 1 image allowed · Max size 2MB
                            </p>
                        </div>

                        {/* Upload Button */}
                        <div className="flex justify-end">
                            {/* Hidden Input */}
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleImageChange}
                            />

                            {/* Trigger Button */}
                            <Button
                                variant="outline"
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                Change Image
                            </Button>
                        </div>
                    </div>
                </div>


                {/* Active Status */}
                <div className="flex items-center gap-3">
                    <input
                        type="checkbox"
                        checked={form.isActive}
                        onChange={(e) =>
                            setForm((p) => ({
                                ...p,
                                isActive: e.target.checked,
                            }))
                        }
                        className="h-4 w-4"
                    />
                    <span className="text-sm text-gray-700">
                        Active Category
                    </span>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
                    <Button
                        onClick={handleUpdate}
                        disabled={loading || !hasChanges}
                        className="w-full sm:w-auto"
                    >
                        {loading
                            ? "Updating..."
                            : hasChanges
                                ? "Update Category"
                                : "No Changes"}
                    </Button>

                    <Button
                        variant="outline"
                        onClick={() => navigate("/admin/categories")}
                        disabled={loading}
                        className="w-full sm:w-auto"
                    >
                        Cancel
                    </Button>
                </div>
            </div>
        </div>
    );

}
