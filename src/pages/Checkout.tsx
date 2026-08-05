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
import { calculateOrderPricingBreakdown } from "../utils/orderPricing";
import PrivacyPolicy from "./PrivacyPolicy";
import {
  FiChevronDown,
  FiChevronUp
} from "react-icons/fi";
import { validateCoupon } from "../services/coupon.api";


type ProfileResponse = {
  success: boolean;
  data: {
    title?: "Mr" | "Mrs" | "Ms";
    name: string;
    mobile: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
    walletCredit?: number;
  };
};

type AppliedCoupon = {
  couponCode: string;
  description?: string;
  couponType: "FLAT" | "PERCENTAGE";
  couponValue: number;
  couponDiscount: number;
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
  const [profileState, setProfileState] = useState("");
  const [line1, setLine1] = useState("");
  const [line2, setLine2] = useState("");
  const [city, setCity] = useState("");
  const [stateValue, setStateValue] = useState("");
  const [pincode, setPincode] = useState("");
  const [addressMode, setAddressMode] = useState<AddressMode>("PROFILE");
  const [walletCredit, setWalletCredit] = useState(0);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [showCouponSection, setShowCouponSection] = useState(false);
  const [minOrderValid, setMinOrderValid] = useState(true);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [mobile, setMobile] = useState("");
  const disableGstForTN = config?.disableGstForTN || false;
  const [validatedLocation, setValidatedLocation] = useState<{
    pincode: string;
    state: string;
  } | null>(null);

  const pricingBreakdown = useMemo(
    () => calculateOrderPricingBreakdown(products),
    [products]
  );
  const totalQuantity = useMemo(
    () =>
      products.reduce(
        (total, item) => total + item.quantity,
        0
      ),
    [products]
  );
  const packagingPercent = config?.packagingPercent ?? 0;
  const gstPercent = config?.gstPercent ?? 0;
  const currentState = addressMode === "PROFILE"
    ? profileState
    : stateValue.trim();

  const {
    packagingCharge,
    grossTotal,
    appliedCouponDiscount,
    discountedGrossTotal,
    gstAmount,
    grandTotal,
  } = useMemo(
    () =>
      calculateOrderAmounts({
        nonComboProductTotal: pricingBreakdown.nonComboProductTotal,
        comboPackageTotal: pricingBreakdown.comboPackageTotal,
        couponDiscount: appliedCoupon?.couponDiscount ?? 0,
        packagingPercent,
        gstPercent,
        state: currentState,
        config,
      }),
    [
      pricingBreakdown,
      appliedCoupon,
      packagingPercent,
      gstPercent,
      currentState,
      config,
    ]
  );

  const creditUsed = Math.min(walletCredit, grandTotal);
  const finalPayable = grandTotal - creditUsed;

  useEffect(() => {
    const currentPincode =
      addressMode === "PROFILE"
        ? profilePincode
        : pincode;

    if (!currentPincode || currentPincode.length !== 6) {
      setValidatedLocation(null);
      setMinOrderValid(false);
      return;
    }

    if (
      validatedLocation?.pincode === currentPincode
    ) {
      return;
    }

    let active = true;

    (async () => {
      try {
        const res = await fetch(
          `https://api.postalpincode.in/pincode/${currentPincode}`
        );

        const data = await res.json();
        if (!active) return;

        if (
          !data ||
          data[0]?.Status !== "Success"
        ) {
          setValidatedLocation(null);
          setMinOrderValid(false);
          return;
        }

        setValidatedLocation({
          pincode: currentPincode,
          state: data[0].PostOffice[0].State,
        });

      } catch {
        if (!active) return;
        setValidatedLocation(null);
        setMinOrderValid(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [
    addressMode,
    pincode,
    profilePincode,
    validatedLocation?.pincode,
  ]);


  useEffect(() => {
    if (!validatedLocation) {
      return;
    }

    let minAmount = config?.otherStateMinOrderValue ?? 5000;
    const isTamilNadu = validatedLocation.state.trim().toLowerCase() === "tamil nadu";
    if (isTamilNadu) {
      minAmount = config?.tnMinOrderValue ?? 3000;
    }

    setMinOrderValid(
      grandTotal >= minAmount
    );
  }, [
    validatedLocation,
    grandTotal,
    config?.tnMinOrderValue,
    config?.otherStateMinOrderValue,
  ]);

  useEffect(() => {
    setAppliedCoupon(null);
    setCouponCode("");
  }, [products]);

  useEffect(() => {
    let mounted = true;

    async function fetchProfile() {
      try {
        const res: ProfileResponse = await apiFetch("/user/profile");
        if (!mounted || !res?.data) return;
        setMobile(res.data.mobile);

        const customerName = [
          res.data.title?.trim(),
          res.data.name?.trim(),
        ]
          .filter(Boolean)
          .join(" ");

        const formatted = [
          customerName,
          res.data.mobile?.trim(),
          res.data.address?.trim(),
          `${res.data.city?.trim()}, ${res.data.state?.trim()} - ${res.data.pincode?.trim()}`,
        ]
          .filter(Boolean)
          .join("\n");
        setWalletCredit(res.data.walletCredit || 0);
        setProfileAddress(formatted);
        setProfilePicode(res.data.pincode);
        setProfileState(res.data.state?.trim() || "");
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
    let deliveryState = "";
    if (addressMode === "PROFILE") {
      finalAddress = profileAddress;
      deliveryState = profileState;
    } else {
      if (!line1 || !city || !stateValue || pincode.length !== 6) {
        showAlert({
          type: "error",
          message: "Please complete all required address fields",
        });
        return;
      }
      const addressParts = [
        line1.trim(),
        line2.trim(),
        `${city.trim()}, ${stateValue.trim()} - ${pincode.trim()}`,
      ];

      finalAddress = addressParts
        .filter(Boolean)
        .join("\n");
      deliveryState = stateValue.trim();
    }
    if (!finalAddress.trim()) {
      showAlert({
        type: "error",
        message: "Delivery address is required",
      });
      return;
    }
    if (!deliveryState) {
      showAlert({
        type: "error",
        message: "State is required",
      });
      return;
    }
    const currentPincode = addressMode === "PROFILE" ? profilePincode : pincode;
    if (!currentPincode) {
      showAlert({
        type: "error",
        message: "Pincode is required for validation",
      });
      return;
    }

    if (!minOrderValid) {
      showAlert({
        type: "error",
        message: "A minimum order value is required for your delivery location. Please add more items to continue with your order.",
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
      const normalizedAddress = finalAddress
        .split("\n")
        .map(line => line.trim())
        .filter(Boolean)
        .join("\n");

      const res = await apiFetch("/orders", {
        method: "POST",
        body: JSON.stringify({
          address: normalizedAddress,
          deliveryState,
          paymentMode,
          paymentStatus,
          transactionId,
          couponCode: appliedCoupon?.couponCode ?? null,
          walletUsed: creditUsed,
          mobile: mobile.trim(),
        })
      });
      const orderId = res.OrderId;

      lockCart();
      clearCart();
      cartStore.getState().clearDirty();

      navigate("/order-success", {
        state: {
          orderId,
          address: finalAddress,
          total: finalPayable,
          paymentMode: paymentMode === "ONLINE" ? "Online Payment (Paid)" : "Online Payment Required",
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
    await new Promise((res) => setTimeout(res, 1500));
    console.log(total);
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
  async function applyCoupon() {

    const code = couponCode.trim().toUpperCase();
    if (!code) {
      showAlert({
        type: "error",
        message: "Please enter a coupon code.",
      });
      return;
    }

    try {
      setCouponLoading(true);

      const coupon = await validateCoupon(
        code,
        grossTotal
      );

      setAppliedCoupon(coupon);
      showAlert({
        type: "success",
        message: "Coupon applied successfully.",
      });
    } catch (err: any) {
      showAlert({
        type: "error",
        message:
          err?.message ??
          "Unable to validate coupon.",
      });
    } finally {
      setCouponLoading(false);
    }
  }

  function removeCoupon() {
    setAppliedCoupon(null);
    setCouponCode("");
    setShowCouponSection(false);
    showAlert({
      type: "success",
      message: "Coupon removed.",
    });
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
              •  Customers must collect their parcel from the designated transport office/service point by paying transporation.
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
                      </>
                    ) : (
                      <span className="font-medium">
                        ₹{p.price}
                      </span>
                    )}

                    {(p.discountText || !p.isComboPackage) && (
                      <span className="text-green-600 text-xs font-medium bg-green-50 px-1 rounded">
                        {p.discountText || "NET RATE"}
                      </span>
                    )}
                  </div>
                </div>

                <div className="font-medium">
                  ₹{p.price * p.quantity}
                </div>
              </div>
            ))}
          </div>

          <div className="pb-3 mb-3">
            <button
              type="button"
              onClick={() => setShowCouponSection((v) => !v)}
              className="w-full flex items-center justify-between py-2"
            >
              <div>
                <h3 className="text-sm font-semibold text-gray-800">
                  🏷 Apply Coupon
                </h3>

                <p className="text-xs text-gray-500">
                  Have a promo code?
                </p>
              </div>

              {showCouponSection ? (
                <FiChevronUp className="text-gray-500" size={18} />
              ) : (
                <FiChevronDown className="text-gray-500" size={18} />
              )}
            </button>

            {showCouponSection && (
              !appliedCoupon ? (
                <div className="grid grid-cols-[1fr_auto] h-11 rounded-lg border overflow-hidden">
                  <input
                    type="text"
                    value={couponCode}
                    disabled={couponLoading}
                    onChange={(e) =>
                      setCouponCode(
                        e.target.value
                          .toUpperCase()
                          .replace(/\s/g, "")
                      )
                    }
                    placeholder="Enter coupon code"
                    maxLength={20}
                    className="
                    w-full
                    border-0
                    bg-transparent
                    px-3
                    text-sm
                    outline-none
                    placeholder:text-gray-400
                  "
                  />

                  <button
                    type="button"
                    onClick={applyCoupon}
                    disabled={couponLoading || !couponCode.trim()}
                    className="
                      min-w-[90px]
                      border-l
                      border-gray-200
                      bg-[var(--color-primary)]
                      text-white
                      text-sm
                      font-medium
                      transition-colors
                      hover:brightness-95
                      disabled:bg-gray-200
                      disabled:text-gray-500
                    "
                  >
                    {couponLoading ? "Checking..." : "Apply"}
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-medium text-green-700">
                        {appliedCoupon.couponCode}
                      </div>

                      {appliedCoupon.description && (
                        <div className="text-xs text-gray-500">
                          {appliedCoupon.description}
                        </div>
                      )}
                    </div>

                    <Button
                      variant="secondary"
                      onClick={removeCoupon}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              )
            )}
          </div>

          <div className="border-t pt-4 space-y-2 text-sm">

            <div className="flex justify-between items-start">
              <div>
                <p>Products Total</p>

                <p className="text-xs text-gray-500">
                  {products.length} Products • {totalQuantity} Qty
                </p>
              </div>

              <span>₹{pricingBreakdown.productSubtotal}</span>
            </div>

            {pricingBreakdown.hasComboPackages && (
              <div className="flex justify-between items-center text-gray-600">
                <div className="flex items-center gap-2 flex-wrap">
                  <span>Combo Packages</span>

                  <span
                    className="
                      rounded-full
                      bg-green-100
                      text-green-700
                      text-[10px]
                      font-medium
                      px-2
                      py-0.5
                    "
                  >
                    Inclusive Of Packaging Charges
                  </span>
                </div>

                <span>₹{pricingBreakdown.comboPackageTotal}</span>
              </div>
            )}

            {pricingBreakdown.hasNonComboProducts && (
              <div className="flex justify-between text-gray-600">
                <span>Non Combo Products</span>
                <span>₹{pricingBreakdown.nonComboProductTotal}</span>
              </div>
            )}

            {packagingCharge > 0 && (
              <div className="flex justify-between text-gray-600">
                <span>Packaging Charge ({packagingPercent}%)</span>
                <span>₹{packagingCharge}</span>
              </div>
            )}

            {appliedCouponDiscount > 0 && (
              <>
                <div className="flex justify-between font-medium pt-2 border-t">
                  <span>Amount Before Discount</span>
                  <span>₹{grossTotal}</span>
                </div>

                <div className="flex justify-between text-green-600 font-medium">
                  <span>
                    Coupon Savings{" "}
                    {appliedCoupon?.couponType === "PERCENTAGE"
                      ? `(${appliedCoupon.couponValue}%)`
                      : `(Flat ₹${appliedCoupon?.couponValue})`}
                  </span>
                  <span>-₹{appliedCouponDiscount}</span>
                </div>

                <div className="flex justify-between font-medium">
                  <span>Amount After Discount</span>
                  <span>₹{discountedGrossTotal}</span>
                </div>
              </>
            )}

            {/* GST */}
            {gstAmount > 0 && (
              <div className="flex justify-between text-gray-600">
                <span>GST ({gstPercent}%)</span>
                <span>₹{gstAmount}</span>
              </div>
            )}

            <div className="border-t my-4" />

            <div className="flex justify-between items-center">
              <div>
                <p className="font-semibold text-[var(--color-primary)]">
                  Grand Total
                </p>

                <p className="text-xs text-gray-500">
                  {disableGstForTN && currentState == 'Tamil Nadu' ? "Inclusive of Packaging Charges" : "Inclusive of GST & Packaging Charges"}
                </p>
              </div>

              <span className="text-2xl font-bold text-[var(--color-primary)]">
                ₹{grandTotal}
              </span>
            </div>
          </div>

          {walletCredit > 0 && (
            <div className="border-t pt-4 space-y-2 text-sm">

              <div className="flex justify-between text-gray-600">
                <span>Wallet Balance</span>
                <span>₹{walletCredit}</span>
              </div>

              <div className="flex justify-between text-green-700 font-medium">
                <span>Wallet Applied</span>
                <span>-₹{creditUsed}</span>
              </div>

              <div className="border-t my-4" />

              <div className="flex justify-between items-center">
                <div>
                  <p className="font-semibold text-[var(--color-primary)]">
                    Amount Payable
                  </p>

                  <p className="text-xs text-gray-500">
                    Amount to be paid
                  </p>
                </div>

                <span className="text-2xl font-bold text-[var(--color-primary)]">
                  ₹{finalPayable}
                </span>
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
                <button
                  type="button"
                  onClick={() => setShowTermsModal(true)}
                  className="text-blue-600 hover:underline"
                >
                  Terms & Conditions
                </button>
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
              data-enter-submit="true"
              onClick={placeOrder}
              disabled={
                placingOrder ||
                products.length === 0
              }
              className={`w-full py-3 text-base transition-all ${placingOrder ||
                products.length === 0
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
              data-enter-submit="true"
              onClick={placeOrder}
              disabled={
                placingOrder ||
                products.length === 0
              }
              className={`w-full py-3 text-base transition-all ${placingOrder ||
                products.length === 0
                ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                : "bg-[var(--color-primary)] text-white hover:opacity-90"
                }`}

            >
              {placingOrder
                ? "Placing Order Enquiry…"
                : "Place Order Enquiry"}
            </Button>
          )}
        </div>
      </div>
      {showTermsModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">

          <div className="
              bg-white
              rounded-xl
              w-full
              max-w-4xl
              max-h-[90vh]
              flex
              flex-col
              overflow-hidden
            ">

            <div className="flex justify-between items-center border-b p-4">

              <h2 className="font-semibold text-lg">
                Terms & Conditions
              </h2>

              <button
                onClick={() => setShowTermsModal(false)}
                className="text-xl text-gray-500 hover:text-black"
              >
                ✕
              </button>

            </div>

            <div className="overflow-y-auto flex-1 p-4">
              <PrivacyPolicy />
            </div>

          </div>

        </div>
      )}
    </div>
  );
}