import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Button from "../../components/ui/Button";
import { useAlert } from "../../store/alert.store";

import {
    getDiscountById,
    updateDiscount,
} from "../../services/adminDiscounts.api";

import { useAdminDiscountsStore } from "../../store/adminDiscounts.store";

export default function AdminEditDiscount() {
    const navigate = useNavigate();
    const { showAlert } = useAlert();

    const { discountId } = useParams<{ discountId: string }>();

    const refreshDiscounts = useAdminDiscountsStore(
        (s) => s.refreshDiscounts
    );

    if (!discountId) {
        return (
            <div className="p-6 text-red-500 text-sm">
                Discount ID missing in URL
            </div>
        );
    }

    const [fetching, setFetching] = useState(true);
    const [loading, setLoading] = useState(false);

    const [form, setForm] = useState({
        discountMode: "PERCENT",
        discountValue: 0,
        priority: 1,
        isActive: true,
    });

    const [original, setOriginal] = useState({
        discountMode: "PERCENT",
        discountValue: 0,
        priority: 1,
        isActive: true,
    });

    const [readonlyInfo, setReadonlyInfo] = useState({
        discountType: "",
        targetId: "",
    });

    /* ================================
       LOAD DISCOUNT
    ================================ */
    useEffect(() => {
        const loadDiscount = async () => {
            try {
                const res = await getDiscountById(discountId);

                setForm({
                    discountMode: res.discountMode,
                    discountValue: res.discountValue,
                    priority: res.priority,
                    isActive: res.isActive,
                });

                setOriginal({
                    discountMode: res.discountMode,
                    discountValue: res.discountValue,
                    priority: res.priority,
                    isActive: res.isActive,
                });

                setReadonlyInfo({
                    discountType: res.discountType,
                    targetId: res.targetId,
                });
            } catch (err: any) {
                showAlert({
                    type: "error",
                    message: err?.message || "Failed to load discount",
                });

                navigate("/admin/discounts");
            } finally {
                setFetching(false);
            }
        };

        loadDiscount();
    }, [discountId]);

    /* ================================
       CHANGE DETECTION
    ================================ */
    const hasChanges = useMemo(() => {
        if (form.discountMode !== original.discountMode) return true;
        if (form.discountValue !== original.discountValue) return true;
        if (form.priority !== original.priority) return true;
        if (form.isActive !== original.isActive) return true;
        return false;
    }, [form, original]);

    /* ================================
       UPDATE DISCOUNT
    ================================ */
    const handleUpdate = async () => {
        if (!hasChanges) {
            showAlert({
                type: "error",
                message: "No changes to update",
            });
            return;
        }

        if (form.discountValue <= 0) {
            showAlert({
                type: "error",
                message: "Discount value must be greater than 0",
            });
            return;
        }

        try {
            setLoading(true);

            await updateDiscount(discountId, {
                discountMode: form.discountMode,
                discountValue: form.discountValue,
                priority: form.priority,
                isActive: form.isActive,
            });

            showAlert({
                type: "success",
                message: "Discount updated successfully",
            });

            await refreshDiscounts();

            navigate("/admin/discounts");
        } catch (err: any) {
            showAlert({
                type: "error",
                message: err?.message || "Failed to update discount",
            });
        } finally {
            setLoading(false);
        }
    };

    if (fetching) {
        return (
            <>
                {Array.from({ length: 5 }).map((_, i) => (
                    <div className="p-6 space-y-4" key={i}>
                        <div className="h-6 w-52 bg-gray-200 rounded animate-pulse" />
                        <div className="h-32 bg-gray-100 rounded-xl animate-pulse" />
                        <div className="h-64 bg-gray-100 rounded-xl animate-pulse" />
                    </div>
                ))}
            </>
        );
    }

    return (
        <div className="max-w-2xl mx-auto p-6 space-y-6">
            <h1 className="text-2xl font-bold">Edit Discount</h1>

            {/* Readonly Info */}
            <div className="border rounded-xl p-4 bg-gray-50 text-sm space-y-1">
                <p>
                    <b>Discount Type:</b> {readonlyInfo.discountType}
                </p>
                <p>
                    <b>Target ID:</b> {readonlyInfo.targetId}
                </p>
            </div>

            {/* Editable Form */}
            <div className="border rounded-2xl p-5 space-y-4 bg-white shadow-sm">
                {/* Mode */}
                <div>
                    <p className="text-sm font-medium mb-1">
                        Discount Mode
                    </p>
                    <select
                        className="border rounded-lg px-3 py-2 w-full"
                        value={form.discountMode}
                        onChange={(e) =>
                            setForm((p) => ({
                                ...p,
                                discountMode: e.target.value,
                            }))
                        }
                    >
                        <option value="PERCENT">Percent (%)</option>
                        <option value="FLAT">Flat (₹)</option>
                    </select>
                </div>

                {/* Value */}
                <div>
                    <p className="text-sm font-medium mb-1">
                        Discount Value
                    </p>
                    <input
                        type="number"
                        className="border rounded-lg px-3 py-2 w-full"
                        value={form.discountValue}
                        onChange={(e) =>
                            setForm((p) => ({
                                ...p,
                                discountValue: Number(e.target.value),
                            }))
                        }
                    />
                </div>

                {/* Priority */}
                <div>
                    <p className="text-sm font-medium mb-1">
                        Priority
                    </p>
                    <select
                        className="border rounded-lg px-3 py-2 w-full"
                        value={form.priority}
                        onChange={(e) =>
                            setForm((p) => ({
                                ...p,
                                priority: Number(e.target.value),
                            }))
                        }
                    >
                        <option value={1}>1 (Highest)</option>
                        <option value={2}>2</option>
                        <option value={3}>3 (Lowest)</option>
                    </select>
                </div>

                {/* Active */}
                <label className="flex items-center gap-2 text-sm">
                    <input
                        type="checkbox"
                        checked={form.isActive}
                        onChange={(e) =>
                            setForm((p) => ({
                                ...p,
                                isActive: e.target.checked,
                            }))
                        }
                    />
                    Active Discount
                </label>

                {/* Actions */}
                <div className="flex gap-3">
                    <Button
                        onClick={handleUpdate}
                        disabled={loading || !hasChanges}
                    >
                        {loading
                            ? "Updating…"
                            : hasChanges
                                ? "Update Discount"
                                : "No Changes"}
                    </Button>

                    <Button
                        variant="outline"
                        disabled={loading}
                        onClick={() => navigate("/admin/discounts")}
                    >
                        Cancel
                    </Button>
                </div>
            </div>
        </div>
    );
}