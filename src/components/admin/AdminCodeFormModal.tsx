import { useEffect, useRef, useState } from "react";
import { X, ShieldCheck } from "lucide-react";
import Button from "../ui/Button";
import { useAdminCodeStore } from "../../store/adminCode.store";
import { useAlert } from "../../store/alert.store";
import { useConfigStore } from "../../store/config.store";

import {
    generateAdminCode,
} from "../../utils/adminCode";

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
    const modalRef =
        useRef<HTMLDivElement>(null);

    const {
        createCode,
        creating,
    } = useAdminCodeStore();

    const { config } = useConfigStore();
    console.log(config)

    const { showAlert } =
        useAlert();

    const [form, setForm] =
        useState<FormState>(initialForm);

    useEffect(() => {
        if (!open) return;

        const defaultScheme = config?.bulkSchemes?.[0];

        setForm({
            ...initialForm,
            code: generateAdminCode(),
            schemeId:
                defaultScheme?.schemeId ?? "",
        });

        document.body.style.overflow =
            "hidden";

        const onKeyDown = (
            e: KeyboardEvent
        ) => {
            if (e.key === "Escape") {
                onClose();
            }
        };

        window.addEventListener(
            "keydown",
            onKeyDown
        );

        return () => {
            document.body.style.overflow =
                "";

            window.removeEventListener(
                "keydown",
                onKeyDown
            );
        };
    }, [open, onClose]);

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
                                onClick={
                                    onClose
                                }
                                className="rounded-lg p-2 hover:bg-gray-100"
                            >
                                <X size={20} />
                            </button>

                        </div>

                    </div>

                    {/* Body */}

                    <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

                            <div>

                                <label className={labelClass}>

                                    User ID

                                </label>

                                <input
                                    className={inputClass}
                                    placeholder="Mobile Number"
                                    value={
                                        form.userId
                                    }
                                    onChange={(e) =>
                                        update(
                                            "userId",
                                            e.target
                                                .value
                                        )
                                    }
                                />

                            </div>

                            <div>

                                <label className={labelClass}>

                                    Scheme

                                </label>

                                <select
                                    className={
                                        inputClass
                                    }
                                    value={form.schemeId}
                                    onChange={(e) =>
                                        update(
                                            "schemeId",
                                            e.target.value
                                        )
                                    }
                                >

                                    {config?.bulkSchemes?.map((scheme: any) => (
                                        <option
                                            key={scheme.schemeId}
                                            value={scheme.schemeId}
                                        >
                                            {scheme.schemeName}
                                        </option>
                                    ))}

                                </select>

                            </div>

                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

                            <div>

                                <label className={labelClass}>

                                    Generated Code

                                </label>

                                <input
                                    className={`${inputClass} font-mono font-bold tracking-widest`}
                                    readOnly
                                    value={
                                        form.code
                                    }
                                />

                            </div>

                            <div>

                                <label className={labelClass}>

                                    Expiry Date

                                </label>

                                <input
                                    type="datetime-local"
                                    className={
                                        inputClass
                                    }
                                    min={new Date()
                                        .toISOString()
                                        .slice(
                                            0,
                                            16
                                        )}
                                    value={
                                        form.expiryDate
                                    }
                                    onChange={(e) =>
                                        update(
                                            "expiryDate",
                                            e.target
                                                .value
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
                                onClick={
                                    onClose
                                }
                                disabled={
                                    creating
                                }
                            >
                                Cancel
                            </Button>

                            <button
                                type="button"
                                disabled={
                                    creating
                                }
                                onClick={
                                    submit
                                }
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