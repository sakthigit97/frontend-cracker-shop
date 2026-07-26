import { useEffect, useState } from "react";
import Button from "../../components/ui/Button";
import CouponFormModal from "../../components/admin/CouponFormModal";
import CouponTable from "../../components/admin/CouponTable";
import { useAdminCouponStore } from "../../store/adminCoupon.store";

export default function AdminCoupons() {
    const {
        coupons,
        loading,
        fetchCoupons,
    } = useAdminCouponStore();

    const [open, setOpen] = useState(false);

    useEffect(() => {
        fetchCoupons();
    }, []);

    return (
        <div className="space-y-6">

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                <div>
                    <h1 className="text-2xl font-bold">
                        Coupons
                    </h1>

                    <p className="text-gray-500">
                        Create and manage discount coupons
                    </p>
                </div>

                <Button
                    onClick={() => setOpen(true)}
                    className="w-full sm:w-auto"
                >
                    + Create Coupon
                </Button>

            </div>

            {loading ? (
                <div className="bg-white rounded-xl shadow-sm border p-6">
                    <div className="animate-pulse space-y-4">

                        <div className="h-8 w-48 rounded bg-gray-200"></div>

                        {[...Array(5)].map((_, index) => (
                            <div
                                key={index}
                                className="grid grid-cols-6 gap-4"
                            >
                                <div className="h-5 rounded bg-gray-200"></div>
                                <div className="h-5 rounded bg-gray-200"></div>
                                <div className="h-5 rounded bg-gray-200"></div>
                                <div className="h-5 rounded bg-gray-200"></div>
                                <div className="h-5 rounded bg-gray-200"></div>
                                <div className="h-5 rounded bg-gray-200"></div>
                            </div>
                        ))}

                    </div>
                </div>
            ) : (
                <CouponTable coupons={coupons} />
            )}

            <CouponFormModal
                open={open}
                onClose={() => setOpen(false)}
            />

        </div>
    );
}