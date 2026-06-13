import ProductCard from "../product/ProductCard";
import { cartStore } from "../../store/cart.store";
import { useAiRecommendation } from "../../store/aiRecommendation.store";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function AiPackageResult() {

    const navigate = useNavigate();
    const { response } = useAiRecommendation();
    const [packageItems, setPackageItems] = useState<any[]>([]);
    const [packageAdded, setPackageAdded] = useState(false);
    const [additionalItems, setAdditionalItems] =
        useState<any[]>([]);
    const addItem = cartStore(
        (s) => s.addItem
    );

    const removeItem = cartStore(
        (s) => s.removeItem
    );

    const items = cartStore(
        (s) => s.items
    );

    if (
        !response?.recommendedPackage
    ) {
        return null;
    }

    const addPackageToCart = () => {
        if (packageItems.length === 0) {
            return;
        }
        packageItems.forEach(
            (item: any) => {

                const existingQty =
                    items[item.id] || 0;

                const requiredQty =
                    Number(item.qty);

                const diff =
                    requiredQty -
                    existingQty;

                if (diff > 0) {

                    addItem(
                        item.id,
                        diff
                    );

                }

            }
        );

        setPackageAdded(true);
    };

    const totalAmount =
        packageItems.reduce(
            (sum, item) =>
                sum +
                (Number(item.price) *
                    Number(item.qty)),
            0
        );


    const totalItems = packageItems.length;
    const totalQuantity =
        packageItems.reduce(
            (sum, item) =>
                sum + Number(item.qty),
            0
        );


    useEffect(() => {

        if (!response) {
            return;
        }

        setPackageItems(
            response.recommendedPackage?.items || []
        );

        setAdditionalItems(
            response.additionalProducts || []
        );

        setPackageAdded(false);

    }, [response]);

    const increaseQty = (
        productId: string
    ) => {

        setPackageItems(prev =>
            prev.map(item =>
                item.id === productId
                    ? {
                        ...item,
                        qty:
                            item.qty + 1,
                    }
                    : item
            )
        );
    };

    const decreaseQty = (
        productId: string
    ) => {

        setPackageItems(prev =>
            prev.map(item => {

                if (
                    item.id !== productId
                ) {
                    return item;
                }

                return {
                    ...item,
                    qty: Math.max(
                        1,
                        item.qty - 1
                    ),
                };

            })
        );
    };

    const addToPackage = (
        product: any
    ) => {

        const exists =
            packageItems.some(
                item =>
                    item.id === product.id
            );

        if (exists) {
            return;
        }

        setPackageItems(prev => [
            ...prev,
            {
                ...product,
                qty: 1,
            },
        ]);

        setPackageAdded(false);
        setAdditionalItems(prev =>
            prev.filter(
                item =>
                    item.id !== product.id
            )
        );
    };
    const removeFromPackage = (
        productId: string
    ) => {

        const removed = packageItems.find(
            item =>
                item.id === productId
        );

        if (!removed) {
            return;
        }

        setPackageItems(prev =>
            prev.filter(
                item => item.id !== productId
            )
        );
        setPackageAdded(false);
        setAdditionalItems(prev => {

            const exists =
                prev.some(
                    item =>
                        item.id === removed.id
                );

            if (exists) {
                return prev;
            }

            return [
                {
                    ...removed,
                    qty: 1,
                    isAdditional: true,
                },
                ...prev,
            ];

        });
    };

    return (
        <div className="space-y-6">

            {packageItems.length > 0 && (

                <div className="rounded-xl bg-green-50 border border-green-200 p-4">

                    <h3 className="text-lg font-semibold text-green-700">
                        AI Recommended Package
                    </h3>

                    <div className="mt-2 text-sm text-gray-700">

                        <p>
                            Total Amount:
                            <span className="font-semibold ml-1">
                                ₹{totalAmount}
                            </span>
                        </p>

                        <p>
                            Products:
                            <span className="font-semibold ml-1">
                                {totalItems}
                            </span>
                        </p>

                        <p>
                            Total Quantity:
                            <span className="font-semibold ml-1">
                                {totalQuantity}
                            </span>
                        </p>
                    </div>

                </div>

            )}

            <div>
                <div>

                    <h3 className="text-lg font-semibold mb-4">
                        Package Preview
                    </h3>

                    {packageItems.length === 0 ? (

                        <div
                            className="
                            rounded-xl
                            border-2
                            border-dashed
                            p-8
                            text-center
                            text-gray-500
                            bg-gray-50
                                "
                        >
                            No products selected.
                            Add products from Additional Products.
                        </div>

                    ) : (


                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">

                            {packageItems.map((product: any) => {

                                const qty = items[product.id] || 0;

                                return (

                                    <div
                                        key={product.id}
                                        className="
                    bg-white
                    border
                    rounded-xl
                    overflow-hidden
                    shadow-sm
                    flex
                    flex-col
                    h-full
                "
                                    >


                                        <div
                                            className="
                                                p-3
                                                border-b
                                                bg-gray-50
                                            "
                                        >

                                            <div className="flex justify-between items-center">

                                                <span className="text-sm font-medium">
                                                    Qty
                                                </span>

                                                <button
                                                    onClick={() =>
                                                        removeFromPackage(
                                                            product.id
                                                        )
                                                    }
                                                    className="
                                                        text-red-500
                                                        text-sm sm:text-xs
                                                        hover:underline
                                                        px-2 py-1
                                                        rounded
                                                        hover:bg-red-50
                                                    "
                                                >
                                                    Remove
                                                </button>

                                            </div>

                                            <div className="flex items-center gap-2 mt-2">

                                                <button
                                                    onClick={() =>
                                                        decreaseQty(product.id)
                                                    }
                                                    disabled={
                                                        product.qty <= 1
                                                    }
                                                    className="
                                                        w-10 h-10 sm:w-8 sm:h-8
                                                        border
                                                        rounded-md
                                                        flex items-center justify-center
                                                        text-lg sm:text-base
                                                        hover:bg-gray-100
                                                        transition-colors
                                                    "
                                                >
                                                    -
                                                </button>

                                                <span className="font-semibold min-w-[40px] sm:min-w-[30px] text-center text-lg">
                                                    {product.qty}
                                                </span>

                                                <button
                                                    onClick={() =>
                                                        increaseQty(product.id)
                                                    }
                                                    className="
                                                    w-10 h-10 sm:w-8 sm:h-8
                                                    border
                                                    rounded-md
                                                    flex items-center justify-center
                                                    text-lg sm:text-base
                                                    hover:bg-gray-100
                                                    transition-colors
                                                "
                                                >
                                                    +
                                                </button>

                                            </div>

                                        </div>

                                        <div className="flex-1">

                                            <ProductCard
                                                product={product}
                                                quantityInCart={qty}
                                                onAddToCart={() =>
                                                    addItem(product.id, 1)
                                                }
                                                onIncrease={() =>
                                                    addItem(product.id, 1)
                                                }
                                                onDecrease={() => {

                                                    if (qty === 1) {
                                                        removeItem(product.id);
                                                    } else {
                                                        addItem(
                                                            product.id,
                                                            -1
                                                        );
                                                    }

                                                }}
                                                hideCartControls
                                            />

                                        </div>

                                    </div>

                                );

                            })}

                        </div>

                    )}

                </div>

            </div>

            <div
                className="
                    sticky
                    bottom-0
                    bg-white
                    border-t
                    p-3 sm:p-4
                    rounded-xl
                    shadow-lg
                    left-0 right-0
                "
            >

                <div
                    className="
                        flex
                        flex-col
                        md:flex-row
                        md:items-center
                        md:justify-between
                        gap-3 sm:gap-4
                    "
                >

                    <div className="flex-1">

                        <div className="font-semibold text-base sm:text-lg">
                            Total Amount: ₹{totalAmount}
                        </div>

                        <div className="text-xs sm:text-sm text-gray-500">
                            {totalItems} Products
                        </div>

                    </div>

                    {!packageAdded ? (

                        <button
                            onClick={addPackageToCart}
                            className="
                            w-full md:w-auto
                            px-4 sm:px-6
                            py-3 sm:py-3
                            rounded-lg
                            bg-[var(--color-primary)]
                            text-white
                            font-medium
                            text-sm sm:text-base
                            hover:opacity-90
                            transition-opacity
                        "
                        >
                            Add Package To Cart
                        </button>

                    ) : (

                        <button
                            onClick={() =>
                                navigate("/cart")
                            }
                            className="
                            w-full md:w-auto
                            px-4 sm:px-6
                            py-3 sm:py-3
                            rounded-lg
                            bg-green-600
                            text-white
                            font-medium
                            text-sm sm:text-base
                            hover:opacity-90
                            transition-opacity
                        "
                        >
                            View Cart
                        </button>

                    )}

                </div>

            </div>

            {additionalItems.length > 0 && (

                <div>

                    <h3 className="text-lg font-semibold mb-4">
                        You May Also Like
                    </h3>

                    <div
                        className="
                            grid
                            grid-cols-1
                            sm:grid-cols-2
                            lg:grid-cols-4
                            gap-6
                        "
                    >

                        {additionalItems.map(
                            (
                                product: any
                            ) => {

                                const qty =
                                    items[
                                    product.id
                                    ] || 0;

                                return (
                                    <div
                                        key={product.id}
                                        className="
                                        flex
                                        flex-col
                                        h-full
                                        "
                                    >
                                        <div className="mb-2">

                                            <button
                                                onClick={() =>
                                                    addToPackage(
                                                        product
                                                    )
                                                }
                                                className="
                                                    w-full
                                                    py-2.5 sm:py-2
                                                    px-2
                                                    rounded-lg
                                                    bg-[var(--color-primary)]
                                                    text-white
                                                    text-xs sm:text-sm
                                                    font-medium
                                                    hover:opacity-90
                                                    transition-opacity
                                                "
                                            >
                                                Add To Package
                                            </button>

                                        </div>
                                        <ProductCard
                                            key={
                                                product.id
                                            }
                                            product={{
                                                ...product,
                                            }}
                                            quantityInCart={
                                                qty
                                            }
                                            onAddToCart={() =>
                                                addItem(
                                                    product.id,
                                                    1
                                                )
                                            }
                                            onIncrease={() =>
                                                addItem(
                                                    product.id,
                                                    1
                                                )
                                            }
                                            onDecrease={() => {

                                                if (
                                                    qty === 1
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
                                            hideCartControls
                                        />
                                    </div>
                                );

                            }
                        )}

                    </div>

                </div>

            )}

        </div>
    );
}