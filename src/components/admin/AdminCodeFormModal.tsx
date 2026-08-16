import { useEffect, useRef, useState } from "react";
import { X, ShieldCheck } from "lucide-react";
import Button from "../ui/Button";
import { useAdminCodeStore } from "../../store/adminCode.store";
import { useAlert } from "../../store/alert.store";
import { useConfigStore } from "../../store/config.store";
import { generateAdminCode } from "../../utils/adminCode";
import { apiFetch } from "../../services/api";

interface Props {
    open: boolean;
    onClose: () => void;
}

interface FormState {
    userId: string;
    schemeId: string;
    code: string;
    expiryDate: string;
}

const initialForm: FormState = {
    userId: "",
    schemeId: "",
    code: "",
    expiryDate: "",
};

export default function AdminCodeFormModal({
    open,
    onClose,
}: Props) {
    const modalRef = useRef<HTMLDivElement>(null);

    const {
        createCode,
        creating,
    } = useAdminCodeStore();

    const { config } = useConfigStore();
    const { showAlert } = useAlert();
    const [form, setForm] =
        useState<FormState>(initialForm);

    const [mobileNumbers, setMobileNumbers] =
        useState<string[]>([]);

    const [loadingMobiles, setLoadingMobiles] =
        useState(false);

    const [userDropdownOpen, setUserDropdownOpen] =
        useState(false);

    const [userSearch, setUserSearch] =
        useState("");

    const userDropdownRef =
        useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!userDropdownOpen) return;

        const handleClickOutside = (event: MouseEvent) => {
            if (
                userDropdownRef.current &&
                !userDropdownRef.current.contains(
                    event.target as Node
                )
            ) {
                setUserDropdownOpen(false);
            }
        };

        document.addEventListener(
            "mousedown",
            handleClickOutside
        );

        return () => {
            document.removeEventListener(
                "mousedown",
                handleClickOutside
            );
        };
    }, [userDropdownOpen]);

    useEffect(() => {
        if (!open) return;

        const defaultScheme =
            config?.bulkOrderSchemes?.[0];

        setForm({
            ...initialForm,
            code: generateAdminCode(),
            schemeId:
                defaultScheme?.schemeId ?? "",
        });

        document.body.style.overflow = "hidden";

        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                onClose();
            }
        };

        window.addEventListener(
            "keydown",
            onKeyDown
        );

        return () => {
            document.body.style.overflow = "";

            window.removeEventListener(
                "keydown",
                onKeyDown
            );
        };
    }, [open, onClose, config]);

    /*
     * Load all user mobile numbers
     * whenever the modal is opened.
     */
    useEffect(() => {
        if (!open) return;

        let cancelled = false;

        const loadMobileNumbers = async () => {
            try {
                setLoadingMobiles(true);

                const response = await apiFetch(
                    "/admin/users/mobiles"
                );

                if (cancelled) return;

                const mobiles = Array.isArray(
                    response?.items
                )
                    ? response.items
                    : [];

                setMobileNumbers(mobiles);
            } catch (error: any) {
                if (cancelled) return;

                console.error(
                    "Failed to load user mobile numbers",
                    error
                );

                setMobileNumbers([]);

                showAlert({
                    type: "error",
                    message:
                        error?.message ||
                        "Unable to load user mobile numbers.",
                });
            } finally {
                if (!cancelled) {
                    setLoadingMobiles(false);
                }
            }
        };

        loadMobileNumbers();

        return () => {
            cancelled = true;
        };
    }, [open, showAlert]);

    const filteredMobiles = mobileNumbers.filter(
        (mobile) =>
            mobile.includes(userSearch.trim())
    );
    if (!open) return null;

    const update = (
        key: keyof FormState,
        value: any
    ) => {
        setForm((prev) => ({
            ...prev,
            [key]: value,
        }));
    };

    async function submit() {
        if (!form.userId.trim()) {
            return showAlert({
                type: "error",
                message: "User ID is required.",
            });
        }

        if (!form.expiryDate) {
            return showAlert({
                type: "error",
                message: "Expiry Date is required.",
            });
        }

        try {
            await createCode({
                userId: form.userId.trim(),
                schemeId: form.schemeId,
                code: form.code,
                expiryDate: new Date(
                    form.expiryDate
                ).getTime(),
            });

            showAlert({
                type: "success",
                message:
                    "Admin Code generated successfully.",
            });

            onClose();
        } catch (e: any) {
            showAlert({
                type: "error",
                message:
                    e.message ||
                    "Unable to generate Admin Code.",
            });
        }
    }

    const inputClass = `
        w-full
        rounded-xl
        border
        border-gray-300
        bg-white
        px-4
        py-3
        text-sm
        outline-none
        transition
        focus:border-orange-500
        focus:ring-4
        focus:ring-orange-100
    `;

    const labelClass =
        "mb-2 block text-sm font-semibold text-gray-700";

    return (
        <div
            className="
                fixed
                inset-0
                z-50
                bg-black/60
                backdrop-blur-sm
                p-3
                sm:p-5
            "
            onClick={onClose}
        >
            <div className="flex h-full items-center justify-center">
                <div
                    ref={modalRef}
                    onClick={(e) =>
                        e.stopPropagation()
                    }
                    className="
                        w-full
                        max-w-3xl
                        bg-white
                        rounded-2xl
                        shadow-2xl
                        flex
                        flex-col
                        max-h-[95vh]
                        overflow-hidden
                    "
                >
                    {/* Header */}
                    <div className="border-b bg-white px-6 py-5">
                        <div className="flex items-start justify-between">
                            <div className="flex gap-4">
                                <div className="h-12 w-12 rounded-xl bg-orange-100 flex items-center justify-center">
                                    <ShieldCheck
                                        size={24}
                                        className="text-orange-600"
                                    />
                                </div>

                                <div>
                                    <h2 className="text-2xl font-bold">
                                        Generate Access Code
                                    </h2>

                                    <p className="mt-1 text-sm text-gray-500">
                                        Generate bulk order access codes.
                                    </p>
                                </div>
                            </div>

                            <button
                                onClick={onClose}
                                className="rounded-lg p-2 hover:bg-gray-100"
                            >
                                <X size={20} />
                            </button>
                        </div>
                    </div>

                    {/* Body */}
                    <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

                            <div
                                ref={userDropdownRef}
                                className="relative"
                            >
                                <label className={labelClass}>
                                    User ID
                                </label>

                                <div className="relative">
                                    <input
                                        className={`${inputClass} pr-12`}
                                        placeholder={
                                            loadingMobiles
                                                ? "Loading users..."
                                                : "Search mobile number"
                                        }
                                        value={
                                            userDropdownOpen
                                                ? userSearch
                                                : form.userId
                                        }
                                        disabled={loadingMobiles}
                                        onFocus={() => {
                                            setUserSearch("");
                                            setUserDropdownOpen(true);
                                        }}
                                        onChange={(e) => {
                                            const value = e.target.value;

                                            setUserSearch(value);
                                            setUserDropdownOpen(true);
                                        }}
                                    />

                                    {/* Dropdown arrow */}
                                    <button
                                        type="button"
                                        disabled={loadingMobiles}
                                        onClick={() =>
                                            setUserDropdownOpen(
                                                (prev) => !prev
                                            )
                                        }
                                        className="
                absolute
                right-0
                top-0
                h-full
                w-12
                flex
                items-center
                justify-center
                text-gray-500
                hover:text-gray-700
            "
                                    >
                                        <svg
                                            width="20"
                                            height="20"
                                            viewBox="0 0 20 20"
                                            fill="none"
                                            className={`transition-transform ${userDropdownOpen
                                                ? "rotate-180"
                                                : ""
                                                }`}
                                        >
                                            <path
                                                d="M5 7.5L10 12.5L15 7.5"
                                                stroke="currentColor"
                                                strokeWidth="1.8"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                            />
                                        </svg>
                                    </button>
                                </div>

                                {userDropdownOpen && (
                                    <div
                                        className="
                absolute
                left-0
                right-0
                top-full
                z-50
                mt-2
                overflow-hidden
                rounded-xl
                border
                border-gray-200
                bg-white
                shadow-xl
            "
                                    >
                                        {/* Search header */}
                                        <div className="border-b bg-gray-50 px-4 py-3">
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs font-semibold text-gray-500">
                                                    {userSearch.trim()
                                                        ? `${filteredMobiles.length} users found`
                                                        : `${mobileNumbers.length} users`}
                                                </span>

                                                {userSearch && (
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            setUserSearch("")
                                                        }
                                                        className="text-xs font-medium text-orange-600 hover:text-orange-700"
                                                    >
                                                        Clear
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        {/* User list */}
                                        <div className="max-h-64 overflow-y-auto">
                                            {filteredMobiles.length > 0 ? (
                                                filteredMobiles.map(
                                                    (mobile) => {
                                                        const selected =
                                                            form.userId === mobile;

                                                        return (
                                                            <button
                                                                key={mobile}
                                                                type="button"
                                                                onClick={() => {
                                                                    update(
                                                                        "userId",
                                                                        mobile
                                                                    );

                                                                    setUserSearch(
                                                                        ""
                                                                    );

                                                                    setUserDropdownOpen(
                                                                        false
                                                                    );
                                                                }}
                                                                className={`
                                        flex
                                        w-full
                                        items-center
                                        justify-between
                                        px-4
                                        py-3
                                        text-left
                                        text-sm
                                        transition
                                        hover:bg-orange-50
                                        ${selected
                                                                        ? "bg-orange-50 text-orange-700"
                                                                        : "text-gray-700"
                                                                    }
                                    `}
                                                            >
                                                                <span className="font-medium">
                                                                    {mobile}
                                                                </span>

                                                                {selected && (
                                                                    <svg
                                                                        width="18"
                                                                        height="18"
                                                                        viewBox="0 0 20 20"
                                                                        fill="none"
                                                                    >
                                                                        <path
                                                                            d="M5 10L8.5 13.5L15 6.5"
                                                                            stroke="currentColor"
                                                                            strokeWidth="2"
                                                                            strokeLinecap="round"
                                                                            strokeLinejoin="round"
                                                                        />
                                                                    </svg>
                                                                )}
                                                            </button>
                                                        );
                                                    }
                                                )
                                            ) : (
                                                <div className="px-4 py-8 text-center">
                                                    <p className="text-sm font-medium text-gray-600">
                                                        No users found
                                                    </p>

                                                    <p className="mt-1 text-xs text-gray-400">
                                                        Try another mobile number
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                <p className="mt-1.5 text-xs text-gray-500">
                                    {loadingMobiles
                                        ? "Loading existing users..."
                                        : `${mobileNumbers.length} users available`}
                                </p>
                            </div>

                            {/* Scheme */}
                            <div>
                                <label
                                    className={labelClass}
                                >
                                    Scheme
                                </label>

                                <select
                                    className={inputClass}
                                    value={form.schemeId}
                                    onChange={(e) =>
                                        update(
                                            "schemeId",
                                            e.target.value
                                        )
                                    }
                                >
                                    {config?.bulkOrderSchemes?.map(
                                        (scheme: any) => (
                                            <option
                                                key={
                                                    scheme.schemeId
                                                }
                                                value={
                                                    scheme.schemeId
                                                }
                                            >
                                                {
                                                    scheme.schemeName
                                                }
                                            </option>
                                        )
                                    )}
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                            {/* Generated Code */}
                            <div>
                                <label
                                    className={labelClass}
                                >
                                    Generated Code
                                </label>

                                <input
                                    className={`${inputClass} font-mono font-bold tracking-widest`}
                                    readOnly
                                    value={form.code}
                                />
                            </div>

                            {/* Expiry */}
                            <div>
                                <label
                                    className={labelClass}
                                >
                                    Expiry Date
                                </label>

                                <input
                                    type="datetime-local"
                                    className={inputClass}
                                    min={new Date()
                                        .toISOString()
                                        .slice(0, 16)}
                                    value={
                                        form.expiryDate
                                    }
                                    onChange={(e) =>
                                        update(
                                            "expiryDate",
                                            e.target.value
                                        )
                                    }
                                />
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="border-t bg-gray-50 px-6 py-4">
                        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                            <Button
                                variant="secondary"
                                onClick={onClose}
                                disabled={creating}
                            >
                                Cancel
                            </Button>

                            <button
                                type="button"
                                disabled={
                                    creating ||
                                    loadingMobiles
                                }
                                onClick={submit}
                                className="
                                    inline-flex
                                    items-center
                                    justify-center
                                    rounded-xl
                                    bg-orange-500
                                    px-6
                                    py-3
                                    font-semibold
                                    text-white
                                    transition
                                    hover:bg-orange-600
                                    disabled:opacity-60
                                    min-w-[200px]
                                "
                            >
                                {creating
                                    ? "Generating..."
                                    : "Generate Code"}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}