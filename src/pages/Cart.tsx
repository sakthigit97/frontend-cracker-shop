import { cartStore } from "../store/cart.store";
import { useCartProducts } from "../hooks/useCartProducts";
import Button from "../components/ui/Button";
import { useNavigate } from "react-router-dom";
import { useMemo, useState } from "react";
import ProductSkeleton from "../components/product/ProductSkeleton";
import { Link } from "react-router-dom";
import defaultImage from "../assets/default-image.png";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import { useAlert } from "../store/alert.store";
import { calculateOrderPricingBreakdown } from "../utils/orderPricing";
import { calculateOrderAmounts } from "../utils/pricing";
import { useConfigStore } from "../store/config.store";
import { useProfileStore } from "../store/profile.store";
import { useEffect } from "react";

export default function Cart() {
  const addItem = cartStore((s) => s.addItem);
  const removeItem = cartStore((s) => s.removeItem);
  const navigate = useNavigate();
  const locked = cartStore((s) => s.locked);
  const clearCart = cartStore((s) => s.clear);
  const [showClearCartConfirm, setShowClearCartConfirm] = useState(false);
  const { products, loading } = useCartProducts();
  const isEmpty = products.length === 0;
  const { config } = useConfigStore();
  const packagingPercent = Number(config?.packagingPercent || 0);
  const gstPercent = Number(config?.gstPercent || 0);
  const profile = useProfileStore((s) => s.profile);
  const loadProfile = useProfileStore((s) => s.loadProfile);

  const pricingBreakdown: any = useMemo(
    () => calculateOrderPricingBreakdown(products),
    [products]
  );

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const deliveryState = profile?.state;

  const {
    packagingCharge,
    gstAmount,
    grandTotal,
  } = useMemo(
    () =>
      calculateOrderAmounts({
        nonComboProductTotal: pricingBreakdown.nonComboProductTotal,
        comboPackageTotal: pricingBreakdown.comboPackageTotal,
        couponDiscount: 0,
        packagingPercent,
        state: deliveryState,
        gstPercent,
        config,
      }),
    [
      pricingBreakdown,
      packagingPercent,
      deliveryState,
      gstPercent,
      config,
    ]
  );

  const { showAlert } = useAlert();
  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <ProductSkeleton key={i} />
        ))}
      </div>
    );
  }
  {
    locked && (
      <div className="text-sm text-gray-500 text-center py-2">
        Cart locked after order placement
      </div>
    )
  }
  if (isEmpty) {
    return (
      <div className="py-24 text-center space-y-4">
        <h2 className="text-xl font-semibold text-[var(--color-primary)]">
          Your cart is empty
        </h2>
        <p className="text-sm text-gray-500">
          Add some crackers to continue shopping
        </p>

        <Button
          onClick={() => navigate("/")}
          className="mt-4 px-8 py-3 text-base"
        >
          Continue Shopping
        </Button>
      </div>
    );
  }


  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
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
            Your Cart
          </h1>
        </div>
        <button
          onClick={() => setShowClearCartConfirm(true)}
          disabled={products.length === 0}
          className="
          flex items-center gap-2
          px-3 py-2
          rounded-lg
          border
          border-red-200
          bg-red-50
          text-red-600
          hover:bg-red-100
          hover:border-red-300
          transition-all
          disabled:opacity-50
          disabled:cursor-not-allowed
        "
        >
          🗑
          <span className="hidden sm:inline">
            Clear Cart
          </span>
        </button>
      </div>

      <div className="bg-white rounded-2xl border shadow-sm flex flex-col">
        <div
          className="
            divide-y
            max-h-[55vh]
            overflow-y-auto
          "
        >
          {products.map((p) => (
            <div
              key={p.id}
              className="
                p-4
                flex
                flex-col
                gap-4
                sm:flex-row
                sm:items-center
                sm:gap-5
              "
            >
              <img
                src={p.image || defaultImage}
                className="w-16 h-16 object-contain rounded-md"
              />

              <div className="flex-1">
                <Link
                  to={`/product/${p.id}`}
                  className="
                   font-medium
                    text-blue-600
                    hover:text-blue-800
                    hover:underline
                    cursor-pointer
                    transition
                  "
                >
                  {p.name}
                </Link>

                <div className="mt-1 flex flex-col gap-1">

                  {(p.discountText || !p.isComboPackage) && (
                    <span className="text-xs font-semibold text-green-600">
                      {p.discountText || "NET RATE"}
                    </span>
                  )}

                  <div className="flex items-center gap-2 flex-wrap">


                    {p.originalPrice && p.originalPrice > p.price && (
                      <span className="text-sm line-through text-gray-400">
                        ₹{p.originalPrice}
                      </span>
                    )}

                    <span className="font-semibold text-[var(--color-primary)]">
                      ₹{p.price}
                    </span>

                    <span className="text-xs text-gray-500">
                      × {p.quantity}
                    </span>
                  </div>
                  <p className="font-semibold text-sm">
                    ₹{p.price * p.quantity}
                  </p>
                </div>
              </div>

              <div
                className="
                  flex
                  flex-row
                  items-center
                  justify-between
                  gap-3
                  sm:flex-col
                  sm:items-end
                "
              >
                <div
                  className="
                    w-[120px]
                    h-[38px]
                    flex
                    items-center
                    justify-between
                    px-3
                    rounded-lg
                    bg-[var(--color-primary)]
                    text-white
                    text-sm
                    font-semibold
                  "
                >
                  <button
                    onClick={() => p.quantity > 1 && addItem(p.id, -1)}
                    disabled={p.quantity === 1}
                    className="px-2 disabled:opacity-40"
                  >
                    −
                  </button>

                  <span>{p.quantity}</span>

                  <button
                    onClick={() => addItem(p.id, 1)}
                    className="px-2"
                  >
                    +
                  </button>
                </div>

                {/* Remove */}
                <button
                  onClick={() => removeItem(p.id)}
                  className="
                    text-xs
                    text-red-500
                    hover:underline
                    sm:self-end
                  "
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>

        <div
          className="
              border-t
              px-4 md:px-6
              py-6
              flex
              flex-col
              lg:flex-row
              lg:justify-between
              lg:items-start
              gap-6
              bg-white
          "
        >
          <div className="w-full lg:flex-1 lg:max-w-[620px]">

            <div className="rounded-xl bg-gray-50 border p-5">

              <h3 className="text-base font-semibold text-[var(--color-primary)] mb-4">
                Order Summary
              </h3>

              <div className="flex justify-between text-sm">
                <span>Products Total</span>
                <span>₹{pricingBreakdown.productSubtotal}</span>
              </div>

              {pricingBreakdown.hasNonComboProducts && (
                <div className="flex justify-between text-sm text-gray-600 mt-2">
                  <span>Non Combo Products</span>
                  <span>₹{pricingBreakdown.nonComboProductTotal}</span>
                </div>
              )}

              {pricingBreakdown.hasComboPackages && (
                <>
                  <div className="flex justify-between items-center text-sm mt-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span>Combo Packages</span>

                      <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-medium text-green-700">
                        Inclusive Of Packaging Charges
                      </span>
                    </div>

                    <span>₹{pricingBreakdown.comboPackageTotal}</span>
                  </div>
                </>
              )}

              {packagingCharge > 0 && (
                <div className="flex justify-between text-sm mt-2">
                  <span>Packaging Charge ({packagingPercent}%)</span>
                  <span>₹{packagingCharge}</span>
                </div>
              )}

              {gstAmount > 0 && (
                <div className="flex justify-between text-sm mt-2">
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
                    Inclusive of GST & Packaging Charges
                  </p>
                </div>

                <span className="text-3xl font-bold text-[var(--color-primary)]">
                  ₹{grandTotal}
                </span>
              </div>
            </div>

          </div>

          <div
            className="
                w-full
                lg:w-[340px]
                flex
                flex-col
                gap-3
                lg:self-center
            "
          >
            <Button
              variant="secondary"
              className="w-full"
              onClick={() => navigate("/")}
            >
              Add More Items
            </Button>

            <Button
              className="w-full"
              data-enter-submit="true"
              disabled={products.length === 0}
              onClick={() => navigate("/checkout")}
            >
              Proceed to Checkout
            </Button>
          </div>
        </div>
      </div>
      <ConfirmDialog
        open={showClearCartConfirm}
        title="Clear Cart?"
        message={
          <>
            Are you sure you want to remove all items from your cart?
            <br />
            <span className="text-red-500 font-medium">
              This action cannot be undone.
            </span>
          </>
        }
        confirmText="Yes, Clear Cart"
        cancelText="Cancel"
        onCancel={() => setShowClearCartConfirm(false)}
        onConfirm={async () => {
          clearCart();

          showAlert({
            type: "success",
            message: "Cart cleared successfully.",
          });

          setShowClearCartConfirm(false);
        }}
      />
    </div>
  );
}