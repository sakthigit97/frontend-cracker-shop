import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    FaArrowLeft,
    FaClock,
    FaFire,
    FaSearch,
    FaShoppingCart,
    FaTag,
} from "react-icons/fa";

import { useFlashSaleStore } from "../store/flashSale.store";
import { useHomeProducts } from "../store/homeProduct.store";
import { cartStore } from "../store/cart.store";

export default function FlashSales() {
    const navigate = useNavigate();

    const {
        flashSales,
        loading: flashSalesLoading,
        fetchActive: fetchActiveFlashSales,
    } = useFlashSaleStore();

    const {
        products,
        loading: productsLoading,
        fetchAll,
    } = useHomeProducts();

    const items = cartStore((s) => s.items);
    const addItem = cartStore((s) => s.addItem);
    const removeItem = cartStore((s) => s.removeItem);

    const [now, setNow] = useState(Date.now());
    const [search, setSearch] = useState("");

    /*
     * Load the same data already used by Home.
     */
    useEffect(() => {
        fetchActiveFlashSales();
        fetchAll();
    }, []);

    /*
     * Live countdown.
     */
    useEffect(() => {
        const timer = window.setInterval(() => {
            setNow(Date.now());
        }, 1000);

        return () => {
            window.clearInterval(timer);
        };
    }, []);

    /*
     * Match FlashSale.productId with the existing
     * product list.
     */
    const deals = useMemo(() => {
        if (
            flashSales.length === 0 ||
            products.length === 0
        ) {
            return [];
        }

        const productMap = new Map(
            products.map((product) => [
                product.id,
                product,
            ])
        );

        return flashSales
            .map((sale) => {
                const product = productMap.get(
                    sale.productId
                );

                if (!product) {
                    return null;
                }

                const remaining =
                    new Date(sale.endAt).getTime() - now;

                /*
                 * Never show expired sales even if the store
                 * still contains an old response.
                 */
                if (remaining <= 0) {
                    return null;
                }

                return {
                    sale,
                    product,
                };
            })
            .filter(
                (
                    item
                ): item is NonNullable<typeof item> =>
                    item !== null
            );
    }, [flashSales, products, now]);

    /*
     * Search.
     */
    const filteredDeals = useMemo(() => {
        const query = search
            .trim()
            .toLowerCase();

        if (!query) {
            return deals;
        }

        return deals.filter(({ sale, product }) => {
            return (
                sale.header
                    ?.toLowerCase()
                    .includes(query) ||
                product.name
                    ?.toLowerCase()
                    .includes(query)
            );
        });
    }, [deals, search]);

    /*
     * Countdown formatter.
     */
    const getCountdown = (endAt: string) => {
        const difference =
            new Date(endAt).getTime() - now;

        if (difference <= 0) {
            return "SALE ENDED";
        }

        const totalSeconds = Math.floor(
            difference / 1000
        );

        const days = Math.floor(
            totalSeconds / 86400
        );

        const hours = Math.floor(
            (totalSeconds % 86400) / 3600
        );

        const minutes = Math.floor(
            (totalSeconds % 3600) / 60
        );

        const seconds =
            totalSeconds % 60;

        const pad = (value: number) =>
            String(value).padStart(2, "0");

        if (days > 0) {
            return `${days}d ${pad(hours)}h ${pad(
                minutes
            )}m`;
        }

        return `${pad(hours)}:${pad(
            minutes
        )}:${pad(seconds)}`;
    };

    /*
     * Currency.
     */
    const formatCurrency = (value: number) =>
        `₹${Number(value || 0).toLocaleString(
            "en-IN"
        )}`;

    const isLoading =
        flashSalesLoading ||
        productsLoading;

    return (
        <div className="min-h-screen bg-[#fffaf4]">
            <div className="mx-auto max-w-7xl px-3 py-5 sm:px-5 sm:py-7 lg:px-6">


                <div className="mb-5">
                    <button
                        type="button"
                        onClick={() => navigate(-1)}
                        className="
              mb-4
              inline-flex
              items-center
              gap-2
              rounded-lg
              px-2
              py-1.5
              text-xs
              font-medium
              text-gray-600
              transition
              hover:bg-white
              hover:text-[var(--color-primary)]
            "
                    >
                        <FaArrowLeft className="text-[10px]" />
                        Back
                    </button>

                    <div
                        className="
              overflow-hidden
              rounded-2xl
              border
              border-orange-100
              bg-gradient-to-br
              from-[#fff7ed]
              via-white
              to-[#fffaf4]
              shadow-[0_4px_18px_rgba(0,0,0,0.04)]
            "
                    >
                        <div className="flex flex-col gap-4 px-4 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">

                            <div className="flex items-center gap-3">
                                <div
                                    className="
                    flex
                    h-11
                    w-11
                    shrink-0
                    items-center
                    justify-center
                    rounded-xl
                    bg-orange-100
                    text-[var(--color-primary)]
                  "
                                >
                                    <FaFire className="text-lg" />
                                </div>

                                <div>
                                    <div className="flex items-center gap-2">
                                        <h1
                                            className="
                        text-xl
                        font-bold
                        tracking-tight
                        text-gray-900
                        sm:text-2xl
                      "
                                        >
                                            Flash Deals
                                        </h1>

                                        <span
                                            className="
                        hidden
                        rounded-full
                        border
                        border-orange-200
                        bg-white
                        px-2
                        py-0.5
                        text-[9px]
                        font-bold
                        uppercase
                        tracking-wide
                        text-orange-600
                        sm:inline-flex
                      "
                                        >
                                            Limited Time
                                        </span>
                                    </div>

                                    <p className="mt-1 text-xs text-gray-500 sm:text-sm">
                                        Grab special prices before these deals end.
                                    </p>
                                </div>
                            </div>

                            {/* Search */}
                            <div className="relative w-full sm:w-64">
                                <FaSearch
                                    className="
                    absolute
                    left-3
                    top-1/2
                    -translate-y-1/2
                    text-xs
                    text-gray-400
                  "
                                />

                                <input
                                    type="text"
                                    value={search}
                                    onChange={(e) =>
                                        setSearch(e.target.value)
                                    }
                                    placeholder="Search flash deals..."
                                    className="
                    w-full
                    rounded-xl
                    border
                    border-orange-100
                    bg-white
                    py-2.5
                    pl-9
                    pr-3
                    text-xs
                    outline-none
                    transition
                    focus:border-orange-300
                    focus:ring-2
                    focus:ring-orange-100
                  "
                                />
                            </div>
                        </div>
                    </div>
                </div>


                {isLoading && (
                    <div
                        className="
                            grid
                            grid-cols-1
                            gap-4
                            sm:grid-cols-2
                            lg:grid-cols-3
                            xl:grid-cols-4
                            "
                    >
                        {Array.from({ length: 8 }).map(
                            (_, index) => (
                                <div
                                    key={index}
                                    className="
                                        h-[390px]
                                        animate-pulse
                                        rounded-2xl
                                        border
                                        border-orange-100
                                        bg-white
                                    "
                                />
                            )
                        )}
                    </div>
                )}


                {!isLoading &&
                    filteredDeals.length === 0 && (
                        <div
                            className="
                                rounded-2xl
                                border
                                border-orange-100
                                bg-white
                                px-5
                                py-16
                                text-center
                            "
                        >
                            <div
                                className="
                                    mx-auto
                                    flex
                                    h-14
                                    w-14
                                    items-center
                                    justify-center
                                    rounded-full
                                    bg-orange-50
                                    text-orange-400
                                    "
                            >
                                <FaTag />
                            </div>

                            <h2 className="mt-4 text-lg font-bold text-gray-800">
                                No flash deals available
                            </h2>

                            <p className="mt-1 text-sm text-gray-500">
                                Check back soon for new limited-time offers.
                            </p>

                            {search && (
                                <button
                                    type="button"
                                    onClick={() => setSearch("")}
                                    className="
                                        mt-4
                                        text-xs
                                        font-semibold
                                        text-[var(--color-primary)]
                                        hover:underline
                                    "
                                >
                                    Clear search
                                </button>
                            )}
                        </div>
                    )}

                {!isLoading &&
                    filteredDeals.length > 0 && (
                        <div
                            className="
                                grid
                                grid-cols-1
                                gap-4
                                sm:grid-cols-2
                                lg:grid-cols-3
                                xl:grid-cols-4
                            "
                        >
                            {filteredDeals.map(
                                ({ sale, product }) => {
                                    const quantity =
                                        items[product.id] || 0;

                                    const originalPrice =
                                        Number(
                                            sale.originalPrice
                                        );

                                    const salePrice =
                                        Number(
                                            sale.salePrice
                                        );

                                    const savings = Math.max(
                                        0,
                                        originalPrice -
                                        salePrice
                                    );

                                    const discount =
                                        originalPrice > 0
                                            ? Math.round(
                                                ((originalPrice -
                                                    salePrice) /
                                                    originalPrice) *
                                                100
                                            )
                                            : 0;

                                    return (
                                        <article
                                            key={sale.flashSaleId}
                                            className="
                                                group
                                                overflow-hidden
                                                rounded-2xl
                                                border
                                                border-orange-100
                                                bg-white
                                                shadow-[0_3px_12px_rgba(0,0,0,0.04)]
                                                transition-all
                                                duration-200
                                                hover:-translate-y-0.5
                                                hover:border-orange-200
                                                hover:shadow-[0_8px_22px_rgba(0,0,0,0.08)]
                                            "
                                        >
                                            {/* Image */}
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    navigate(
                                                        `/products/${product.id}`
                                                    )
                                                }
                                                className="
                          relative
                          block
                          h-52
                          w-full
                          overflow-hidden
                          bg-gradient-to-br
                          from-[#fffaf4]
                          to-[#fff1dc]
                        "
                                            >
                                                <img
                                                    src={sale.imageUrl}
                                                    alt={product.name}
                                                    className="
                            h-full
                            w-full
                            object-contain
                            px-7
                            py-5
                            transition-transform
                            duration-300
                            group-hover:scale-[1.04]
                          "
                                                />

                                                {discount > 0 && (
                                                    <span
                                                        className="
                              absolute
                              left-3
                              top-3
                              inline-flex
                              items-center
                              gap-1
                              rounded-full
                              bg-[var(--color-primary)]
                              px-2.5
                              py-1
                              text-[10px]
                              font-bold
                              text-white
                              shadow-sm
                            "
                                                    >
                                                        <FaFire className="text-[8px]" />
                                                        {discount}% OFF
                                                    </span>
                                                )}
                                            </button>

                                            {/* Details */}
                                            <div className="p-4">

                                                <div className="flex items-start justify-between gap-2">
                                                    <div className="min-w-0">
                                                        <h2
                                                            className="
                                line-clamp-1
                                text-base
                                font-bold
                                text-gray-900
                              "
                                                        >
                                                            {sale.header}
                                                        </h2>

                                                        <p
                                                            className="
                                mt-1
                                line-clamp-1
                                text-xs
                                font-medium
                                text-gray-500
                              "
                                                        >
                                                            {product.name}
                                                        </p>
                                                    </div>

                                                    <FaTag
                                                        className="
                              mt-1
                              shrink-0
                              text-xs
                              text-orange-300
                            "
                                                    />
                                                </div>

                                                {/* Price */}
                                                <div className="mt-3">
                                                    <div className="flex items-baseline gap-2">
                                                        <span
                                                            className="
                                text-2xl
                                font-extrabold
                                leading-none
                                text-[var(--color-primary)]
                              "
                                                        >
                                                            {formatCurrency(
                                                                salePrice
                                                            )}
                                                        </span>

                                                        {originalPrice >
                                                            salePrice && (
                                                                <span
                                                                    className="
                                  text-xs
                                  text-gray-400
                                  line-through
                                "
                                                                >
                                                                    {formatCurrency(
                                                                        originalPrice
                                                                    )}
                                                                </span>
                                                            )}
                                                    </div>

                                                    {savings > 0 && (
                                                        <p
                                                            className="
                                mt-1
                                text-[11px]
                                font-semibold
                                text-green-600
                              "
                                                        >
                                                            Save{" "}
                                                            {formatCurrency(
                                                                savings
                                                            )}
                                                        </p>
                                                    )}
                                                </div>

                                                {/* Countdown */}
                                                <div
                                                    className="
                            mt-3
                            flex
                            items-center
                            justify-between
                            rounded-xl
                            bg-orange-50
                            px-3
                            py-2
                          "
                                                >
                                                    <div
                                                        className="
                              flex
                              items-center
                              gap-1.5
                              text-[10px]
                              font-medium
                              text-gray-500
                            "
                                                    >
                                                        <FaClock
                                                            className="
                                text-[var(--color-primary)]
                              "
                                                        />
                                                        Ends in
                                                    </div>

                                                    <span
                                                        className="
                              font-mono
                              text-[11px]
                              font-bold
                              text-gray-800
                            "
                                                    >
                                                        {getCountdown(
                                                            sale.endAt
                                                        )}
                                                    </span>
                                                </div>

                                                {/* Cart */}
                                                <div className="mt-3">
                                                    {quantity === 0 ? (
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                addItem(
                                                                    product.id,
                                                                    1
                                                                )
                                                            }
                                                            className="
                                flex
                                w-full
                                items-center
                                justify-center
                                gap-2
                                rounded-xl
                                bg-[var(--color-primary)]
                                px-4
                                py-2.5
                                text-xs
                                font-semibold
                                text-white
                                transition
                                hover:brightness-105
                                active:scale-[0.99]
                              "
                                                        >
                                                            <FaShoppingCart className="text-[10px]" />
                                                            Add to Cart
                                                        </button>
                                                    ) : (
                                                        <div
                                                            className="
                                flex
                                h-10
                                items-center
                                justify-between
                                rounded-xl
                                border
                                border-gray-200
                                bg-gray-50
                                px-1
                              "
                                                        >
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    if (
                                                                        quantity ===
                                                                        1
                                                                    ) {
                                                                        removeItem(
                                                                            product.id
                                                                        );
                                                                    } else {
                                                                        addItem(
                                                                            product.id,
                                                                            -1
                                                                        );
                                                                    }
                                                                }}
                                                                className="
                                  flex
                                  h-8
                                  w-9
                                  items-center
                                  justify-center
                                  rounded-lg
                                  bg-white
                                  text-base
                                  font-semibold
                                  text-gray-600
                                  shadow-sm
                                "
                                                            >
                                                                −
                                                            </button>

                                                            <span
                                                                className="
                                  text-xs
                                  font-semibold
                                  text-gray-700
                                "
                                                            >
                                                                {quantity} in cart
                                                            </span>

                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    addItem(
                                                                        product.id,
                                                                        1
                                                                    )
                                                                }
                                                                className="
                                  flex
                                  h-8
                                  w-9
                                  items-center
                                  justify-center
                                  rounded-lg
                                  bg-[var(--color-primary)]
                                  text-base
                                  font-semibold
                                  text-white
                                "
                                                            >
                                                                +
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Product link */}
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        navigate(
                                                            `/products/${product.id}`
                                                        )
                                                    }
                                                    className="
                            mt-2
                            w-full
                            py-1
                            text-center
                            text-[11px]
                            font-medium
                            text-gray-500
                            transition
                            hover:text-[var(--color-primary)]
                          "
                                                >
                                                    View Product
                                                </button>
                                            </div>
                                        </article>
                                    );
                                }
                            )}
                        </div>
                    )}
            </div>
        </div>
    );
}