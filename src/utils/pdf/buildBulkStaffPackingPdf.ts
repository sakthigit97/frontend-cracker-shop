import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import { PDF_THEME } from "./invoiceTheme";
import { line, text } from "./invoiceHelpers";
import { formatDateTime } from "../date";

export async function buildBulkStaffPackingPdf(
    order: any,
    _config: any
) {
    const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
        compress: true,
    });

    const normal = () =>
        doc.setFont("helvetica", "normal");

    const bold = () =>
        doc.setFont("helvetica", "bold");

    const LEFT = PDF_THEME.LEFT;
    const RIGHT = PDF_THEME.RIGHT;
    const COLORS = PDF_THEME.colors;

    normal();

    let y = 10;

    /*
     * ============================================================
     * ORDER INFORMATION
     * ============================================================
     */

    const orderDate = order.createdAt
        ? formatDateTime(
            order.createdAt
        )
        : "-";

    bold();

    doc.setFontSize(9);

    doc.setTextColor(
        ...COLORS.dark
    );

    text(
        doc,
        `Order : ${order.orderId ?? "-"}`,
        LEFT,
        y
    );

    text(
        doc,
        `Date : ${orderDate}`,
        RIGHT,
        y,
        {
            align: "right",
        }
    );

    y += 3;

    line(doc, y);

    /*
     * ============================================================
     * CUSTOMER DETAILS
     * ============================================================
     */

    y += 3;

    bold();

    doc.setFontSize(8);

    doc.setTextColor(
        ...COLORS.dark
    );

    const address =
        order.address ?? {};

    const customerDetails = [
        address.fullName,
        address.mobile,
        address.addressLine1,
        address.addressLine2,
        `${address.city ?? ""}, ${address.state ?? ""}`.replace(
            /^,\s*|\s*,\s*$/,
            ""
        ),
        address.pincode,
    ].filter(Boolean);

    const customerText =
        customerDetails.join("\n");

    const customerLines =
        doc.splitTextToSize(
            customerText || "-",
            RIGHT - LEFT - 6
        );

    const customerBoxHeight =
        Math.max(
            9,
            customerLines.length * 3.5 + 5
        );

    doc.setDrawColor(
        ...COLORS.border
    );

    doc.setLineWidth(0.15);

    doc.roundedRect(
        LEFT,
        y - 2,
        RIGHT - LEFT,
        customerBoxHeight,
        1.5,
        1.5
    );

    normal();

    doc.setFontSize(8);

    doc.setTextColor(
        ...COLORS.dark
    );

    text(
        doc,
        customerLines.join("\n"),
        LEFT + 3,
        y + 2
    );

    y += customerBoxHeight + 1;

    /*
     * ============================================================
     * SORT ITEMS BY sequenceNumber
     * ============================================================
     */

    const items =
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

    const totalQty =
        items.reduce(
            (
                sum: number,
                item: any
            ) =>
                sum +
                Number(
                    item.quantity ?? 0
                ),
            0
        );

    /*
     * ============================================================
     * PRODUCTS
     * ============================================================
     */

    autoTable(doc, {
        startY: y,

        theme: "grid",

        head: [[
            "#",
            "Product",
            "Carton Content",
            "Carton",
        ]],

        body: items.map(
            (
                item: any,
                index: number
            ) => [
                    String(index + 1),

                    item.name ?? "-",

                    `${item.cartonQty ?? 0}/${item.packUnit
                        ? ` ${item.packUnit}`
                        : ""
                    }`,

                    String(
                        item.quantity ?? 0
                    ),
                ]
        ),

        styles: {
            font: "helvetica",
            fontStyle: "normal",
            fontSize: 8,

            overflow: "linebreak",

            cellPadding: {
                top: 1.5,
                bottom: 1.5,
                left: 2,
                right: 2,
            },

            minCellHeight: 6,

            lineWidth: 0.08,

            lineColor:
                COLORS.border,

            valign: "middle",

            textColor:
                COLORS.dark,
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

        alternateRowStyles: {
            fillColor:
                COLORS.alternate,
        },

        columnStyles: {
            /*
             * #
             */
            0: {
                cellWidth: 10,
                halign: "center",
            },

            /*
             * Product
             */
            1: {
                cellWidth: 115,
                halign: "left",
            },

            /*
             * Carton
             * Example: 50 Box
             */
            2: {
                cellWidth: 30,
                halign: "center",
            },

            /*
             * Qty
             * Number of cartons
             */
            3: {
                cellWidth: 20,
                halign: "center",
            },
        },

        didParseCell: (
            data
        ) => {

            /*
             * #
             */
            if (
                data.section ===
                "body" &&
                data.column.index === 0
            ) {
                data.cell.styles.halign =
                    "center";
            }

            /*
             * Carton
             */
            if (
                data.section ===
                "body" &&
                data.column.index === 2
            ) {
                data.cell.styles.halign =
                    "center";
            }

            /*
             * Qty
             */
            if (
                data.section ===
                "body" &&
                data.column.index === 3
            ) {
                data.cell.styles.fontStyle =
                    "bold";

                data.cell.styles.halign =
                    "center";
            }
        },
    });

    /*
     * ============================================================
     * TOTAL QUANTITY
     * ============================================================
     */

    const tableBottom =
        (doc as any)
            .lastAutoTable
            ?.finalY ?? y;

    const totalY =
        tableBottom + 5;

    line(
        doc,
        totalY
    );

    bold();

    doc.setFontSize(9);

    doc.setTextColor(
        ...COLORS.dark
    );

    /*
     * Keep total aligned with Qty column.
     *
     * Columns:
     * #       = 10
     * Product = 115
     * Carton  = 30
     * Qty     = 20
     */
    const qtyColumnLeft =
        LEFT +
        10 +
        115 +
        30;

    const qtyColumnRight =
        qtyColumnLeft + 20;

    text(
        doc,
        "Total Carton",
        qtyColumnLeft - 4,
        totalY + 5,
        {
            align: "right",
        }
    );

    text(
        doc,
        String(totalQty),
        qtyColumnRight - 3,
        totalY + 5,
        {
            align: "right",
        }
    );

    return doc;
}