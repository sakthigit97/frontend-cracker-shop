import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../../components/ui/Button";
import { useAlert } from "../../store/alert.store";
import { updateAdminConfig, getSliderPresign } from "../../services/adminConfig.api";
import { uploadFilesToS3 } from "../../utils/uploadToS3";
import { useConfigStore } from "../../store/config.store";

const MAX_IMAGE_SIZE = 3 * 1024 * 1024;
export default function AdminConfigPage() {
    const navigate = useNavigate();
    const { showAlert } = useAlert();
    const refreshConfig = useConfigStore((s) => s.refreshConfig);
    const [fetching, setFetching] = useState(true);
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState<any>(null);
    const fileRef = useRef<HTMLInputElement | null>(null);
    const [uploadIndex, setUploadIndex] = useState<number | null>(null);
    const packageFileRef = useRef<HTMLInputElement | null>(null);
    const [packageUploadIndex, setPackageUploadIndex] = useState<number | null>(null);
    const whatsAppFileRef = useRef<HTMLInputElement | null>(null);
    const [whatsAppUploadIndex, setWhatsAppUploadIndex] = useState<number | null>(null);

    useEffect(() => {
        const load = async () => {
            try {
                await refreshConfig();
                const res = useConfigStore.getState().config;

                if (!res) {
                    throw new Error("Config not available");
                }

                const fixedSliderImages = (res.sliderImages || []).map((s: any) => ({
                    id: s.id || crypto.randomUUID(),
                    imageUrl: s.imageUrl || "",
                    title: s.title || "",
                    imageFile: null,
                    previewUrl: "",
                    imageChanged: false,
                }));
                setForm({
                    ...res,
                    adminMobile: res.adminMobile || "",
                    adminWhatsapp: res.adminWhatsapp || "",
                    adminEmail: res.adminEmail || "",
                    adminAddress: res.adminAddress || "",
                    gmapLink: res.gmapLink || "",
                    displayMobile: res.displayMobile || "",
                    website: res.website || "",
                    disableGstForTN: res.disableGstForTN || false,
                    bulkOrderSchemes: (res.bulkOrderSchemes || []).map(
                        (scheme: any) => ({
                            schemeId: scheme.schemeId || "",
                            schemeName: scheme.schemeName || "",
                            minAmount: scheme.minAmount ?? 0,
                            maxAmount: scheme.maxAmount ?? 0,
                            isAdminApprovalRequired:
                                scheme.isAdminApprovalRequired ?? false,
                            bulkPriceAdjustmentPercent:
                                scheme.bulkPriceAdjustmentPercent,
                            bulkPriceAdjustmentType:
                                scheme.bulkPriceAdjustmentType,
                            isActive: scheme.isActive ?? true,
                            sortOrder: scheme.sortOrder ?? 0,
                        })
                    ),
                    sliderImages: fixedSliderImages,
                    packageTags: (res.packageTags || []).map((p: any) => ({
                        ...p,
                        productId: p.productId || "",
                        imageFile: null,
                        previewUrl: "",
                        imageChanged: false,
                    })),
                    aiTags: (res.aiTags || []).map((category: any) => ({
                        ...category,
                        options: category.options || [],
                    })),
                    whatsAppSupport: {
                        enabled: res.whatsAppSupport?.enabled ?? true,
                        autoOpenDelay: res.whatsAppSupport?.autoOpenDelay ?? 1000,
                        autoCloseAfter: res.whatsAppSupport?.autoCloseAfter ?? 8000,
                        title: res.whatsAppSupport?.title ?? "WhatsApp Support",
                        subtitle: res.whatsAppSupport?.subtitle ?? "Choose an expert to chat",
                        contacts: (res.whatsAppSupport?.contacts || []).map((c: any) => ({
                            ...c,
                            imageFile: null,
                            previewUrl: "",
                            imageChanged: false
                        })),
                    },
                });
            } catch {
                showAlert({ type: "error", message: "Failed to load config" });
            } finally {
                setFetching(false);
            }
        };

        load();
    }, [refreshConfig]);

    const createPreview = (file: File) => URL.createObjectURL(file);
    const validateImage = (
        file: File
    ) => {

        if (!file.type.startsWith("image/")) {
            showAlert({
                type: "error",
                message: "Please select an image."
            });
            return false;
        }

        if (file.size > MAX_IMAGE_SIZE) {

            showAlert({

                type: "error",

                message: "Image must be under 3MB",

            });

            return false;

        }
        return true;
    };

    const handleUploadSlider = (e: React.ChangeEvent<HTMLInputElement>) => {

        const file = e.target.files?.[0];

        if (!file) return;

        if (!validateImage(file)) {
            return;
        }

        if (uploadIndex === null) return;

        const previewUrl = createPreview(file);
        setForm((prev: any) => {
            const sliderImages = [...prev.sliderImages];
            sliderImages[uploadIndex] = {
                ...sliderImages[uploadIndex],
                imageFile: file,
                previewUrl,
                imageChanged: true,
            };

            return {
                ...prev,
                sliderImages,
            };

        });

        e.target.value = "";
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
                    productId: "",
                    imageFile: null,
                    previewUrl: "",
                    imageChanged: false,
                }
            ],
        }));
    };

    const addWhatsAppContact = () => {
        setForm((prev: any) => ({
            ...prev,
            whatsAppSupport: {
                ...prev.whatsAppSupport,
                contacts: [
                    ...(prev.whatsAppSupport?.contacts || []),
                    {
                        id: crypto.randomUUID(),
                        name: "",
                        role: "",
                        phone: "",
                        image: "",
                        message: "",
                        imageFile: null,
                        previewUrl: "",
                        imageChanged: false,
                    }
                ],
            },
        }));
    };

    const removeWhatsAppContact = (index: number) => {
        setForm((prev: any) => ({
            ...prev,
            whatsAppSupport: {
                ...prev.whatsAppSupport,
                contacts:
                    prev.whatsAppSupport.contacts.filter(
                        (_: any, i: number) => i !== index
                    ),
            },
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
                    options: [
                        {
                            id: crypto.randomUUID(),
                            name: "",
                        },
                    ]
                }
            ]
        }));
    }

    const removeAiTag = (index: number) => {
        setForm((prev: any) => ({
            ...prev,
            aiTags: prev.aiTags.filter((_: any, i: number) => i !== index),
        }));
    };

    const removeAiTagOption = (
        categoryIndex: number,
        optionIndex: number
    ) => {
        setForm((prev: any) => {
            const updated = [...prev.aiTags];

            updated[categoryIndex].options =
                updated[categoryIndex].options.filter(
                    (_: any, i: number) => i !== optionIndex
                );

            return {
                ...prev,
                aiTags: updated,
            };
        });
    };

    const updateAiTagName = (
        categoryIndex: number,
        value: string
    ) => {
        setForm((prev: any) => {
            const updated = [...prev.aiTags];

            updated[categoryIndex].name = value;

            return {
                ...prev,
                aiTags: updated,
            };
        });
    };


    const updateAiTagOption = (
        categoryIndex: number,
        optionIndex: number,
        value: string
    ) => {
        setForm((prev: any) => {
            const updated = [...prev.aiTags];

            updated[categoryIndex].options[optionIndex].name = value;

            return {
                ...prev,
                aiTags: updated,
            };
        });
    };

    const addAiTagOption = (categoryIndex: number) => {
        setForm((prev: any) => {
            const updated = [...prev.aiTags];

            updated[categoryIndex].options = [
                ...(updated[categoryIndex].options || []),
                {
                    id: crypto.randomUUID(),
                    name: "",
                },
            ];

            return {
                ...prev,
                aiTags: updated,
            };
        });
    };

    const handleUploadPackageImage = (
        e: React.ChangeEvent<HTMLInputElement>
    ) => {

        const file = e.target.files?.[0];

        if (!file) return;


        if (!validateImage(file)) {
            return;
        }

        if (packageUploadIndex === null) return;

        const previewUrl = createPreview(file);

        setForm((prev: any) => {

            const packageTags = [...prev.packageTags];

            packageTags[packageUploadIndex] = {

                ...packageTags[packageUploadIndex],

                imageFile: file,

                previewUrl,

                imageChanged: true,

            };

            return {
                ...prev,
                packageTags,
            };

        });

        e.target.value = "";
    };

    const handleUploadWhatsAppImage = (
        e: React.ChangeEvent<HTMLInputElement>
    ) => {

        const file = e.target.files?.[0];

        if (!file) return;

        if (!validateImage(file)) {
            return;
        }

        if (whatsAppUploadIndex === null) return;

        const previewUrl = createPreview(file);

        setForm((prev: any) => {

            const contacts = [
                ...(prev.whatsAppSupport?.contacts || []),
            ];

            contacts[whatsAppUploadIndex] = {

                ...contacts[whatsAppUploadIndex],

                imageFile: file,

                previewUrl,

                imageChanged: true,

            };

            return {

                ...prev,

                whatsAppSupport: {

                    ...prev.whatsAppSupport,

                    contacts,

                },

            };

        });

        e.target.value = "";

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
                    imageFile: null,
                    previewUrl: "",
                    imageChanged: false,
                }
            ],
        }));
    };

    const removeSlider = (index: number) => {
        setForm((prev: any) => ({
            ...prev,
            sliderImages: prev.sliderImages.filter((_: any, i: number) => i !== index),
        }));
    };

    const slug = (value: string) =>
        value
            .trim()
            .toLowerCase()
            .replace(/\s+/g, "-");


    const uploadPendingImages = async (
        items: any[],
        imageKey: "imageUrl" | "image",
    ) => {

        const updated = [...items];

        for (let i = 0; i < updated.length; i++) {

            const item = updated[i];

            if (!item.imageChanged || !item.imageFile) {
                continue;
            }

            const presign = await getSliderPresign({
                fileName: item.imageFile.name,
                contentType: item.imageFile.type,
            });

            await uploadFilesToS3(
                [
                    {
                        uploadUrl: presign.uploadUrl,
                    },
                ],
                [item.imageFile],
                true
            );

            updated[i] = {
                ...item,
                [imageKey]: presign.fileUrl,
                imageFile: null,
                previewUrl: "",
                imageChanged: false,
                oldImageUrl: item[imageKey] || "",
            };
        }
        return updated;
    };

    const addBulkScheme = () => {
        setForm((prev: any) => {
            const schemes = prev.bulkOrderSchemes || [];

            const nextNumber = schemes.length + 1;

            return {
                ...prev,
                bulkOrderSchemes: [
                    ...schemes,
                    {
                        schemeId: `SCHEME${nextNumber}`,
                        schemeName: "",
                        minAmount: 0,
                        maxAmount: 0,
                        isAdminApprovalRequired: false,
                        bulkPriceAdjustmentPercent: undefined,
                        bulkPriceAdjustmentType: undefined,
                        isActive: true,
                        sortOrder: nextNumber,
                    },
                ],
            };
        });
    };

    const updateBulkScheme = (
        index: number,
        changes: Record<string, any>
    ) => {
        setForm((prev: any) => {
            const updated = [...(prev.bulkOrderSchemes || [])];

            updated[index] = {
                ...updated[index],
                ...changes,
            };

            return {
                ...prev,
                bulkOrderSchemes: updated,
            };
        });
    };

    const validateBulkOrderSchemes = (): boolean => {
        const schemes = form.bulkOrderSchemes || [];

        const schemeIds = new Set<string>();

        for (let i = 0; i < schemes.length; i++) {
            const scheme = schemes[i];

            const schemeNumber = i + 1;

            // Scheme ID
            if (!scheme.schemeId?.trim()) {
                alert(`Scheme ${schemeNumber}: Scheme ID is required.`);
                return false;
            }

            const schemeId =
                scheme.schemeId.trim().toUpperCase();

            if (schemeIds.has(schemeId)) {
                alert(
                    `Duplicate Scheme ID "${schemeId}". Scheme IDs must be unique.`
                );
                return false;
            }

            schemeIds.add(schemeId);

            // Scheme Name
            if (!scheme.schemeName?.trim()) {
                alert(
                    `Scheme ${schemeNumber}: Scheme Name is required.`
                );
                return false;
            }

            // Minimum Amount
            if (
                scheme.minAmount === "" ||
                scheme.minAmount === undefined ||
                scheme.minAmount === null ||
                Number(scheme.minAmount) < 0
            ) {
                alert(
                    `${scheme.schemeName}: Minimum Order Amount is required.`
                );
                return false;
            }

            // Maximum Amount
            if (
                scheme.maxAmount === "" ||
                scheme.maxAmount === undefined ||
                scheme.maxAmount === null ||
                Number(scheme.maxAmount) <= 0
            ) {
                alert(
                    `${scheme.schemeName}: Maximum Order Amount is required.`
                );
                return false;
            }

            // Max must be greater than Min
            if (
                Number(scheme.maxAmount) <=
                Number(scheme.minAmount)
            ) {
                alert(
                    `${scheme.schemeName}: Maximum Order Amount must be greater than Minimum Order Amount.`
                );
                return false;
            }

            // Adjustment validation
            if (scheme.bulkPriceAdjustmentType) {
                const percent =
                    scheme.bulkPriceAdjustmentPercent;

                if (
                    percent === undefined ||
                    percent === null ||
                    percent === "" ||
                    Number(percent) <= 0
                ) {
                    alert(
                        `${scheme.schemeName}: Adjustment Percentage is required when an adjustment type is selected.`
                    );
                    return false;
                }

                if (Number(percent) > 100) {
                    alert(
                        `${scheme.schemeName}: Adjustment Percentage cannot be greater than 100%.`
                    );
                    return false;
                }
            }
        }

        return true;
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

            if (form.website && !/^https?:\/\/.+/i.test(form.website)) {
                showAlert({
                    type: "error",
                    message: "Enter a valid website URL",
                });
                return;
            }

            if (form.gmapLink && !/^https?:\/\/.+/i.test(form.gmapLink)) {
                showAlert({
                    type: "error",
                    message: "Enter a valid Google Maps URL",
                });
                return;
            }

            const names = (form.packageTags || []).map((p: any) =>
                p.name.trim().toLowerCase()
            );

            if (new Set(names).size !== names.length) {
                showAlert({
                    type: "error",
                    message: "Duplicate package names are not allowed",
                });
                return;
            }

            const rewardAmount = Number(form.referralRewardAmount);

            if (
                form.referralRewardType === "PERCENT" &&
                (rewardAmount < 0 || rewardAmount > 100)
            ) {
                showAlert({
                    type: "error",
                    message:
                        "Referral reward percentage must be between 0 and 100",
                });
                return;
            }

            if (
                form.referralRewardType === "FLAT" &&
                rewardAmount < 0
            ) {
                showAlert({
                    type: "error",
                    message:
                        "Referral reward amount cannot be negative",
                });
                return;
            }

            const aiCategories = form.aiTags || [];
            const invalidCategory = aiCategories.some(
                (c: any) => !c.name?.trim()
            );

            if (invalidCategory) {
                showAlert({
                    type: "error",
                    message: "Category name is required",
                });
                return;
            }

            const categoryNames = aiCategories.map((c: any) =>
                c.name.trim().toLowerCase()
            );

            if (
                new Set(categoryNames).size !== categoryNames.length
            ) {
                showAlert({
                    type: "error",
                    message:
                        "Duplicate category names are not allowed",
                });
                return;
            }

            for (const category of aiCategories) {

                if (!category.options?.length) {
                    showAlert({
                        type: "error",
                        message: `Category "${category.name}" must have at least one option`,
                    });
                    return;
                }

                const invalidOption = category.options.some(
                    (o: any) => !o.name?.trim()
                );

                if (invalidOption) {
                    showAlert({
                        type: "error",
                        message: `Option name is required in "${category.name}"`,
                    });
                    return;
                }

                const optionNames = category.options.map((o: any) =>
                    o.name.trim().toLowerCase()
                );

                if (
                    new Set(optionNames).size !== optionNames.length
                ) {
                    showAlert({
                        type: "error",
                        message: `Duplicate options found in "${category.name}"`,
                    });
                    return;
                }
            }

            const contacts = form.whatsAppSupport?.contacts || [];
            for (const contact of contacts) {

                if (!contact.name?.trim()) {
                    showAlert({
                        type: "error",
                        message: "WhatsApp contact name is required",
                    });
                    return;
                }

                if (!contact.phone?.trim()) {
                    showAlert({
                        type: "error",
                        message: "WhatsApp number is required",
                    });
                    return;
                }

                if (!/^\d{12}$/.test(contact.phone)) {
                    showAlert({
                        type: "error",
                        message:
                            "WhatsApp number must include country code. Example: 91999....",
                    });
                    return;
                }
            }

            if (!validateBulkOrderSchemes()) {
                return;
            }

            setLoading(true);
            const uploadedSliderImages =
                await uploadPendingImages(
                    form.sliderImages,
                    "imageUrl"
                );

            const uploadedPackageTags =
                await uploadPendingImages(
                    form.packageTags,
                    "imageUrl"
                );

            const uploadedWhatsAppContacts =
                await uploadPendingImages(
                    form.whatsAppSupport?.contacts || [],
                    "image"
                );

            const payload = {
                ...form,

                sliderImages: uploadedSliderImages.map(
                    (img: any) => ({
                        id: img.id,
                        title: img.title,
                        imageUrl: img.imageUrl,
                    })
                ),

                packageTags:
                    (uploadedPackageTags || []).map(
                        (p: any) => ({
                            id: slug(p.name),
                            name: p.name.trim(),
                            imageUrl: p.imageUrl || "",
                            productId: p.productId.trim(),
                        })
                    ),

                aiTags: (form.aiTags || []).map(
                    (category: any) => {

                        const categoryId = slug(category.name);

                        return {
                            id: categoryId,
                            name: category.name.trim(),

                            options: (
                                category.options || []
                            ).map((option: any) => ({
                                id: `${categoryId}:${slug(
                                    option.name
                                )}`,
                                name: option.name.trim(),
                            })),
                        };
                    }
                ),

                whatsAppSupport: {
                    ...form.whatsAppSupport,
                    contacts: uploadedWhatsAppContacts.map(
                        ({
                            imageFile,
                            previewUrl,
                            imageChanged,
                            ...contact
                        }: any) => contact
                    ),

                },
            };

            await updateAdminConfig(payload);
            await refreshConfig();
            const latest = useConfigStore.getState().config;
            if (!latest) {
                throw new Error("Failed to refresh config");
            }

            setForm((prev: any) => ({
                ...prev,
                ...latest,
                sliderImages: uploadedSliderImages,
                packageTags: uploadedPackageTags,
                whatsAppSupport: {
                    ...latest.whatsAppSupport,
                    contacts: uploadedWhatsAppContacts,
                },
            }));

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
                    <div className="space-y-6 border border-gray-200 rounded-xl p-4">

                        <div>
                            <p className="text-sm font-semibold mb-3">
                                General Features
                            </p>

                            <div className="grid md:grid-cols-2 gap-3">
                                {[
                                    ["isPaymentEnabled", "Payment Enabled"],
                                    ["isReferralEnabled", "Referral Enabled"],
                                    ["isJoinBonusEnabled", "Join Bonus Enabled"],
                                    ["isEmailEnabled", "Email Enabled"],
                                    ["isSmsEnabled", "SMS Enabled"],
                                ].map(([key, label]) => (
                                    <label
                                        key={key}
                                        className="flex items-center gap-2 text-sm"
                                    >
                                        <input
                                            type="checkbox"
                                            checked={!!form[key]}
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
                        </div>

                        <hr />

                        <div>
                            <p className="text-sm font-semibold mb-3">
                                Email Features
                            </p>

                            <div className="grid md:grid-cols-2 gap-3">
                                {[
                                    ["isEstimateEmailEnabled", "Estimate Email"],
                                ].map(([key, label]) => (
                                    <label
                                        key={key}
                                        className="flex items-center gap-2 text-sm"
                                    >
                                        <input
                                            type="checkbox"
                                            checked={!!form[key]}
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
                        </div>

                        <hr />

                        <div>
                            <p className="text-sm font-semibold mb-3">
                                SMS / OTP Features
                            </p>

                            <div className="grid md:grid-cols-2 gap-3">
                                {[
                                    ["isRegisterOTPEnabled", "Register OTP"],
                                    ["isForgotOTPEnabled", "Forgot Password OTP"],
                                    ["isOrderPlaceSMSEnabled", "Order Placed SMS"],
                                    ["IsOrderConfirmSMSEnabled", "Order Confirm SMS"],
                                    ["isOrderDispatchSMSEnabled", "Order Dispatch SMS"],
                                    ["isPaidSMSEnabled", "Payment Success SMS"],
                                    ["isCartUpdateSMSEnabled", "Cart Update SMS"],
                                ].map(([key, label]) => (
                                    <label
                                        key={key}
                                        className="flex items-center gap-2 text-sm"
                                    >
                                        <input
                                            type="checkbox"
                                            checked={!!form[key]}
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
                        </div>

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
                                Referral Reward Type
                            </label>

                            <select
                                className="border border-gray-300 rounded-lg p-3 w-full"
                                value={form.referralRewardType || "FLAT"}
                                onChange={(e) =>
                                    setForm((p: any) => ({
                                        ...p,
                                        referralRewardType: e.target.value,
                                    }))
                                }
                            >
                                <option value="FLAT">Flat Amount</option>
                                <option value="PERCENT">Percentage</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                {form.referralRewardType === "PERCENT"
                                    ? "Referral Reward Percentage (%)"
                                    : "Referral Reward Amount (₹)"}
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

                    <div className="space-y-5 border border-gray-200 rounded-xl p-4">
                        <div className="flex items-center justify-between gap-4">
                            <div>
                                <p className="text-sm font-semibold">
                                    Bulk Order Schemes
                                </p>

                                <p className="text-xs text-gray-500 mt-1">
                                    Configure bulk-order pricing and approval rules.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={addBulkScheme}
                                className="
                                rounded-lg
                                bg-[var(--color-primary)]
                                px-4
                                py-2
                                text-sm
                                font-medium
                                text-white
                                hover:opacity-90
                                transition
                                whitespace-nowrap
                            "
                            >
                                + Add Scheme
                            </button>
                        </div>

                        {(form.bulkOrderSchemes || []).map(
                            (scheme: any, index: number) => (
                                <div
                                    key={scheme.schemeId || index}
                                    className="border rounded-xl p-4 space-y-4 bg-gray-50"
                                >
                                    <div className="flex items-center justify-between">
                                        <h3 className="font-medium">
                                            {scheme.schemeName ||
                                                scheme.schemeId ||
                                                `Scheme ${index + 1}`}
                                        </h3>
                                    </div>

                                    {/* Scheme ID */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Scheme ID
                                        </label>

                                        <input
                                            className="border border-gray-300 rounded-lg p-3 w-full bg-gray-100"
                                            value={scheme.schemeId || ""}
                                            disabled
                                        />
                                    </div>

                                    {/* Scheme Name */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Scheme Name
                                        </label>

                                        <input
                                            className="border border-gray-300 rounded-lg p-3 w-full"
                                            value={scheme.schemeName || ""}
                                            onChange={(e) =>
                                                updateBulkScheme(index, {
                                                    schemeName: e.target.value,
                                                })
                                            }
                                        />
                                    </div>

                                    {/* Min / Max */}
                                    <div className="grid md:grid-cols-2 gap-4">

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Minimum Order Amount *
                                            </label>

                                            <input
                                                type="number"
                                                min={0}
                                                className="border border-gray-300 rounded-lg p-3 w-full"
                                                value={scheme.minAmount ?? ""}
                                                onChange={(e) =>
                                                    updateBulkScheme(index, {
                                                        minAmount:
                                                            e.target.value === ""
                                                                ? ""
                                                                : Number(e.target.value),
                                                    })
                                                }
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Maximum Order Amount *
                                            </label>

                                            <input
                                                type="number"
                                                min={0}
                                                className="border border-gray-300 rounded-lg p-3 w-full"
                                                value={scheme.maxAmount ?? ""}
                                                onChange={(e) =>
                                                    updateBulkScheme(index, {
                                                        maxAmount:
                                                            e.target.value === ""
                                                                ? ""
                                                                : Number(e.target.value),
                                                    })
                                                }
                                            />
                                        </div>

                                    </div>

                                    {/* Price Adjustment */}
                                    <div className="border-t pt-4">
                                        <p className="text-sm font-medium mb-3">
                                            Bulk Price Adjustment
                                        </p>

                                        <div className="grid md:grid-cols-2 gap-4">

                                            {/* Type */}
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Adjustment Type
                                                </label>

                                                <select
                                                    className="border border-gray-300 rounded-lg p-3 w-full"
                                                    value={
                                                        scheme.bulkPriceAdjustmentType || ""
                                                    }
                                                    onChange={(e) => {
                                                        const type = e.target.value || undefined;
                                                        updateBulkScheme(index, {
                                                            bulkPriceAdjustmentType: type,
                                                            bulkPriceAdjustmentPercent: type ? scheme.bulkPriceAdjustmentPercent : undefined,
                                                        });
                                                    }}
                                                >
                                                    <option value="">
                                                        No Adjustment
                                                    </option>

                                                    <option value="PLUS">
                                                        Increase (+)
                                                    </option>

                                                    <option value="MINUS">
                                                        Decrease (-)
                                                    </option>
                                                </select>
                                            </div>

                                            {/* Percentage */}
                                            {scheme.bulkPriceAdjustmentType && (
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        Adjustment Percentage (%) *
                                                    </label>

                                                    <input
                                                        type="number"
                                                        min={0.01}
                                                        max={100}
                                                        step="0.01"
                                                        className="border border-gray-300 rounded-lg p-3 w-full"
                                                        placeholder="Enter percentage"
                                                        value={
                                                            scheme.bulkPriceAdjustmentPercent ?? ""
                                                        }
                                                        onChange={(e) =>
                                                            updateBulkScheme(index, {
                                                                bulkPriceAdjustmentPercent:
                                                                    e.target.value === ""
                                                                        ? undefined
                                                                        : Number(e.target.value),
                                                            })
                                                        }
                                                    />
                                                </div>
                                            )}

                                        </div>

                                        <p className="text-xs text-gray-500 mt-2">
                                            If no adjustment is configured, the product's
                                            bulk base price will be used directly.
                                        </p>
                                    </div>

                                    {/* Admin Approval */}
                                    <label className="flex items-center gap-2 text-sm">
                                        <input
                                            type="checkbox"
                                            checked={
                                                !!scheme.isAdminApprovalRequired
                                            }
                                            onChange={(e) =>
                                                updateBulkScheme(index, {
                                                    isAdminApprovalRequired:
                                                        e.target.checked,
                                                })
                                            }
                                        />

                                        Admin Approval Required
                                    </label>

                                    {/* Active */}
                                    <label className="flex items-center gap-2 text-sm">
                                        <input
                                            type="checkbox"
                                            checked={scheme.isActive !== false}
                                            onChange={(e) =>
                                                updateBulkScheme(index, {
                                                    isActive: e.target.checked,
                                                })
                                            }
                                        />

                                        Active
                                    </label>
                                </div>
                            )
                        )}
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

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Display Mobile Number
                            </label>

                            <input
                                type="tel"
                                className="border border-gray-300 rounded-lg p-3 w-full"
                                value={form.displayMobile || ""}
                                onChange={(e) =>
                                    setForm((p: any) => ({
                                        ...p,
                                        displayMobile: e.target.value,
                                    }))
                                }
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Website
                            </label>

                            <input
                                type="url"
                                className="border border-gray-300 rounded-lg p-3 w-full"
                                placeholder="https://example.com"
                                value={form.website || ""}
                                onChange={(e) =>
                                    setForm((p: any) => ({
                                        ...p,
                                        website: e.target.value,
                                    }))
                                }
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Google Maps Link
                            </label>

                            <input
                                type="url"
                                className="border border-gray-300 rounded-lg p-3 w-full"
                                placeholder="https://maps.app.goo.gl/..."
                                value={form.gmapLink || ""}
                                onChange={(e) =>
                                    setForm((p: any) => ({
                                        ...p,
                                        gmapLink: e.target.value,
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

                    {/* WhatsApp Support */}
                    <div className="space-y-5 border border-gray-200 rounded-xl p-4">

                        <p className="text-sm font-medium">
                            WhatsApp Support
                        </p>

                        <label className="flex items-center gap-2 text-sm">
                            <input
                                type="checkbox"
                                checked={!!form.whatsAppSupport?.enabled}
                                onChange={(e) =>
                                    setForm((prev: any) => ({
                                        ...prev,
                                        whatsAppSupport: {
                                            ...prev.whatsAppSupport,
                                            enabled: e.target.checked,
                                        },
                                    }))
                                }
                            />
                            Enable WhatsApp Support
                        </label>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Popup Title
                            </label>

                            <input
                                className="border border-gray-300 rounded-lg p-3 w-full"
                                value={form.whatsAppSupport?.title || ""}
                                onChange={(e) =>
                                    setForm((prev: any) => ({
                                        ...prev,
                                        whatsAppSupport: {
                                            ...prev.whatsAppSupport,
                                            title: e.target.value,
                                        },
                                    }))
                                }
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Popup Subtitle
                            </label>

                            <input
                                className="border border-gray-300 rounded-lg p-3 w-full"
                                value={form.whatsAppSupport?.subtitle || ""}
                                onChange={(e) =>
                                    setForm((prev: any) => ({
                                        ...prev,
                                        whatsAppSupport: {
                                            ...prev.whatsAppSupport,
                                            subtitle: e.target.value,
                                        },
                                    }))
                                }
                            />
                        </div>

                        <div className="grid md:grid-cols-2 gap-4">

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Auto Open Delay
                                </label>

                                <select
                                    className="border border-gray-300 rounded-lg p-3 w-full"
                                    value={form.whatsAppSupport?.autoOpenDelay ?? 1000}
                                    onChange={(e) =>
                                        setForm((prev: any) => ({
                                            ...prev,
                                            whatsAppSupport: {
                                                ...prev.whatsAppSupport,
                                                autoOpenDelay: Number(e.target.value),
                                            },
                                        }))
                                    }
                                >
                                    <option value={1000}>1 Second</option>
                                    <option value={2000}>2 Seconds</option>
                                    <option value={3000}>3 Seconds</option>
                                    <option value={5000}>5 Seconds</option>
                                    <option value={10000}>10 Seconds</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Auto Close After
                                </label>

                                <select
                                    className="border border-gray-300 rounded-lg p-3 w-full"
                                    value={form.whatsAppSupport?.autoCloseAfter ?? 8000}
                                    onChange={(e) =>
                                        setForm((prev: any) => ({
                                            ...prev,
                                            whatsAppSupport: {
                                                ...prev.whatsAppSupport,
                                                autoCloseAfter: Number(e.target.value),
                                            },
                                        }))
                                    }
                                >
                                    <option value={0}>Never</option>
                                    <option value={5000}>5 Seconds</option>
                                    <option value={8000}>8 Seconds</option>
                                    <option value={10000}>10 Seconds</option>
                                    <option value={15000}>15 Seconds</option>
                                    <option value={20000}>20 Seconds</option>
                                </select>
                            </div>

                        </div>

                        <div className="border-t pt-4">

                            <div className="flex items-center justify-between mb-4">

                                <h3 className="font-medium">
                                    WhatsApp Contacts
                                </h3>

                                <Button
                                    variant="outline"
                                    onClick={addWhatsAppContact}
                                >
                                    + Add Contact
                                </Button>

                            </div>

                            {(form.whatsAppSupport?.contacts || []).map(
                                (contact: any, index: number) => (

                                    <div
                                        key={contact.id}
                                        className="border rounded-xl bg-gray-50 p-4 space-y-4 mb-5"
                                    >

                                        {contact.previewUrl || contact.image ? (
                                            <img
                                                src={contact.previewUrl || contact.image}
                                                alt={contact.name}
                                                className="w-20 h-20 rounded-full object-cover border"
                                            />
                                        ) : (
                                            <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center text-xs text-gray-500">
                                                No Image
                                            </div>
                                        )}

                                        <Button
                                            variant="outline"
                                            onClick={() => {
                                                setWhatsAppUploadIndex(index);
                                                whatsAppFileRef.current?.click();
                                            }}
                                        >
                                            {
                                                contact.previewUrl || contact.image
                                                    ? "Change Image"
                                                    : "Upload Image"
                                            }
                                        </Button>

                                        <input
                                            className="border border-gray-300 rounded-lg p-3 w-full"
                                            placeholder="Name"
                                            value={contact.name}
                                            onChange={(e) => {
                                                const updated = [...form.whatsAppSupport.contacts];
                                                updated[index].name = e.target.value;

                                                setForm((prev: any) => ({
                                                    ...prev,
                                                    whatsAppSupport: {
                                                        ...prev.whatsAppSupport,
                                                        contacts: updated,
                                                    },
                                                }));
                                            }}
                                        />

                                        <input
                                            className="border border-gray-300 rounded-lg p-3 w-full"
                                            placeholder="Role"
                                            value={contact.role}
                                            onChange={(e) => {
                                                const updated = [...form.whatsAppSupport.contacts];
                                                updated[index].role = e.target.value;

                                                setForm((prev: any) => ({
                                                    ...prev,
                                                    whatsAppSupport: {
                                                        ...prev.whatsAppSupport,
                                                        contacts: updated,
                                                    },
                                                }));
                                            }}
                                        />

                                        <input
                                            className="border border-gray-300 rounded-lg p-3 w-full"
                                            placeholder="Phone (918838913161)"
                                            value={contact.phone}
                                            onChange={(e) => {
                                                const updated = [...form.whatsAppSupport.contacts];
                                                updated[index].phone = e.target.value.replace(/\D/g, "");

                                                setForm((prev: any) => ({
                                                    ...prev,
                                                    whatsAppSupport: {
                                                        ...prev.whatsAppSupport,
                                                        contacts: updated,
                                                    },
                                                }));
                                            }}
                                        />

                                        <textarea
                                            rows={3}
                                            className="border border-gray-300 rounded-lg p-3 w-full resize-none"
                                            placeholder="Default Message"
                                            value={contact.message}
                                            onChange={(e) => {
                                                const updated = [...form.whatsAppSupport.contacts];
                                                updated[index].message = e.target.value;

                                                setForm((prev: any) => ({
                                                    ...prev,
                                                    whatsAppSupport: {
                                                        ...prev.whatsAppSupport,
                                                        contacts: updated,
                                                    },
                                                }));
                                            }}
                                        />

                                        <Button
                                            variant="outline"
                                            onClick={() =>
                                                removeWhatsAppContact(index)
                                            }
                                        >
                                            Remove Contact
                                        </Button>

                                    </div>
                                )
                            )}

                        </div>

                    </div>


                    {/* Slider */}
                    <div className="space-y-4 border border-gray-200 rounded-xl p-4">
                        <p className="text-sm font-medium">Slider Images</p>

                        {form.sliderImages.map((img: any, index: number) => (
                            <div key={img.id} className="border rounded-xl p-4 space-y-3 bg-gray-50">

                                {img.previewUrl || img.imageUrl ? (
                                    <img
                                        src={img.previewUrl || img.imageUrl}
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
                                    {img.previewUrl || img.imageUrl
                                        ? "Change Image"
                                        : "Upload Image"}
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
                            accept="image/*"
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
                                    {tag.previewUrl || tag.imageUrl ? (
                                        <img
                                            src={tag.previewUrl || tag.imageUrl}
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
                                        {
                                            tag.previewUrl || tag.imageUrl
                                                ? "Change Image"
                                                : "Upload Image"
                                        }
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

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Product ID
                                        </label>

                                        <input
                                            className="border border-gray-300 rounded-lg p-3 w-full"
                                            placeholder="Product ID"
                                            value={tag.productId || ""}
                                            onChange={(e) => {
                                                const value = e.target.value;

                                                setForm((prev: any) => {
                                                    const updated = [...prev.packageTags];

                                                    updated[index].productId = value;

                                                    return {
                                                        ...prev,
                                                        packageTags: updated,
                                                    };
                                                });
                                            }}
                                        />
                                    </div>

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
                            accept="image/*"
                            onChange={handleUploadPackageImage}
                        />
                    </div>

                    <div className="space-y-4 border border-gray-200 rounded-xl p-4">

                        <p className="text-sm font-medium">
                            AI Tags
                        </p>

                        {(form.aiTags || []).map((tag: any, categoryIndex: number) => (

                            <div
                                key={tag.id}
                                className="border rounded-xl p-4 space-y-4 bg-gray-50"
                            >

                                <input
                                    className="border border-gray-300 rounded-lg p-3 w-full"
                                    placeholder="Category Name"
                                    value={tag.name || ""}
                                    onChange={(e) =>
                                        updateAiTagName(categoryIndex, e.target.value)
                                    }
                                />

                                <div className="space-y-2">

                                    {(tag.options || []).map(
                                        (option: any, optionIndex: number) => (

                                            <div
                                                key={option.id}
                                                className="flex gap-2"
                                            >

                                                <input
                                                    className="border border-gray-300 rounded-lg p-3 flex-1"
                                                    placeholder="Option Name"
                                                    value={option.name || ""}
                                                    onChange={(e) =>
                                                        updateAiTagOption(
                                                            categoryIndex,
                                                            optionIndex,
                                                            e.target.value
                                                        )
                                                    }
                                                />

                                                <Button
                                                    variant="outline"
                                                    onClick={() =>
                                                        removeAiTagOption(
                                                            categoryIndex,
                                                            optionIndex
                                                        )
                                                    }
                                                >
                                                    Remove
                                                </Button>

                                            </div>

                                        )
                                    )}

                                </div>

                                <div className="flex gap-2">

                                    <Button
                                        variant="outline"
                                        onClick={() =>
                                            addAiTagOption(categoryIndex)
                                        }
                                    >
                                        + Add Option
                                    </Button>

                                    <Button
                                        variant="outline"
                                        onClick={() =>
                                            removeAiTag(categoryIndex)
                                        }
                                    >
                                        Remove Category
                                    </Button>

                                </div>

                            </div>

                        ))}

                        <Button
                            variant="outline"
                            onClick={addAiTag}
                        >
                            + Add AI Tag Category
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
            <input
                ref={whatsAppFileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleUploadWhatsAppImage}
            />
        </div>
    );
}
