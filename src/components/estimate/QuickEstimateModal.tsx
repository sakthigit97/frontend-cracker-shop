import Button from "../ui/Button";
import { quickEstimateStore } from "../../store/quickEstimate.store";
import { cartStore } from "../../store/cart.store";
import { useQuickEstimateProducts } from "../../hooks/useQuickEstimateProducts";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface Props {
    open: boolean;
    onClose: () => void;
}


export default function QuickEstimateModal({
    open,
    onClose,
}: Props) {

    const {
        products,
    } =
        useQuickEstimateProducts();

    const isEstimateEmpty = products.length === 0;
    const addItem =
        quickEstimateStore(
            (s) => s.addItem
        );

    const removeItem =
        quickEstimateStore(
            (s) => s.removeItem
        );

    const clear =
        quickEstimateStore(
            (s) => s.clear
        );

    const cartAdd =
        cartStore(
            (s) => s.addItem
        );

    if (!open) {
        return null;
    }

    const originalTotal =
        products.reduce(
            (sum, p) =>
                sum +
                (
                    (
                        p.originalPrice ||
                        p.price
                    ) *
                    p.quantity
                ),
            0
        );

    const finalTotal =
        products.reduce(
            (sum, p) =>
                sum +
                (
                    p.price *
                    p.quantity
                ),
            0
        );

    const savings =
        originalTotal -
        finalTotal;

    const totalQty =
        products.reduce(
            (sum, p) =>
                sum +
                p.quantity,
            0
        );

    const addAllToCart =
        () => {

            products.forEach(
                (
                    product
                ) => {

                    cartAdd(
                        product.id,
                        product.quantity
                    );
                }
            );
            clear();
            onClose();
        };

    const downloadPdf = () => {

        const doc = new jsPDF();

        const formatMoney = (amount: number) =>
            `Rs. ${amount.toLocaleString("en-IN")}`;

        // HEADER

        doc.setFont("helvetica", "bold");
        doc.setFontSize(22);

        doc.text(
            "SIVAKASI PYRO PARK",
            14,
            20
        );

        doc.setFont("helvetica", "normal");
        doc.setFontSize(14);

        doc.text(
            "Quick Estimate Summary",
            14,
            30
        );

        doc.setDrawColor(220);
        doc.line(
            14,
            36,
            196,
            36
        );

        // PRODUCT TABLE

        autoTable(doc, {
            startY: 42,

            head: [[
                "Product",
                "Qty",
                "Price",
                "Amount"
            ]],

            body: products.map(
                (product) => [

                    product.name,

                    String(
                        product.quantity
                    ),

                    formatMoney(
                        product.price
                    ),

                    formatMoney(
                        product.price *
                        product.quantity
                    )
                ]
            ),

            theme: "striped",

            headStyles: {
                fillColor: [15, 23, 42],
                textColor: 255,
                fontStyle: "bold",
                halign: "center",
            },

            bodyStyles: {
                fontSize: 10,
            },

            columnStyles: {
                0: {
                    cellWidth: 90,
                },
                1: {
                    halign: "center",
                    cellWidth: 20,
                },
                2: {
                    halign: "right",
                    cellWidth: 35,
                },
                3: {
                    halign: "right",
                    cellWidth: 35,
                },
            },
        });

        const finalY =
            (doc as any)
                .lastAutoTable
                .finalY + 10;

        // SUMMARY TITLE

        doc.setFont(
            "helvetica",
            "bold"
        );

        doc.setFontSize(13);

        doc.text(
            "Estimate Summary",
            14,
            finalY
        );

        // SUMMARY TABLE

        autoTable(doc, {
            startY: finalY + 4,

            theme: "grid",

            body: [
                [
                    "Products",
                    String(
                        products.length
                    ),
                ],

                [
                    "Quantity",
                    String(
                        totalQty
                    ),
                ],

                [
                    "MRP Total",
                    formatMoney(
                        originalTotal
                    ),
                ],

                [
                    "Savings",
                    formatMoney(
                        savings
                    ),
                ],

                [
                    "Final Total",
                    formatMoney(
                        finalTotal
                    ),
                ],
            ],

            styles: {
                fontSize: 11,
            },

            columnStyles: {
                0: {
                    fontStyle: "bold",
                    cellWidth: 70,
                },

                1: {
                    halign: "right",
                },
            },

            didParseCell: (data) => {

                if (
                    data.row.index === 4
                ) {
                    data.cell.styles.fontStyle =
                        "bold";

                    data.cell.styles.fontSize =
                        13;
                }

                if (
                    data.row.index === 3
                ) {
                    data.cell.styles.textColor =
                        [34, 139, 34];
                }
            },
        });

        const summaryEndY =
            (doc as any)
                .lastAutoTable
                .finalY + 15;

        // FOOTER

        const generatedDate =
            new Date()
                .toLocaleString(
                    "en-IN",
                    {
                        dateStyle:
                            "medium",
                        timeStyle:
                            "short",
                    }
                );

        doc.setFont(
            "helvetica",
            "normal"
        );

        doc.setFontSize(10);

        doc.setTextColor(
            100
        );

        doc.text(
            `Generated On: ${generatedDate}`,
            14,
            summaryEndY
        );

        doc.text(
            "This estimate is for reference only. Prices are subject to stock availability.",
            14,
            summaryEndY + 8
        );

        doc.save(
            `quick-estimate-${Date.now()}.pdf`
        );
    };

    return (
        <div
            className="
                fixed
                inset-0
                bg-black/50
                z-50
                flex
                justify-end
            "
        >
            <div
                className="
                    bg-white
                    w-full
                    md:w-[450px]
                    h-full
                    overflow-y-auto
                    flex
                    flex-col
                "
            >

                <div
                    className="
                        p-4
                        border-b
                        flex
                        justify-between
                    "
                >
                    <h2
                        className="
                            font-semibold
                            text-lg
                        "
                    >
                        Quick Estimate
                    </h2>

                    <button
                        onClick={
                            onClose
                        }
                    >
                        ✕
                    </button>
                </div>

                <div
                    className="
                        flex-1
                        divide-y
                    "
                >

                    {products.map(
                        (
                            product
                        ) => (

                            <div
                                key={
                                    product.id
                                }
                                className="
                                    p-4
                                    flex
                                    gap-3
                                "
                            >
                                <img
                                    src={
                                        product.image
                                    }
                                    className="
                                        w-16
                                        h-16
                                        object-contain
                                    "
                                />

                                <div
                                    className="
                                        flex-1
                                    "
                                >
                                    <p
                                        className="
                                            font-medium
                                        "
                                    >
                                        {
                                            product.name
                                        }
                                    </p>

                                    <div
                                        className="
                                            flex
                                            gap-2
                                            items-center
                                        "
                                    >
                                        <span>
                                            ₹
                                            {
                                                product.price
                                            }
                                        </span>

                                        {product.originalPrice && (
                                            <span
                                                className="
                                                    text-sm
                                                    line-through
                                                    text-gray-400
                                                "
                                            >
                                                ₹
                                                {
                                                    product.originalPrice
                                                }
                                            </span>
                                        )}
                                    </div>

                                    <div
                                        className="
                                            mt-2
                                            flex
                                            items-center
                                            gap-2
                                        "
                                    >
                                        <button
                                            onClick={() =>
                                                product.quantity ===
                                                    1
                                                    ? removeItem(
                                                        product.id
                                                    )
                                                    : addItem(
                                                        product.id,
                                                        -1
                                                    )
                                            }
                                        >
                                            −
                                        </button>

                                        <span>
                                            {
                                                product.quantity
                                            }
                                        </span>

                                        <button
                                            onClick={() =>
                                                addItem(
                                                    product.id,
                                                    1
                                                )
                                            }
                                        >
                                            +
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )
                    )}
                </div>

                <div
                    className="
                        border-t
                        p-4
                        space-y-2
                    "
                >
                    <div
                        className="
                            flex
                            justify-between
                        "
                    >
                        <span>
                            Products
                        </span>

                        <span>
                            {
                                products.length
                            }
                        </span>
                    </div>

                    <div
                        className="
                            flex
                            justify-between
                        "
                    >
                        <span>
                            Quantity
                        </span>

                        <span>
                            {
                                totalQty
                            }
                        </span>
                    </div>

                    <div
                        className="
                            flex
                            justify-between
                        "
                    >
                        <span>
                            MRP Total
                        </span>

                        <span>
                            ₹
                            {
                                originalTotal.toLocaleString()
                            }
                        </span>
                    </div>

                    <div
                        className="
                            flex
                            justify-between
                            text-green-600
                        "
                    >
                        <span>
                            Savings
                        </span>

                        <span>
                            ₹
                            {
                                savings.toLocaleString()
                            }
                        </span>
                    </div>

                    <div
                        className="
                            flex
                            justify-between
                            font-bold
                            text-lg
                        "
                    >
                        <span>
                            Final Total
                        </span>

                        <span>
                            ₹
                            {
                                finalTotal.toLocaleString()
                            }
                        </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-5">

                        <Button
                            variant="outline"
                            onClick={downloadPdf}
                            disabled={isEstimateEmpty}
                            className="h-12 md:h-16 col-span-2 md:col-span-1"
                        >
                            Download PDF
                        </Button>

                        <Button
                            variant="outline"
                            onClick={clear}
                            className="h-12 md:h-16 col-span-2 md:col-span-1"
                        >
                            Clear
                        </Button>

                        <Button
                            onClick={addAllToCart}
                            disabled={isEstimateEmpty}
                            className="
                                h-12 md:h-16
                                col-span-2 md:col-span-1
                                bg-[var(--color-accent)]
                                text-[var(--color-primary)]
                                "
                        >
                            Add All To Cart
                        </Button>

                    </div>
                </div>

            </div>
        </div>
    );
}