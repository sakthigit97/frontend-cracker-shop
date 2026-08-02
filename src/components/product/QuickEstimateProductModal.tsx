import { memo, useEffect, useMemo, useState } from "react";
import defaultImage from "../../assets/default-image.png";
import ProductSkeleton from "../product/ProductSkeleton";
import EmptyState from "../ui/EmptyState";
import {
    useFetchProductDetails,
    useProductDetails,
} from "../../store/productDetails.store";

interface QuickEstimateProductModalProps {
    productId: string | null;
    open: boolean;
    onClose: () => void;
}

function getYouTubeId(url?: string) {
    if (!url) return null;
    const regExp = /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([^&?/]+)/;
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
        setActiveIndex((prev) => (prev === 0 ? media.length - 1 : prev - 1));

    const next = () => setActiveIndex((prev) => (prev + 1) % media.length);

    useEffect(() => {
        if (!media.length || media.length <= 1) return;
        if (media[activeIndex]?.type === "video") return;

        const interval = setInterval(() => {
            setActiveIndex((prev) => (prev + 1) % media.length);
        }, 3000);

        return () => clearInterval(interval);
    }, [media, activeIndex]);

    return (
        <div className="relative w-full">
            <div
                className="
    relative
    h-[260px]
    sm:h-[340px]
    md:h-[480px]
    lg:h-[560px]
    rounded-2xl
    border
    bg-gradient-to-br
    from-gray-50
    via-white
    to-gray-100
    shadow-inner
    overflow-hidden
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
                                    const img = e.currentTarget;

                                    if (img.src !== defaultImage) {
                                        img.onerror = null;
                                        img.src = defaultImage;
                                    }
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
p-6
md:p-8
cursor-zoom-in
transition-all
duration-300
hover:scale-[1.03]
select-none
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
        </div>
    );
});

export default function QuickEstimateProductModal({
    open,
    productId,
    onClose,
}: QuickEstimateProductModalProps) {
    const fetchProduct = useFetchProductDetails();
    const { data: product, loading } = useProductDetails(productId ?? "");

    useEffect(() => {
        if (!open) return;

        if (!productId) return;

        fetchProduct(productId);
    }, [open, productId]);

    useEffect(() => {
        if (!open) return;

        document.body.style.overflow = "hidden";

        return () => {
            document.body.style.overflow = "";
        };
    }, [open]);

    useEffect(() => {
        if (!open) return;

        const esc = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                onClose();
            }
        };

        window.addEventListener("keydown", esc);

        return () => window.removeEventListener("keydown", esc);
    }, [open, onClose]);

    const videoId = useMemo(() => {
        return getYouTubeId(product?.youtubeUrl || "");
    }, [product]);

    if (!open) return null;

    if (loading && !product) {
        return (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4">
                <div className="bg-white rounded-3xl w-full max-w-5xl p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <ProductSkeleton />
                        <ProductSkeleton />
                    </div>
                </div>
            </div>
        );
    }
    const validImages =
        product?.images?.filter((img) => img && img.trim().length > 0) ?? [];

    const imageMedia =
        validImages.length > 0
            ? validImages.map((img) => ({
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

    if (!product) {
        return (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4">
                <div className="bg-white rounded-3xl w-full max-w-lg p-10">
                    <EmptyState
                        title="Product not found"
                        description="Unable to load product details."
                    />

                    <div className="mt-8 flex justify-center">
                        <button
                            onClick={onClose}
                            className="
                            px-6
                            py-2
                            rounded-xl
                            bg-[var(--color-primary)]
                            text-white
                        "
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div
            className="
    fixed
    inset-0
    z-[100]
    bg-black/60

    flex
    items-center
    justify-center

    p-3
    md:p-6
"
            onClick={onClose}
        >
            <div
                onClick={(e) => e.stopPropagation()}
                className="
    relative
    bg-white

    w-[94vw]
    max-w-[94vw]

    h-[88vh]
    max-h-[88vh]

    md:w-full
    md:max-w-6xl
    md:h-auto
    md:max-h-[95vh]

    rounded-2xl
    md:rounded-3xl

    shadow-2xl
    overflow-hidden

    flex
    flex-col

    animate-in
    fade-in
    zoom-in-95
"
            >
                {/* HEADER */}

                <div
                    className="
    sticky
    top-0
    z-20
    bg-white
    border-b
    px-3
    py-2
    md:px-5
    md:py-4
    flex
    items-center
    justify-between
"
                >
                    <div>
                        <h2 className="text-lg md:text-xl font-semibold text-[var(--color-primary)]">
                            Product Details
                        </h2>

                        <p className="text-xs md:text-sm text-gray-500">
                            {product.categoryName}
                        </p>
                    </div>

                    <button
                        onClick={onClose}
                        className="
                            flex
                            items-center
                            justify-center
                            w-8
                            h-8
                            md:w-10
                            md:h-10
                            rounded-full
                            hover:bg-gray-100
                            text-xl
                            md:text-2xl
                            shrink-0
                        "
                    >
                        ×
                    </button>
                </div>

                {/* BODY */}

                <div
                    className="
                        flex-1
                        overflow-y-auto
                        p-3
                        md:p-8
                    "
                >
                    <div
                        className="
                          grid
                        grid-cols-1
                        lg:grid-cols-2
                        gap-4
                        md:gap-8
                    "
                    >
                        <ProductImage media={media} name={product.name} />

                        {/* RIGHT */}

                        <div className="flex flex-col gap-6">
                            <div>
                                <p className="text-xs uppercase tracking-wide text-[var(--color-muted)]">
                                    {product.categoryName}
                                </p>

                                <h1 className="text-3xl font-bold text-[var(--color-primary)] mt-1">
                                    {product.name}
                                </h1>
                            </div>

                            <div className="flex flex-wrap items-center gap-4">
                                <span className="text-4xl font-bold text-[var(--color-primary)]">
                                    ₹{product.price}
                                </span>

                                {product.originalPrice && (
                                    <span className="line-through text-xl text-gray-400">
                                        ₹{product.originalPrice}
                                    </span>
                                )}

                                {product.discountText && (
                                    <span
                                        className="
                                        bg-[var(--color-secondary)]
                                        text-white
                                        rounded-full
                                        px-4
                                        py-1
                                        text-sm
                                        font-semibold
                                    "
                                    >
                                        {product.discountText}
                                    </span>
                                )}
                            </div>

                            {product.description && (
                                <div className="border-t pt-5">
                                    <h3 className="font-semibold text-lg text-[var(--color-primary)] mb-3">
                                        Description
                                    </h3>

                                    <p
                                        className="
                                        leading-7
                                        text-gray-600
                                        whitespace-pre-wrap
                                    "
                                    >
                                        {product.description}
                                    </p>
                                </div>
                            )}

                            {/* VIDEO */}

                            {videoId && (
                                <div className="border-t pt-5">
                                    <h3 className="font-semibold text-lg text-[var(--color-primary)] mb-4">
                                        Product Video
                                    </h3>

                                    <div
                                        className="
                                            relative
                                            w-full
                                            aspect-video
                                            rounded-2xl
                                            overflow-hidden
                                            bg-black
                                            max-h-[420px]
                                        "
                                    >
                                        <iframe
                                            src={`https://www.youtube.com/embed/${videoId}?rel=0`}
                                            title={product.name}
                                            loading="lazy"
                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                            allowFullScreen
                                            referrerPolicy="strict-origin-when-cross-origin"
                                            className="absolute inset-0 w-full h-full border-0"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}