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
    <div className="bg-[var(--color-background)] min-h-screen py-6 px-4">

      <div className="max-w-xl mx-auto rounded-3xl bg-white shadow-lg border overflow-hidden">

        {/* Header */}
        <div className="bg-green-50 border-b px-6 py-8 text-center">

          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-100 text-green-600 text-5xl shadow-sm">
            ✓
          </div>

          <h1 className="mt-5 text-2xl md:text-3xl font-bold text-[var(--color-primary)]">
            Order Placed Successfully
          </h1>

          <p className="mt-3 text-sm md:text-base text-gray-600 leading-6">
            Thank you for shopping with us.
            <br />
            We'll notify you once your order is confirmed by us.
          </p>

        </div>

        <div className="p-5 md:p-6 space-y-5">

          {/* Order Information */}
          <div className="rounded-2xl border p-5">

            <h2 className="font-semibold text-lg mb-4">
              📦 Order Information
            </h2>

            <div className="space-y-4">

              <div className="border-b pb-3">
                <p className="text-xs uppercase tracking-wide text-gray-500">
                  Order ID
                </p>

                <p className="mt-1 font-semibold text-[15px] break-words">
                  {orderId}
                </p>
              </div>


              <div className="border-b pb-3">
                <p className="text-xs uppercase tracking-wide text-gray-500">
                  Payment
                </p>

                <p className="mt-1 font-semibold text-[15px] break-words">
                  {paymentMode}
                </p>
              </div>



              <div className="border-b pb-3">
                <p className="text-xs uppercase tracking-wide text-gray-500">
                  Amount
                </p>

                <p className="mt-1 font-semibold text-[15px] break-words">
                  ₹{total}
                </p>
              </div>

              <div className="space-y-2">
                <div className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-3 text-sm leading-6 text-gray-700">
                  <b>Expected Delivery:</b> 🚚 {estimatedDelivery}
                </div>
              </div>

            </div>

          </div>

          <div className="rounded-2xl border p-5">

            <h2 className="font-semibold text-lg mb-4">
              📍 Delivery Address
            </h2>

            <div className="whitespace-pre-line leading-7 text-gray-700">
              {address}
            </div>

          </div>

          {/* Buttons */}

          <div className="pt-2 flex flex-col sm:flex-row gap-3">

            <Button
              className="w-full h-12 text-base"
              onClick={() => navigate("/")}
            >
              Continue Shopping
            </Button>

            <Button
              variant="secondary"
              className="w-full h-12 text-base"
              onClick={() => navigate("/orders")}
            >
              View My Orders
            </Button>

          </div>

        </div>

      </div>

    </div>
  );
}