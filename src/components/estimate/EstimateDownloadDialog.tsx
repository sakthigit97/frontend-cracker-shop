import { useEffect, useState } from "react";
import Button from "../ui/Button";

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

export default function EstimateDownloadDialog({
    open,
    loading = false,
    onClose,
    onDownload,
}: Props) {
    const [customerName, setCustomerName] = useState("");
    const [mobile, setMobile] = useState("");
    const [email, setEmail] = useState("");

    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (open) {
            setErrors({});
        }
    }, [open]);

    if (!open) return null;

    function validate() {
        const next: Record<string, string> = {};

        if (!customerName.trim()) {
            next.customerName = "Customer name is required";
        } else if (customerName.trim().length < 3) {
            next.customerName = "Minimum 3 characters";
        }

        if (!mobile.trim()) {
            next.mobile = "Mobile number is required";
        } else if (!/^[6-9]\d{9}$/.test(mobile.trim())) {
            next.mobile = "Enter a valid 10 digit mobile number";
        }

        if (
            email.trim() &&
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
        ) {
            next.email = "Enter a valid email";
        }

        setErrors(next);

        return Object.keys(next).length === 0;
    }

    function submit() {
        if (!validate()) return;

        onDownload({
            customerName: customerName.trim(),
            mobile: mobile.trim(),
            email: email.trim() || undefined,
        });
    }

    return (
        <div className="fixed inset-0 z-[80] bg-black/40 flex items-center justify-center p-4">

            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">

                <h2 className="text-xl font-semibold mb-1">
                    Download Estimate
                </h2>

                <p className="text-sm text-gray-500 mb-6">
                    Please enter customer details before downloading.
                </p>

                <div className="space-y-4">

                    <div>
                        <label className="text-sm font-medium">
                            Customer Name *
                        </label>

                        <input
                            value={customerName}
                            onChange={(e) =>
                                setCustomerName(e.target.value)
                            }
                            className="w-full mt-1 rounded-lg border px-3 py-2"
                        />

                        {errors.customerName && (
                            <p className="text-red-500 text-xs mt-1">
                                {errors.customerName}
                            </p>
                        )}
                    </div>

                    <div>
                        <label className="text-sm font-medium">
                            Mobile Number *
                        </label>

                        <input
                            value={mobile}
                            maxLength={10}
                            onChange={(e) =>
                                setMobile(
                                    e.target.value.replace(/\D/g, "")
                                )
                            }
                            className="w-full mt-1 rounded-lg border px-3 py-2"
                        />

                        {errors.mobile && (
                            <p className="text-red-500 text-xs mt-1">
                                {errors.mobile}
                            </p>
                        )}
                    </div>

                    <div>
                        <label className="text-sm font-medium">
                            Email (Optional)
                        </label>

                        <input
                            value={email}
                            onChange={(e) =>
                                setEmail(e.target.value)
                            }
                            className="w-full mt-1 rounded-lg border px-3 py-2"
                        />

                        {errors.email && (
                            <p className="text-red-500 text-xs mt-1">
                                {errors.email}
                            </p>
                        )}
                    </div>

                </div>

                <div className="flex justify-end gap-3 mt-8">

                    <Button
                        variant="secondary"
                        onClick={onClose}
                    >
                        Cancel
                    </Button>

                    <Button
                        onClick={submit}
                        disabled={loading}
                    >
                        {loading ? "Downloading..." : "Download PDF"}
                    </Button>

                </div>

            </div>

        </div>
    );
}