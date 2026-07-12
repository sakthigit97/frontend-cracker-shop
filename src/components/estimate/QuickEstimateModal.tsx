import Button from "../ui/Button";
import { quickEstimateStore } from "../../store/quickEstimate.store";
import { cartStore } from "../../store/cart.store";
import { useQuickEstimateProducts } from "../../hooks/useQuickEstimateProducts";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useMemo, useEffect, useState } from "react";
import { useConfigStore } from "../../store/config.store";
import { calculateOrderAmounts } from "../../utils/pricing";
import defaultImage from "../../assets/default-image.png";
import { calculateOrderPricingBreakdown } from "../../utils/orderPricing";
import EstimateDownloadDialog from "./EstimateDownloadDialog";
import { apiFetch } from "../../services/api";

interface Props {
    open: boolean;
    onClose: () => void;
}

export default function QuickEstimateModal({
    open,
    onClose,
}: Props) {
    const { products } = useQuickEstimateProducts();

    const addItem = quickEstimateStore((s) => s.addItem);
    const removeItem = quickEstimateStore((s) => s.removeItem);
    const clear = quickEstimateStore((s) => s.clear);
    const cartAdd = cartStore((s) => s.addItem);
    const config = useConfigStore((s) => s.config);
    const isEstimateEmailSend = config?.isEstimateEmailEnabled || false;
    const packagingPercent = config?.packagingPercent ?? 0;
    const gstPercent = config?.gstPercent ?? 0;
    const originalTotal = products.reduce(
        (sum, p) => sum + (p.originalPrice || p.price) * p.quantity,
        0
    );
    const [showDownloadDialog, setShowDownloadDialog] = useState(false);
    const [downloading, setDownloading] = useState(false);

    const pricingBreakdown = useMemo(
        () => calculateOrderPricingBreakdown(products),
        [products]
    );

    const totalAmount = pricingBreakdown.subtotal;
    const {
        eligibleChargeAmount,
        comboAmount,
    } = pricingBreakdown;

    const {
        packagingCharge,
        gstAmount,
        grandTotal,
    } = useMemo(
        () =>
            calculateOrderAmounts({
                totalAmount,
                chargeableAmount: eligibleChargeAmount,
                packagingPercent,
                gstPercent,
                state: "Tamil Nadu",
                config,
            }),
        [
            totalAmount,
            eligibleChargeAmount,
            packagingPercent,
            gstPercent,
            config,
        ]
    );
    const savings = originalTotal - totalAmount;
    const totalQty = products.reduce(
        (sum, p) => sum + Math.max(0, Number(p.quantity) || 0),
        0
    );
    const isEstimateEmpty = totalQty === 0;
    const addAllToCart = () => {
        products.forEach((product) => {
            cartAdd(product.id, product.quantity);
        });
        clear();
        onClose();
    };

    const downloadPdf = (customer: {
        customerName: string;
        mobile: string;
        email?: string;
    }) => {
        const doc = new jsPDF();
        const formatMoney = (amount: number) => `Rs. ${amount.toLocaleString("en-IN")}`;

        doc.setFont("helvetica", "bold");
        doc.setFontSize(18);
        doc.text("SIVAKASI PYRO PARK", 14, 16);


        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        let infoY = 28;

        // IMPORTANT NOTICE (Right Side)
        const noticeX = 118;
        const noticeY = 22;
        const noticeWidth = 78;
        const noticeHeight = 24;

        doc.setFillColor(255, 248, 230);
        doc.setDrawColor(245, 158, 11);
        doc.roundedRect(
            noticeX,
            noticeY,
            noticeWidth,
            noticeHeight,
            2,
            2,
            "FD"
        );

        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.setTextColor(146, 64, 14);
        doc.text("IMPORTANT", noticeX + 3, noticeY + 5);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(7.5);
        doc.setTextColor(70);

        doc.text(
            "No Home Delivery",
            noticeX + 3,
            noticeY + 10
        );

        doc.text(
            "Transport Office Pickup",
            noticeX + 3,
            noticeY + 14
        );

        doc.text(
            "Min Order: TN 3K | Other 5K | North 10K",
            noticeX + 3,
            noticeY + 18
        );


        if (config?.adminMobile) {
            doc.text(`Mobile : +91 ${config.adminMobile}`, 14, infoY);
            infoY += 4;
        }

        if (config?.adminEmail) {
            doc.text(`Email   : ${config.adminEmail}`, 14, infoY);
            infoY += 4;
        }

        if (config?.adminAddress) {
            doc.text(`Address : ${config.adminAddress}`, 14, infoY);
            infoY += 4;
        }

        infoY += 4;

        doc.setFont("helvetica", "bold");
        doc.text("Customer", 14, infoY);

        infoY += 5;

        doc.setFont("helvetica", "normal");
        doc.text(`Name    : ${customer.customerName}`, 14, infoY);

        infoY += 4;

        doc.text(`Mobile  : ${customer.mobile}`, 14, infoY);

        if (customer.email) {
            infoY += 4;
            doc.text(`Email   : ${customer.email}`, 14, infoY);
        }

        infoY += 3;
        doc.line(14, infoY + 2, 196, infoY + 2);


        autoTable(doc, {
            startY: infoY + 6,

            head: [["Product", "Qty", "MRP", "Offer Price", "Total"]],

            body: products.map((product) => [
                product.isComboPackage
                    ? `${product.name}\n(Combo Package)`
                    : product.name,

                String(product.quantity),

                product.originalPrice ? formatMoney(product.originalPrice) : "-",

                formatMoney(product.price),

                formatMoney(product.price * product.quantity),
            ]),

            theme: "grid",

            tableLineWidth: 0,

            alternateRowStyles: {
                fillColor: [250, 250, 250],
            },

            styles: {
                lineWidth: 0.08,
                lineColor: [235, 235, 235],
            },

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
                    cellWidth: 80,
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
                    cellWidth: 30,
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

                    // Remove the extra right border
                    data.cell.styles.lineWidth = {
                        top: 0.08,
                        left: 0.08,
                        bottom: 0.08,
                        right: 0,
                    };
                }

                // Remove the extra header border too
                if (data.section === "head" && data.column.index === 4) {
                    data.cell.styles.lineWidth = {
                        top: 0.08,
                        left: 0.08,
                        bottom: 0.08,
                        right: 0,
                    };
                }
            },
        });

        const finalY = (doc as any).lastAutoTable.finalY + 10;

        doc.setFont("helvetica", "bold");

        doc.setFontSize(13);
        doc.setFillColor(15, 23, 42);
        doc.rect(14, finalY - 5, 70, 8, "F");

        doc.setTextColor(255);
        doc.setFont("helvetica", "bold");
        doc.text("Estimate Summary", 17, finalY);

        doc.setTextColor(0);

        const summaryRows: string[][] = [
            ["Products", String(products.length)],

            ["Quantity", String(totalQty)],

            ["MRP Total", formatMoney(originalTotal)],

            ["Discount", formatMoney(savings)],

            ["Sub Total", formatMoney(totalAmount)],

        ];
        if (comboAmount > 0) {
            summaryRows.push([
                "Combo Package Amount",
                formatMoney(comboAmount),
            ]);

            summaryRows.push([
                "Chargeable Amount",
                formatMoney(eligibleChargeAmount),
            ]);
        }

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

        const generatedDate = new Date().toLocaleString("en-IN", {
            dateStyle: "medium",
            timeStyle: "short",
        });

        const summaryEndY = (doc as any).lastAutoTable.finalY + 12;

        let footerY = summaryEndY;

        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.setTextColor(100);

        doc.text(`Generated On : ${generatedDate}`, 14, footerY);
        footerY += 8;


        if (comboAmount > 0) {
            doc.text(
                `GST and Packaging charges are calculated only on eligible products.`,
                14,
                footerY
            );
            footerY += 6;
        } else {
            if (packagingPercent > 0) {
                doc.text(
                    `Packaging Charges (${packagingPercent}%) Included`,
                    14,
                    footerY
                );
                footerY += 6;
            }

            if (gstPercent > 0) {
                doc.text(
                    `GST (${gstPercent}%) Included`,
                    14,
                    footerY
                );
                footerY += 6;
            }
        }

        doc.text(
            "This quotation is an estimate only. Final billing is subject to stock availability.",
            14,
            footerY
        );

        footerY += 6;
        doc.setFont("helvetica", "bold");
        doc.setTextColor(15, 23, 42);
        doc.text("Thank you for choosing Sivakasi Pyro Park!", 14, footerY);
        const pageCount = doc.getNumberOfPages();

        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);

            doc.setFontSize(9);
            doc.setTextColor(120);
            const pageHeight = doc.internal.pageSize.getHeight();

            doc.text(
                `Page ${i} of ${pageCount}`,
                196,
                pageHeight - 6,
                { align: "right" }
            );
        }
        const pdfBlob = doc.output("blob");

        const arrayBuffer = doc.output("arraybuffer");

        const bytes = new Uint8Array(arrayBuffer);

        let binary = "";

        bytes.forEach((b) => {
            binary += String.fromCharCode(b);
        });

        const pdfBase64 = btoa(binary);

        doc.save(`quick-estimate-${Date.now()}.pdf`);

        return {
            pdfBlob,
            pdfBase64,
        };
    }; useEffect(() => {
        if (!open) return;

        const html = document.documentElement;
        const body = document.body;

        const htmlOverflow = html.style.overflow;
        const bodyOverflow = body.style.overflow;

        html.style.overflow = "hidden";
        body.style.overflow = "hidden";

        return () => {
            html.style.overflow = htmlOverflow;
            body.style.overflow = bodyOverflow;
        };
    }, [open]);

    if (!open) {
        return null;
    }
    const handleDownload = async (customer: {
        customerName: string;
        mobile: string;
        email?: string;
    }) => {
        try {
            setDownloading(true);
            setShowDownloadDialog(false);

            const { pdfBase64 } = downloadPdf(customer);
            if (isEstimateEmailSend) {
                await apiFetch("/estimates/email", {
                    method: "POST",
                    body: JSON.stringify({
                        customerName: customer.customerName,
                        mobile: customer.mobile,
                        pdfBase64,
                    }),
                });
            }

            setShowDownloadDialog(false);
        } finally {
            setDownloading(false);
        }
    };

    return (
        <div
            className="
            fixed
            top-0
            left-0
            w-screen
            h-screen
            z-[9999]
            bg-slate-900/65
            backdrop-blur-sm
            flex
            justify-end
            "
            onClick={onClose}
        >
            <div
                className="
                relative
                bg-white
                w-full
                md:w-[460px]
                h-screen
                max-h-screen
                overflow-y-auto
                flex
                flex-col
                shadow-2xl
                "
                onClick={(e) => e.stopPropagation()}
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
                <div className="mx-4 mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
                    <div className="font-semibold text-amber-900 mb-2">
                        ⚠ Important Information
                    </div>

                    <ul className="space-y-2 text-sm text-amber-800 list-disc pl-5">
                        <li>
                            Home delivery is not available. Orders will be dispatched via a
                            registered transport service.
                        </li>

                        <li>
                            Customers must collect their parcel from the designated transport
                            office/service point.
                        </li>

                        <li>
                            <strong>Minimum Order Value:</strong>
                            <ul className="list-disc pl-5 mt-1">
                                <li>Tamil Nadu – ₹3,000</li>
                                <li>Other States – ₹5,000</li>
                                <li>Northern States – ₹10,000</li>
                            </ul>
                        </li>
                    </ul>
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
                                        product.image || defaultImage
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

                    {comboAmount > 0 && (
                        <>
                            <div className="flex justify-between">
                                <span>Combo Package Amount</span>
                                <span>₹{comboAmount.toLocaleString()}</span>
                            </div>

                            <div className="flex justify-between">
                                <span>GST / Packaging Eligible Amount</span>
                                <span>₹{eligibleChargeAmount.toLocaleString()}</span>
                            </div>
                        </>
                    )}

                    {packagingPercent > 0 && packagingCharge > 0 && (
                        <div className="flex justify-between">
                            <span>
                                {comboAmount > 0
                                    ? `Packaging (${packagingPercent}% - Eligible Items)`
                                    : `Packaging (${packagingPercent}%)`}
                            </span>
                            <span>₹{(packagingCharge)}</span>
                        </div>
                    )}

                    {gstPercent > 0 && gstAmount > 0 && (
                        <div className="flex justify-between">
                            <span>
                                {comboAmount > 0
                                    ? `GST (${gstPercent}% - Eligible Items)`
                                    : `GST (${gstPercent}%)`}
                            </span>
                            <span>₹{(gstAmount)}</span>
                        </div>
                    )}

                    <div className="border-t pt-3 flex justify-between font-bold text-xl">
                        <span>Grand Total</span>

                        <span>
                            ₹{grandTotal.toLocaleString()}
                        </span>
                    </div>
                    <div className="mt-5 space-y-3">

                        <Button
                            onClick={addAllToCart}
                            disabled={isEstimateEmpty}
                            className="
                                w-full
                                h-12
                                bg-[var(--color-accent)]
                                text-[var(--color-primary)]
                            "
                        >
                            Add All To Cart
                        </Button>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

                            <Button
                                variant="outline"
                                disabled={isEstimateEmpty}
                                onClick={() => setShowDownloadDialog(true)}
                                className="h-11 whitespace-nowrap"
                            >
                                Download PDF
                            </Button>

                            <Button
                                variant="outline"
                                onClick={clear}
                                className="h-11"
                            >
                                Clear
                            </Button>

                        </div>

                    </div>
                </div>
            </div>
            <div onClick={(e) => e.stopPropagation()}>
                <EstimateDownloadDialog
                    open={showDownloadDialog}
                    loading={downloading}
                    onClose={() => setShowDownloadDialog(false)}
                    onDownload={handleDownload}
                />
            </div>
        </div>
    );
}