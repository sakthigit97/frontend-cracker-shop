import { useParams } from "react-router-dom";
import { useEffect, useState, memo } from "react";
import {
  useProductDetails,
  useFetchProductDetails,
} from "../store/productDetails.store";
import { cartStore } from "../store/cart.store";
import ProductSkeleton from "../components/product/ProductSkeleton";
import EmptyState from "../components/ui/EmptyState";
import { useNavigate } from "react-router-dom";
import defaultImage from "../assets/default-image.png";

function getYouTubeId(url: string) {
  const regExp =
    /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([^&?/]+)/;
  const match = url.match(regExp);
  return match ? match[1] : null;
}
type MediaItem =
  | {
    type: "image";
    src: string;
  }
  | {
    type: "video";
    src: string;
  };

const ProductImage = memo(function ProductImage({
  media,
  name,
}: {
  media: MediaItem[];
  name: string;
}) {

  const [showViewer, setShowViewer] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [viewerIndex, setViewerIndex] = useState(0);

  useEffect(() => {
    media.forEach((item) => {
      if (item.type === "image") {
        const img = new Image();
        img.src = item.src;
      }
    });
  }, [media]);

  useEffect(() => {
    if (!media.length || media.length <= 1) return;
    if (media[activeIndex]?.type === "video") return;

    const interval = setInterval(() => {
      setActiveIndex(prev => (prev + 1) % media.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [media, activeIndex]);

  const viewerPrev = () => {
    let i = viewerIndex;

    do {
      i = i === 0 ? media.length - 1 : i - 1;
    } while (media[i].type === "video");

    setViewerIndex(i);
  };

  const viewerNext = () => {
    let i = viewerIndex;

    do {
      i = (i + 1) % media.length;
    } while (media[i].type === "video");

    setViewerIndex(i);
  };

  const prev = () =>
    setActiveIndex(prev =>
      prev === 0 ? media.length - 1 : prev - 1
    );

  const next = () =>
    setActiveIndex(prev =>
      (prev + 1) % media.length
    );

  return (
    <div
      className="
        relative
        w-full
        aspect-[4/3]
        max-h-[450px]
        rounded-2xl
        overflow-hidden
        bg-white
        border
        border-gray-200
        shadow-sm
        flex
        items-center
        justify-center
        "
    >

      <div className="absolute inset-0 rounded-2xl ring-1 ring-black/5" />

      {/* Previous */}
      <button
        onClick={prev}
        className="
        absolute
        top-1/2
        -translate-y-1/2
        z-20
        left-3
        w-9
        h-9
        md:w-11
        md:h-11
        rounded-full
        bg-white/90
        backdrop-blur-sm
        shadow-lg
        hover:bg-white
        hover:scale-105
        transition-all
        "
      >
        ❮
      </button>

      <button
        onClick={next}
        className="
          absolute
          top-1/2
          -translate-y-1/2
          z-20
          right-3
          w-9
          h-9
          md:w-11
          md:h-11
          rounded-full
          bg-white/90
          backdrop-blur-sm
          shadow-lg
          hover:bg-white
          hover:scale-105
          transition-all
          "
      >
        ❯
      </button>

      {media.map((item, index) => (
        <div
          key={index}
          className={`absolute inset-0 transition-opacity duration-500 ${activeIndex === index
            ? "opacity-100 z-10"
            : "opacity-0 pointer-events-none"
            }`}
        >
          {item.type === "image" ? (
            <img
              onClick={() => {
                setViewerIndex(index);
                setShowViewer(true);
              }}
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = defaultImage;
              }}
              src={item.src || defaultImage}
              alt={name}
              loading="eager"
              draggable={false}
              className="
              absolute
              inset-0
              w-full
              h-full
              object-contain
              p-4
              md:p-6
              cursor-zoom-in
              transition-transform
              duration-300
              hover:scale-105
              "
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-black">
              <iframe
                src={`https://www.youtube.com/embed/${item.src}?rel=0`}
                allowFullScreen
                className="w-full aspect-video rounded-2xl"
              />
            </div>
          )}
        </div>
      ))}

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-20">
        {media.map((_, index) => (
          <button
            key={index}
            onClick={() => setActiveIndex(index)}
            className={`h-2 rounded-full transition-all ${activeIndex === index
              ? "w-6 bg-[var(--color-primary)]"
              : "w-2 bg-gray-300"
              }`}
          />
        ))}
      </div>
      {showViewer && (
        <div
          className="fixed inset-0 z-[9999] bg-black/90 flex items-center justify-center"
          onClick={() => setShowViewer(false)}
        >
          {/* Close */}
          <button
            onClick={() => setShowViewer(false)}
            className="absolute top-5 right-5 text-white text-4xl font-light"
          >
            ×
          </button>

          {/* Previous */}
          {media.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                viewerPrev();
              }}
              className="absolute left-6 top-1/2 -translate-y-1/2 text-white text-5xl"
            >
              ❮
            </button>
          )}

          {/* Image */}
          <img
            src={(media[viewerIndex] as { type: "image"; src: string }).src}
            alt={name}
            onClick={(e) => e.stopPropagation()}
            className="max-w-[95vw] max-h-[90vh] object-contain"
          />

          {/* Next */}
          {media.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                viewerNext();
              }}
              className="absolute right-6 top-1/2 -translate-y-1/2 text-white text-5xl"
            >
              ❯
            </button>
          )}
        </div>
      )}
    </div>
  );
});

export default function ProductDetails() {
  const { productId = "" } = useParams();
  const fetchProduct = useFetchProductDetails();
  const { data: product, loading } = useProductDetails(productId);
  const addItem = cartStore((s) => s.addItem);
  const navigate = useNavigate();
  const cartQty = cartStore(
    (s) => (product ? s.items[product.id] ?? 0 : 0)
  );

  useEffect(() => {
    fetchProduct(productId);
  }, [productId, fetchProduct]);

  if (loading && !product) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <ProductSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (!product) {
    return (
      <div className="py-20 text-center text-sm text-gray-500">
        <EmptyState
          title="Product not found"
          description="Try explore other product."
        />
      </div>
    );
  }

  const videoId = product.youtubeUrl ? getYouTubeId(product.youtubeUrl) : null;
  const available_qty = product?.qty || 0;
  const imageMedia =
    product.images && product.images.length > 0
      ? product.images.map((img) => ({
        type: "image" as const,
        src: img,
      }))
      : [
        {
          type: "image" as const,
          src: defaultImage,
        },
      ];

  const media = [
    ...imageMedia,
    ...(videoId
      ? [
        {
          type: "video" as const,
          src: videoId,
        },
      ]
      : []),
  ];


  return (

    <div className="p-4 max-w-6xl mx-auto space-y-10">

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
          Detailed Product
        </h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-white rounded-2xl border border-gray-200 p-4 md:p-6 shadow-sm">
        {/* IMAGE */}
        <ProductImage
          media={media}
          name={product.name}
        />

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
            {product?.discountText && (
              <span className="bg-[var(--color-secondary)] text-white text-sm font-semibold px-3 py-1 rounded-full">
                {product?.discountText}
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
                  className={`mt-2 w-full text-sm ${available_qty === 0
                    ? "cursor-not-allowed text-gray-600"
                    : ""
                    }`}
                  disabled={available_qty === 0}
                >
                  {available_qty === 0 ? "Out of Stock" : "Add to Cart"}
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

    </div>
  );
}