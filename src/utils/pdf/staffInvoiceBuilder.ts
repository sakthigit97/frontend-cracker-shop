import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import { PDF_THEME } from "./invoiceTheme";
import { line, text } from "./invoiceHelpers";
import { formatDateTime } from "../date";
import { getDisplayPackUnit } from "../displayPackUnit";
import { getComboProductNames } from "../../services/admin.api";
import { sortProductsByCategoryAndSequence } from "../sequncerUtil";

export async function buildStaffPackingPdf(
    order: any,
    _config: any,
    categories: any
) {
    const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
        compress: true,
    });

    const normal = () => doc.setFont("helvetica", "normal");
    const bold = () => doc.setFont("helvetica", "bold");
    const LEFT = PDF_THEME.LEFT;
    const RIGHT = PDF_THEME.RIGHT;
    const COLORS = PDF_THEME.colors;

    normal();
    let y = 10;
    const orderDate = order.updatedAt
        ? formatDateTime(
            Number(order.updatedAt)
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

    y += 3;

    bold();

    doc.setFontSize(8);

    doc.setTextColor(
        ...COLORS.dark
    );

    const customerDetails =
        order.address ??
        order.customer?.address ??
        "-";

    const customerLines =
        doc.splitTextToSize(
            String(
                customerDetails
            ).trim(),
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

    const items =
        Array.isArray(order.items)
            ? sortProductsByCategoryAndSequence(
                order.items,
                categories
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

    const comboProductNames =
        new Map<string, string[]>();

    const comboProductIds = [
        ...new Set(
            items
                .filter(
                    (item: any) =>
                        item.isComboPackage === true &&
                        item.productId
                )
                .map(
                    (item: any) =>
                        item.productId
                )
        ),
    ];

    await Promise.all(
        comboProductIds.map(
            async (productId: string) => {
                try {
                    const result =
                        await getComboProductNames(
                            productId
                        );

                    comboProductNames.set(
                        productId,
                        result.productNames || []
                    );
                } catch (error) {
                    console.error(
                        "Failed to fetch combo product names",
                        productId,
                        error
                    );

                    comboProductNames.set(
                        productId,
                        []
                    );
                }
            }
        )
    );

    autoTable(doc, {
        startY: y,

        theme: "grid",

        head: [[
            "#",
            "Product",
            "Unit",
            "Qty",
        ]],

        body: items.map(
            (
                item: any,
                index: number
            ) => {

                const comboNames =
                    comboProductNames.get(
                        String(item.productId)
                    ) || [];

                const productName =
                    comboNames.length > 0
                        ? `${item.name ?? "-"}\n(${comboNames.join(", ")})`
                        : item.name ?? "-";

                const packQuantity =
                    Number(
                        item.packQuantity ?? 0
                    );

                const packUnit =
                    item.packUnit?.trim();

                const cartonText =
                    packQuantity > 0
                        ? `${packQuantity} ${getDisplayPackUnit(packUnit)
                            ? ` ${getDisplayPackUnit(packUnit)}`
                            : ""
                        }`
                        : getDisplayPackUnit(packUnit) || "-";

                return [
                    String(index + 1),
                    productName,
                    cartonText,
                    String(item.quantity ?? 0),
                ];
            }
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
                [80, 80, 80],

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
             *
             * Example:
             * 50 Box
             */
            2: {
                cellWidth: 30,
                halign: "center",
            },

            /*
             * Qty
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
     * Table columns:
     *
     * #       = 10
     * Product = 115
     * Carton  = 30
     * Qty     = 20
     *
     * Qty column starts at:
     *
     * LEFT + 10 + 115 + 30
     */

    const qtyColumnLeft =
        LEFT +
        10 +
        115 +
        30;

    const qtyColumnRight =
        qtyColumnLeft + 20;

    /*
     * Total Qty label
     */

    text(
        doc,
        "Total Qty",
        qtyColumnLeft - 4,
        totalY + 5,
        {
            align: "right",
        }
    );

    /*
     * Total Qty value
     */

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