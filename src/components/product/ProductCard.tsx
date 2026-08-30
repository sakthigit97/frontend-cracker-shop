import { memo } from "react";
import { useNavigate } from "react-router-dom";

import defaultImage from "../../assets/default-image.png";
import type { Product } from "../../types/product";
import Button from "../ui/Button";
import { useCatalog } from "../../store/catalog.store";

interface Props {
  product: Product;
  quantityInCart?: number;
  onAddToCart?: (product: Product) => void;
  onIncrease?: (product: Product) => void;
  onDecrease?: (product: Product) => void;
  hideCartControls?: boolean;
  buttonLabel?: string;
}

function ProductCard({
  product,
  quantityInCart = 0,
  onAddToCart,
  onIncrease,
  onDecrease,
  hideCartControls = false,
  buttonLabel = "Add to Cart",
}: Props) {
  const navigate = useNavigate();

  const availableQty = product?.qty || 0;

  const { categories, brands } = useCatalog();

  const brandName = brands.find(
    (brand) => brand.id === product.brandId
  )?.name;

  const categoryName = categories.find(
    (category) => category.id === product.categoryId
  )?.name;

  const handleCardClick = () => {
    navigate(`/product/${product.id}`);
  };

  const stop = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const hasPack =
    Number(product.packQuantity) > 0 &&
    Boolean(product.packUnit?.trim());

  return (
    <div
      onClick={
        buttonLabel === "Add to Cart"
          ? handleCardClick
          : undefined
      }
      className="
        group
        cursor-pointer
        bg-[var(--color-surface)]
        rounded-xl
        border
        border-gray-200
        shadow-sm
        flex
        flex-col
        h-full
        overflow-hidden
        transition-all
        duration-200
        ease-out
        hover:-translate-y-0.5
        hover:shadow-lg
        hover:border-[var(--color-primary)]
        hover:ring-1
        hover:ring-[var(--color-primary)]
        hover:ring-opacity-20
      "
    >
      {/* ============================================================
          PRODUCT IMAGE
          ============================================================ */}
      <div
        className="
          relative
          bg-white
          aspect-[4/3]
          flex
          items-center
          justify-center
          overflow-hidden
        "
      >
        <img
          src={product.image?.trim() || defaultImage}
          alt={product.name}
          loading="lazy"
          decoding="async"
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = defaultImage;
          }}
          onLoad={(e) => {
            e.currentTarget.classList.remove("opacity-0");
            e.currentTarget.classList.add("opacity-100");
          }}
          className="
            w-full
            h-full
            max-w-full
            max-h-full
            object-contain
            p-3
            opacity-0
            transition-opacity
            duration-300
            group-hover:scale-[1.02]
          "
        />

        {product.discountText && (
          <span
            className="
              absolute
              top-2
              left-2
              bg-[var(--color-secondary)]
              text-white
              text-[11px]
              font-bold
              px-2
              py-1
              rounded-md
              shadow-sm
              whitespace-nowrap
            "
          >
            {product.discountText}
          </span>
        )}
      </div>

      {/* ============================================================
          PRODUCT INFORMATION
          ============================================================ */}
      <div
        className="
          px-3
          pt-2.5
          pb-3
          flex
          flex-col
          flex-1
        "
      >
        {/* Product Name */}
        <h3
          className="
            text-sm
            sm:text-[15px]
            font-semibold
            text-[var(--color-primary)]
            leading-snug
            break-words
          "
        >
          {product.name}
        </h3>

        {/* Category + Brand */}
        {(categoryName || brandName) && (
          <div className="mt-1.5">
            {categoryName && (
              <div
                className="
                  text-[11px]
                  sm:text-xs
                  text-gray-500
                  uppercase
                  tracking-wide
                  leading-snug
                  break-words
                "
              >
                {categoryName}
              </div>
            )}

            {brandName && (
              <div
                className="
                  mt-0.5
                  text-xs
                  sm:text-[13px]
                  text-[var(--color-primary)]
                  font-medium
                  leading-snug
                  break-words
                "
              >
                {brandName}
              </div>
            )}
          </div>
        )}

        {/* ============================================================
            PACK + PRICE
            ============================================================ */}
        <div
          className="
            mt-2
            flex
            flex-col
            gap-1.5
            sm:flex-row
            sm:items-center
            sm:justify-between
            sm:gap-2
            min-w-0
          "
        >
          {/* Pack Information */}
          {hasPack && (
            <div
              className="
                inline-flex
                self-start
                items-center
                gap-1
                px-2
                py-1
                rounded-full
                bg-gray-100
                text-xs
                whitespace-nowrap
                max-w-full
              "
            >
              <span className="shrink-0 text-gray-500">
                📦
              </span>

              <span
                className="
                  font-semibold
                  text-[var(--color-primary)]
                  truncate
                "
              >
                {product.packQuantity} {product.packUnit}
              </span>
            </div>
          )}

          {/* Price */}
          <div
            className="
              flex
              items-baseline
              gap-1.5
              whitespace-nowrap
              shrink-0
            "
          >
            <span
              className="
                text-base
                font-bold
                text-[var(--color-primary)]
              "
            >
              ₹{product.price}
            </span>

            {product.originalPrice && (
              <span
                className="
                  text-xs
                  line-through
                  text-[var(--color-muted)]
                "
              >
                ₹{product.originalPrice}
              </span>
            )}
          </div>
        </div>

        {/* ============================================================
            CART CONTROLS
            ============================================================ */}
        {!hideCartControls && (
          <div className="mt-auto pt-3">
            {quantityInCart === 0 ? (
              <Button
                onClick={(e) => {
                  stop(e);
                  onAddToCart?.(product);
                }}
                disabled={availableQty === 0}
                className={`
                  w-full
                  text-sm
                  font-medium
                  ${availableQty === 0
                    ? "bg-gray-300 cursor-not-allowed text-gray-600"
                    : ""
                  }
                `}
              >
                {availableQty === 0
                  ? "Out of Stock"
                  : buttonLabel}
              </Button>
            ) : (
              <div
                onClick={stop}
                className="
                  flex
                  items-center
                  justify-between
                  rounded-lg
                  px-3
                  py-1.5
                  bg-[var(--color-primary)]
                  text-white
                  border
                  border-[var(--color-primary)]
                  transition-all
                  hover:opacity-90
                "
              >
                <button
                  type="button"
                  onClick={() => onDecrease?.(product)}
                  className="
                    text-lg
                    font-bold
                    px-2
                    hover:scale-110
                    transition-transform
                  "
                >
                  −
                </button>

                <span className="text-sm font-semibold">
                  {quantityInCart}
                </span>

                <button
                  type="button"
                  onClick={() => onIncrease?.(product)}
                  className="
                    text-lg
                    font-bold
                    px-2
                    hover:scale-110
                    transition-transform
                  "
                >
                  +
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default memo(ProductCard);