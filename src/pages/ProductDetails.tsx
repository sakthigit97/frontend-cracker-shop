import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState, memo } from "react";

import {
  useProductDetails,
  useFetchProductDetails,
} from "../store/productDetails.store";

import { cartStore } from "../store/cart.store";
import ProductSkeleton from "../components/product/ProductSkeleton";
import EmptyState from "../components/ui/EmptyState";
import defaultImage from "../assets/default-image.png";
import { useCatalog } from "../store/catalog.store";

/* ============================================================
 * YouTube Types
 * ============================================================ */

interface YouTubePlayerStateChangeEvent {
  data: number;
}

interface YouTubePlayer {
  destroy: () => void;
}

interface YouTubePlayerOptions {
  videoId: string;
  playerVars?: {
    rel?: number;
    playsinline?: number;
    origin?: string;
  };
  events?: {
    onStateChange?: (
      event: YouTubePlayerStateChangeEvent
    ) => void;
  };
}

interface YouTubeAPI {
  Player: new (
    element: HTMLElement,
    options: YouTubePlayerOptions
  ) => YouTubePlayer;

  PlayerState: {
    ENDED: number;
    PLAYING: number;
    PAUSED: number;
    BUFFERING: number;
    CUED: number;
  };
}

declare global {
  interface Window {
    YT?: YouTubeAPI;
    onYouTubeIframeAPIReady?: () => void;
  }
}

/* ============================================================
 * YouTube API Loader
 * ============================================================ */

let youtubeApiPromise: Promise<void> | null =
  null;

function loadYouTubeApi(): Promise<void> {
  if (window.YT?.Player) {
    return Promise.resolve();
  }

  if (youtubeApiPromise) {
    return youtubeApiPromise;
  }

  youtubeApiPromise = new Promise(
    (resolve) => {
      const existingScript =
        document.querySelector(
          'script[src="https://www.youtube.com/iframe_api"]'
        );

      const previousCallback =
        window.onYouTubeIframeAPIReady;

      window.onYouTubeIframeAPIReady =
        () => {
          previousCallback?.();
          resolve();
        };

      if (existingScript) {
        return;
      }

      const script =
        document.createElement("script");

      script.src =
        "https://www.youtube.com/iframe_api";

      script.async = true;

      document.body.appendChild(script);
    }
  );

  return youtubeApiPromise;
}

/* ============================================================
 * YouTube URL -> Video ID
 * ============================================================ */

function getYouTubeId(url: string) {
  try {
    const parsed = new URL(url);

    const hostname =
      parsed.hostname.toLowerCase();

    /* --------------------------------------------------------
     * youtu.be/VIDEO_ID
     * -------------------------------------------------------- */
    if (hostname === "youtu.be") {
      return (
        parsed.pathname
          .replace(/^\/+/, "")
          .split("/")[0] || null
      );
    }

    /* --------------------------------------------------------
     * youtube.com URLs
     * -------------------------------------------------------- */
    if (
      hostname === "youtube.com" ||
      hostname === "www.youtube.com" ||
      hostname.endsWith(".youtube.com")
    ) {
      /*
       * youtube.com/watch?v=VIDEO_ID
       */
      const watchId =
        parsed.searchParams.get("v");

      if (watchId) {
        return watchId;
      }

      /*
       * youtube.com/embed/VIDEO_ID
       * youtube.com/shorts/VIDEO_ID
       * youtube.com/live/VIDEO_ID
       */
      const parts =
        parsed.pathname
          .split("/")
          .filter(Boolean);

      const typeIndex =
        parts.findIndex((part) =>
          [
            "embed",
            "shorts",
            "live",
          ].includes(
            part.toLowerCase()
          )
        );

      if (
        typeIndex !== -1 &&
        parts[typeIndex + 1]
      ) {
        return parts[typeIndex + 1];
      }
    }

    return null;
  } catch {
    return null;
  }
}

/* ============================================================
 * Media Types
 * ============================================================ */

type MediaItem =
  | {
    type: "image";
    src: string;
  }
  | {
    type: "video";
    src: string;
  };

/* ============================================================
 * Product Image / Video Carousel
 * ============================================================ */

