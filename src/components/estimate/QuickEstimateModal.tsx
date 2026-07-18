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
import Icon from "../../assets/icon-new.png";
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
        const doc = new jsPDF({
            orientation: "portrait",
            unit: "mm",
            format: "a4",
            compress: true,
        });
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);

        const LEFT = 12;
        const RIGHT = 198;

        const COLORS = {
            primary: [15, 23, 42] as [number, number, number],
            border: [225, 225, 225] as [number, number, number],
            alternate: [249, 249, 249] as [number, number, number],
            success: [22, 163, 74] as [number, number, number],
            warning: [245, 158, 11] as [number, number, number],
            warningBg: [255, 248, 235] as [number, number, number],
            gray: [110, 110, 110] as [number, number, number],
            dark: [45, 45, 45] as [number, number, number],
        };

        const formatMoney = (amount: number) =>
            `Rs. ${amount.toLocaleString("en-IN")}`;

        const text = (
            value: string,
            x: number,
            y: number,
            options?: any
        ) => doc.text(value, x, y, options);

        const line = (y: number) => {
            doc.setDrawColor(...COLORS.border);
            doc.line(LEFT, y, RIGHT, y);
        };

        let y = 10;
        doc.addImage(Icon, "PNG", LEFT, y - 1, 14, 14);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(18);
        doc.setTextColor(0);

        text("SIVAKASI PYRO PARK", LEFT + 17, y + 4);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(...COLORS.gray);

        text(
            "Premium Fireworks & Crackers",
            LEFT + 17,
            y + 9
        );

        const boxX = 138;
        const boxY = 8;
        const boxW = 60;
        const boxH = 16;

        doc.setFillColor(...COLORS.warningBg);
        doc.setDrawColor(...COLORS.warning);
        doc.roundedRect(
            boxX,
            boxY,
            boxW,
            boxH,
            2,
            2,
            "FD"
        );

        doc.setFont("helvetica", "bold");
        doc.setFontSize(8.5);
        doc.setTextColor(146, 64, 14);

        text("IMPORTANT", boxX + 2.5, boxY + 4);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7);
        doc.setTextColor(...COLORS.dark);

        text("No Home Delivery", boxX + 2.5, boxY + 8);
        text("Transportation fee should be paid by customer", boxX + 2.5, boxY + 11.5);
        text("MIN: TN - 3000 | Other - 5000 | North - 10,000", boxX + 2.5, boxY + 15);


        y = 26;
        doc.setFontSize(7.5);
        doc.setTextColor(...COLORS.dark);

        if (config?.displayMobile) {
            text(config.displayMobile, LEFT, y);
            y += 4;
        }

        if (config?.adminEmail) {
            text(config.adminEmail, LEFT, y);
            y += 4;
        }

        if (config?.adminAddress) {
            const address = doc.splitTextToSize(
                config.adminAddress,
                175
            );

            text(address, LEFT, y);

            y += address.length * 3.4;
        }

        y += 2;

        line(y);
        y += 5;

        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        doc.setTextColor(0);
        text("CUSTOMER", LEFT, y);
        y += 5;


        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);

        text(customer.customerName, LEFT, y);
        y += 4;

        text(customer.mobile, LEFT, y);
        y += 4;

        if (customer.email?.trim()) {
            const email = doc.splitTextToSize(
                customer.email.trim(),
                175
            );

            text(email, LEFT, y);

            y += email.length * 3.4;
        }

        y += 2;


        line(y);

        const tableStartY = y + 3;

        autoTable(doc, {

            startY: tableStartY,

            head: [[
                "Product",
                "Qty",
                "MRP",
                "Offer",
                "Total"
            ]],

            body: products.map((product) => [

                product.isComboPackage
                    ? `${product.name}  • Combo`
                    : product.name,

                String(product.quantity),
                product.originalPrice ? formatMoney(product.originalPrice) : "-",
                formatMoney(product.price),
                formatMoney(
                    product.price * product.quantity
                ),
            ]),
            theme: "grid",

            tableLineWidth: 0,

            styles: {
                font: "helvetica",
                fontStyle: "normal",
                fontSize: 8,
                overflow: "linebreak",
                cellPadding: {
                    top: 1.2,
                    bottom: 1.2,
                    left: 2.2,
                    right: 2.2,
                },
                minCellHeight: 6,
                lineWidth: 0.08,
                lineColor: COLORS.border,
                valign: "middle",
                textColor: COLORS.dark,
            },

            alternateRowStyles: {
                fillColor: COLORS.alternate,
            },
            headStyles: {
                font: "helvetica",
                fontStyle: "bold",
                fontSize: 8,
                fillColor: COLORS.primary,
                textColor: [255, 255, 255],
                halign: "center",
                valign: "middle",
                cellPadding: {
                    top: 2,
                    bottom: 2,
                    left: 2,
                    right: 2,
                },
            },

            columnStyles: {
                0: {
                    cellWidth: 88,
                    halign: "left",
                },

                1: {
                    cellWidth: 14,
                    halign: "center",
                },

                2: {
                    cellWidth: 26,
                    halign: "right",
                },

                3: {
                    cellWidth: 28,
                    halign: "right",
                },

                4: {
                    cellWidth: 30,
                    halign: "right",
                },
            },

            didParseCell: (data) => {

                if (data.section === "head") {

                    data.cell.styles.lineColor = COLORS.primary;

                    return;
                }


                if (
                    data.section === "body" &&
                    data.column.index === 0
                ) {

                    const product = products[data.row.index];

                    if (product?.isComboPackage) {

                        data.cell.styles.fontStyle = "bold";

                        data.cell.styles.textColor = [
                            25,
                            70,
                            140,
                        ];
                    }
                }

                //-----------------------------------------
                // MRP
                //-----------------------------------------

                if (
                    data.section === "body" &&
                    data.column.index === 2
                ) {

                    data.cell.styles.textColor = [
                        120,
                        120,
                        120,
                    ];

                    data.cell.styles.fillColor = [
                        248,
                        248,
                        248,
                    ];
                }

                //-----------------------------------------
                // Offer Price
                //-----------------------------------------

                if (
                    data.section === "body" &&
                    data.column.index === 3
                ) {

                    data.cell.styles.fontStyle = "bold";

                    data.cell.styles.textColor =
                        COLORS.primary;
                }


                if (
                    data.section === "body" &&
                    data.column.index === 4
                ) {

                    data.cell.styles.fontStyle = "bold";

                    data.cell.styles.textColor =
                        COLORS.primary;
                }
            },
        });
        const summaryStartY =
            (doc as any).lastAutoTable.finalY + 2;
        const summaryWidth = RIGHT - LEFT;

        doc.setFillColor(...COLORS.primary);

        doc.rect(
            LEFT,
            summaryStartY,
            summaryWidth,
            6,
            "F"
        );

        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.setTextColor(255);

        text(
            "Estimate Summary",
            LEFT + summaryWidth / 2,
            summaryStartY + 4,
            {
                align: "center",
            }
        );
        doc.setTextColor(0);

        const summaryRows: string[][] = [

            [
                "Products",
                String(products.length),
            ],

            [
                "Quantity",
                String(totalQty),
            ],

            [
                "MRP Total",
                formatMoney(originalTotal),
            ],

            [
                "Discount",
                "- " + formatMoney(savings),
            ],

            [
                "Sub Total",
                formatMoney(totalAmount),
            ],
        ];

        if (comboAmount > 0) {

            summaryRows.push([
                "Combo Amount (No GST & Packaging)",
                formatMoney(comboAmount),
            ]);

            summaryRows.push([
                "GST Eligible",
                formatMoney(
                    eligibleChargeAmount
                ),
            ]);
        }

        if (
            packagingPercent > 0 &&
            packagingCharge > 0
        ) {

            summaryRows.push([
                `Packaging (${packagingPercent}%)`,
                formatMoney(packagingCharge),
            ]);
        }

        if (
            gstPercent > 0 &&
            gstAmount > 0
        ) {

            summaryRows.push([
                `GST (${gstPercent}%)`,
                formatMoney(gstAmount),
            ]);
        }

        summaryRows.push([
            "Grand Total",
            formatMoney(grandTotal),
        ]);
        autoTable(doc, {
            startY: summaryStartY,
            theme: "plain",

            head: [[
                {
                    content: "Estimate Summary",
                    colSpan: 2,
                    styles: {
                        halign: "center",
                        fillColor: COLORS.primary,
                        textColor: [255, 255, 255],
                        fontStyle: "bold",
                        fontSize: 9,
                        lineWidth: 0,
                    },
                },
            ]],

            body: summaryRows,

            styles: {
                font: "helvetica",
                fontSize: 8,
                overflow: "linebreak",

                cellPadding: {
                    top: 1.3,
                    bottom: 1.3,
                    left: 3,
                    right: 3,
                },

                minCellHeight: 6,
                lineWidth: 0.08,

                lineColor: COLORS.border,
            },

            columnStyles: {

                0: {
                    cellWidth: 62,
                    fontStyle: "bold",
                },

                1: {
                    cellWidth: 124,
                    halign: "right",
                },
            },
            didParseCell: (data) => {

                if (data.section !== "body") return;

                const label =
                    summaryRows[data.row.index][0];


                if (label === "Discount") {

                    data.cell.styles.textColor =
                        COLORS.success;

                    data.cell.styles.fontStyle = "bold";
                }

                if (label === "Combo Amount") {

                    data.cell.styles.fillColor = [
                        247,
                        249,
                        255,
                    ];
                }

                if (label === "GST Eligible") {

                    data.cell.styles.fillColor = [
                        252,
                        252,
                        252,
                    ];
                }

                if (label === "Grand Total") {

                    data.cell.styles.fillColor =
                        COLORS.primary;

                    data.cell.styles.textColor = [
                        255,
                        255,
                        255,
                    ];
                    data.cell.styles.font = "helvetica";
                    data.cell.styles.fontStyle = "bold";

                    data.cell.styles.fontSize = 10;
                }
            },
        });

        let footerY =
            (doc as any).lastAutoTable.finalY + 6;

        line(footerY);

        footerY += 5;

        doc.setFont("helvetica", "normal");

        doc.setFontSize(7.5);

        doc.setTextColor(...COLORS.gray);

        if (comboAmount > 0) {

            text(
                "GST & Packaging charges are calculated only for eligible products.",
                LEFT,
                footerY
            );

            footerY += 4;

        } else {

            const notes: string[] = [];

            if (
                packagingPercent > 0 &&
                packagingCharge > 0
            ) {

                notes.push(
                    `Packaging (${packagingPercent}%) Included`
                );
            }

            if (
                gstPercent > 0 &&
                gstAmount > 0
            ) {

                notes.push(
                    `GST (${gstPercent}%) Included`
                );
            }

            if (notes.length > 0) {

                text(
                    notes.join("   •   "),
                    LEFT,
                    footerY
                );

                footerY += 4;
            }
        }

        text(
            "Estimate only. Final billing depends on stock availability.",
            LEFT,
            footerY
        );

        footerY += 4;

        doc.setFont("helvetica", "bold");

        doc.setFontSize(8);

        doc.setTextColor(...COLORS.primary);

        text(
            "Thank you for choosing Sivakasi Pyro Park!",
            LEFT,
            footerY
        );

        footerY += 5;

        doc.setFont("helvetica", "normal");

        doc.setFontSize(7);

        doc.setTextColor(...COLORS.gray);

        const generatedDate =
            new Date().toLocaleString("en-IN", {
                dateStyle: "medium",
                timeStyle: "short",
            });

        text(
            `Generated : ${generatedDate}`,
            LEFT,
            footerY
        );

        const pageCount = doc.getNumberOfPages();
        for (let page = 1; page <= pageCount; page++) {

            doc.setPage(page);

            const pageHeight =
                doc.internal.pageSize.getHeight();

            doc.setDrawColor(...COLORS.border);

            doc.line(
                LEFT,
                pageHeight - 8,
                RIGHT,
                pageHeight - 8
            );

            doc.setFont("helvetica", "normal");

            doc.setFontSize(7);

            doc.setTextColor(...COLORS.gray);

            text(
                `Page ${page} of ${pageCount}`,
                RIGHT,
                pageHeight - 4,
                {
                    align: "right",
                }
            );
        }

        const pdfBlob = doc.output("blob");
        const arrayBuffer = doc.output("arraybuffer");
        const bytes = new Uint8Array(arrayBuffer);
        let binary = "";

        for (const byte of bytes) {
            binary += String.fromCharCode(byte);
        }

        const pdfBase64 = btoa(binary);

        doc.save(
            `quick-estimate-${Date.now()}.pdf`
        );

        return {

            pdfBlob,

            pdfBase64,
        };
    };




    useEffect(() => {
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

        if (downloading) return;
        setDownloading(true);

        await new Promise((resolve) => setTimeout(resolve, 50));
        setShowDownloadDialog(false);

        try {
            await new Promise((resolve) =>
                requestAnimationFrame(resolve)
            );

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
                            Customers must collect their parcel from the designated transport office/service point by paying transporation.
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
                                <div className="flex items-center gap-2">
                                    <span>Combo Package Amount</span>
                                    <span className="rounded bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-700">
                                        No GST & Packaging
                                    </span>
                                </div>

                                <span>₹{comboAmount.toLocaleString()}</span>
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
                            disabled={isEstimateEmpty || downloading}
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
                                disabled={isEstimateEmpty || downloading}
                                onClick={() => setShowDownloadDialog(true)}
                                className="h-11 whitespace-nowrap"
                            >
                                {downloading ? "Generating PDF..." : "Download PDF"}
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
                {downloading && (
                    <div className="fixed inset-0 z-[99999] bg-black/30 backdrop-blur-sm flex items-center justify-center">

                        <div className="bg-white rounded-2xl shadow-2xl px-8 py-6 flex flex-col items-center">

                            <svg
                                className="h-10 w-10 animate-spin text-[var(--color-accent)]"
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                            >
                                <circle
                                    className="opacity-20"
                                    cx="12"
                                    cy="12"
                                    r="10"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                />

                                <path
                                    className="opacity-100"
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                                />
                            </svg>

                            <p className="mt-4 text-lg font-semibold">
                                Generating Estimate...
                            </p>

                            <p className="mt-1 text-sm text-gray-500">
                                Please wait...
                            </p>

                        </div>

                    </div>
                )}
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