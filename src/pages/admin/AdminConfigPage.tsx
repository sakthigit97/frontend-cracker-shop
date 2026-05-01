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
                    adminEmail: res.adminEmail || "",
                    sliderImages: fixedSliderImages
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

            if (!isValidMobile) {
                showAlert({
                    type: "error",
                    message: "Enter a valid 10-digit mobile number",
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
            setLoading(true);
            const updated = await updateAdminConfig(form);
            setConfig(updated);

            showAlert({
                type: "success",
                message: "Config updated successfully",
            });

            navigate("/admin/configs");
        } catch {
            showAlert({ type: "error", message: "Failed to update config" });
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

                        <input
                            className="border border-gray-300 rounded-lg p-3 w-full"
                            placeholder="Join Bonus Amount"
                            value={form.joinBonusAmount || ""}
                            onChange={(e) =>
                                setForm((p: any) => ({
                                    ...p,
                                    joinBonusAmount: e.target.value,
                                }))
                            }
                        />

                        <input
                            className="border border-gray-300 rounded-lg p-3 w-full"
                            placeholder="Referral Reward Amount"
                            value={form.referralRewardAmount || ""}
                            onChange={(e) =>
                                setForm((p: any) => ({
                                    ...p,
                                    referralRewardAmount: e.target.value,
                                }))
                            }
                        />
                    </div>

                    {/* Orders */}
                    <div className="space-y-4 border border-gray-200 rounded-xl p-4">
                        <p className="text-sm font-medium">Order Values</p>

                        {[
                            ["packagingPercent", "Package Fee (%)"],
                            ["gstPercent", "GST (%)"],
                            ["tnMinOrderValue", "TN Min Order Value"],
                            ["otherStateMinOrderValue", "Other State Min Order Value"],
                        ].map(([key, label]) => (
                            <input
                                key={key}
                                className="border border-gray-300 rounded-lg p-3 w-full"
                                placeholder={label}
                                value={form[key] || ""}
                                onChange={(e) =>
                                    setForm((p: any) => ({
                                        ...p,
                                        [key]: e.target.value,
                                    }))
                                }
                            />
                        ))}
                    </div>

                    {/* Admin Contact */}
                    <div className="space-y-4 border border-gray-200 rounded-xl p-4">
                        <p className="text-sm font-medium">Admin Contact Details</p>

                        <input
                            type="tel"
                            maxLength={10}
                            className="border border-gray-300 rounded-lg p-3 w-full"
                            placeholder="Admin Mobile Number"
                            value={form.adminMobile || ""}
                            onChange={(e) =>
                                setForm((p: any) => ({
                                    ...p,
                                    adminMobile: e.target.value.replace(/\D/g, ""),
                                }))
                            }
                        />

                        <input
                            type="email"
                            className="border border-gray-300 rounded-lg p-3 w-full"
                            placeholder="Admin Email"
                            value={form.adminEmail || ""}
                            onChange={(e) =>
                                setForm((p: any) => ({
                                    ...p,
                                    adminEmail: e.target.value,
                                }))
                            }
                        />
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
