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
        <div className="max-w-2xl space-y-6">
            <h1 className="text-xl font-semibold">Admin Config</h1>

            {/* FLAGS */}
            <div className="space-y-3 border rounded-xl p-4">
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

            {/* AMOUNTS */}
            <div className="space-y-4 border rounded-xl p-4">
                <p className="text-sm font-medium">Wallet Values</p>

                <div>
                    <p className="text-sm">Join Bonus Amount</p>
                    <input
                        className="border rounded-lg px-3 py-2 w-full"
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
                    <p className="text-sm">Referral Reward Amount</p>
                    <input
                        className="border rounded-lg px-3 py-2 w-full"
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

            {/* SLIDER IMAGES */}
            <div className="space-y-4 border rounded-xl p-4">
                <p className="text-sm font-medium">Slider Images</p>

                {form.sliderImages.map((img: any, index: number) => (
                    <div
                        key={img.id}
                        className="border rounded-lg p-3 space-y-2"
                    >
                        {img.imageUrl ? (
                            <img
                                src={img.imageUrl}
                                className="h-24 w-full object-cover rounded-lg border"
                            />
                        ) : (
                            <p className="text-xs text-gray-400">No image uploaded</p>
                        )}
                        <Button
                            variant="outline"
                            type="button"
                            onClick={() => {
                                setUploadIndex(index);
                                fileRef.current?.click();
                            }}
                        >
                            {img.imageUrl ? "Change Image" : "Upload Image"}
                        </Button>
                        <div className="space-y-1">
                            <p className="text-xs font-medium">Title</p>
                            <input
                                className="border rounded-lg px-3 py-2 w-full"
                                placeholder="Enter slider title"
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
                        </div>

                        {/* Remove */}
                        <Button
                            variant="outline"
                            type="button"
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
                    accept="image/*"
                    className="hidden"
                    onChange={handleUploadSlider}
                />
            </div>

            {/* ACTIONS */}
            <div className="flex gap-3">
                <Button onClick={handleSave} disabled={loading}>
                    {loading ? "Saving…" : "Save Config"}
                </Button>

                <Button variant="outline" onClick={() => navigate("/admin")}>
                    Cancel
                </Button>
            </div>
        </div>
    );
}