const ProductImage = memo(
  function ProductImage({
    media,
    name,
  }: {
    media: MediaItem[];
    name: string;
  }) {
    const [showViewer, setShowViewer] =
      useState(false);

    const [activeIndex, setActiveIndex] =
      useState(0);

    const [viewerIndex, setViewerIndex] =
      useState(0);

    /*
     * DOM element where YouTube API creates
     * the iframe player.
     */
    const videoContainerRef =
      useRef<HTMLDivElement | null>(
        null
      );

    const playerRef =
      useRef<YouTubePlayer | null>(
        null
      );

    /*
     * Used to prevent stale async YouTube
     * initialization after slide changes.
     */
    const playerGenerationRef =
      useRef(0);

    /* --------------------------------------------------------
     * Preload images
     * -------------------------------------------------------- */

    useEffect(() => {
      media.forEach((item) => {
        if (item.type === "image") {
          const img = new Image();
          img.src = item.src;
        }
      });
    }, [media]);

    /* --------------------------------------------------------
     * Reset active index when media changes
     * -------------------------------------------------------- */

    useEffect(() => {
      setActiveIndex((current) =>
        current >= media.length
          ? 0
          : current
      );

      setViewerIndex((current) =>
        current >= media.length
          ? 0
          : current
      );
    }, [media.length]);

    /* --------------------------------------------------------
     * Destroy current YouTube player
     * -------------------------------------------------------- */

    const destroyPlayer = () => {
      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch {
          // Ignore player cleanup errors.
        }

        playerRef.current = null;
      }

      if (videoContainerRef.current) {
        videoContainerRef.current.innerHTML =
          "";
      }
    };

    /* --------------------------------------------------------
     * Initialize YouTube player only when the active
     * slide is a video.
     * -------------------------------------------------------- */

    useEffect(() => {
      const activeMedia =
        media[activeIndex];

      /*
       * Any non-video slide must not have
       * an active YouTube player.
       */
      if (
        !activeMedia ||
        activeMedia.type !== "video"
      ) {
        destroyPlayer();
        return;
      }

      const generation =
        ++playerGenerationRef.current;

      let cancelled = false;

      /*
       * Make sure the previous player is gone
       * before creating a new one.
       */
      destroyPlayer();

      const initializePlayer =
        async () => {
          try {
            await loadYouTubeApi();

            if (
              cancelled ||
              generation !==
              playerGenerationRef.current
            ) {
              return;
            }

            if (!window.YT?.Player) {
              return;
            }

            const container =
              videoContainerRef.current;

            if (!container) {
              return;
            }

            /*
             * Clear anything left by a previous
             * player instance.
             */
            container.innerHTML = "";

            playerRef.current =
              new window.YT.Player(
                container,
                {
                  videoId:
                    activeMedia.src,

                  playerVars: {
                    rel: 0,
                    playsinline: 1,
                    origin:
                      window.location.origin,
                  },

                  events: {
                    onStateChange:
                      (
                        event
                      ) => {
                        if (
                          cancelled ||
                          generation !==
                          playerGenerationRef.current
                        ) {
                          return;
                        }

                        const playerState =
                          window.YT
                            ?.PlayerState;

                        if (
                          !playerState
                        ) {
                          return;
                        }

                        /*
                         * Video has finished.
                         *
                         * Only here do we move
                         * to the next slide.
                         */
                        if (
                          event.data ===
                          playerState.ENDED
                        ) {
                          setActiveIndex(
                            (current) =>
                              (current +
                                1) %
                              media.length
                          );
                        }

                        /*
                         * PLAYING:
                         * Do nothing.
                         *
                         * The carousel is already
                         * stopped because the active
                         * slide is a video.
                         */

                        /*
                         * PAUSED:
                         * Do nothing.
                         *
                         * Stay on the video.
                         */

                        /*
                         * BUFFERING:
                         * Do nothing.
                         *
                         * Stay on the video.
                         */
                      },
                  },
                }
              );
          } catch (error) {
            console.error(
              "Failed to initialize YouTube player:",
              error
            );
          }
        };

      initializePlayer();

      return () => {
        cancelled = true;

        playerGenerationRef.current++;

        destroyPlayer();
      };
    }, [activeIndex, media]);

    /* --------------------------------------------------------
     * Image Auto Slide
     *
     * IMPORTANT:
     *
     * If current slide is a video, there is NO
     * interval running.
     *
     * YouTube's ENDED event controls moving
     * to the next slide.
     * -------------------------------------------------------- */

    useEffect(() => {
      if (
        media.length <= 1
      ) {
        return;
      }

      const activeMedia =
        media[activeIndex];

      /*
       * Video slide:
       *
       * DO NOT start the timer.
       */
      if (
        activeMedia?.type === "video"
      ) {
        return;
      }

      const interval =
        window.setInterval(() => {
          setActiveIndex(
            (current) =>
              (current + 1) %
              media.length
          );
        }, 3000);

      return () =>
        window.clearInterval(
          interval
        );
    }, [
      media,
      activeIndex,
    ]);

    /* --------------------------------------------------------
     * Main carousel navigation
     * -------------------------------------------------------- */

    const prev = () => {
      setActiveIndex((current) =>
        current === 0
          ? media.length - 1
          : current - 1
      );
    };

    const next = () => {
      setActiveIndex(
        (current) =>
          (current + 1) %
          media.length
      );
    };

    /* --------------------------------------------------------
     * Viewer navigation
     *
     * Images and videos are both supported.
     * -------------------------------------------------------- */

    const viewerPrev = () => {
      if (!media.length) {
        return;
      }

      setViewerIndex(
        (current) =>
          current === 0
            ? media.length - 1
            : current - 1
      );
    };

    const viewerNext = () => {
      if (!media.length) {
        return;
      }

      setViewerIndex(
        (current) =>
          (current + 1) %
          media.length
      );
    };

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

        {/* ==================================================
            PREVIOUS
            ================================================== */}

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

        {/* ==================================================
            NEXT
            ================================================== */}

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

        {/* ==================================================
            MEDIA
            ================================================== */}

        {media.map(
          (item, index) => (
            <div
              key={`${item.type}-${item.src}-${index}`}
              className={`absolute inset-0 transition-opacity duration-500 ${activeIndex === index
                ? "opacity-100 z-10"
                : "opacity-0 pointer-events-none"
                }`}
            >
              {item.type ===
                "image" ? (
                <img
                  onClick={() => {
                    setViewerIndex(
                      index
                    );

                    setShowViewer(
                      true
                    );
                  }}
                  onError={(e) => {
                    e.currentTarget.onerror =
                      null;

                    e.currentTarget.src =
                      defaultImage;
                  }}
                  src={
                    item.src ||
                    defaultImage
                  }
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
                /*
                 * IMPORTANT:
                 *
                 * Do NOT render an iframe here.
                 *
                 * YouTube IFrame API creates the
                 * iframe inside this div.
                 */
                <div className="absolute inset-0 flex items-center justify-center bg-black">
                  <div
                    ref={
                      activeIndex ===
                        index
                        ? videoContainerRef
                        : undefined
                    }
                    className="
                      w-full
                      h-full
                      flex
                      items-center
                      justify-center
                    "
                  />
                </div>
              )}
            </div>
          )
        )}

        {/* ==================================================
            DOTS
            ================================================== */}

        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-20">
          {media.map(
            (_, index) => (
              <button
                key={index}
                onClick={() =>
                  setActiveIndex(
                    index
                  )
                }
                className={`h-2 rounded-full transition-all ${activeIndex ===
                  index
                  ? "w-6 bg-[var(--color-primary)]"
                  : "w-2 bg-gray-300"
                  }`}
              />
            )
          )}
        </div>

        {/* ==================================================
            FULL SCREEN VIEWER
            ================================================== */}

        {showViewer && (
          <div
            className="
              fixed
              inset-0
              z-[9999]
              bg-black/90
              flex
              items-center
              justify-center
            "
            onClick={() =>
              setShowViewer(false)
            }
          >
            {/* Close */}

            <button
              onClick={() =>
                setShowViewer(
                  false
                )
              }
              className="
                absolute
                top-5
                right-5
                text-white
                text-4xl
                font-light
                z-20
              "
            >
              ×
            </button>

            {/* Viewer Previous */}

            {media.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();

                  viewerPrev();
                }}
                className="
                  absolute
                  left-6
                  top-1/2
                  -translate-y-1/2
                  text-white
                  text-5xl
                  z-20
                "
              >
                ❮
              </button>
            )}

            {/* Viewer Content */}

            {media[
              viewerIndex
            ]?.type === "video" ? (
              <div
                className="
                  w-[90vw]
                  max-w-5xl
                  aspect-video
                  rounded-2xl
                  overflow-hidden
                  bg-black
                "
                onClick={(e) =>
                  e.stopPropagation()
                }
              >
                <iframe
                  src={`https://www.youtube.com/embed/${media[
                    viewerIndex
                  ].src
                    }?rel=0&playsinline=1`}
                  allow="
                    accelerometer;
                    autoplay;
                    clipboard-write;
                    encrypted-media;
                    gyroscope;
                    picture-in-picture;
                    web-share
                  "
                  allowFullScreen
                  title={`${name} video`}
                  className="w-full h-full"
                />
              </div>
            ) : (
              <img
                src={
                  (
                    media[
                    viewerIndex
                    ] as {
                      type: "image";
                      src: string;
                    }
                  ).src ||
                  defaultImage
                }
                alt={name}
                onError={(e) => {
                  e.currentTarget.onerror =
                    null;

                  e.currentTarget.src =
                    defaultImage;
                }}
                onClick={(e) =>
                  e.stopPropagation()
                }
                className="
                  max-w-[95vw]
                  max-h-[90vh]
                  object-contain
                "
              />
            )}

            {/* Viewer Next */}

            {media.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();

                  viewerNext();
                }}
                className="
                  absolute
                  right-6
                  top-1/2
                  -translate-y-1/2
                  text-white
                  text-5xl
                  z-20
                "
              >
                ❯
              </button>
            )}
          </div>
        )}
      </div>
    );
  }
);

