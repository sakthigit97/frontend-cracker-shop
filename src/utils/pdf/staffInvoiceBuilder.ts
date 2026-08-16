import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import { PDF_THEME } from "./invoiceTheme";
import { line, text } from "./invoiceHelpers";

export async function buildStaffPackingPdf(
    order: any,
    _config: any
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

    /*
     * ============================================================
     * ORDER INFORMATION
     * ============================================================
     */

    const orderDate = order.updatedAt
        ? new Date(Number(order.updatedAt)).toLocaleDateString(
            "en-IN",
            {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
            }
        )
        : "-";

    bold();
    doc.setFontSize(9);
    doc.setTextColor(...COLORS.dark);

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
    doc.setTextColor(...COLORS.dark);
    const customerDetails =
        order.address ??
        order.customer?.address ??
        "-";

    const customerLines = doc.splitTextToSize(
        String(customerDetails).trim(),
        RIGHT - LEFT - 6
    );

    const customerBoxHeight =
        Math.max(9, customerLines.length * 3.5 + 5);

    doc.setDrawColor(...COLORS.border);
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
    doc.setTextColor(...COLORS.dark);

    text(
        doc,
        customerLines.join("\n"),
        LEFT + 3,
        y + 2
    );

    y += customerBoxHeight + 1;

    const items = Array.isArray(order.items)
        ? [...order.items].sort((a: any, b: any) => {
            const aSequence = Number(a.sequenceNumber);
            const bSequence = Number(b.sequenceNumber);

            if (
                Number.isFinite(aSequence) &&
                Number.isFinite(bSequence)
            ) {
                return aSequence - bSequence;
            }

            if (Number.isFinite(aSequence)) {
                return -1;
            }

            if (Number.isFinite(bSequence)) {
                return 1;
            }

            return 0;
        })
        : [];

    const totalQty = items.reduce(
        (sum: number, item: any) =>
            sum + Number(item.quantity ?? 0),
        0
    );

    autoTable(doc, {
        startY: y,

        theme: "grid",

        head: [[
            "#",
            "Product",
            "Qty",
        ]],

        body: items.map(
            (item: any, index: number) => [
                String(index + 1),
                item.name ?? "-",
                String(item.quantity ?? 0),
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
            lineColor: COLORS.border,

            valign: "middle",
            textColor: COLORS.dark,
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

        alternateRowStyles: {
            fillColor: COLORS.alternate,
        },

        columnStyles: {
            0: {
                cellWidth: 10,
                halign: "center",
            },

            1: {
                cellWidth: 145,
                halign: "left",
            },

            2: {
                cellWidth: 20,
                halign: "center",
            },
        },

        didParseCell: (data) => {
            if (
                data.section === "body" &&
                data.column.index === 0
            ) {
                data.cell.styles.halign = "center";
            }

            if (
                data.section === "body" &&
                data.column.index === 2
            ) {
                data.cell.styles.fontStyle = "bold";
                data.cell.styles.halign = "center";
            }
        },
    });

    /*
   * ============================================================
   * TOTAL QUANTITY
   * ============================================================
   */

    const tableBottom = (doc as any).lastAutoTable?.finalY ?? y;
    const totalY = tableBottom + 5;

    line(doc, totalY);

    bold();
    doc.setFontSize(9);
    doc.setTextColor(...COLORS.dark);

    /*
     * Table columns:
     *
     * #       = 10
     * Product = 145
     * Qty     = 20
     *
     * So the Qty column starts at:
     * LEFT + 10 + 145
     */
    const qtyColumnLeft = LEFT + 10 + 145;
    const qtyColumnRight = qtyColumnLeft + 20;

    /*
     * Put the quantity value inside the exact Qty column.
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

    /*
     * Put "Total Qty" immediately before the Qty column.
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
    return doc;
}