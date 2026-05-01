import { cartStore } from "../store/cart.store";
import { useCartProducts } from "../hooks/useCartProducts";
import Button from "../components/ui/Button";
import { useNavigate } from "react-router-dom";
import { useMemo } from "react";
import ProductSkeleton from "../components/product/ProductSkeleton";
import { Link } from "react-router-dom";

export default function Cart() {
  const addItem = cartStore((s) => s.addItem);
  const removeItem = cartStore((s) => s.removeItem);
  const navigate = useNavigate();
  const locked = cartStore((s) => s.locked);

  const { products, loading } = useCartProducts();
  const isEmpty = products.length === 0;
  const totalAmount = useMemo(
    () => products.reduce((sum, p) => sum + p.price * p.quantity, 0),
    [products]
  );
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
          Your Cart
        </h1>
      </div>

      <div className="bg-white rounded-2xl border shadow-sm flex flex-col h-[70vh]">
        <div className="flex-1 overflow-y-auto divide-y">
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
                src={p.image}
                alt={p.name}
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

                  {p.discountText && (
                    <span className="text-xs font-semibold text-green-600">
                      {p.discountText}
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

        {/* SUMMARY */}
        <div
          className="
            border-t
            px-4
            py-4
            flex
            flex-col
            gap-4
            sm:flex-row
            sm:items-center
            sm:justify-between
            bg-white
          "
        >
          <div className="flex flex-col gap-2">
            <div>
              <p className="text-sm text-gray-500">Total</p>
              <p className="text-2xl font-bold text-[var(--color-primary)]">
                ₹{totalAmount}
              </p>
            </div>

            <Button
              variant="secondary"
              onClick={() => navigate("/")}
            >
              Add More Items
            </Button>
          </div>

          <Button
            disabled={products.length === 0}
            onClick={() => navigate("/checkout")}
            className="px-8 py-3 text-base"
          >
            Proceed to Checkout
          </Button>
        </div>
      </div>
    </div>
  );
}