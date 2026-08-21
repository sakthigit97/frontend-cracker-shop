import { useEffect, useState } from "react";
import Button from "../ui/Button";
import { useProfileStore } from "../../store/profile.store";

interface Props {
    open: boolean;
    loading?: boolean;
    onClose: () => void;
    onDownload: (data: {
        customerName: string;
        mobile: string;
        email?: string;
    }) => void;
}

type CustomerTitle = "Mr." | "Mrs." | "Ms.";
export default function EstimateDownloadDialog({
    open,
    loading = false,
    onClose,
    onDownload,
}: Props) {
    const profile = useProfileStore(
        (s: any) => s.profile
    );

    const [title, setTitle] =
        useState<CustomerTitle>("Mr.");

    const [customerName, setCustomerName] =
        useState("");

    const [mobile, setMobile] =
        useState("");

    const [email, setEmail] =
        useState("");

    const [captchaA, setCaptchaA] =
        useState(0);

    const [captchaB, setCaptchaB] =
        useState(0);

    const [captchaOp, setCaptchaOp] =
        useState<"+" | "-">("+");

    const [captchaAnswer, setCaptchaAnswer] =
        useState("");

    const [errors, setErrors] =
        useState<Record<string, string>>({});

    useEffect(() => {
        if (open) {
            setErrors({});

            const a =
                Math.floor(Math.random() * 20) + 5;

            const b =
                Math.floor(Math.random() * 20) + 1;

            if (Math.random() > 0.5) {
                setCaptchaA(a);
                setCaptchaB(b);
                setCaptchaOp("+");
            } else {
                setCaptchaA(Math.max(a, b));
                setCaptchaB(Math.min(a, b));
                setCaptchaOp("-");
            }

            setCaptchaAnswer("");

            if (
                profile &&
                profile.name &&
                profile.mobile
            ) {
                if (
                    profile.title === "Mr." ||
                    profile.title === "Mrs." ||
                    profile.title === "Ms."
                ) {
                    setTitle(profile.title);
                } else {
                    setTitle("Mr.");
                }

                setCustomerName(
                    profile.name || ""
                );

                setMobile(
                    profile.mobile || ""
                );

                setEmail(
                    profile.email || ""
                );
            } else {
                setTitle("Mr.");
                setCustomerName("");
                setMobile("");
                setEmail("");
            }
        }
    }, [open, profile]);

    if (!open) return null;

    function validate() {
        const next: Record<string, string> = {};

        const expected =
            captchaOp === "+"
                ? captchaA + captchaB
                : captchaA - captchaB;

        if (
            Number(captchaAnswer) !==
            expected
        ) {
            next.captcha =
                "Incorrect answer";
        }

        if (!customerName.trim()) {
            next.customerName =
                "Customer name is required";
        } else if (
            customerName.trim().length < 3
        ) {
            next.customerName =
                "Minimum 3 characters";
        }

        if (!mobile.trim()) {
            next.mobile =
                "Mobile number is required";
        } else if (
            !/^[6-9]\d{9}$/.test(
                mobile.trim()
            )
        ) {
            next.mobile =
                "Enter a valid 10 digit mobile number";
        }

        if (
            email.trim() &&
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
                email.trim()
            )
        ) {
            next.email =
                "Enter a valid email";
        }

        setErrors(next);

        return (
            Object.keys(next).length === 0
        );
    }

    function submit() {
        if (!validate()) {
            return;
        }

        /*
         * Concatenate title + customer name
         * before sending to backend.
         *
         * Example:
         * Mr. Sakthibalan
         * Mrs. Priya
         * Ms. Divya
         */
        const fullCustomerName =
            `${title} ${customerName.trim()}`;

        onDownload({
            customerName:
                fullCustomerName,
            mobile:
                mobile.trim(),
            email:
                email.trim() ||
                undefined,
        });
    }

    return (
        <div className="fixed inset-0 z-[80] bg-black/40 flex items-center justify-center p-4">
            <div
                onClick={(e) =>
                    e.stopPropagation()
                }
                className="
                    bg-white
                    rounded-2xl
                    shadow-xl
                    w-full
                    max-w-md
                    h-[92vh]
                    max-h-[92vh]
                    flex
                    flex-col
                    overflow-hidden
                "
            >
                <div className="flex-1 overflow-y-auto p-6">
                    <h2 className="text-xl font-semibold mb-1">
                        Download Estimate
                    </h2>

                    <p className="text-sm text-gray-500 mb-6">
                        Please enter customer details before downloading.
                    </p>

                    <div className="space-y-4">

                        {/* ============================
                            TITLE
                            ============================ */}

                        <div>
                            <label className="text-sm font-medium">
                                Title *
                            </label>

                            <select
                                value={title}
                                onChange={(e) =>
                                    setTitle(
                                        e.target
                                            .value as CustomerTitle
                                    )
                                }
                                className="
                                    w-full
                                    mt-1
                                    rounded-lg
                                    border
                                    px-3
                                    py-2
                                    bg-white
                                "
                            >
                                <option value="Mr.">
                                    Mr.
                                </option>

                                <option value="Mrs.">
                                    Mrs.
                                </option>

                                <option value="Ms.">
                                    Ms.
                                </option>
                            </select>
                        </div>

                        {/* ============================
                            CUSTOMER NAME
                            ============================ */}

                        <div>
                            <label className="text-sm font-medium">
                                Customer Name *
                            </label>

                            <input
                                value={
                                    customerName
                                }
                                onChange={(e) =>
                                    setCustomerName(
                                        e.target
                                            .value
                                    )
                                }
                                className="
                                    w-full
                                    mt-1
                                    rounded-lg
                                    border
                                    px-3
                                    py-2
                                "
                            />

                            {errors.customerName && (
                                <p className="text-red-500 text-xs mt-1">
                                    {
                                        errors.customerName
                                    }
                                </p>
                            )}
                        </div>

                        {/* ============================
                            MOBILE
                            ============================ */}

                        <div>
                            <label className="text-sm font-medium">
                                Mobile Number *
                            </label>

                            <input
                                value={mobile}
                                maxLength={10}
                                onChange={(e) =>
                                    setMobile(
                                        e.target.value.replace(
                                            /\D/g,
                                            ""
                                        )
                                    )
                                }
                                className="
                                    w-full
                                    mt-1
                                    rounded-lg
                                    border
                                    px-3
                                    py-2
                                "
                            />

                            {errors.mobile && (
                                <p className="text-red-500 text-xs mt-1">
                                    {
                                        errors.mobile
                                    }
                                </p>
                            )}
                        </div>

                        {/* ============================
                            EMAIL
                            ============================ */}

                        <div>
                            <label className="text-sm font-medium">
                                Email (Optional)
                            </label>

                            <input
                                value={email}
                                onChange={(e) =>
                                    setEmail(
                                        e.target.value
                                    )
                                }
                                className="
                                    w-full
                                    mt-1
                                    rounded-lg
                                    border
                                    px-3
                                    py-2
                                "
                            />

                            {errors.email && (
                                <p className="text-red-500 text-xs mt-1">
                                    {
                                        errors.email
                                    }
                                </p>
                            )}
                        </div>

                        {/* ============================
                            CAPTCHA
                            ============================ */}

                        <div>
                            <label className="text-sm font-medium">
                                Security Check *
                            </label>

                            <div className="mt-2 flex items-center gap-2 w-full">
                                <div className="shrink-0 rounded-lg bg-gray-100 border px-3 py-2 font-semibold whitespace-nowrap">
                                    {captchaA}{" "}
                                    {captchaOp}{" "}
                                    {captchaB} = ?
                                </div>

                                <input
                                    value={
                                        captchaAnswer
                                    }
                                    onChange={(e) =>
                                        setCaptchaAnswer(
                                            e.target.value.replace(
                                                /\D/g,
                                                ""
                                            )
                                        )
                                    }
                                    placeholder="Answer"
                                    className="
                                        min-w-0
                                        flex-1
                                        rounded-lg
                                        border
                                        px-3
                                        py-2
                                    "
                                />
                            </div>

                            {errors.captcha && (
                                <p className="text-red-500 text-xs mt-1">
                                    {
                                        errors.captcha
                                    }
                                </p>
                            )}
                        </div>
                    </div>

                    {/* ============================
                        ACTIONS
                        ============================ */}

                    <div className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-3 border-t pt-4">
                        <Button
                            variant="secondary"
                            className="w-full sm:w-auto"
                            disabled={loading}
                            onClick={onClose}
                        >
                            Cancel
                        </Button>

                        <Button
                            onClick={submit}
                            disabled={loading}
                            className="
                                w-full
                                sm:w-auto
                                sm:min-w-[170px]
                                flex
                                items-center
                                justify-center
                                gap-2
                            "
                        >
                            {loading && (
                                <svg
                                    className="h-4 w-4 animate-spin"
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                >
                                    <circle
                                        className="opacity-25"
                                        cx="12"
                                        cy="12"
                                        r="10"
                                        stroke="currentColor"
                                        strokeWidth="4"
                                    />

                                    <path
                                        className="opacity-75"
                                        fill="currentColor"
                                        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                                    />
                                </svg>
                            )}

                            {loading
                                ? "Generating PDF..."
                                : "Download PDF"}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}