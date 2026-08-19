import Button from "../components/ui/Button";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import defaultImage from "../assets/default-image.png";
import { useMemo, useState, useEffect } from "react";
import ProductSkeleton from "../components/product/ProductSkeleton";
import { cartStore } from "../store/cart.store";
import { useCartProducts } from "../hooks/useCartProducts";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import { useAlert } from "../store/alert.store";
import { calculateOrderPricingBreakdown } from "../utils/orderPricing";
import { calculateOrderAmounts } from "../utils/pricing";
import { useConfigStore } from "../store/config.store";
import { useProfileStore } from "../store/profile.store";
import { useCatalog } from "../store/catalog.store";
import { sortProductsByCategoryAndSequence } from "../utils/sequncerUtil";

export default function Cart() {
  const addItem = cartStore((s) => s.addItem);
  const removeItem = cartStore((s) => s.removeItem);
  const navigate = useNavigate();
  const locked = cartStore((s) => s.locked);
  const clearCart = cartStore((s) => s.clear);
  const {
    categories,
    brands,
    fetchCategories,
    fetchBrands,
  } = useCatalog();

  const [showClearCartConfirm, setShowClearCartConfirm] = useState(false);
  const { products, loading } = useCartProducts();
  const isEmpty = products.length === 0;
  const { config } = useConfigStore();

  const packagingPercent = Number(
    config?.packagingPercent || 0
  );

  const gstPercent = Number(
    config?.gstPercent || 0
  );

  const disableGstForTN = config?.disableGstForTN || false;
  const profile = useProfileStore((s) => s.profile);
  const loadProfile = useProfileStore((s) => s.loadProfile);
  const totalQuantity = useMemo(
    () =>
      products.reduce(
        (total, item) => total + item.quantity,
        0
      ),
    [products]
  );

  const pricingBreakdown = useMemo(
    () => calculateOrderPricingBreakdown(products),
    [products]
  );

  useEffect(() => {
    if (categories.length === 0) {
      fetchCategories();
    }

    if (brands.length === 0) {
      fetchBrands();
    }
  }, [
    categories.length,
    brands.length,
    fetchCategories,
    fetchBrands,
  ]);

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
        nonComboProductTotal:
          pricingBreakdown.nonComboProductTotal,
        comboPackageTotal:
          pricingBreakdown.comboPackageTotal,
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

  const displayProducts: any = sortProductsByCategoryAndSequence(
    products,
    categories
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

  {
    locked && (
      <div className="text-sm text-gray-500 text-center py-2">
        Cart locked after order placement
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
              flex
              items-center
              justify-center
              w-9
              h-9
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
          disabled={displayProducts.length === 0}
          className="
            flex
            items-center
            gap-2
            px-3
            py-2
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
          {displayProducts.map((p: any) => {
            const brandName = brands.find(
              (brand) => brand.id === p.brandId
            )?.name;

            const categoryName = categories.find(
              (category) => category.id === p.categoryId
            )?.name;

            return (
              <div
                key={p.id}
                className="
            px-3
            py-2.5
            sm:px-4
            sm:py-3
            flex
            items-center
            gap-3
            sm:gap-4
          "
              >
                {/* ------------------------------------------------
              Product Image
          ------------------------------------------------- */}
                <Link
                  to={`/product/${p.id}`}
                  className="
              shrink-0
              self-center
            "
                >
                  <img
                    src={p.image || defaultImage}
                    alt={p.name}
                    loading="lazy"
                    decoding="async"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = defaultImage;
                    }}
                    className="
                w-14
                h-14
                sm:w-16
                sm:h-16
                object-contain
                rounded-lg
                border
                border-gray-100
                bg-white
              "
                  />
                </Link>

                {/* ------------------------------------------------
              Product Information
          ------------------------------------------------- */}
                <div className="flex-1 min-w-0">
                  {/* Product Name */}
                  <Link
                    to={`/product/${p.id}`}
                    title={p.name}
                    className="
                block
                text-sm
                sm:text-base
                font-semibold
                text-[var(--color-primary)]
                hover:opacity-80
                transition
                leading-tight

                /* Mobile */
                line-clamp-2

                /* Desktop */
                sm:truncate
              "
                  >
                    {p.name}
                  </Link>

                  {/* ------------------------------------------------
                Category + Brand
            ------------------------------------------------- */}
                  {(categoryName || brandName) && (
                    <div
                      className="
                  mt-1
                  flex
                  flex-wrap
                  items-center
                  gap-1
                  sm:gap-1.5
                  text-[11px]
                  sm:text-sm
                  leading-tight
                  min-w-0
                "
                    >
                      {categoryName && (
                        <span
                          title={categoryName}
                          className="
                      max-w-full
                      break-words
                      text-[var(--color-muted)]
                    "
                        >
                          {categoryName}
                        </span>
                      )}

                      {categoryName && brandName && (
                        <span className="text-gray-300 shrink-0">
                          •
                        </span>
                      )}

                      {brandName && (
                        <span
                          title={brandName}
                          className="
                      max-w-full
                      break-words
                      font-semibold
                      text-[var(--color-primary)]
                    "
                        >
                          {brandName}
                        </span>
                      )}
                    </div>
                  )}

                  {/* ------------------------------------------------
                Pack + Rate
            ------------------------------------------------- */}
                  <div
                    className="
                mt-1
                flex
                flex-wrap
                items-center
                gap-1.5
              "
                  >
                    {/* Pack */}
                    {Number(p.packQuantity) > 0 &&
                      p.packUnit?.trim() && (
                        <span
                          className="
                      inline-flex
                      items-center
                      gap-1
                      rounded-full
                      bg-gray-100
                      border
                      border-gray-200
                      px-2
                      py-0.5
                      text-[10px]
                      sm:text-[11px]
                      font-semibold
                      text-[var(--color-primary)]
                      whitespace-nowrap
                    "
                        >
                          <span>📦</span>
                          <span>
                            {p.packQuantity}/{p.packUnit}
                          </span>
                        </span>
                      )}

                    {/* Discount / Net Rate */}
                    {(p.discountText || !p.isComboPackage) && (
                      <span
                        className="
                    text-[10px]
                    sm:text-xs
                    font-semibold
                    text-green-600
                    whitespace-nowrap
                  "
                      >
                        {p.discountText || "NET RATE"}
                      </span>
                    )}
                  </div>

                  {/* ------------------------------------------------
                Price
            ------------------------------------------------- */}
                  <div
                    className="
                mt-1
                flex
                flex-wrap
                items-center
                gap-1.5
                leading-none
              "
                  >
                    {p.originalPrice &&
                      p.originalPrice > p.price && (
                        <span
                          className="
                      text-[11px]
                      sm:text-sm
                      line-through
                      text-gray-400
                    "
                        >
                          ₹{p.originalPrice}
                        </span>
                      )}

                    <span
                      className="
                  text-sm
                  sm:text-base
                  font-semibold
                  text-[var(--color-primary)]
                "
                    >
                      ₹{p.price}
                    </span>

                    <span className="text-[11px] sm:text-xs text-gray-500">
                      × {p.quantity}
                    </span>

                    <span
                      className="
                  text-sm
                  font-semibold
                  text-[var(--color-primary)]
                "
                    >
                      = ₹{p.price * p.quantity}
                    </span>
                  </div>
                </div>

                {/* ------------------------------------------------
              Quantity + Remove
          ------------------------------------------------- */}
                <div
                  className="
              shrink-0
              flex
              flex-col
              items-end
              justify-center
              gap-1
            "
                >
                  {/* Quantity */}
                  <div
                    className="
                w-[82px]
                sm:w-[104px]
                h-[32px]
                sm:h-[34px]
                flex
                items-center
                justify-between
                px-1
                sm:px-1.5
                rounded-lg
                bg-[var(--color-primary)]
                text-white
                text-xs
                sm:text-sm
                font-semibold
              "
                  >
                    <button
                      onClick={() =>
                        p.quantity > 1 &&
                        addItem(p.id, -1)
                      }
                      disabled={p.quantity === 1}
                      aria-label={`Decrease quantity of ${p.name}`}
                      className="
                  w-6
                  sm:w-7
                  h-full
                  flex
                  items-center
                  justify-center
                  disabled:opacity-40
                  hover:opacity-80
                "
                    >
                      −
                    </button>

                    <span className="min-w-[16px] text-center">
                      {p.quantity}
                    </span>

                    <button
                      onClick={() =>
                        addItem(p.id, 1)
                      }
                      aria-label={`Increase quantity of ${p.name}`}
                      className="
                  w-6
                  sm:w-7
                  h-full
                  flex
                  items-center
                  justify-center
                  hover:opacity-80
                "
                    >
                      +
                    </button>
                  </div>

                  {/* Remove */}
                  <button
                    onClick={() => removeItem(p.id)}
                    className="
                text-[10px]
                sm:text-xs
                text-red-500
                hover:text-red-600
                hover:underline
                leading-tight
              "
                  >
                    Remove
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* --------------------------------------------------------
      Order Summary
  --------------------------------------------------------- */}
        <div
          className="
      border-t
      px-4
      md:px-6
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

              <div className="flex justify-between text-sm gap-4">
                <span>
                  Products Total (
                  {displayProducts.length} Products /{" "}
                  {totalQuantity} Qty)
                </span>

                <span className="shrink-0">
                  ₹{pricingBreakdown.productSubtotal}
                </span>
              </div>

              {pricingBreakdown.hasNonComboProducts && (
                <div className="flex justify-between text-sm text-gray-600 mt-2 gap-4">
                  <span>
                    Non Combo Products
                  </span>

                  <span className="shrink-0">
                    ₹{pricingBreakdown.nonComboProductTotal}
                  </span>
                </div>
              )}

              {pricingBreakdown.hasComboPackages && (
                <>
                  <div className="flex justify-between items-center text-sm mt-2 gap-4">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span>
                        Combo Packages
                      </span>

                      <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-medium text-green-700">
                        Inclusive Of Packaging Charges
                      </span>
                    </div>

                    <span className="shrink-0">
                      ₹{pricingBreakdown.comboPackageTotal}
                    </span>
                  </div>
                </>
              )}

              {packagingCharge > 0 && (
                <div className="flex justify-between text-sm mt-2 gap-4">
                  <span>
                    Packaging Charge ({packagingPercent}%)
                  </span>

                  <span className="shrink-0">
                    ₹{packagingCharge}
                  </span>
                </div>
              )}

              {gstAmount > 0 && (
                <div className="flex justify-between text-sm mt-2 gap-4">
                  <span>
                    GST ({gstPercent}%)
                  </span>

                  <span className="shrink-0">
                    ₹{gstAmount}
                  </span>
                </div>
              )}

              <div className="border-t my-4" />

              <div className="flex justify-between items-center gap-4">
                <div>
                  <p className="font-semibold text-[var(--color-primary)]">
                    Grand Total
                  </p>

                  <p className="text-xs text-gray-500">
                    {disableGstForTN &&
                      deliveryState == "Tamil Nadu"
                      ? "Inclusive of Packaging Charges"
                      : "Inclusive of GST & Packaging Charges"}
                  </p>
                </div>

                <span className="text-3xl font-bold text-[var(--color-primary)] shrink-0">
                  ₹{grandTotal}
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
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
              disabled={displayProducts.length === 0}
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
            Are you sure you want to remove all
            items from your cart?
            <br />

            <span className="text-red-500 font-medium">
              This action cannot be undone.
            </span>
          </>
        }
        confirmText="Yes, Clear Cart"
        cancelText="Cancel"
        onCancel={() =>
          setShowClearCartConfirm(false)
        }
        onConfirm={async () => {
          clearCart();

          showAlert({
            type: "success",
            message:
              "Cart cleared successfully.",
          });

          setShowClearCartConfirm(false);
        }}
      />
    </div>
  );
}