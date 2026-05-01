import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../components/ui/Button";
import { useCartProducts } from "../hooks/useCartProducts";
import { apiFetch } from "../services/api";
import { cartStore } from "../store/cart.store";
import { useConfigStore } from "../store/config.store";
import { useAlert } from "../store/alert.store";
import { INDIA_STATES } from "../utils/states";
import { calculateOrderAmounts } from "../utils/pricing";

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
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedTransport, setAcceptedTransport] = useState(false);
  const [profileAddress, setProfileAddress] = useState("");
  const [profilePincode, setProfilePicode] = useState("");
  const [line1, setLine1] = useState("");
  const [line2, setLine2] = useState("");
  const [city, setCity] = useState("");
  const [stateValue, setStateValue] = useState("");
  const [pincode, setPincode] = useState("");
  const [addressMode, setAddressMode] = useState<AddressMode>("PROFILE");
  const [walletCredit, setWalletCredit] = useState(0);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [minOrderValid, setMinOrderValid] = useState(true);
  const totalAmount = useMemo(
    () => products.reduce((sum, p) => sum + p.price * p.quantity, 0),
    [products]
  );
  const packagingPercent = config?.packagingPercent ?? 0;
  const gstPercent = config?.gstPercent ?? 0;
  const currentState =
    addressMode === "PROFILE"
      ? profileAddress
      : stateValue;

  const { packagingCharge, gstAmount, grandTotal } =
    useMemo(
      () =>
        calculateOrderAmounts({
          totalAmount,
          packagingPercent,
          gstPercent,
          state: currentState,
          config,
        }),
      [totalAmount, packagingPercent, gstPercent, currentState, config]
    );

  const creditUsed = Math.min(walletCredit, grandTotal);
  const finalPayable = grandTotal - creditUsed;

  useEffect(() => {
    const currentPincode =
      addressMode === "PROFILE" ? profilePincode : pincode;

    if (!currentPincode || currentPincode.length !== 6) {
      setMinOrderValid(false);
      return;
    }

    let active = true;

    (async () => {
      const res = await validateMinimumOrder(
        currentPincode,
        totalAmount
      );

      if (!active) return;
      setMinOrderValid(res.valid);
    })();

    return () => {
      active = false;
    };
  }, [pincode, profilePincode, addressMode, totalAmount]);


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
        setProfilePicode(res.data.pincode);
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

  async function validateMinimumOrder(
    pincode: string,
    amount: number
  ): Promise<{ valid: boolean; message?: string }> {
    try {
      const res = await fetch(
        `https://api.postalpincode.in/pincode/${pincode}`
      );
      const data = await res.json();

      if (!data || data[0].Status !== "Success") {
        return {
          valid: false,
          message: "Invalid pincode. Please enter a valid pincode.",
        };
      }

      const state = data[0].PostOffice[0].State;
      let minAmount = config?.otherStateMinOrderValue || 5000;
      if (state === "Tamil Nadu") {
        minAmount = config?.tnMinOrderValue || 3000;
      }

      if (amount < minAmount) {
        return {
          valid: false,
          message: `Minimum order for ${state} is ₹${minAmount}`,
        };
      }
      return { valid: true };
    } catch (err) {
      return {
        valid: false,
        message: "Unable to verify pincode. Please try again.",
      };
    }
  }

  const placeOrder = async () => {
    if (placingOrder) return;
    if (!acceptedTerms || !acceptedTransport) {
      showAlert({
        type: "error",
        message: "Please accept terms and transportation conditions to proceed",
      });
      return;
    }

    const cartItems = cartStore.getState().items;
    if (Object.keys(cartItems).length === 0) {
      showAlert({
        type: "error",
        message: "Your cart is empty",
      });
      return;
    }
    let finalAddress = "";

    if (addressMode === "PROFILE") {
      finalAddress = profileAddress;
    } else {
      if (!line1 || !city || !stateValue || pincode.length !== 6) {
        showAlert({
          type: "error",
          message: "Please complete all required address fields",
        });
        return;
      }

      const addressParts = [
        line1,
        line2,
        `${city}, ${stateValue} - ${pincode}`,
      ];
      finalAddress = addressParts.filter(Boolean).join("\n");
    }
    if (!finalAddress.trim()) {
      showAlert({
        type: "error",
        message: "Delivery address is required",
      });
      return;
    }
    const currentPincode =
      addressMode === "PROFILE"
        ? profilePincode
        : pincode;

    if (!currentPincode) {
      showAlert({
        type: "error",
        message: "Pincode is required for validation",
      });
      return;
    }

    const validation = await validateMinimumOrder(
      currentPincode,
      totalAmount
    );

    if (!validation.valid) {
      showAlert({
        type: "error",
        message: validation.message || "Minimum order not met",
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
          finalPayable
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
          subtotal: totalAmount,
          packagingCharge,
          gstAmount,
          totalAmount: grandTotal,
          walletUsed: creditUsed,
          finalPayable,
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
          total: finalPayable,
          paymentMode: paymentMode === "ONLINE"
            ? "Online Payment (Paid)"
            : "Online Payment Required",
          estimatedDelivery: "Tamil Nadu: 3 to 5 working days, Other states: 7 to 10 working days",
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


      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={() => navigate(-1)}
          className="
          flex items-center justify-center
          w-9 h-9
          rounded-full
          bg-[var(--color-primary)]
          text-white
          shadow-sm

          hover:scale-105
          active:scale-95
          transition-all
        "
        >
          ←
        </button>

        <h1 className="text-xl md:text-2xl font-semibold text-[var(--color-primary)]">
          Checkout
        </h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white rounded-xl border p-5 space-y-4">
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-lg p-4 text-sm space-y-2">
            <p className="font-semibold flex items-center gap-2">
              ⚠️ Important Information
            </p>

            <p>
              • Home delivery is not available. Orders will be dispatched via a transport service.
            </p>

            <p>
              • Customers must collect the parcel from the transport office/service point.
            </p>

            <p>
              • Minimum order value:
              <br />
              &nbsp;&nbsp;– Tamil Nadu: ₹{config?.tnMinOrderValue ?? 3000}
              <br />
              &nbsp;&nbsp;– Other States: ₹{config?.otherStateMinOrderValue ?? 5000}
            </p>
          </div>

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
                <div className="space-y-3 mt-3">

                  <input
                    type="text"
                    placeholder="Address Line 1 *"
                    value={line1}
                    onChange={(e) => setLine1(e.target.value)}
                    className="w-full rounded-lg border p-3 text-sm"
                  />

                  <input
                    type="text"
                    placeholder="Address Line 2"
                    value={line2}
                    onChange={(e) => setLine2(e.target.value)}
                    className="w-full rounded-lg border p-3 text-sm"
                  />

                  <input
                    type="text"
                    placeholder="City *"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full rounded-lg border p-3 text-sm"
                  />

                  <select
                    value={stateValue}
                    onChange={(e) => setStateValue(e.target.value)}
                    className="w-full rounded-lg border p-3 text-sm bg-white"
                  >
                    <option value="">Select State *</option>
                    {INDIA_STATES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>

                  <input
                    type="text"
                    placeholder="Pincode *"
                    value={pincode}
                    maxLength={6}
                    onChange={(e) =>
                      setPincode(e.target.value.replace(/\D/g, ""))
                    }
                    className="w-full rounded-lg border p-3 text-sm"
                  />

                </div>
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
                className="flex justify-between items-start text-sm py-2"
              >
                <div>
                  <div>{p.name} × {p.quantity}</div>

                  <div className="flex items-center gap-2 mt-1">
                    {p.originalPrice && p.originalPrice > p.price ? (
                      <>
                        <span className="line-through text-gray-400 text-xs">
                          ₹{p.originalPrice}
                        </span>

                        <span className="text-green-600 font-semibold">
                          ₹{p.price}
                        </span>

                        {p.discountText && (
                          <span className="text-green-600 text-xs font-medium bg-green-50 px-1 rounded">
                            {p.discountText}
                          </span>
                        )}
                      </>
                    ) : (
                      <span className="font-medium">₹{p.price}</span>
                    )}
                  </div>
                </div>

                <div className="font-medium">
                  ₹{p.price * p.quantity}
                </div>
              </div>
            ))}
          </div>

          <div className="border-t pt-4 space-y-2 text-sm">

            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>₹{totalAmount}</span>
            </div>

            {packagingCharge > 0 && (
              <div className="flex justify-between text-gray-600">
                <span>Packaging Charges ({packagingPercent}%)</span>
                <span>₹{packagingCharge}</span>
              </div>
            )}

            {gstAmount > 0 && (
              <div className="flex justify-between text-gray-600">
                <span>GST ({gstPercent}%)</span>
                <span>₹{gstAmount}</span>
              </div>
            )}

            <div className="flex justify-between font-semibold text-[var(--color-primary)] pt-2 border-t">
              <span>Grand Total</span>
              <span>₹{grandTotal}</span>
            </div>

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

          <div className="space-y-3 text-sm mt-4">

            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
                className="mt-1"
              />
              <span>
                I agree to the{" "}
                <a
                  href="/privacy-policy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  Terms & Conditions
                </a>
              </span>
            </label>

            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={acceptedTransport}
                onChange={(e) => setAcceptedTransport(e.target.checked)}
                className="mt-1"
              />
              <span>
                I acknowledge that transportation and parcel charges are to be borne by the customer.
              </span>
            </label>
          </div>

          {isPaymentEnabled ? (
            <Button
              onClick={placeOrder}
              disabled={
                placingOrder ||
                !acceptedTerms ||
                !acceptedTransport ||
                products.length === 0 ||
                !minOrderValid
              }
              className={`w-full py-3 text-base transition-all ${placingOrder ||
                !acceptedTerms ||
                !acceptedTransport ||
                products.length === 0 ||
                !minOrderValid
                ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                : "bg-[var(--color-primary)] text-white hover:opacity-90"
                }`}

            >
              {placingOrder
                ? "Redirecting…"
                : "Pay Online (Mock)"}
            </Button>
          ) : (
            <Button
              onClick={placeOrder}
              disabled={
                placingOrder ||
                !acceptedTerms ||
                !acceptedTransport ||
                products.length === 0 ||
                !minOrderValid
              }
              className={`w-full py-3 text-base transition-all ${placingOrder ||
                !acceptedTerms ||
                !acceptedTransport ||
                products.length === 0 ||
                !minOrderValid
                ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                : "bg-[var(--color-primary)] text-white hover:opacity-90"
                }`}

            >
              {placingOrder
                ? "Placing Order…"
                : "Place Order (Online Payment Required)"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}