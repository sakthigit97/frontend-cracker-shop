import { useLocation, useNavigate } from "react-router-dom";
import Button from "../components/ui/Button";

type OrderSuccessState = {
  orderId: string;
  address: string;
  total: number;
  paymentMode: string;
  estimatedDelivery: string;
};

export default function OrderSuccess() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as OrderSuccessState | null;

  if (!state) {
    navigate("/", { replace: true });
    return null;
  }

  const {
    orderId,
    address,
    total,
    paymentMode,
    estimatedDelivery,
  } = state;

  return (
    <div className="px-4 py-8 sm:py-12">
      <div className="max-w-lg mx-auto bg-white rounded-2xl border shadow-sm p-6 sm:p-8 text-center">

        {/* Success Icon */}
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-600 text-3xl">
          ✓
        </div>

        {/* Title */}
        <h1 className="text-xl sm:text-2xl font-bold text-[var(--color-primary)] mb-2">
          Order Placed Successfully
        </h1>

        <p className="text-sm text-[var(--color-muted)] mb-6">
          Thank you for your order. Your crackers will be delivered soon 🎆
        </p>

        {/* Order Summary Card */}
        <div className="text-left border rounded-xl p-4 sm:p-5 space-y-3 mb-6">

          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Order ID</span>
            <span className="font-medium">{orderId}</span>
          </div>

          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Payment Mode</span>
            <span>{paymentMode}</span>
          </div>

          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Total Amount</span>
            <span className="font-semibold">₹{total}</span>
          </div>

          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Delivery</span>
            <span className="text-right">{estimatedDelivery}</span>
          </div>

          <hr className="my-3" />
          {/* Address */}
          <div>
            <p className="text-sm text-gray-500 mb-1">
              Delivery Address
            </p>
            <p className="text-sm leading-relaxed whitespace-pre-line">
              {address}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            className="w-full"
            onClick={() => navigate("/")}
          >
            Continue Shopping
          </Button>

          <Button
            variant="secondary"
            className="w-full"
            onClick={() => navigate("/orders")}
          >
            View My Orders
          </Button>
        </div>
      </div>
    </div>
  );
}