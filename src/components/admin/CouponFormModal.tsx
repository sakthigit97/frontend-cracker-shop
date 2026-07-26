import { useEffect, useRef, useState } from "react";
import { X, TicketPercent } from "lucide-react";
import Button from "../ui/Button";
import { useAdminCouponStore } from "../../store/adminCoupon.store";
import { useAlert } from "../../store/alert.store";

interface Props {
    open: boolean;
    onClose: () => void;
}

type CouponType = "FLAT" | "PERCENTAGE";

interface CouponForm {
    couponCode: string;
    description: string;
    type: CouponType;
    value: string;
    expiryDate: string;
}

const CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateCouponCode(length = 8) {
    const bytes = crypto.getRandomValues(new Uint8Array(length));

    return Array.from(bytes)
        .map((b) => CHARS[b % CHARS.length])
        .join("");
}

const initialForm: CouponForm = {
    couponCode: "",
    description: "",
    type: "FLAT",
    value: "",
    expiryDate: "",
};

export default function CouponFormModal({
    open,
    onClose,
}: Props) {

    const { createCoupon } = useAdminCouponStore();
    const { showAlert } = useAlert();

    const modalRef = useRef<HTMLDivElement>(null);

    const [loading, setLoading] = useState(false);

    const [form, setForm] =
        useState<CouponForm>(initialForm);

    useEffect(() => {

        if (!open) return;
        setForm({
            ...initialForm,
            couponCode: generateCouponCode(),
        });

        document.body.style.overflow = "hidden";

        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                onClose();
            }
        };

        window.addEventListener("keydown", onKeyDown);

        return () => {

            document.body.style.overflow = "";

            window.removeEventListener(
                "keydown",
                onKeyDown
            );

        };

    }, [open, onClose]);

    if (!open) return null;

    const update = (
        key: keyof CouponForm,
        value: string
    ) => {

        setForm((prev) => ({
            ...prev,
            [key]: value,
        }));

    };

    const resetForm = () => {
        setForm({
            ...initialForm,
            couponCode: generateCouponCode(),
        });
    };

    const inputClass = `
w-full
rounded-xl
border
border-gray-300
bg-white
px-4
py-3
text-sm
sm:text-base
transition
outline-none
focus:border-orange-500
focus:ring-4
focus:ring-orange-100
`;

    const labelClass =
        "mb-2 block text-sm font-semibold text-gray-700";

    const submit = async () => {

        if (!form.couponCode.trim()) {
            return showAlert({
                type: "error",
                message: "Coupon Code is required",
            });
        }

        if (!form.value) {
            return showAlert({
                type: "error",
                message: "Discount value is required",
            });
        }

        if (
            form.type === "PERCENTAGE" &&
            Number(form.value) > 100
        ) {
            return showAlert({
                type: "error",
                message:
                    "Percentage discount cannot exceed 100",
            });
        }


        if (!form.expiryDate) {
            return showAlert({
                type: "error",
                message: "Expiry Date is required",
            });
        }

        try {

            setLoading(true);

            await createCoupon({
                couponCode: form.couponCode,
                description: form.description,
                type: form.type,
                value: Number(form.value),
                expiryDate: form.expiryDate,
            });

            showAlert({
                type: "success",
                message:
                    "Coupon created successfully",
            });

            resetForm();

            onClose();

        } catch (err: any) {

            showAlert({
                type: "error",
                message:
                    err.message ??
                    "Unable to create coupon",
            });

        } finally {

            setLoading(false);

        }

    };
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
                    onClick={(e) => e.stopPropagation()}
                    className="
                    w-full
                    max-w-md
                    sm:max-w-xl
                    lg:max-w-3xl
                    bg-white
                    rounded-2xl
                    shadow-2xl
                    flex
                    flex-col
                    max-h-[95vh]
                    overflow-hidden
                "
                >

                    {/* ================= HEADER ================= */}

                    <div
                        className="
                        shrink-0
                        border-b
                        bg-white
                        px-5
                        py-4
                        sm:px-6
                    "
                    >

                        <div className="flex items-start justify-between">

                            <div className="flex gap-4">

                                <div
                                    className="
                                    h-12
                                    w-12
                                    rounded-xl
                                    bg-orange-100
                                    flex
                                    items-center
                                    justify-center
                                "
                                >
                                    <TicketPercent
                                        size={24}
                                        className="text-orange-600"
                                    />
                                </div>

                                <div>

                                    <h2
                                        className="
                                        text-xl
                                        sm:text-2xl
                                        font-bold
                                        text-gray-900
                                    "
                                    >
                                        Create Coupon
                                    </h2>

                                    <p
                                        className="
                                        mt-1
                                        text-sm
                                        text-gray-500
                                    "
                                    >
                                        Create promotional coupons for your
                                        customers.
                                    </p>

                                </div>

                            </div>

                            <button
                                onClick={onClose}
                                className="
                                rounded-lg
                                p-2
                                transition
                                hover:bg-gray-100
                            "
                            >
                                <X size={20} />
                            </button>

                        </div>

                    </div>

                    {/* ================= BODY ================= */}

                    <div
                        className="
                        flex-1
                        overflow-y-auto
                        px-5
                        py-6
                        sm:px-6
                        space-y-6
                    "
                    >

                        {/* Coupon Code & Description */}

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

                            <div>

                                <label className={labelClass}>
                                    Coupon Code
                                </label>

                                <input
                                    className={inputClass}
                                    placeholder="Coupon Code"
                                    value={form.couponCode}
                                    onChange={() =>
                                        update(
                                            "couponCode",
                                            generateCouponCode()
                                        )
                                    }
                                />

                            </div>

                            <div>

                                <label className={labelClass}>
                                    Description
                                </label>

                                <input
                                    className={inputClass}
                                    placeholder="Diwali Offer"
                                    value={form.description}
                                    onChange={(e) =>
                                        update(
                                            "description",
                                            e.target.value
                                        )
                                    }
                                />

                            </div>

                        </div>

                        {/* Coupon Type */}

                        <div>

                            <label className={labelClass}>
                                Coupon Type
                            </label>

                            <select
                                className={inputClass}
                                value={form.type}
                                onChange={(e) =>
                                    update(
                                        "type",
                                        e.target.value
                                    )
                                }
                            >

                                <option value="FLAT">
                                    Flat Discount
                                </option>

                                <option value="PERCENTAGE">
                                    Percentage Discount
                                </option>

                            </select>

                        </div>

                        {/* Discount */}

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

                            <div>

                                <label className={labelClass}>
                                    Discount Value
                                </label>

                                <input
                                    type="number"
                                    className={inputClass}
                                    placeholder={
                                        form.type === "FLAT"
                                            ? "₹500"
                                            : "10"
                                    }
                                    value={form.value}
                                    onChange={(e) =>
                                        update(
                                            "value",
                                            e.target.value
                                        )
                                    }
                                />

                            </div>


                        </div>

                        <div>

                            <label className={labelClass}>
                                Expiry Date
                            </label>

                            <input
                                type="datetime-local"
                                className={inputClass}
                                min={new Date().toISOString().slice(0, 16)}
                                value={form.expiryDate}
                                onChange={(e) =>
                                    update(
                                        "expiryDate",
                                        e.target.value
                                    )
                                }
                            />

                        </div>

                    </div>

                    {/* ================= FOOTER ================= */}

                    <div
                        className="
                        shrink-0
                        border-t
                        bg-gray-50
                        px-5
                        py-4
                        sm:px-6
                    "
                    >
                        <div
                            className="
                            flex
                            flex-col-reverse
                            gap-3
                            sm:flex-row
                            sm:justify-end
                        "
                        >

                            <Button
                                variant="secondary"
                                onClick={onClose}
                                disabled={loading}
                                className="w-full sm:w-auto"
                            >
                                Cancel
                            </Button>

                            <button
                                type="button"
                                disabled={loading}
                                onClick={submit}
                                className="
                                inline-flex
                                items-center
                                justify-center
                                gap-2
                                rounded-xl
                                bg-orange-500
                                px-6
                                py-3
                                font-semibold
                                text-white
                                transition-all
                                duration-200
                                hover:bg-orange-600
                                hover:shadow-lg
                                active:scale-[0.98]
                                disabled:cursor-not-allowed
                                disabled:opacity-60
                                disabled:hover:bg-orange-500
                                w-full
                                sm:w-auto
                                min-w-[180px]
                            "
                            >

                                {loading && (
                                    <svg
                                        className="h-5 w-5 animate-spin"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                    >
                                        <circle
                                            cx="12"
                                            cy="12"
                                            r="10"
                                            stroke="currentColor"
                                            strokeWidth="4"
                                            className="opacity-20"
                                        />

                                        <path
                                            d="M22 12a10 10 0 00-10-10"
                                            stroke="currentColor"
                                            strokeWidth="4"
                                            strokeLinecap="round"
                                        />
                                    </svg>
                                )}

                                {loading
                                    ? "Creating Coupon..."
                                    : "Create Coupon"}

                            </button>

                        </div>

                    </div>

                </div>

            </div>

        </div>

    );
}