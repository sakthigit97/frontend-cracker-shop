import { memo, useEffect, useMemo, useState } from "react";
import defaultImage from "../../assets/default-image.png";
import ProductSkeleton from "../product/ProductSkeleton";
import EmptyState from "../ui/EmptyState";
import {
    useFetchProductDetails,
    useProductDetails,
} from "../../store/productDetails.store";
import { cartStore } from "../../store/cart.store";

interface QuickEstimateProductModalProps {
    productId: string | null;
    open: boolean;
    onClose: () => void;
}

function getYouTubeId(url?: string) {
    if (!url) return null;

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
    const [hovered, setHovered] = useState(false);
    const [fade, setFade] = useState(false);

    useEffect(() => {
        setActiveImage(0);
    }, [images]);

    useEffect(() => {
        if (!images || images.length <= 1) return;
        if (hovered) return;

        const timer = setInterval(() => {
            setFade(true);

            setTimeout(() => {
                setActiveImage((prev) =>
                    prev === images.length - 1 ? 0 : prev + 1
                );

                setFade(false);
            }, 250);
        }, 3000);

        return () => clearInterval(timer);
    }, [images, hovered]);

    const prev = () => {
        setActiveImage((p) =>
            p === 0 ? images.length - 1 : p - 1
        );
    };

    const next = () => {
        setActiveImage((p) =>
            p === images.length - 1 ? 0 : p + 1
        );
    };

    return (
        <div className="relative w-full">

            <div className="relative rounded-2xl border bg-gradient-to-br from-gray-50 via-white to-gray-100 shadow-inner p-5 flex justify-center items-center">

                <img
                    src={images[activeImage] || defaultImage}
                    alt={name}
                    onMouseEnter={() => setHovered(true)}
                    onMouseLeave={() => setHovered(false)}
                    className={`
                        w-full
                        max-h-[360px]
                        object-contain
                        transition-all
                        duration-300
                        hover:scale-105
                        ${fade ? "opacity-0" : "opacity-100"}
                    `}
                />

                {images.length > 1 && (
                    <>
                        <button
                            onClick={prev}
                            className="
                                absolute
                                left-3
                                top-1/2
                                -translate-y-1/2
                                w-10
                                h-10
                                rounded-full
                                bg-white/90
                                shadow
                                hover:bg-white
                            "
                        >
                            ←
                        </button>

                        <button
                            onClick={next}
                            className="
                                absolute
                                right-3
                                top-1/2
                                -translate-y-1/2
                                w-10
                                h-10
                                rounded-full
                                bg-white/90
                                shadow
                                hover:bg-white
                            "
                        >
                            →
                        </button>
                    </>
                )}
            </div>

            {images.length > 1 && (
                <div className="flex gap-2 justify-center mt-4 flex-wrap">

                    {images.map((img, index) => (
                        <button
                            key={index}
                            onClick={() => setActiveImage(index)}
                            className={`
                                rounded-lg
                                overflow-hidden
                                border-2
                                transition-all
                                ${index === activeImage
                                    ? "border-[var(--color-primary)]"
                                    : "border-gray-200"}
                            `}
                        >
                            <img
                                src={img}
                                alt=""
                                className="w-16 h-16 object-cover"
                            />
                        </button>
                    ))}

                </div>
            )}
        </div>
    );
});

export default function QuickEstimateProductModal({
    open,
    productId,
    onClose,
}: QuickEstimateProductModalProps) {

    const fetchProduct = useFetchProductDetails();

    const {
        data: product,
        loading,
    } = useProductDetails(productId ?? "");

    const addItem = cartStore((s) => s.addItem);

    const cartQty = cartStore((s) =>
        product ? s.items[product.id] ?? 0 : 0
    );

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

        return () =>
            window.removeEventListener("keydown", esc);
    }, [open, onClose]);

    const videoId = useMemo(() => {
        return getYouTubeId(product?.youtubeUrl || '');
    }, [product]);

    if (!open) return null;

    const availableQty = product?.qty ?? 0;

    console.log("youtubeUrl", product?.youtubeUrl);
    console.log("videoId", videoId);

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
            p-0
            md:p-6
        "
            onClick={onClose}
        >
            <div
                onClick={(e) => e.stopPropagation()}
                className="
    relative
    bg-white
    w-full
    h-screen
    md:h-auto
    md:max-h-[95vh]
    md:max-w-6xl
    rounded-none
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
                    px-5
                    py-4
                    flex
                    items-center
                    justify-between
                "
                >
                    <div>
                        <h2 className="text-xl font-semibold text-[var(--color-primary)]">
                            Product Details
                        </h2>

                        <p className="text-sm text-gray-500">
                            {product.categoryName}
                        </p>
                    </div>

                    <button
                        onClick={onClose}
                        className="
                        w-10
                        h-10
                        rounded-full
                        hover:bg-gray-100
                        text-2xl
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
        p-5
        md:p-8
                "
                >
                    <div
                        className="
                        grid
                        grid-cols-1
                        lg:grid-cols-2
                        gap-10
                    "
                    >

                        <ProductImage
                            images={product.images}
                            name={product.name}
                        />

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

                            {/* CART */}

                            <div className="pt-2">

                                <div
                                    className="
                                    w-full
                                    md:w-[260px]
                                    h-[56px]
                                    rounded-xl
                                    bg-[var(--color-primary)]
                                    text-white
                                    flex
                                    items-center
                                    justify-center
                                    border
                                    border-[var(--color-primary)]
                                "
                                >

                                    {cartQty === 0 ? (
                                        <button
                                            className={`
                                             w-full
                                                h-full
                                                font-semibold
                                                transition-all
                                            ${availableQty === 0
                                                    ? "cursor-not-allowed opacity-60"
                                                    : "hover:opacity-90"}
                                        `}
                                            disabled={availableQty === 0}
                                            onClick={() =>
                                                addItem(product.id, 1)
                                            }
                                        >
                                            {availableQty === 0
                                                ? "Out of Stock"
                                                : "Add to Cart"}
                                        </button>
                                    ) : (
                                        <div
                                            className="
                                            flex
                                            items-center
                                            justify-between
                                            w-full
                                            px-6
                                        "
                                        >
                                            <button
                                                className="text-3xl"
                                                onClick={() =>
                                                    addItem(product.id, -1)
                                                }
                                            >
                                                −
                                            </button>

                                            <span className="text-lg font-bold">
                                                {cartQty}
                                            </span>

                                            <button
                                                className="text-3xl"
                                                onClick={() =>
                                                    addItem(product.id, 1)
                                                }
                                            >
                                                +
                                            </button>
                                        </div>
                                    )}

                                </div>

                            </div>

                            {/* DESCRIPTION */}

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