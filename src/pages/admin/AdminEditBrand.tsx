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
            <div className="bg-white border rounded-xl p-6 text-sm text-red-500">
                Brand ID missing in URL
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

    /* ================================
       LOAD BRAND DETAILS
    ================================ */
    useEffect(() => {
        const loadBrand = async () => {
            try {
                const res = await getBrandById(brandId);
                const loaded = {
                    name: res.name || "",
                    isActive: res.isActive ?? true,
                    logoUrl: res.logoUrl || "",
                };

                setForm({
                    ...loaded,
                    newLogo: null,
                });

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

    /* ================================
       LOGO CHANGE HANDLER
    ================================ */
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

    /* ================================
       PREVIEW LOGO (WITH CLEANUP)
    ================================ */
    const previewLogo = useMemo(() => {
        if (form.newLogo) {
            return URL.createObjectURL(form.newLogo);
        }
        return form.logoUrl;
    }, [form.newLogo, form.logoUrl]);

    useEffect(() => {
        if (!form.newLogo) return;

        const url = URL.createObjectURL(form.newLogo);

        return () => URL.revokeObjectURL(url);
    }, [form.newLogo]);

    /* ================================
       CHANGE DETECTION
    ================================ */
    const hasChanges = useMemo(() => {
        if (form.name.trim() !== original.name.trim()) return true;
        if (form.isActive !== original.isActive) return true;
        if (form.newLogo) return true;
        return false;
    }, [form, original]);

    /* ================================
       UPDATE BRAND
    ================================ */
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

    /* ================================
       LOADING UI
    ================================ */
    if (fetching) {
        return (
            <div className="max-w-2xl space-y-4">
                <div className="h-6 w-40 bg-gray-200 rounded animate-pulse" />
                <div className="h-10 w-full bg-gray-100 border rounded-lg animate-pulse" />
                <div className="h-24 w-full bg-gray-100 border rounded-xl animate-pulse" />
            </div>
        );
    }

    /* ================================
       MAIN UI
    ================================ */
    return (
        <div className="max-w-2xl space-y-6">
            <h1 className="text-xl font-semibold">Edit Brand</h1>

            {/* Brand Name */}
            <div className="space-y-1">
                <p className="text-sm font-medium">Brand Name</p>
                <input
                    className="border rounded-lg px-3 py-2 w-full"
                    value={form.name}
                    onChange={(e) =>
                        setForm((p) => ({
                            ...p,
                            name: e.target.value,
                        }))
                    }
                />
            </div>

            {/* Brand Logo */}
            <div className="space-y-2">
                <p className="text-sm font-medium">Brand Logo</p>

                <div className="flex flex-col sm:flex-row sm:items-center gap-4 border rounded-xl p-4">
                    {previewLogo ? (
                        <img
                            src={previewLogo}
                            alt="Brand Logo"
                            className="h-20 w-20 rounded-lg object-cover border"
                        />
                    ) : (
                        <div className="h-20 w-20 flex items-center justify-center border rounded-lg text-xs text-gray-400">
                            No Logo
                        </div>
                    )}

                    <div className="flex-1">
                        <p className="text-sm font-medium truncate">
                            {form.newLogo ? form.newLogo.name : "Current Logo"}
                        </p>
                        <p className="text-xs text-gray-500">
                            Only 1 image allowed · Max 2MB
                        </p>
                    </div>

                    {/* Hidden Input */}
                    <input
                        ref={fileRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleLogoChange}
                    />

                    {/* Change Button */}
                    <Button
                        variant="outline"
                        type="button"
                        onClick={() => fileRef.current?.click()}
                        className="w-full sm:w-auto"
                    >
                        Change
                    </Button>
                </div>
            </div>

            {/* Active */}
            <label className="flex items-center gap-2 text-sm">
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
                Active
            </label>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3">
                <Button onClick={handleUpdate} disabled={loading || !hasChanges}>
                    {loading ? "Updating…" : hasChanges ? "Update Brand" : "No Changes"}
                </Button>

                <Button
                    variant="outline"
                    disabled={loading}
                    onClick={() => navigate("/admin/brands")}
                >
                    Cancel
                </Button>
            </div>
        </div>
    );
}