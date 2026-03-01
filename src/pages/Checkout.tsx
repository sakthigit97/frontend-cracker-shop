import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../components/ui/Button";
import { useCartProducts } from "../hooks/useCartProducts";
import { apiFetch } from "../services/api";
import { cartStore } from "../store/cart.store";
import { useConfigStore } from "../store/config.store";
import { useAlert } from "../store/alert.store";

type ProfileResponse = {
  success: boolean;
  data: {
    name: string;
    mobile: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
    walletCredit?: number;
  };
};

type AddressMode = "PROFILE" | "NEW";
export default function Checkout() {
  const navigate = useNavigate();
  const { products } = useCartProducts();
  const lockCart = cartStore((s) => s.lock);
  const clearCart = cartStore((s) => s.clear);
  const config = useConfigStore((s) => s.config);
  const isPaymentEnabled = config?.isPaymentEnabled ?? false;
  const { showAlert } = useAlert();

  const [profileAddress, setProfileAddress] = useState("");
  const [newAddress, setNewAddress] = useState("");
  const [addressMode, setAddressMode] = useState<AddressMode>("PROFILE");
  const [walletCredit, setWalletCredit] = useState(0);

  const [loadingProfile, setLoadingProfile] = useState(true);
  const [placingOrder, setPlacingOrder] = useState(false);
  const totalAmount = useMemo(
    () => products.reduce((sum, p) => sum + p.price * p.quantity, 0),
    [products]
  );
  const creditUsed = Math.min(walletCredit, totalAmount);
  const finalPayable = totalAmount - creditUsed;

  useEffect(() => {
    let mounted = true;

    async function fetchProfile() {
      try {
        const res: ProfileResponse = await apiFetch("/user/profile");

        if (!mounted || !res?.data) return;

        const formatted = `
        ${res.data.name}
        ${res.data.mobile}
        ${res.data.address}
        ${res.data.city}, ${res.data.state} - ${res.data.pincode}
        `.trim();
        setWalletCredit(res.data.walletCredit || 0);

        setProfileAddress(formatted);
      } catch {
        setAddressMode("NEW");
      } finally {
        if (mounted) setLoadingProfile(false);
      }
    }

    fetchProfile();
    return () => {
      mounted = false;
    };
  }, []);

  const placeOrder = async () => {
    if (placingOrder) return;
    const cartItems = cartStore.getState().items;
    if (Object.keys(cartItems).length === 0) {
      showAlert({
        type: "error",
        message: "Your cart is empty",
      });
      return;
    }

    const finalAddress =
      addressMode === "PROFILE"
        ? profileAddress
        : newAddress;

    if (!finalAddress.trim()) {
      showAlert({
        type: "error",
        message: "Delivery address is required",
      });
      return;
    }

    setPlacingOrder(true);
    try {
      let paymentMode: "OFFLINE" | "ONLINE" = "OFFLINE";
      let paymentStatus:
        | "NOT_REQUIRED"
        | "SUCCESS"
        | "PENDING" = "NOT_REQUIRED";
      let transactionId: string | null = null;
      if (isPaymentEnabled) {
        paymentMode = "ONLINE";
        paymentStatus = "PENDING";

        const paymentResult = await startMockPayment(
          totalAmount
        );

        if (!paymentResult.success) {
          showAlert({
            type: "error",
            message: "Payment failed. Please try again.",
          });
          return;
        }

        paymentStatus = "SUCCESS";
        transactionId = paymentResult.transactionId;
      }

      const res = await apiFetch("/orders", {
        method: "POST",
        body: JSON.stringify({
          address: finalAddress,
          paymentMode,
          paymentStatus,
          transactionId,
        }),
      });

      lockCart();
      clearCart();
      cartStore.getState().clear();
      cartStore.getState().clearDirty();

      navigate("/order-success", {
        state: {
          orderId: res.orderId,
          address: finalAddress,
          total: totalAmount,
          paymentMode:
            paymentMode === "ONLINE"
              ? "Online Payment (Paid)"
              : "Cash on Delivery",
          estimatedDelivery:
            "Tamil Nadu: 5 working days, Other states: 10 working days",
        },
      });

    } catch (err) {
      console.error(err);
      showAlert({
        type: "error",
        message: "Order failed. Please try again.",
      });
    } finally {
      setPlacingOrder(false);
    }
  };

  async function startMockPayment(total: number) {
    console.log("Mock Payment Started:", total);
    await new Promise((res) => setTimeout(res, 1500));

    // Future:
    // 1. Create Razorpay Order API
    // 2. Open Razorpay Checkout
    // 3. Verify payment
    // 4. Place order only after success

    return {
      success: true,
      transactionId: `MOCK-${Date.now()}`,
    };
  }

  if (products.length === 0) {
    return (
      <div className="py-24 text-center text-gray-500">
        Your cart is empty
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      <h1 className="text-2xl font-bold text-[var(--color-primary)]">
        Checkout
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white rounded-xl border p-5 space-y-4">
          <h2 className="font-semibold text-lg">Delivery Address</h2>

          {loadingProfile ? (
            <p className="text-sm text-gray-500">
              Loading saved address…
            </p>
          ) : (
            <>
              {profileAddress && (
                <label className="flex gap-3 cursor-pointer">
                  <input
                    type="radio"
                    checked={addressMode === "PROFILE"}
                    onChange={() =>
                      setAddressMode("PROFILE")
                    }
                  />
                  <div className="text-sm whitespace-pre-line">
                    {profileAddress}
                  </div>
                </label>
              )}
              <label className="flex gap-3 cursor-pointer">
                <input
                  type="radio"
                  checked={addressMode === "NEW"}
                  onChange={() =>
                    setAddressMode("NEW")
                  }
                />
                <span className="text-sm">
                  Use a different address
                </span>
              </label>

              {addressMode === "NEW" && (
                <textarea
                  rows={6}
                  value={newAddress}
                  onChange={(e) =>
                    setNewAddress(e.target.value)
                  }
                  placeholder="Enter delivery address"
                  className="
                    w-full
                    rounded-lg
                    border
                    p-3
                    text-sm
                    focus:ring-2
                    focus:ring-[var(--color-primary)]
                  "
                />
              )}
            </>
          )}
        </div>

        <div className="bg-white rounded-xl border p-5 space-y-4">
          <h2 className="font-semibold text-lg">Order Summary</h2>

          <div className="space-y-2 max-h-[280px] overflow-y-auto">
            {products.map((p) => (
              <div
                key={p.id}
                className="flex justify-between text-sm"
              >
                <span>
                  {p.name} × {p.quantity}
                </span>
                <span>₹{p.price * p.quantity}</span>
              </div>
            ))}
          </div>

          <div className="border-t pt-4 flex justify-between font-semibold">
            <span>Total</span>
            <span>₹{totalAmount}</span>
          </div>

          {walletCredit > 0 && (
            <div className="border-t pt-3 space-y-1 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Wallet Credit Available</span>
                <span>₹{walletCredit}</span>
              </div>

              <div className="flex justify-between text-green-700 font-medium">
                <span>Credit Applied</span>
                <span>- ₹{creditUsed}</span>
              </div>

              <div className="flex justify-between font-semibold text-[var(--color-primary)] pt-2">
                <span>Final Payable</span>
                <span>₹{finalPayable}</span>
              </div>
            </div>
          )}

          {isPaymentEnabled ? (
            <Button
              onClick={placeOrder}
              disabled={placingOrder}
              className="w-full py-3 text-base"
            >
              {placingOrder
                ? "Redirecting…"
                : "Pay Online (Mock)"}
            </Button>
          ) : (
            <Button
              onClick={placeOrder}
              disabled={placingOrder}
              className="w-full py-3 text-base"
            >
              {placingOrder
                ? "Placing Order…"
                : "Place Order (Cash on Delivery)"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}