/* ============================================================
 * Product Details
 * ============================================================ */

export default function ProductDetails() {
  const {
    productId = "",
  } = useParams();

  const fetchProduct =
    useFetchProductDetails();

  const {
    data: product,
    loading,
  } = useProductDetails(
    productId
  );

  const {
    categories,
    brands,
    fetchCategories,
    fetchBrands,
  } = useCatalog();

  const addItem =
    cartStore(
      (s) => s.addItem
    );

  const navigate =
    useNavigate();

  const cartQty =
    cartStore(
      (s) =>
        product
          ? s.items[
          product.id
          ] ?? 0
          : 0
    );

  /* ==========================================================
   * Fetch product/catalog data
   * ========================================================== */

  useEffect(() => {
    fetchProduct(
      productId
    );

    if (
      categories.length === 0
    ) {
      fetchCategories();
    }

    if (
      brands.length === 0
    ) {
      fetchBrands();
    }
  }, [
    productId,
    fetchProduct,
    categories.length,
    brands.length,
    fetchCategories,
    fetchBrands,
  ]);

  const categoryName =
    categories.find(
      (category: any) =>
        category.id ===
        product?.categoryId
    )?.name || "";

  const brandName =
    brands.find(
      (brand: any) =>
        brand.id ===
        product?.brandId
    )?.name || "";

  /* ==========================================================
   * Loading
   * ========================================================== */

  if (
    loading &&
    !product
  ) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({
          length: 6,
        }).map((_, i) => (
          <ProductSkeleton
            key={i}
          />
        ))}
      </div>
    );
  }

  /* ==========================================================
   * Product not found
   * ========================================================== */

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

  /* ==========================================================
   * Product Media
   * ========================================================== */

  const videoId =
    product.youtubeUrl
      ? getYouTubeId(
        product.youtubeUrl
      )
      : null;

  const available_qty =
    product?.qty || 0;

  const imageMedia =
    product.images &&
      product.images.length >
      0
      ? product.images.map(
        (img) => ({
          type:
            "image" as const,
          src: img,
        })
      )
      : [
        {
          type:
            "image" as const,
          src: defaultImage,
        },
      ];

  const media: MediaItem[] = [
    ...imageMedia,

    ...(videoId
      ? [
        {
          type:
            "video" as const,
          src: videoId,
        },
      ]
      : []),
  ];

  /* ==========================================================
   * UI
   * ========================================================== */

  return (
    <div className="p-4 max-w-6xl mx-auto space-y-10">
      {/* ======================================================
          HEADER
          ====================================================== */}

      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={() =>
            navigate(-1)
          }
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
          Detailed Product
        </h1>
      </div>

      {/* ======================================================
          PRODUCT CARD
          ====================================================== */}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-white rounded-2xl border border-gray-200 p-4 md:p-6 shadow-sm">
        {/* IMAGE / VIDEO */}

        <ProductImage
          media={media}
          name={product.name}
        />

        {/* INFO */}

        <div className="flex flex-col gap-5">
          <div>
            {/* Category */}

            {categoryName && (
              <span
                className="
                  inline-flex
                  items-center
                  rounded-full
                  bg-gray-100
                  px-3
                  py-1
                  text-xs
                  font-medium
                  uppercase
                  tracking-wide
                  text-gray-500
                "
              >
                {categoryName}
              </span>
            )}

            {/* Product Name */}

            <h1
              className="
                mt-3
                text-2xl
                md:text-3xl
                font-bold
                text-[var(--color-primary)]
                leading-tight
              "
            >
              {product.name}
            </h1>

            {/* Brand */}

            {brandName && (
              <div className="mt-2 flex items-center gap-2 text-sm text-gray-500">
                <span className="text-base">
                  🏷️
                </span>

                <span>
                  Brand:
                </span>

                <span className="font-semibold text-gray-700">
                  {brandName}
                </span>
              </div>
            )}

            {/* Pack information */}

            {Number(
              product.packQuantity
            ) > 0 &&
              product.packUnit?.trim() && (
                <div className="mt-4">
                  <span
                    className="
                      inline-flex
                      items-center
                      gap-2
                      rounded-xl
                      border
                      border-gray-200
                      bg-gray-50
                      px-3
                      py-2
                      text-sm
                      text-gray-600
                    "
                  >
                    <span className="text-base">
                      📦
                    </span>

                    <span className="font-medium">
                      Pack:
                    </span>

                    <span className="font-bold text-[var(--color-primary)]">
                      {
                        product.packQuantity
                      }
                      /
                      {
                        product.packUnit
                      }
                    </span>
                  </span>
                </div>
              )}
          </div>

          {/* Price */}

          <div className="flex items-center gap-4 flex-wrap">
            <span className="text-3xl font-bold text-[var(--color-primary)]">
              ₹{product.price}
            </span>

            {product.originalPrice && (
              <span className="line-through text-lg text-[var(--color-muted)]">
                ₹
                {
                  product.originalPrice
                }
              </span>
            )}

            {product?.discountText && (
              <span className="bg-[var(--color-secondary)] text-white text-sm font-semibold px-3 py-1 rounded-full">
                {
                  product.discountText
                }
              </span>
            )}
          </div>

          {/* Cart */}

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
                  onClick={() =>
                    addItem(
                      product.id,
                      1
                    )
                  }
                  className={`mt-2 w-full text-sm ${available_qty ===
                    0
                    ? "cursor-not-allowed text-gray-600"
                    : ""
                    }`}
                  disabled={
                    available_qty ===
                    0
                  }
                >
                  {available_qty ===
                    0
                    ? "Out of Stock"
                    : "Add to Cart"}
                </button>
              ) : (
                <div className="flex items-center justify-between w-full px-6">
                  <button
                    onClick={() =>
                      addItem(
                        product.id,
                        -1
                      )
                    }
                    className="text-2xl px-3 hover:scale-110 transition-transform"
                  >
                    −
                  </button>

                  <span className="text-lg font-bold">
                    {
                      cartQty
                    }
                  </span>

                  <button
                    onClick={() =>
                      addItem(
                        product.id,
                        1
                      )
                    }
                    className="text-2xl px-3 hover:scale-110 transition-transform"
                  >
                    +
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Description */}

          {product.description && (
            <div className="pt-4 border-t">
              <h3 className="font-semibold text-[var(--color-primary)] mb-2">
                Description
              </h3>

              <p className="text-sm text-[var(--color-muted)] leading-relaxed">
                {
                  product.description
                }
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}