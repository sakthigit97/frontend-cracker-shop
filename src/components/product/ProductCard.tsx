import { useNavigate } from "react-router-dom";
import { memo } from "react";
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
  const available_qty = product?.qty || 0;
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

  return (
    <div
      onClick={buttonLabel === "Add to Cart" ? handleCardClick : undefined}
      className="
        cursor-pointer
        bg-[var(--color-surface)]
        rounded-xl
        border
        border-gray-200
        shadow-sm md:shadow-md
        flex
        flex-col
        h-full
        overflow-hidden
        transition-all
        duration-300
        ease-out
        hover:-translate-0.5
        hover:shadow-lg
        hover:border-[var(--color-primary)]
        hover:ring-2
        hover:ring-[var(--color-primary)]
        hover:ring-opacity-30
      "
    >
      {/* Product Image */}
      <div className="relative bg-white aspect-[4/3] flex items-center justify-center">
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
            max-h-full
            max-w-full
            object-contain
            p-3
            transition-opacity
            duration-300
            opacity-0
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
              text-xs
              font-semibold
              px-2
              py-1
              rounded
            "
          >
            {product.discountText}
          </span>
        )}
      </div>

      {/* Product Information */}
      <div className="p-3 flex flex-col flex-1 gap-0.5">
        {/* Product Name */}
        <h3
          className="
            text-sm
            font-semibold
            text-[var(--color-primary)]
            line-clamp-2
            min-h-[2.25rem]
            leading-snug
          "
        >
          {product.name}
        </h3>

        {/* Category + Brand */}
        {(categoryName || brandName) && (
          <div className="mt-1.5 mb-1 space-y-1">
            {categoryName && (
              <div className="flex items-start gap-1.5 min-w-0">

                <span
                  className="
                    min-w-0
                    text-xs
                    text-gray-600
                    leading-snug
                    break-words
                  "
                >
                  {categoryName}
                </span>
              </div>
            )}

            {brandName && (
              <div className="flex items-start gap-1.5 min-w-0">

                <span
                  className="
                    min-w-0
                    text-xs
                    text-[var(--color-primary)]
                    font-medium
                    leading-snug
                    break-words
                  "
                >
                  {brandName}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Pack Information */}
        {Number(product.packQuantity) > 0 &&
          product.packUnit?.trim() && (
            <div
              className="
                inline-flex
                self-start
                items-center
                gap-1.5
                mt-1
                mb-1
                px-2
                py-1
                rounded-full
                bg-gray-100
                text-xs
                max-w-full
              "
            >
              <span className="text-gray-500 shrink-0">
                📦
              </span>

              <span className="text-[var(--color-primary)] font-semibold break-words">
                {product.packQuantity} {product.packUnit}
              </span>
            </div>
          )}

        {/* Price */}
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-base font-bold text-[var(--color-primary)]">
            ₹{product.price}
          </span>

          {product.originalPrice && (
            <span className="text-sm line-through text-[var(--color-muted)]">
              ₹{product.originalPrice}
            </span>
          )}
        </div>

        {/* Cart Controls */}
        {!hideCartControls && (
          <div className="mt-auto pt-3">
            {quantityInCart === 0 ? (
              <Button
                onClick={(e) => {
                  stop(e);
                  onAddToCart?.(product);
                }}
                disabled={available_qty === 0}
                className={`mt-2 w-full text-sm ${available_qty === 0
                  ? "bg-gray-300 cursor-not-allowed text-gray-600"
                  : ""
                  }`}
              >
                {available_qty === 0
                  ? "Out of Stock"
                  : buttonLabel}
              </Button>
            ) : (
              <div
                onClick={stop}
                className="
                  mt-2
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
                  hover:opacity-90
                  transition-all
                "
              >
                <button
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