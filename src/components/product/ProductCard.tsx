import { useNavigate } from "react-router-dom";
import Button from "../ui/Button";
import type { Product } from "../../types/product";
import { memo } from "react";
import { getDiscountPercent } from "../../utils/pricing";

interface Props {
  product: Product;
  quantityInCart?: number;
  onAddToCart?: (product: Product) => void;
  onIncrease?: (product: Product) => void;
  onDecrease?: (product: Product) => void;
}

function ProductCard({
  product,
  quantityInCart = 0,
  onAddToCart,
  onIncrease,
  onDecrease,
}: Props) {
  const navigate = useNavigate();

  const discount = getDiscountPercent(
    product.price,
    product.originalPrice
  );

  const handleCardClick = () => {
    navigate(`/product/${product.id}`);
  };

  const stop = (e: React.MouseEvent) => e.stopPropagation();
  return (
    <div
      onClick={handleCardClick}
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
      {/* Image */}
      <div className="relative bg-white aspect-[4/3] flex items-center justify-center">
        <img
          src={product.image || "/placeholder.png"}
          alt={product.name}
          loading="lazy"
          decoding="async"
          className="
            max-h-full
            max-w-full
            object-contain
            p-3
            transition-opacity
            duration-300
            opacity-0
          "
          onLoad={(e) => {
            e.currentTarget.classList.remove("opacity-0");
            e.currentTarget.classList.add("opacity-100");
          }}
        />

        {discount && (
          <span className="absolute top-2 left-2 bg-[var(--color-secondary)] text-white text-xs font-semibold px-2 py-1 rounded">
            {discount}% OFF
          </span>
        )}
      </div>

      {/* Content */}
      <div className="p-3 flex flex-col flex-1 gap-0.5">
        <h3 className="
          text-sm
          font-semibold
          text-[var(--color-primary)]
          line-clamp-2
          min-h-[2.25rem]
          leading-snug
        ">
          {product.name}
        </h3>

        {product.brand && (
          <p className="text-xs text-[var(--color-muted)]">{product.brand}</p>
        )}

        <div className="flex items-center gap-2">
          <span className="text-base font-bold text-[var(--color-primary)]">
            ₹{product.price}
          </span>

          {product.originalPrice && (
            <span className="text-sm line-through text-[var(--color-muted)]">
              ₹{product.originalPrice}
            </span>
          )}
        </div>

        {/* CTA */}
        <div className="mt-auto pt-3">
          {quantityInCart === 0 ? (
            <Button
              onClick={(e) => {
                stop(e);
                onAddToCart?.(product);
              }}
              className="mt-2 w-full text-sm"
            >
              Add to Cart
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
                className="text-lg font-bold px-2 hover:scale-110 transition-transform"
              >
                −
              </button>
              <span className="text-sm font-semibold">
                {quantityInCart}
              </span>

              <button
                onClick={() => onIncrease?.(product)}
                className="text-lg font-bold px-2 hover:scale-110 transition-transform"
              >
                +
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
export default memo(ProductCard);