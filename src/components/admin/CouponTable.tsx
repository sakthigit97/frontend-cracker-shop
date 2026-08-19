import { useState } from "react";
import type { Coupon } from "../../services/coupon.api";
import { useAdminCouponStore } from "../../store/adminCoupon.store";
import { useAlert } from "../../store/alert.store";
import { FaTrash, FaTicketAlt } from "react-icons/fa";
import ConfirmDialog from "../ui/ConfirmDialog";
import { formatDateTime } from "../../utils/date";

interface Props {
    coupons: Coupon[];
}

export default function CouponTable({ coupons }: Props) {
    const { deleteCoupon } = useAdminCouponStore();
    const { showAlert } = useAlert();
    const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
    const [selectedCoupon, setSelectedCoupon] = useState<string | null>(null);
    const handleDelete = async (couponCode: string) => {
        setShowLeaveConfirm(true);
        setSelectedCoupon(couponCode);
    };

    const confirmDelete = async () => {
        if (!selectedCoupon) return;

        try {
            await deleteCoupon(selectedCoupon);

            showAlert({
                type: "success",
                message: "Coupon deleted successfully",
            });

            setShowLeaveConfirm(false);
            setSelectedCoupon(null);
        } catch (err: any) {
            showAlert({
                type: "error",
                message: err.message || "Failed to delete coupon",
            });
        }
    };

    if (!coupons.length) {
        return (
            <div className="
                bg-white
                rounded-xl
                shadow-sm
                border
                px-6
                py-10
                sm:px-10
                sm:py-16
                ">
                <div className="flex flex-col items-center">

                    <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center">
                        <FaTicketAlt className="text-3xl text-orange-500" />
                    </div>

                    <h3 className="mt-5 text-xl font-semibold text-gray-900">
                        No Coupons Created Yet
                    </h3>

                    <p className="mt-2 text-gray-500 text-center max-w-md">
                        Create your first coupon to offer discounts and promotional
                        campaigns for your customers.
                    </p>
                </div>
            </div>
        );
    }
    return (
        <div className="bg-white rounded-xl shadow border overflow-hidden">

            <div className="max-h-[500px] overflow-auto">

                <table className="min-w-full">
                    <thead className="sticky top-0 z-10 bg-gray-100">
                        <tr className="text-left">

                            <th className="px-4 py-3">Coupon</th>

                            <th className="px-4 py-3">Description</th>

                            <th className="px-4 py-3">Type</th>

                            <th className="px-4 py-3">Value</th>

                            <th className="px-4 py-3">
                                Expiry
                            </th>

                            <th className="px-4 py-3 text-center">
                                Action
                            </th>

                        </tr>
                    </thead>

                    <tbody>
                        {coupons.map((coupon) => (
                            <tr
                                key={coupon.couponCode}
                                className="border-t hover:bg-gray-50"
                            >
                                <td className="px-4 py-3 font-semibold">
                                    {coupon.couponCode}
                                </td>

                                <td className="px-4 py-3">
                                    {coupon.description || "-"}
                                </td>

                                <td className="px-4 py-3">
                                    {coupon.type}
                                </td>

                                <td className="px-4 py-3">
                                    {coupon.type === "FLAT"
                                        ? `₹${coupon.value}`
                                        : `${coupon.value}%`}
                                </td>

                                <td className="px-4 py-3">
                                    {formatDateTime(coupon.expiryDate)}
                                </td>

                                <td className="px-4 py-3 text-center">
                                    <button
                                        onClick={() => handleDelete(coupon.couponCode)}
                                        className="rounded-lg p-2 text-red-600 transition hover:bg-red-50 hover:text-red-700"
                                        title="Delete Coupon"
                                    >
                                        <FaTrash size={16} />
                                    </button>
                                </td>

                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <ConfirmDialog
                open={showLeaveConfirm}
                title="Delete coupon?"
                description="Are you sure you want to delete this coupon?"
                confirmText="Delete"
                cancelText="Cancel"
                onConfirm={confirmDelete}
                onCancel={() => {
                    setShowLeaveConfirm(false);
                    setSelectedCoupon(null);
                }}
            />
        </div>
    );
}