import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { PDF_THEME } from "../../utils/pdf/invoiceTheme";
import { getProductCounts } from "../../utils/productCounts";

import {
    money,
    line,
    text,
    formatStatus,
} from "../../utils/pdf/invoiceHelpers";
import Icon from "../../assets/icon-new.png";
import { formatDateTime } from "../date";

export async function buildInvoicePdf(
    order: any,
    config: any
) {
    const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
        compress: true,
    });

    const normal = () => doc.setFont("helvetica", "normal");
    const bold = () => doc.setFont("helvetica", "bold");

    normal();
    doc.setFontSize(8);

    const LEFT = PDF_THEME.LEFT;
    const RIGHT = PDF_THEME.RIGHT;
    const COLORS = PDF_THEME.colors;

    let y = 10;

    doc.addImage(
        Icon,
        "PNG",
        LEFT,
        y - 1,
        14,
        14
    );

    bold();
    doc.setFontSize(18);
    doc.setTextColor(0);

    const packagingPercent =
        config?.packagingPercent ?? 0;

    const gstPercent =
        config?.gstPercent ?? 0;

    text(
        doc,
        config?.companyName ||
        "SIVAKASI PYRO PARK",
        LEFT + 17,
        y + 4
    );

    normal();
    doc.setFontSize(8);
    doc.setTextColor(
        ...COLORS.gray
    );

    text(
        doc,
        "Premium Fireworks & Crackers",
        LEFT + 17,
        y + 9
    );

    const boxX = 138;
    const boxY = 8;
    const boxW = 60;
    const boxH = 16;

    doc.setFillColor(
        ...COLORS.warningBg
    );

    doc.setDrawColor(
        ...COLORS.warning
    );

    doc.roundedRect(
        boxX,
        boxY,
        boxW,
        boxH,
        2,
        2,
        "FD"
    );

    bold();

    doc.setFontSize(8.5);
    doc.setTextColor(
        146,
        64,
        14
    );

    text(
        doc,
        "IMPORTANT",
        boxX + 2.5,
        boxY + 4
    );

    normal();

    doc.setFontSize(7);
    doc.setTextColor(
        ...COLORS.dark
    );

    text(
        doc,
        "No Home Delivery",
        boxX + 2.5,
        boxY + 8
    );

    text(
        doc,
        "Transportation fee should be paid by customer",
        boxX + 2.5,
        boxY + 11.5
    );

    text(
        doc,
        "MIN: TN - 3000 | Other - 5000 | North - 10,000",
        boxX + 2.5,
        boxY + 15
    );

    y = 26;

    doc.setFontSize(7.5);
    doc.setTextColor(
        ...COLORS.dark
    );

    if (config?.displayMobile) {
        text(
            doc,
            config.displayMobile,
            LEFT,
            y
        );

        y += 4;
    }

    if (config?.adminEmail) {
        text(
            doc,
            config.adminEmail,
            LEFT,
            y
        );

        y += 4;
    }

    if (config?.website) {
        text(
            doc,
            config.website,
            LEFT,
            y
        );

        y += 4;
    }

    if (config?.adminAddress) {
        const address = doc.splitTextToSize(
            config.adminAddress,
            110
        );

        text(
            doc,
            address,
            LEFT,
            y
        );

        y += address.length * 3.4;
    }

    y += 2;

    line(doc, y);

    y += 5;

    bold();

    doc.setFontSize(8);
    doc.setTextColor(0);

    text(
        doc,
        `Invoice No : ${order.orderId}`,
        LEFT,
        y
    );

    const orderDate =
        formatDateTime(
            Number(order.updatedAt)
        );

    text(
        doc,
        `Order Date : ${orderDate}`,
        110,
        y
    );

    y += 4;

    text(
        doc,
        `Status : ${formatStatus(order.status)}`,
        LEFT,
        y
    );

    y += 6;

    line(
        doc,
        y
    );

    line(
        doc,
        y
    );

    y += 5;

    bold();

    doc.setFontSize(8);
    doc.setTextColor(0);

    text(
        doc,
        "CUSTOMER DETAILS",
        LEFT,
        y
    );

    y += 5;

    const customerLines =
        doc.splitTextToSize(
            (order.address ?? "").trim(),
            150
        );

    text(
        doc,
        customerLines,
        LEFT,
        y
    );

    y += customerLines.length * 3.8;

    y += 2;

    line(
        doc,
        y
    );

    y += 4;

    const invoiceItems =
        Array.isArray(order.items)
            ? [...order.items].sort(
                (a: any, b: any) => {
                    const aSequence =
                        Number(
                            a.sequenceNumber
                        );

                    const bSequence =
                        Number(
                            b.sequenceNumber
                        );

                    if (
                        Number.isFinite(
                            aSequence
                        ) &&
                        Number.isFinite(
                            bSequence
                        )
                    ) {
                        return (
                            aSequence -
                            bSequence
                        );
                    }

                    if (
                        Number.isFinite(
                            aSequence
                        )
                    ) {
                        return -1;
                    }

                    if (
                        Number.isFinite(
                            bSequence
                        )
                    ) {
                        return 1;
                    }

                    return 0;
                }
            )
            : [];

    const {
        totalCount,
        sparklerCount,
        otherCount,
    } = getProductCounts(
        invoiceItems,
        config?.sparklerCategory
    );

    const tableStartY = y;

    autoTable(doc, {
        startY: tableStartY,

        theme: "grid",

        tableLineWidth: 0,

        head: [[
            "Product",
            "Qty",
            "Unit",
            "MRP",
            "Discount",
            "Offer Price",
            "Total",
        ]],

        body: invoiceItems.map(
            (item: any) => {
                const packQuantity =
                    Number(
                        item.packQuantity
                    );

                const packUnit =
                    item.packUnit?.trim();

                const unitText =
                    packQuantity > 0 &&
                        packUnit
                        ? `${packQuantity} ${packUnit}`
                        : "-";

                const productName =
                    item.isComboPackage
                        ? `${item.name} • Combo`
                        : item.name;

                return [
                    productName,
                    String(item.quantity),
                    unitText,
                    item.isComboPackage
                        ? money(item.price)
                        : item.originalPrice
                            ? money(
                                item.originalPrice
                            )
                            : "-",

                    item.discountText ?? "-",
                    money(item.price),
                    money(item.total),
                ];
            }
        ),

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

            minCellHeight: 8,

            lineWidth: 0.08,

            lineColor:
                [80, 80, 80],

            valign: "middle",

            textColor:
                COLORS.dark,
        },

        alternateRowStyles: {
            fillColor:
                COLORS.alternate,
        },

        headStyles: {
            font: "helvetica",

            fontStyle: "bold",

            fontSize: 8,

            fillColor:
                COLORS.primary,

            textColor: [
                255,
                255,
                255,
            ],

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
                cellWidth: 55,
                halign: "left",
            },
            1: {
                cellWidth: 12,
                halign: "center",
            },
            2: {
                cellWidth: 20,
                halign: "center",
            },
            3: {
                cellWidth: 22,
                halign: "right",
            },
            4: {
                cellWidth: 22,
                halign: "center",
            },
            5: {
                cellWidth: 24,
                halign: "right",
            },
            6: {
                cellWidth: 25,
                halign: "right",
            },
        },

        didParseCell: (
            data
        ) => {
            if (
                data.section === "head"
            ) {
                data.cell.styles.lineColor =
                    COLORS.primary;

                return;
            }

            if (
                data.section === "body" &&
                data.column.index === 0
            ) {
                const item =
                    invoiceItems[
                    data.row.index
                    ];

                if (
                    item?.isComboPackage
                ) {
                    data.cell.styles.fontStyle =
                        "bold";

                    data.cell.styles.textColor = [
                        25,
                        70,
                        140,
                    ];
                }
            }

            if (
                data.section === "body" &&
                data.column.index === 3
            ) {
                const item =
                    invoiceItems[
                    data.row.index
                    ];

                data.cell.styles.textColor =
                    item?.isComboPackage
                        ? COLORS.dark
                        : [
                            120,
                            120,
                            120,
                        ];

                data.cell.styles.fillColor = [
                    248,
                    248,
                    248,
                ];

                if (
                    item?.isComboPackage
                ) {
                    data.cell.styles.fontStyle =
                        "bold";
                }
            }

            if (
                data.section === "body" &&
                data.column.index === 4
            ) {
                data.cell.styles.textColor = [
                    22,
                    163,
                    74,
                ];

                data.cell.styles.fontStyle =
                    "bold";

                data.cell.styles.halign =
                    "center";
            }

            if (
                data.section === "body" &&
                data.column.index === 5
            ) {
                data.cell.styles.fontStyle =
                    "bold";

                data.cell.styles.textColor =
                    COLORS.primary;
            }
            if (
                data.section === "body" &&
                data.column.index === 6
            ) {
                data.cell.styles.fontStyle =
                    "bold";

                data.cell.styles.textColor =
                    COLORS.primary;
            }
        },
    });
    let summaryStartY =
        (doc as any)
            .lastAutoTable
            .finalY + 2;

    const SUMMARY_WIDTH = 80;

    const SUMMARY_X =
        RIGHT - SUMMARY_WIDTH;

    bold();

    doc.setFontSize(9);

    summaryStartY += 10;

    text(
        doc,
        "Invoice Summary",
        SUMMARY_X,
        summaryStartY
    );

    summaryStartY += 5;

    const drawSummaryRow = (
        label: string,
        value: number | string,
        bold = false
    ) => {
        doc.setFont(
            "helvetica",
            bold
                ? "bold"
                : "normal"
        );

        text(
            doc,
            label,
            SUMMARY_X,
            summaryStartY
        );

        const displayValue =
            typeof value === "number"
                ? money(value)
                : String(
                    value ?? ""
                );

        text(
            doc,
            displayValue,
            RIGHT,
            summaryStartY,
            {
                align: "right",
            }
        );

        summaryStartY += 5;
    };

    /*
     * ============================================================
     * PRODUCT COUNTS
     * ============================================================
     */

    if (sparklerCount > 0) {
        drawSummaryRow(
            "Total Products",
            String(totalCount)
        );

        drawSummaryRow(
            "Sparklers",
            String(sparklerCount)
        );

        drawSummaryRow(
            "Other Products",
            String(otherCount)
        );
    } else {
        drawSummaryRow(
            "Total Products",
            String(totalCount)
        );
    }

    if (
        order.comboPackageTotal > 0
    ) {
        drawSummaryRow(
            "Combo Total (Incl. Packaging)",
            order.comboPackageTotal
        );
    }

    if (
        order.nonComboProductTotal > 0
    ) {
        drawSummaryRow(
            "Non Combo Total",
            order.nonComboProductTotal
        );
    }

    drawSummaryRow(
        "Product Total",
        order.totalProductAmount || 0
    );

    if (
        order.additionalDiscount > 0
    ) {
        let additionalDiscountLabel =
            "Additional Discount";

        if (
            order.additionalDiscountType === "PERCENTAGE"
        ) {
            additionalDiscountLabel =
                `Additional Discount (${order.additionalDiscountValue}%)`;
        } else if (
            order.additionalDiscountType === "FLAT"
        ) {
            additionalDiscountLabel =
                `Additional Discount (Flat Rs. ${order.additionalDiscountValue})`;
        }

        drawSummaryRow(
            additionalDiscountLabel,
            -Number(order.additionalDiscount)
        );
    }

    if (
        order.packagingCharge > 0
    ) {
        drawSummaryRow(
            `Packaging Charge (${packagingPercent}%)`,
            order.packagingCharge
        );
    }

    if (
        order.couponDiscount > 0
    ) {
        drawSummaryRow(
            "Amount Before Discount",
            order.amountBeforeDiscount
        );

        drawSummaryRow(
            "Coupon Discount",
            -order.couponDiscount
        );

        drawSummaryRow(
            "Amount After Discount",
            order.amountAfterDiscount
        );
    }

    if (
        order.gstAmount > 0
    ) {
        drawSummaryRow(
            `GST (${gstPercent}%)`,
            order.gstAmount
        );
    }

    drawSummaryRow(
        "Grand Total (Inclusive of All Charges)",
        order.grandTotal || 0
    );

    if (order.walletUsed > 0) {
        drawSummaryRow(
            "Wallet Used",
            -Number(order.walletUsed)
        );
    }

    if (order.chitAmount > 0) {
        drawSummaryRow(
            "Chit Balance Applied",
            -Number(order.chitAmount)
        );
    }

    doc.setDrawColor(
        ...COLORS.border
    );

    doc.line(
        SUMMARY_X,
        summaryStartY,
        RIGHT,
        summaryStartY
    );

    summaryStartY += 4;

    bold();

    doc.setFontSize(10);

    text(
        doc,
        "Final Payable",
        SUMMARY_X,
        summaryStartY
    );

    text(
        doc,
        money(order.finalPayable),
        RIGHT,
        summaryStartY,
        {
            align: "right",
        }
    );

    summaryStartY += 8;

    normal();

    doc.setFontSize(8);

    doc.setFont(
        "helvetica",
        "italic"
    );

    doc.setFontSize(7);

    text(
        doc,
        "This is not tax invoice – The tax invoice will be sent separately by email or included with your parcel.",
        LEFT,
        summaryStartY
    );

    summaryStartY += 4;

    text(
        doc,
        "Thank you for shopping with Sivakasi Pyro Park.",
        LEFT,
        summaryStartY
    );

    summaryStartY += 6;

    return doc;
}