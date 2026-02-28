import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../../components/ui/Button";
import { useAlert } from "../../store/alert.store";
import {
    createCategory,
    getCategoryImagePresign,
} from "../../services/adminCategories.api";
import { uploadFilesToS3 } from "../../utils/uploadToS3";
import { useAdminCategoriesStore } from "../../store/adminCategories.store";

const MAX_IMAGE_SIZE = 2 * 1024 * 1024;
export default function AdminCreateCategory() {
    const navigate = useNavigate();
    const { showAlert } = useAlert();
    const [loading, setLoading] = useState(false);

    const [form, setForm] = useState<{
        name: string;
        image: File | null;
        isActive: boolean;
    }>({
        name: "",
        image: null,
        isActive: true,
    });

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        if (files.length > 1) {
            showAlert({
                type: "error",
                message: "Only one image is allowed for category",
            });
            return;
        }

        const file = files[0];
        if (file.size > MAX_IMAGE_SIZE) {
            showAlert({
                type: "error",
                message: "Image must be less than 2MB",
            });
            return;
        }

        setForm((prev) => ({
            ...prev,
            image: file,
        }));
    };

    const handleSubmit = async () => {
        if (!form.name.trim()) {
            showAlert({
                type: "error",
                message: "Category name is required",
            });
            return;
        }

        if (!form.image) {
            showAlert({
                type: "error",
                message: "Category image is required",
            });
            return;
        }

        try {
            setLoading(true);

            const presign = await getCategoryImagePresign({
                fileName: form.image.name,
                contentType: form.image.type,
            });

            await uploadFilesToS3(
                [{ uploadUrl: presign.uploadUrl }],
                [form.image]
            );

            await createCategory({
                name: form.name.trim(),
                imageUrl: presign.fileUrl,
                isActive: form.isActive,
            });

            showAlert({
                type: "success",
                message: "Category created successfully",
            });

            useAdminCategoriesStore.getState().clearCache();
            navigate("/admin/categories");
        } catch (err: any) {
            showAlert({
                type: "error",
                message: err?.message || "Failed to create category",
            });
        } finally {
            setLoading(false);
        }
    };
    return (
        <div className="flex justify-center">
            <div className="w-full max-w-3xl">
                <div className="bg-white border rounded-2xl p-6 space-y-6">

                    {/* Header */}
                    <div>
                        <h1 className="text-xl font-semibold">Add Category</h1>
                        <p className="text-sm text-gray-500 mt-1">
                            Create a new product category
                        </p>
                    </div>

                    {/* Name */}
                    <div className="space-y-1">
                        <label className="text-sm font-medium">
                            Category Name
                        </label>
                        <input
                            className="border rounded-md p-2 w-full"
                            placeholder="Enter category name"
                            value={form.name}
                            onChange={(e) =>
                                setForm({ ...form, name: e.target.value })
                            }
                        />
                    </div>
                    {/* ================= IMAGE UPLOAD ================= */}
                    <div className="space-y-2">
                        <p className="text-sm font-medium">Category Image</p>

                        {/* ----------- EMPTY STATE ----------- */}
                        {!form.image ? (
                            <label
                                className="
                                flex flex-col items-center justify-center
                                border-2 border-dashed border-gray-300
                                rounded-xl p-6
                                cursor-pointer
                                hover:border-gray-400
                                transition
                                text-center
                                bg-gray-50
                            "
                            >
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleImageChange}
                                />

                                <p className="text-sm font-medium text-gray-700">
                                    Click to upload image
                                </p>

                                <p className="text-xs text-gray-500 mt-1">
                                    JPG / PNG · Max 2MB · Only 1 image allowed
                                </p>
                            </label>
                        ) : (
                            /* ----------- PREVIEW STATE ----------- */
                            <div
                                className="
                                flex flex-col sm:flex-row
                                items-start sm:items-center
                                gap-4
                                border rounded-xl
                                p-4
                                bg-white
                            "
                            >
                                {/* Preview Image */}
                                <img
                                    src={URL.createObjectURL(form.image)}
                                    alt="Category preview"
                                    className="
                                    h-20 w-20
                                    rounded-lg
                                    object-cover
                                    border
                                    shrink-0
                                "
                                />

                                {/* File Info */}
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-800 truncate">
                                        {form.image.name}
                                    </p>

                                    <p className="text-xs text-gray-500 mt-1">
                                        {(form.image.size / 1024).toFixed(0)} KB
                                    </p>
                                </div>

                                {/* Action Button */}
                                <div className="w-full sm:w-auto">
                                    <Button
                                        variant="outline"
                                        className="w-full sm:w-auto"
                                        onClick={() =>
                                            setForm((prev) => ({
                                                ...prev,
                                                image: null,
                                            }))
                                        }
                                    >
                                        Change Image
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Active */}
                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            checked={form.isActive}
                            onChange={(e) =>
                                setForm({
                                    ...form,
                                    isActive: e.target.checked,
                                })
                            }
                        />
                        <span className="text-sm">Active</span>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-3 pt-4 border-t">
                        <Button
                            variant="outline"
                            onClick={() => navigate("/admin/categories")}
                        >
                            Cancel
                        </Button>

                        <Button onClick={handleSubmit} disabled={loading}>
                            {loading ? "Saving…" : "Save Category"}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}