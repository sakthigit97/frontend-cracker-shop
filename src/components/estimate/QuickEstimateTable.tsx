import { quickEstimateStore } from "../../store/quickEstimate.store";
import type { Product } from "../../types/product";
import QuickEstimateTableRow from "./QuickEstimateTableRow";
import defaultImage from "../../assets/default-image.png";

interface Props {
    products: Product[];
}

export default function QuickEstimateTable({
    products,
}: Props) {

    const items = quickEstimateStore((s) => s.items);
    const addItem = quickEstimateStore((s) => s.addItem);
    const removeItem = quickEstimateStore((s) => s.removeItem);

    return (

        <div className="w-full">
            <div className="hidden lg:block overflow-x-auto rounded-xl border bg-white shadow-sm">

                <table className="w-full">

                    <thead>

                        <tr className="bg-[var(--color-primary)] text-white">

                            <th className="text-left p-4 w-24">
                                Image
                            </th>

                            <th className="text-left p-4">
                                Product
                            </th>

                            <th className="text-center p-4 w-28">
                                MRP
                            </th>

                            <th className="text-center p-4 w-28">
                                Price
                            </th>

                            <th className="text-center p-4 w-48">
                                Quantity
                            </th>

                            <th className="text-right p-4 w-32">
                                Total
                            </th>

                        </tr>

                    </thead>

                    <tbody>

                        {products.map((product) => {

                            const qty =
                                items[product.id] || 0;

                            return (

                                <QuickEstimateTableRow
                                    key={product.id}
                                    product={product}
                                    quantity={qty}
                                    onIncrease={() =>
                                        addItem(product.id, 1)
                                    }
                                    onDecrease={() => {

                                        if (qty <= 1)
                                            removeItem(product.id);
                                        else
                                            addItem(product.id, -1);

                                    }}
                                    onChange={(newQty) => {

                                        if (newQty <= 0) {
                                            removeItem(product.id);
                                            return;
                                        }

                                        const diff =
                                            newQty - qty;

                                        addItem(product.id, diff);

                                    }}
                                />

                            );

                        })}

                    </tbody>

                </table>

            </div>
            <div className="lg:hidden space-y-3">

                {products.map((product) => {

                    const qty =
                        items[product.id] || 0;

                    return (

                        <div
                            key={product.id}
                            className="
                                bg-white
                                rounded-xl
                                border
                                shadow-sm
                                p-3
                            "
                        >

                            <div className="flex gap-3">

                                <img
                                    src={product.image || defaultImage}
                                    className="h-14 w-14 object-contain border rounded-md"
                                />

                                <div className="flex-1">

                                    <div className="font-semibold text-sm">

                                        {product.name}

                                    </div>

                                    <div className="mt-1">

                                        <span className="font-bold">

                                            ₹{product.price}

                                        </span>

                                        {product.originalPrice && (

                                            <span className="ml-2 text-xs line-through text-gray-400">

                                                ₹{product.originalPrice}

                                            </span>

                                        )}

                                    </div>

                                </div>

                            </div>

                            <div className="flex justify-between items-center mt-3">

                                <div
                                    className="
                                        inline-flex
                                        border
                                        rounded-lg
                                        overflow-hidden
                                    "
                                >

                                    <button
                                        className="w-10 h-10 bg-gray-100"
                                        onClick={() => {

                                            if (qty <= 1)
                                                removeItem(product.id);
                                            else
                                                addItem(product.id, -1);

                                        }}
                                    >
                                        −
                                    </button>

                                    <input
                                        className="w-12 text-center border-x"
                                        value={qty}
                                        onChange={(e) => {

                                            const value =
                                                Number(
                                                    e.target.value
                                                );

                                            if (
                                                Number.isNaN(value)
                                            )
                                                return;

                                            if (value <= 0) {

                                                removeItem(product.id);

                                                return;
                                            }

                                            addItem(
                                                product.id,
                                                value - qty
                                            );

                                        }}
                                    />

                                    <button
                                        className="
                                            w-10
                                            h-10
                                            bg-[var(--color-primary)]
                                            text-white
                                        "
                                        onClick={() =>
                                            addItem(product.id, 1)
                                        }
                                    >
                                        +
                                    </button>

                                </div>

                                <div className="font-bold">

                                    ₹{product.price * qty}

                                </div>

                            </div>

                        </div>

                    );

                })}

            </div>
        </div>
    );

}