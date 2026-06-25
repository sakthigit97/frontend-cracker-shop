import Button from "../ui/Button";
import { quickEstimateStore } from "../../store/quickEstimate.store";
import { cartStore } from "../../store/cart.store";
import { useQuickEstimateProducts } from "../../hooks/useQuickEstimateProducts";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useMemo } from "react";
import { useConfigStore } from "../../store/config.store";
import { calculateOrderAmounts } from "../../utils/pricing";

interface Props {
    open: boolean;
    onClose: () => void;
}

export default function QuickEstimateModal({
    open,
    onClose,
}: Props) {
    const { products } = useQuickEstimateProducts();

    const isEstimateEmpty = products.length === 0;
    const addItem = quickEstimateStore((s) => s.addItem);

    const removeItem = quickEstimateStore((s) => s.removeItem);

    const clear = quickEstimateStore((s) => s.clear);

    const cartAdd = cartStore((s) => s.addItem);

    const config = useConfigStore((s) => s.config);

    const packagingPercent = config?.packagingPercent ?? 0;

    const gstPercent = config?.gstPercent ?? 0;

    const originalTotal = products.reduce(
        (sum, p) => sum + (p.originalPrice || p.price) * p.quantity,
        0
    );

    const totalAmount = products.reduce((sum, p) => sum + p.price * p.quantity, 0);

    const { packagingCharge, gstAmount, grandTotal } = useMemo(
        () =>
            calculateOrderAmounts({
                totalAmount,
                packagingPercent,
                gstPercent,
                state: "Tamil Nadu",
                config,
            }),
        [totalAmount, packagingPercent, gstPercent, config]
    );

    const savings = originalTotal - totalAmount;

    const totalQty = products.reduce((sum, p) => sum + p.quantity, 0);

    const addAllToCart = () => {
        products.forEach((product) => {
            cartAdd(product.id, product.quantity);
        });
        clear();
        onClose();
    };

    const downloadPdf = () => {
        const doc = new jsPDF();
        const formatMoney = (amount: number) => `Rs. ${amount.toLocaleString("en-IN")}`;

        doc.setFont("helvetica", "bold");
        doc.setFontSize(22);

        doc.text(
            "SIVAKASI PYRO PARK",
            14,
            18
        );

        doc.setFont("helvetica", "normal");
        doc.setFontSize(13);

        doc.text(
            "Quick Estimate Summary",
            14,
            27
        );

        doc.setFontSize(10);

        doc.setTextColor(90);

        doc.text(
            "Mobile : +91 " + config?.adminMobile,
            14,
            34
        );

        doc.text(
            "Email : +91 " + config?.adminEmail,
            120,
            34
        );

        doc.setDrawColor(220);
        doc.line(
            14,
            40,
            196,
            40
        );

        autoTable(doc, {
            startY: 42,

            head: [["Product", "Qty", "MRP", "Offer Price", "Amount"]],

            body: products.map((product) => [
                product.name,

                String(product.quantity),

                product.originalPrice ? formatMoney(product.originalPrice) : "-",

                formatMoney(product.price),

                formatMoney(product.price * product.quantity),
            ]),

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
                    cellWidth: 72,
                },

                1: {
                    cellWidth: 16,
                    halign: "center",
                },

                2: {
                    cellWidth: 28,
                    halign: "right",
                },

                3: {
                    cellWidth: 34,
                    halign: "right",
                },

                4: {
                    cellWidth: 38,
                    halign: "right",
                },
            },

            didParseCell: (data) => {
                if (data.section === "body" && data.column.index === 2) {
                    data.cell.styles.fillColor = [245, 245, 245];

                    data.cell.styles.textColor = [120, 120, 120];
                }

                if (data.section === "body" && data.column.index === 3) {
                    data.cell.styles.fontStyle = "bold";

                    data.cell.styles.textColor = [15, 23, 42];
                }

                if (data.section === "body" && data.column.index === 4) {
                    data.cell.styles.fontStyle = "bold";
                }
            },
        });

        const finalY = (doc as any).lastAutoTable.finalY + 10;

        doc.setFont("helvetica", "bold");

        doc.setFontSize(13);

        doc.text("Estimate Summary", 14, finalY);

        const summaryRows: string[][] = [
            ["Products", String(products.length)],

            ["Quantity", String(totalQty)],

            ["MRP Total", formatMoney(originalTotal)],

            ["Discount", formatMoney(savings)],

            ["Sub Total", formatMoney(totalAmount)],
        ];

        if (packagingPercent > 0 && packagingCharge > 0) {
            summaryRows.push([
                `Packaging (${packagingPercent}%)`,

                formatMoney(packagingCharge),
            ]);
        }

        if (gstPercent > 0 && gstAmount > 0) {
            summaryRows.push([`GST (${gstPercent}%)`, formatMoney(gstAmount)]);
        }

        summaryRows.push(["Grand Total", formatMoney(grandTotal)]);

        autoTable(doc, {
            startY: finalY + 4,

            theme: "grid",

            body: summaryRows,

            styles: {
                fontSize: 11,

                cellPadding: 3,
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
                if (data.section !== "body") return;

                if (summaryRows[data.row.index]?.[0] === "Discount") {
                    data.cell.styles.textColor = [22, 163, 74];
                    data.cell.styles.fontStyle = "bold";
                }

                if (summaryRows[data.row.index]?.[0] === "Grand Total") {
                    data.cell.styles.fillColor = [15, 23, 42];
                    data.cell.styles.textColor = [255, 255, 255];
                    data.cell.styles.fontStyle = "bold";
                    data.cell.styles.fontSize = 12;
                }
            },
        });

        const summaryEndY = (doc as any).lastAutoTable.finalY + 12;

        const generatedDate = new Date().toLocaleString("en-IN", {
            dateStyle: "medium",
            timeStyle: "short",
        });

        doc.setFont("helvetica", "normal");

        doc.setFontSize(10);

        doc.setTextColor(100);

        doc.text(`Generated On : ${generatedDate}`, 14, summaryEndY);

        let footerY = summaryEndY + 8;

        if (packagingPercent > 0) {
            doc.text(`Packaging Charges (${packagingPercent}%) Included`, 14, footerY);

            footerY += 6;
        }

        if (gstPercent > 0) {
            doc.text(`GST (${gstPercent}%) Included`, 14, footerY);
            footerY += 6;
        }

        doc.text(
            "This estimate is for reference only. Prices are subject to stock availability.",
            14,
            footerY
        );

        footerY += 6;
        doc.setFont("helvetica", "bold");
        doc.setTextColor(15, 23, 42);
        doc.text("Thank you for choosing Sivakasi Pyro Park!", 14, footerY);
        doc.save(`quick-estimate-${Date.now()}.pdf`);
    };

    if (!open) {
        return null;
    }

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
            onClick={onClose}
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
                    onClick={(e) => e.stopPropagation()}
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
                    <div className="flex justify-between">
                        <span>Products</span>
                        <span>{products.length}</span>
                    </div>

                    <div className="flex justify-between">
                        <span>Quantity</span>
                        <span>{totalQty}</span>
                    </div>

                    <div className="flex justify-between">
                        <span>MRP Total</span>
                        <span>₹{originalTotal.toLocaleString()}</span>
                    </div>

                    <div className="flex justify-between text-green-600">
                        <span>Discount</span>
                        <span>- ₹{savings.toLocaleString()}</span>
                    </div>

                    <div className="flex justify-between">
                        <span>Sub Total</span>
                        <span>₹{totalAmount.toLocaleString()}</span>
                    </div>

                    {packagingPercent > 0 && packagingCharge > 0 && (
                        <div className="flex justify-between">
                            <span>Packaging ({packagingPercent}%)</span>
                            <span>₹{(packagingCharge)}</span>
                        </div>
                    )}

                    {gstPercent > 0 && gstAmount > 0 && (
                        <div className="flex justify-between">
                            <span>GST ({gstPercent}%)</span>
                            <span>₹{(gstAmount)}</span>
                        </div>
                    )}

                    <div className="border-t pt-3 flex justify-between font-bold text-xl">
                        <span>Grand Total</span>

                        <span>
                            ₹{grandTotal.toLocaleString()}
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