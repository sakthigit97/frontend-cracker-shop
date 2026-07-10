import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../../components/ui/Button";
import { useAlert } from "../../store/alert.store";
import { fetchGlobalConfig } from "../../services/config.api";
import { updateAdminConfig, getSliderPresign } from "../../services/adminConfig.api";
import { uploadFilesToS3 } from "../../utils/uploadToS3";
import { useConfigStore } from "../../store/config.store";

const MAX_IMAGE_SIZE = 3 * 1024 * 1024;
export default function AdminConfigPage() {
    const navigate = useNavigate();
    const { showAlert } = useAlert();
    const config = useConfigStore((s) => s.config);
    const setConfig = useConfigStore((s) => s.setConfig);
    const [fetching, setFetching] = useState(true);
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState<any>(null);
    const fileRef = useRef<HTMLInputElement | null>(null);
    const [uploadIndex, setUploadIndex] = useState<number | null>(null);
    const packageFileRef = useRef<HTMLInputElement | null>(null);
    const [packageUploadIndex, setPackageUploadIndex] = useState<number | null>(null);

    useEffect(() => {
        const load = async () => {
            try {
                const res = config ? config : await fetchGlobalConfig();
                const fixedSliderImages = (res.sliderImages || []).map((s: any) => ({
                    id: s.id || crypto.randomUUID(),
                    imageUrl: s.imageUrl || "",
                    title: s.title || ""
                }));

                setConfig(res);
                setForm({
                    ...res,
                    adminMobile: res.adminMobile || "",
                    adminWhatsapp: res.adminWhatsapp || "",
                    adminEmail: res.adminEmail || "",
                    adminAddress: res.adminAddress || "",
                    disableGstForTN: res.disableGstForTN || false,
                    sliderImages: fixedSliderImages,
                    packageTags: res.packageTags || [],
                    aiTags: res.aiTags || [],
                });
            } catch {
                showAlert({ type: "error", message: "Failed to load config" });
            } finally {
                setFetching(false);
            }
        };

        load();
    }, []);

    const handleUploadSlider = async (e: any) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > MAX_IMAGE_SIZE) {
            showAlert({
                type: "error",
                message: "Image must be under 3MB",
            });
            return;
        }

        try {
            if (uploadIndex === null) return;
            const presign = await getSliderPresign({
                fileName: file.name,
                contentType: file.type,
            });

            await uploadFilesToS3([{ uploadUrl: presign.uploadUrl }], [file]);
            setForm((prev: any) => {
                const updated = [...prev.sliderImages];
                updated[uploadIndex].imageUrl = presign.fileUrl;
                return { ...prev, sliderImages: updated };
            });
        } catch {
            showAlert({
                type: "error",
                message: "Upload failed",
            });
        }
    };

    const addPackageTag = () => {
        setForm((prev: any) => ({
            ...prev,
            packageTags: [
                ...(prev.packageTags || []),
                {
                    id: crypto.randomUUID(),
                    name: "",
                    imageUrl: "",
                },
            ],
        }));
    };

    const removePackageTag = (index: number) => {
        setForm((prev: any) => ({
            ...prev,
            packageTags: prev.packageTags.filter(
                (_: any, i: number) => i !== index
            ),
        }));
    };

    const addAiTag = () => {
        setForm((prev: any) => ({
            ...prev,
            aiTags: [
                ...(prev.aiTags || []),
                {
                    id: crypto.randomUUID(),
                    name: "",
                },
            ],
        }));
    };

    const removeAiTag = (index: number) => {
        setForm((prev: any) => ({
            ...prev,
            aiTags: prev.aiTags.filter(
                (_: any, i: number) => i !== index
            ),
        }));
    };

    const handleUploadPackageImage = async (e: any) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > MAX_IMAGE_SIZE) {
            showAlert({
                type: "error",
                message: "Image must be under 3MB",
            });
            return;
        }

        try {
            if (packageUploadIndex === null) return;

            const presign = await getSliderPresign({
                fileName: file.name,
                contentType: file.type,
            });

            await uploadFilesToS3(
                [{ uploadUrl: presign.uploadUrl }],
                [file]
            );

            setForm((prev: any) => {
                const updated = [...(prev.packageTags || [])];

                updated[packageUploadIndex].imageUrl =
                    presign.fileUrl;

                return {
                    ...prev,
                    packageTags: updated,
                };
            });
        } catch {
            showAlert({
                type: "error",
                message: "Upload failed",
            });
        }
    };

    const addSlider = () => {
        setForm((prev: any) => ({
            ...prev,
            sliderImages: [
                ...(prev.sliderImages || []),
                {
                    id: crypto.randomUUID(),
                    imageUrl: "",
                    title: "",
                },
            ],
        }));
    };

    const removeSlider = (index: number) => {
        setForm((prev: any) => ({
            ...prev,
            sliderImages: prev.sliderImages.filter((_: any, i: number) => i !== index),
        }));
    };

    const handleSave = async () => {
        try {
            const isValidMobile = /^[6-9]\d{9}$/.test(form.adminMobile);
            const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.adminEmail);
            const isValidWhatsapp = /^[6-9]\d{9}$/.test(form.adminWhatsapp);

            if (!isValidMobile) {
                showAlert({
                    type: "error",
                    message: "Enter a valid 10-digit mobile number",
                });
                return;
            }

            if (!isValidWhatsapp) {
                showAlert({
                    type: "error",
                    message: "Enter valid WhatsApp number",
                });
                return;
            }

            if (!isValidEmail) {
                showAlert({
                    type: "error",
                    message: "Enter a valid email address",
                });
                return;
            }

            const invalidPackage = (form.packageTags || []).some(
                (p: any) => !p.name?.trim()
            );

            if (invalidPackage) {
                showAlert({
                    type: "error",
                    message: "Package name is required",
                });
                return;
            }

            const names = (form.packageTags || []).map(
                (p: any) => p.name.trim().toLowerCase()
            );

            if (new Set(names).size !== names.length) {
                showAlert({
                    type: "error",
                    message: "Duplicate package names are not allowed",
                });
                return;
            }

            const invalidAiTag = (form.aiTags || []).some(
                (t: any) => !t.name?.trim()
            );

            if (invalidAiTag) {
                showAlert({
                    type: "error",
                    message: "AI Tag name is required",
                });
                return;
            }
            const aiNames = (form.aiTags || []).map(
                (t: any) => t.name.trim().toLowerCase()
            );

            if (new Set(aiNames).size !== aiNames.length) {
                showAlert({
                    type: "error",
                    message: "Duplicate AI Tags are not allowed",
                });
                return;
            }

            setLoading(true);

            const payload = {
                ...form,
                packageTags: (form.packageTags || []).map(
                    (p: any) => ({
                        id: p.name
                            .trim()
                            .toLowerCase()
                            .replace(/\s+/g, "-"),
                        name: p.name.trim(),
                        imageUrl: p.imageUrl || "",
                    })
                ),
                aiTags: (form.aiTags || []).map(
                    (t: any) => ({
                        id: t.name
                            .trim()
                            .toLowerCase()
                            .replace(/\s+/g, "-"),
                        name: t.name.trim(),
                    })
                ),
            };

            const updated = await updateAdminConfig(payload);

            setConfig(updated);

            showAlert({
                type: "success",
                message: "Config updated successfully",
            });

            navigate("/admin/configs");
        } catch {
            showAlert({
                type: "error",
                message: "Failed to update config",
            });
        } finally {
            setLoading(false);
        }
    };

    if (fetching || !form) {
        return <div className="max-w-2xl">Loading...</div>;
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
                                Admin Configs
                            </h1>
                        </div>

                        <p className="text-sm text-gray-500">
                            Manage platform settings and configurations
                        </p>
                    </div>

                    {/* Feature Toggles */}
                    <div className="space-y-3 border border-gray-200 rounded-xl p-4">
                        <p className="text-sm font-medium">Feature Toggles</p>

                        {[
                            ["isPaymentEnabled", "Payment Enabled"],
                            ["isReferralEnabled", "Referral Enabled"],
                            ["isJoinBonusEnabled", "Join Bonus Enabled"],
                            ["isEmailEnabled", "Email Enabled"],
                            ["isSmsEnabled", "SMS Enabled"],
                        ].map(([key, label]) => (
                            <label key={key} className="flex items-center gap-2 text-sm">
                                <input
                                    type="checkbox"
                                    checked={form[key]}
                                    onChange={(e) =>
                                        setForm((p: any) => ({
                                            ...p,
                                            [key]: e.target.checked,
                                        }))
                                    }
                                />
                                {label}
                            </label>
                        ))}
                    </div>

                    {/* Wallet */}
                    <div className="space-y-4 border border-gray-200 rounded-xl p-4">
                        <p className="text-sm font-medium">Wallet Values</p>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Join Bonus Amount
                            </label>

                            <input
                                className="border border-gray-300 rounded-lg p-3 w-full"
                                value={form.joinBonusAmount || ""}
                                onChange={(e) =>
                                    setForm((p: any) => ({
                                        ...p,
                                        joinBonusAmount: e.target.value,
                                    }))
                                }
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Referral Reward Amount
                            </label>

                            <input
                                className="border border-gray-300 rounded-lg p-3 w-full"
                                value={form.referralRewardAmount || ""}
                                onChange={(e) =>
                                    setForm((p: any) => ({
                                        ...p,
                                        referralRewardAmount: e.target.value,
                                    }))
                                }
                            />
                        </div>
                    </div>

                    {/* Orders */}
                    <div className="space-y-4 border border-gray-200 rounded-xl p-4">
                        <p className="text-sm font-medium">Order Values</p>
                        {[
                            ["packagingPercent", "Package Fee (%)"],
                            ["gstPercent", "GST (%)"],
                            ["tnMinOrderValue", "TN Minimum Order Value"],
                            ["otherStateMinOrderValue", "Other State Minimum Order Value"],
                        ].map(([key, label]) => (
                            <div key={key}>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    {label}
                                </label>

                                <input
                                    className="border border-gray-300 rounded-lg p-3 w-full"
                                    value={form[key] || ""}
                                    onChange={(e) =>
                                        setForm((p: any) => ({
                                            ...p,
                                            [key]: e.target.value,
                                        }))
                                    }
                                />
                            </div>
                        ))}
                    </div>

                    {/* Admin Contact */}
                    <div className="space-y-4 border border-gray-200 rounded-xl p-4">
                        <p className="text-sm font-medium">
                            Admin Contact Details
                        </p>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Admin Mobile Number
                            </label>

                            <input
                                type="tel"
                                maxLength={10}
                                className="border border-gray-300 rounded-lg p-3 w-full"
                                value={form.adminMobile || ""}
                                onChange={(e) =>
                                    setForm((p: any) => ({
                                        ...p,
                                        adminMobile: e.target.value.replace(/\D/g, ""),
                                    }))
                                }
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Admin WhatsApp Number
                            </label>

                            <input
                                type="tel"
                                maxLength={10}
                                className="border border-gray-300 rounded-lg p-3 w-full"
                                value={form.adminWhatsapp || ""}
                                onChange={(e) =>
                                    setForm((p: any) => ({
                                        ...p,
                                        adminWhatsapp: e.target.value.replace(/\D/g, ""),
                                    }))
                                }
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Admin Email Address
                            </label>

                            <input
                                type="email"
                                className="border border-gray-300 rounded-lg p-3 w-full"
                                value={form.adminEmail || ""}
                                onChange={(e) =>
                                    setForm((p: any) => ({
                                        ...p,
                                        adminEmail: e.target.value,
                                    }))
                                }
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Admin Address
                            </label>

                            <textarea
                                rows={4}
                                className="border border-gray-300 rounded-lg p-3 w-full resize-none"
                                value={form.adminAddress || ""}
                                onChange={(e) =>
                                    setForm((p: any) => ({
                                        ...p,
                                        adminAddress: e.target.value,
                                    }))
                                }
                            />
                        </div>

                        <label className="flex items-center gap-2 text-sm">
                            <input
                                type="checkbox"
                                checked={form.disableGstForTN || false}
                                onChange={(e) =>
                                    setForm((p: any) => ({
                                        ...p,
                                        disableGstForTN: e.target.checked,
                                    }))
                                }
                            />

                            Disable GST for Tamil Nadu
                        </label>
                    </div>

                    {/* Slider */}
                    <div className="space-y-4 border border-gray-200 rounded-xl p-4">
                        <p className="text-sm font-medium">Slider Images</p>

                        {form.sliderImages.map((img: any, index: number) => (
                            <div key={img.id} className="border rounded-xl p-4 space-y-3 bg-gray-50">

                                {img.imageUrl ? (
                                    <img
                                        src={img.imageUrl}
                                        className="h-24 w-full object-cover rounded-lg border"
                                    />
                                ) : (
                                    <p className="text-xs text-gray-400">
                                        No image uploaded
                                    </p>
                                )}

                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setUploadIndex(index);
                                        fileRef.current?.click();
                                    }}
                                >
                                    {img.imageUrl ? "Change Image" : "Upload Image"}
                                </Button>

                                <input
                                    className="border border-gray-300 rounded-lg p-3 w-full"
                                    placeholder="Slider title"
                                    value={img.title || ""}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        setForm((prev: any) => {
                                            const updated = [...prev.sliderImages];
                                            updated[index].title = value;
                                            return { ...prev, sliderImages: updated };
                                        });
                                    }}
                                />

                                <Button
                                    variant="outline"
                                    onClick={() => removeSlider(index)}
                                >
                                    Remove
                                </Button>
                            </div>
                        ))}

                        <Button variant="outline" onClick={addSlider}>
                            + Add Slider Image
                        </Button>

                        <input
                            ref={fileRef}
                            type="file"
                            className="hidden"
                            onChange={handleUploadSlider}
                        />
                    </div>

                    <div className="space-y-4 border border-gray-200 rounded-xl p-4">
                        <p className="text-sm font-medium">
                            Package Tags
                        </p>

                        {(form.packageTags || []).map(
                            (tag: any, index: number) => (
                                <div
                                    key={tag.id}
                                    className="
                    border
                    rounded-xl
                    p-4
                    space-y-3
                    bg-gray-50
                "
                                >
                                    {tag.imageUrl ? (
                                        <img
                                            src={tag.imageUrl}
                                            className="
                            h-24
                            w-full
                            object-cover
                            rounded-lg
                            border
                        "
                                        />
                                    ) : (
                                        <p className="text-xs text-gray-400">
                                            No image uploaded
                                        </p>
                                    )}

                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            setPackageUploadIndex(index);
                                            packageFileRef.current?.click();
                                        }}
                                    >
                                        {tag.imageUrl
                                            ? "Change Image"
                                            : "Upload Image"}
                                    </Button>

                                    <input
                                        className="
                        border
                        border-gray-300
                        rounded-lg
                        p-3
                        w-full
                    "
                                        placeholder="Package Name"
                                        value={tag.name || ""}
                                        onChange={(e) => {
                                            const value =
                                                e.target.value;

                                            setForm((prev: any) => {
                                                const updated = [
                                                    ...prev.packageTags,
                                                ];

                                                updated[index].name =
                                                    value;

                                                return {
                                                    ...prev,
                                                    packageTags:
                                                        updated,
                                                };
                                            });
                                        }}
                                    />

                                    <Button
                                        variant="outline"
                                        onClick={() =>
                                            removePackageTag(index)
                                        }
                                    >
                                        Remove
                                    </Button>
                                </div>
                            )
                        )}

                        <Button
                            variant="outline"
                            onClick={addPackageTag}
                        >
                            + Add Package Tag
                        </Button>

                        <input
                            ref={packageFileRef}
                            type="file"
                            className="hidden"
                            onChange={handleUploadPackageImage}
                        />
                    </div>

                    <div className="space-y-4 border border-gray-200 rounded-xl p-4">

                        <p className="text-sm font-medium">
                            AI Tags
                        </p>

                        {(form.aiTags || []).map(
                            (tag: any, index: number) => (
                                <div
                                    key={tag.id}
                                    className="border rounded-xl p-4 space-y-3 bg-gray-50"
                                >

                                    <input
                                        className="border border-gray-300 rounded-lg p-3 w-full"
                                        placeholder="AI Tag Name"
                                        value={tag.name || ""}
                                        onChange={(e) => {

                                            const value = e.target.value;

                                            setForm((prev: any) => {

                                                const updated = [...prev.aiTags];

                                                updated[index].name = value;

                                                return {
                                                    ...prev,
                                                    aiTags: updated,
                                                };
                                            });
                                        }}
                                    />

                                    <Button
                                        variant="outline"
                                        onClick={() => removeAiTag(index)}
                                    >
                                        Remove
                                    </Button>

                                </div>
                            )
                        )}

                        <Button
                            variant="outline"
                            onClick={addAiTag}
                        >
                            + Add AI Tag
                        </Button>

                    </div>

                    {/* Actions */}
                    <div className="flex flex-col sm:flex-row sm:justify-end gap-3 pt-4 border-t">
                        <Button
                            variant="outline"
                            className="w-full sm:w-auto"
                            onClick={() => navigate("/admin")}
                        >
                            Cancel
                        </Button>

                        <Button
                            className="w-full sm:w-auto"
                            onClick={handleSave}
                            disabled={loading}
                        >
                            {loading ? "Saving…" : "Save Config"}
                        </Button>
                    </div>

                </div>
            </div>
        </div>
    );
}
