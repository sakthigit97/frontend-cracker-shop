import { useEffect, useState } from "react";
import { X, UserRoundPen } from "lucide-react";

import Button from "../../components/ui/Button";
import { useAlert } from "../../store/alert.store";
import { updateAdminUser } from "../../services/adminUsers.api";

interface AdminUser {
    mobile: string;
    name?: string;
    role?: string;
    address?: string;
    city?: string;
    state?: string;
    pincode?: string;
}

interface Props {
    open: boolean;
    user: AdminUser | null;
    onClose: () => void;
    onUpdated: () => Promise<void> | void;
}

interface FormState {
    name: string;
    role: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
}

const initialForm: FormState = {
    name: "",
    role: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
};

export default function AdminUserEditModal({
    open,
    user,
    onClose,
    onUpdated,
}: Props) {
    const { showAlert } = useAlert();

    const [form, setForm] =
        useState<FormState>(initialForm);

    const [saving, setSaving] =
        useState(false);

    /*
     * Populate form whenever a different
     * user is opened.
     */
    useEffect(() => {
        if (!open || !user) {
            return;
        }

        setForm({
            name: user.name ?? "",
            role: user.role ?? "",
            address: user.address ?? "",
            city: user.city ?? "",
            state: user.state ?? "",
            pincode: user.pincode ?? "",
        });
    }, [open, user]);

    /*
     * Lock background page scroll while modal
     * is open and support Escape key.
     */
    useEffect(() => {
        if (!open) {
            return;
        }

        const previousOverflow =
            document.body.style.overflow;

        document.body.style.overflow =
            "hidden";

        const handleKeyDown = (
            event: KeyboardEvent
        ) => {
            if (
                event.key === "Escape" &&
                !saving
            ) {
                onClose();
            }
        };

        document.addEventListener(
            "keydown",
            handleKeyDown
        );

        return () => {
            document.body.style.overflow =
                previousOverflow;

            document.removeEventListener(
                "keydown",
                handleKeyDown
            );
        };
    }, [open, onClose, saving]);

    if (!open || !user) {
        return null;
    }

    const updateField = (
        field: keyof FormState,
        value: string
    ) => {
        setForm((previous) => ({
            ...previous,
            [field]: value,
        }));
    };

    const handleSubmit = async () => {
        const name =
            form.name.trim();

        const role =
            form.role.trim();

        const address =
            form.address.trim();

        const city =
            form.city.trim();

        const state =
            form.state.trim();

        const pincode =
            form.pincode.trim();

        /*
         * Required validations
         */
        if (!name) {
            showAlert({
                type: "error",
                message:
                    "Name is required.",
            });

            return;
        }

        if (!role) {
            showAlert({
                type: "error",
                message:
                    "Role is required.",
            });

            return;
        }

        if (!address) {
            showAlert({
                type: "error",
                message:
                    "Address is required.",
            });

            return;
        }

        if (!city) {
            showAlert({
                type: "error",
                message:
                    "City is required.",
            });

            return;
        }

        if (!state) {
            showAlert({
                type: "error",
                message:
                    "State is required.",
            });

            return;
        }

        if (!pincode) {
            showAlert({
                type: "error",
                message:
                    "Pincode is required.",
            });

            return;
        }

        if (!/^\d{6}$/.test(pincode)) {
            showAlert({
                type: "error",
                message:
                    "Pincode must be a valid 6-digit number.",
            });

            return;
        }

        try {
            setSaving(true);

            await updateAdminUser(
                user.mobile,
                {
                    name,
                    role,
                    address,
                    city,
                    state,
                    pincode,
                }
            );

            showAlert({
                type: "success",
                message:
                    "User updated successfully.",
            });

            /*
             * Parent clears cache and reloads
             * the current page.
             */
            await onUpdated();

            onClose();
        } catch (error: any) {
            console.error(
                "Update admin user error",
                error
            );

            showAlert({
                type: "error",
                message:
                    error?.message ||
                    "Failed to update user.",
            });
        } finally {
            setSaving(false);
        }
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
        outline-none
        transition
        focus:border-[var(--color-primary)]
        focus:ring-4
        focus:ring-gray-100
        disabled:bg-gray-100
        disabled:text-gray-500
    `;

    const labelClass =
        "mb-2 block text-sm font-semibold text-gray-700";

    return (
        <div
            className="
                fixed
                inset-0
                z-50
                flex
                items-center
                justify-center
                bg-black/60
                backdrop-blur-sm
                p-3
                sm:p-4
            "
            onMouseDown={(event) => {
                if (
                    event.target ===
                    event.currentTarget &&
                    !saving
                ) {
                    onClose();
                }
            }}
        >
            <div
                className="
                    flex
                    w-full
                    max-w-lg
                    max-h-[calc(100dvh-1.5rem)]
                    sm:max-h-[calc(100dvh-2rem)]
                    flex-col
                    overflow-hidden
                    rounded-2xl
                    bg-white
                    shadow-2xl
                "
                onMouseDown={(event) =>
                    event.stopPropagation()
                }
            >
                {/* Header */}
                <div
                    className="
                        shrink-0
                        border-b
                        px-5
                        py-4
                        sm:px-6
                        sm:py-5
                    "
                >
                    <div className="flex items-start justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-3">
                            <div
                                className="
                                    flex
                                    h-10
                                    w-10
                                    shrink-0
                                    items-center
                                    justify-center
                                    rounded-xl
                                    bg-gray-100
                                    sm:h-11
                                    sm:w-11
                                "
                            >
                                <UserRoundPen
                                    size={21}
                                    className="
                                        text-[var(--color-primary)]
                                    "
                                />
                            </div>

                            <div className="min-w-0">
                                <h2
                                    className="
                                        truncate
                                        text-lg
                                        font-bold
                                        text-gray-900
                                        sm:text-xl
                                    "
                                >
                                    Edit User
                                </h2>

                                <p className="mt-0.5 text-sm text-gray-500">
                                    Update user details.
                                </p>
                            </div>
                        </div>

                        <button
                            type="button"
                            disabled={saving}
                            onClick={onClose}
                            className="
                                shrink-0
                                rounded-lg
                                p-2
                                text-gray-500
                                transition
                                hover:bg-gray-100
                                hover:text-gray-700
                                disabled:opacity-50
                            "
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Scrollable body */}
                <div
                    className="
                        min-h-0
                        flex-1
                        overflow-y-auto
                        overscroll-contain
                        px-5
                        py-5
                        sm:px-6
                        sm:py-6
                    "
                >
                    <div className="space-y-5">
                        {/* Mobile */}
                        <div>
                            <label
                                className={labelClass}
                            >
                                Mobile Number
                            </label>

                            <input
                                className={inputClass}
                                value={user.mobile}
                                disabled
                                readOnly
                            />
                        </div>

                        {/* Name */}
                        <div>
                            <label
                                className={labelClass}
                            >
                                Name
                            </label>

                            <input
                                className={inputClass}
                                value={form.name}
                                disabled={saving}
                                onChange={(event) =>
                                    updateField(
                                        "name",
                                        event.target.value
                                    )
                                }
                                placeholder="Enter user name"
                            />
                        </div>

                        {/* Role */}
                        <div>
                            <label
                                className={labelClass}
                            >
                                Role
                            </label>

                            <select
                                className={inputClass}
                                value={form.role}
                                disabled={saving}
                                onChange={(event) =>
                                    updateField(
                                        "role",
                                        event.target.value
                                    )
                                }
                            >
                                <option value="">
                                    Select role
                                </option>

                                <option value="user">
                                    User
                                </option>

                                <option value="admin">
                                    Admin
                                </option>

                                <option value="staff">
                                    Staff
                                </option>
                            </select>
                        </div>

                        {/* Address */}
                        <div>
                            <label
                                className={labelClass}
                            >
                                Address
                            </label>

                            <textarea
                                className={`
                                    ${inputClass}
                                    min-h-[100px]
                                    resize-y
                                `}
                                value={form.address}
                                disabled={saving}
                                onChange={(event) =>
                                    updateField(
                                        "address",
                                        event.target.value
                                    )
                                }
                                placeholder="Enter address"
                            />
                        </div>

                        {/* City */}
                        <div>
                            <label
                                className={labelClass}
                            >
                                City
                            </label>

                            <input
                                className={inputClass}
                                value={form.city}
                                disabled={saving}
                                onChange={(event) =>
                                    updateField(
                                        "city",
                                        event.target.value
                                    )
                                }
                                placeholder="Enter city"
                            />
                        </div>

                        {/* State */}
                        <div>
                            <label
                                className={labelClass}
                            >
                                State
                            </label>

                            <input
                                className={inputClass}
                                value={form.state}
                                disabled={saving}
                                onChange={(event) =>
                                    updateField(
                                        "state",
                                        event.target.value
                                    )
                                }
                                placeholder="Enter state"
                            />
                        </div>

                        {/* Pincode */}
                        <div>
                            <label
                                className={labelClass}
                            >
                                Pincode
                            </label>

                            <input
                                className={inputClass}
                                value={form.pincode}
                                disabled={saving}
                                inputMode="numeric"
                                maxLength={6}
                                onChange={(event) =>
                                    updateField(
                                        "pincode",
                                        event.target.value.replace(
                                            /\D/g,
                                            ""
                                        )
                                    )
                                }
                                placeholder="Enter 6-digit pincode"
                            />
                        </div>
                    </div>
                </div>

                {/* Footer */}
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
                            disabled={saving}
                            onClick={onClose}
                            className="
                                w-full
                                sm:w-auto
                            "
                        >
                            Cancel
                        </Button>

                        <Button
                            disabled={saving}
                            onClick={handleSubmit}
                            className="
                                w-full
                                sm:w-auto
                            "
                        >
                            {saving
                                ? "Saving..."
                                : "Save Changes"}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}