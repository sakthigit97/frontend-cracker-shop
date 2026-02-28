import { useParams } from "react-router-dom";
import { useEffect, useState, memo } from "react";
import {
  useProductDetails,
  useFetchProductDetails,
} from "../store/productDetails.store";
import { cartStore } from "../store/cart.store";
import { getDiscountPercent } from "../utils/pricing";

function getYouTubeId(url: string) {
  const regExp =
    /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([^&?/]+)/;
  const match = url.match(regExp);
  return match ? match[1] : null;
}

const ProductImage = memo(function ProductImage({
  images,
  name,
}: {
  images: string[];
  name: string;
}) {
  const [activeImage, setActiveImage] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isFading, setIsFading] = useState(false);

  useEffect(() => {
    if (!images || images.length <= 1 || isHovered) return;

    const interval = setInterval(() => {
      setIsFading(true);
      setTimeout(() => {
        setActiveImage((prev) =>
          prev === images.length - 1 ? 0 : prev + 1
        );
        setIsFading(false);
      }, 300);
    }, 3000);

    return () => clearInterval(interval);
  }, [images, isHovered]);

  return (
    <div className="relative rounded-2xl p-6 flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-100 border shadow-inner">
      <div className="absolute inset-0 rounded-2xl ring-1 ring-black/5" />
      <img
        src={images[activeImage]}
        alt={name}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`relative max-h-[340px] object-contain transition-all duration-300 hover:scale-105 ${isFading ? "opacity-0" : "opacity-100"
          }`}
      />
    </div>
  );
});

export default function ProductDetails() {
  const { productId = "" } = useParams();
  const fetchProduct = useFetchProductDetails();
  const { data: product, loading } = useProductDetails(productId);

  const addItem = cartStore((s) => s.addItem);
  const cartQty = cartStore(
    (s) => (product ? s.items[product.id] ?? 0 : 0)
  );

  useEffect(() => {
    fetchProduct(productId);
  }, [productId]);

  if (loading && !product) {
    return (

      <>
        {Array.from({ length: 5 }).map((_, i) => (
          <tr key={i} className="border-t animate-pulse">
            <td className="p-3">
              <div className="h-4 w-40 bg-gray-200 rounded" />
            </td>

            <td className="p-3">
              <div className="h-4 w-20 bg-gray-200 rounded" />
            </td>

            <td className="p-3">
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="h-8 w-20 bg-gray-200 rounded-lg" />
                <div className="h-8 w-20 bg-gray-200 rounded-lg" />
              </div>
            </td>
          </tr>
        ))}
      </>
    );
  }

  if (!product) {
    return (
      <div className="py-20 text-center text-sm text-gray-500">
        Product not found
      </div>
    );
  }

  const discount = getDiscountPercent(
    product.price,
    product.originalPrice
  );

  const videoId = product.youtubeUrl
    ? getYouTubeId(product.youtubeUrl)
    : null;

  return (
    <div className="p-4 max-w-6xl mx-auto space-y-10">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-white rounded-2xl border border-gray-200 p-4 md:p-6 shadow-sm">
        {/* IMAGE */}
        <ProductImage images={product.images} name={product.name} />

        {/* INFO */}
        <div className="flex flex-col gap-5">
          <div>
            <p className="text-xs uppercase tracking-wide text-[var(--color-muted)]">
              {product.categoryName}
            </p>
            <h1 className="text-2xl font-bold text-[var(--color-primary)] mt-1">
              {product.name}
            </h1>
          </div>

          <div className="flex items-center gap-4 flex-wrap">
            <span className="text-3xl font-bold text-[var(--color-primary)]">
              ₹{product.price}
            </span>
            {product.originalPrice && (
              <span className="line-through text-lg text-[var(--color-muted)]">
                ₹{product.originalPrice}
              </span>
            )}
            {discount && (
              <span className="bg-[var(--color-secondary)] text-white text-sm font-semibold px-3 py-1 rounded-full">
                {discount}% OFF
              </span>
            )}
          </div>

          <div className="pt-2">
            <div
              className="
              min-w-[220px]
              h-[52px]

              flex
              items-center
              justify-center

              rounded-xl
              bg-[var(--color-primary)]
              text-white
              border
              border-[var(--color-primary)]

              text-base
              font-semibold

              hover:opacity-90
              transition-all
            "
            >
              {cartQty === 0 ? (
                <button
                  onClick={() => addItem(product.id, 1)}
                  className="w-full h-full"
                >
                  Add to Cart
                </button>
              ) : (
                <div className="flex items-center justify-between w-full px-6">
                  <button
                    onClick={() => addItem(product.id, -1)}
                    className="text-2xl px-3 hover:scale-110 transition-transform"
                  >
                    −
                  </button>

                  <span className="text-lg font-bold">
                    {cartQty}
                  </span>

                  <button
                    onClick={() => addItem(product.id, 1)}
                    className="text-2xl px-3 hover:scale-110 transition-transform"
                  >
                    +
                  </button>
                </div>
              )}
            </div>
          </div>
          {product.description && (
            <div className="pt-4 border-t">
              <h3 className="font-semibold text-[var(--color-primary)] mb-2">
                Description
              </h3>
              <p className="text-sm text-[var(--color-muted)] leading-relaxed">
                {product.description}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* VIDEO */}
      {videoId && (
        <div className="bg-white rounded-2xl border border-gray-200 p-4 md:p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-[var(--color-primary)] mb-4">
            Product Video
          </h3>
          <div className="relative w-full overflow-hidden rounded-xl aspect-video bg-black">
            <iframe
              src={`https://www.youtube.com/embed/${videoId}`}
              allowFullScreen
              className="absolute inset-0 w-full h-full"
            />
          </div>
        </div>
      )}
    </div>
  );
}