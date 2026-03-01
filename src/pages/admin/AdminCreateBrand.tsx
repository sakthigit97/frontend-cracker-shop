import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../../components/ui/Button";
import { useAlert } from "../../store/alert.store";
import {
    createBrand,
    getBrandLogoPresign,
} from "../../services/adminBrands.api";
import { uploadFilesToS3 } from "../../utils/uploadToS3";
import { useAdminBrandsStore } from "../../store/adminBrands.store";

const MAX_LOGO_SIZE = 2 * 1024 * 1024;

export default function AdminCreateBrand() {
    const navigate = useNavigate();
    const { showAlert } = useAlert();
    const clearCache = useAdminBrandsStore((s) => s.clearCache);
    const [loading, setLoading] = useState(false);

    const [form, setForm] = useState<{
        name: string;
        logo: File | null;
        isActive: boolean;
    }>({
        name: "",
        logo: null,
        isActive: true,
    });

    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        if (files.length > 1) {
            showAlert({
                type: "error",
                message: "Only one logo is allowed",
            });
            return;
        }

        const file = files[0];

        if (file.size > MAX_LOGO_SIZE) {
            showAlert({
                type: "error",
                message: "Logo must be less than 2MB",
            });
            return;
        }

        setForm((prev) => ({
            ...prev,
            logo: file,
        }));
    };

    const handleSubmit = async () => {
        if (!form.name.trim()) {
            showAlert({
                type: "error",
                message: "Brand name is required",
            });
            return;
        }

        if (!form.logo) {
            showAlert({
                type: "error",
                message: "Brand logo is required",
            });
            return;
        }

        try {
            setLoading(true);

            const presign = await getBrandLogoPresign({
                fileName: form.logo.name,
                contentType: form.logo.type,
            });

            await uploadFilesToS3(
                [{ uploadUrl: presign.uploadUrl }],
                [form.logo]
            );

            await createBrand({
                name: form.name.trim(),
                logoUrl: presign.fileUrl,
                isActive: form.isActive,
            });

            showAlert({
                type: "success",
                message: "Brand created successfully",
            });

            clearCache();
            navigate("/admin/brands");
        } catch (err: any) {
            showAlert({
                type: "error",
                message: err?.message || "Failed to create brand",
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
                        <h1 className="text-xl font-semibold">Add Brand</h1>
                        <p className="text-sm text-gray-500 mt-1">
                            Create a new brand
                        </p>
                    </div>

                    {/* Brand Name */}
                    <div className="space-y-1">
                        <label className="text-sm font-medium">
                            Brand Name
                        </label>
                        <input
                            className="border rounded-md p-2 w-full"
                            placeholder="Enter brand name"
                            value={form.name}
                            onChange={(e) =>
                                setForm((p) => ({
                                    ...p,
                                    name: e.target.value,
                                }))
                            }
                        />
                    </div>

                    {/* Logo Upload */}
                    <div className="space-y-2">
                        <p className="text-sm font-medium">Brand Logo</p>

                        {!form.logo ? (
                            <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-xl p-6 cursor-pointer hover:border-gray-400 transition text-center bg-gray-50">
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleLogoChange}
                                />

                                <p className="text-sm font-medium text-gray-700">
                                    Click to upload logo
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                    PNG / JPG · Max 2MB · Only 1 logo
                                </p>
                            </label>
                        ) : (
                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 border rounded-xl p-4 bg-white">
                                <img
                                    src={URL.createObjectURL(form.logo)}
                                    alt="Logo preview"
                                    className="h-20 w-20 rounded-lg object-cover border shrink-0"
                                />

                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">
                                        {form.logo.name}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">
                                        {(form.logo.size / 1024).toFixed(0)} KB
                                    </p>
                                </div>

                                <div className="w-full sm:w-auto">
                                    <Button
                                        variant="outline"
                                        className="w-full sm:w-auto"
                                        type="button"
                                        onClick={() =>
                                            setForm((p) => ({
                                                ...p,
                                                logo: null,
                                            }))
                                        }
                                    >
                                        Change Logo
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
                                setForm((p) => ({
                                    ...p,
                                    isActive: e.target.checked,
                                }))
                            }
                        />
                        <span className="text-sm">Active</span>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-3 pt-4 border-t">
                        <Button
                            variant="outline"
                            disabled={loading}
                            onClick={() => navigate("/admin/brands")}
                        >
                            Cancel
                        </Button>

                        <Button onClick={handleSubmit} disabled={loading}>
                            {loading ? "Saving…" : "Save Brand"}
                        </Button>
                    </div>

                </div>
            </div>
        </div>
    );
}