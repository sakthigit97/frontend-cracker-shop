// ONLY UI UPDATED — LOGIC SAME

import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Button from "../../components/ui/Button";
import { useAlert } from "../../store/alert.store";

import {
    getBrandById,
    updateBrand,
    getBrandLogoPresign,
} from "../../services/adminBrands.api";

import { uploadFilesToS3 } from "../../utils/uploadToS3";
import { useAdminBrandsStore } from "../../store/adminBrands.store";

const MAX_LOGO_SIZE = 2 * 1024 * 1024;

export default function AdminEditBrand() {
    const navigate = useNavigate();
    const { showAlert } = useAlert();
    const { brandId } = useParams<{ brandId: string }>();

    const fileRef = useRef<HTMLInputElement | null>(null);

    if (!brandId) {
        return (
            <div className="flex justify-center px-4">
                <div className="w-full max-w-5xl">
                    <div className="bg-white border border-gray-200 rounded-2xl p-6 text-sm text-red-500">
                        Brand ID missing in URL
                    </div>
                </div>
            </div>
        );
    }

    const clearCache = useAdminBrandsStore((s) => s.clearCache);
    const [fetching, setFetching] = useState(true);
    const [loading, setLoading] = useState(false);

    const [form, setForm] = useState({
        name: "",
        isActive: true,
        logoUrl: "",
        newLogo: null as File | null,
    });

    const [original, setOriginal] = useState({
        name: "",
        isActive: true,
        logoUrl: "",
    });

    useEffect(() => {
        const loadBrand = async () => {
            try {
                const res = await getBrandById(brandId);

                const loaded = {
                    name: res.name || "",
                    isActive: res.isActive ?? true,
                    logoUrl: res.logoUrl || "",
                };

                setForm({ ...loaded, newLogo: null });
                setOriginal(loaded);
            } catch (err: any) {
                showAlert({
                    type: "error",
                    message: err?.message || "Failed to load brand",
                });
                navigate("/admin/brands");
            } finally {
                setFetching(false);
            }
        };

        loadBrand();
    }, [brandId]);

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
            newLogo: file,
        }));
    };

    const previewLogo = useMemo(() => {
        if (form.newLogo) return URL.createObjectURL(form.newLogo);
        return form.logoUrl;
    }, [form.newLogo, form.logoUrl]);

    const hasChanges = useMemo(() => {
        if (form.name.trim() !== original.name.trim()) return true;
        if (form.isActive !== original.isActive) return true;
        if (form.newLogo) return true;
        return false;
    }, [form, original]);

    const handleUpdate = async () => {
        if (!form.name.trim()) {
            showAlert({
                type: "error",
                message: "Brand name is required",
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

            let finalLogoUrl = form.logoUrl;

            if (form.newLogo) {
                const presign = await getBrandLogoPresign({
                    fileName: form.newLogo.name,
                    contentType: form.newLogo.type,
                    brandId,
                });

                await uploadFilesToS3(
                    [{ uploadUrl: presign.uploadUrl }],
                    [form.newLogo]
                );

                finalLogoUrl = presign.fileUrl;
            }

            await updateBrand(brandId, {
                name: form.name.trim(),
                logoUrl: finalLogoUrl,
                isActive: form.isActive,
            });

            showAlert({
                type: "success",
                message: "Brand updated successfully",
            });

            clearCache();
            navigate("/admin/brands");
        } catch (err: any) {
            showAlert({
                type: "error",
                message: err?.message || "Failed to update brand",
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
                                Edit Brand
                            </h1>
                        </div>

                        <p className="text-sm text-gray-500">
                            Update brand details
                        </p>
                    </div>

                    {/* Name */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium">
                            Brand Name
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

                    {/* Logo */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium">
                            Brand Logo
                        </label>

                        <div className="flex flex-col sm:flex-row gap-4 border rounded-xl p-4 bg-gray-50">
                            <img
                                src={previewLogo}
                                className="h-20 w-20 rounded-lg object-cover border"
                            />

                            <div className="flex-1">
                                <p className="text-sm font-medium">
                                    {form.newLogo
                                        ? "New Logo Selected"
                                        : "Current Logo"}
                                </p>
                                <p className="text-xs text-gray-500">
                                    Max 2MB · 1 image
                                </p>
                            </div>

                            <input
                                ref={fileRef}
                                type="file"
                                className="hidden"
                                onChange={handleLogoChange}
                            />

                            <Button
                                variant="outline"
                                onClick={() => fileRef.current?.click()}
                            >
                                Change Logo
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
                        <span className="text-sm">Active</span>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col sm:flex-row sm:justify-end gap-3 pt-4 border-t">
                        <Button
                            variant="outline"
                            className="w-full sm:w-auto"
                            disabled={loading}
                            onClick={() => navigate("/admin/brands")}
                        >
                            Cancel
                        </Button>

                        <Button
                            className="w-full sm:w-auto"
                            onClick={handleUpdate}
                            disabled={loading || !hasChanges}
                        >
                            {loading
                                ? "Updating…"
                                : hasChanges
                                    ? "Update Brand"
                                    : "No Changes"}
                        </Button>
                    </div>

                </div>
            </div>
        </div>
    );
}