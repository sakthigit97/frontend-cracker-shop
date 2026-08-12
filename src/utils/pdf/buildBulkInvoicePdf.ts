import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { PDF_THEME } from "../../utils/pdf/invoiceTheme";
import { money, line, text, formatStatus } from "../../utils/pdf/invoiceHelpers";
import Icon from "../../assets/icon-new.png";

export async function buildBulkInvoicePdf(
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

    bold();

    y = 26;
    doc.setFontSize(7.5);
    doc.setTextColor(
        ...COLORS.dark
    );

    if (config?.displayMobile) {
        text(doc, config.displayMobile, LEFT, y);
        y += 4;
    }

    if (config?.adminEmail) {
        text(doc, config.adminEmail, LEFT, y);
        y += 4;
    }

    if (config?.website) {
        text(doc, config.website, LEFT, y);
        y += 4;
    }

    if (config?.adminAddress) {
        const address = doc.splitTextToSize(config.adminAddress, 110);
        text(doc, address, LEFT, y);
        y += address.length * 3.4;
    }

    y += 2;
    line(
        doc,
        y
    );

    y += 5;
    bold();
    doc.setFontSize(8);
    doc.setTextColor(0);

    const orderDate = new Date(order.createdAt).toLocaleDateString(
        "en-IN",
        {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
        }
    );

    text(doc, `Invoice No : ${order.orderId}`, LEFT, y);

    text(doc, `Scheme : ${order.schemeId}`, 110, y);
    y += 5;
    text(doc, `Status : ${formatStatus(order.status)}`, LEFT, y);
    text(doc, `Order Date : ${orderDate}`, 110, y);

    y += 5;

    line(doc, y);

    y += 6;
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
    const customerLines = [
        order.address.fullName,
        order.address.mobile,
        order.address.addressLine1,
        order.address.addressLine2,
        `${order.address.city}, ${order.address.state}`,
        order.address.pincode,
    ].filter(Boolean);

    text(
        doc,
        customerLines,
        LEFT,
        y
    );

    y += customerLines.length * 3.8;


    y += 2;

    line(doc, y);
    y += 4;
    const tableStartY = y;
    autoTable(doc, {
        startY: tableStartY,
        theme: "grid",
        tableLineWidth: 0,
        head: [[
            "Product",
            "Carton Qty",
            "Boxes",
            "Rate / Box",
            "Amount"
        ]],
        body: order.items.map((item: any) => [
            item.name,
            item.cartonQty,
            item.quantity,
            money(item.schemePrice),
            money(item.total),
        ]),
        styles: {
            font: "helvetica",
            fontStyle: "normal",
            fontSize: 8,
            overflow: "linebreak",
            cellPadding: {
                top: 1.2,
                bottom: 1.2,
                left: 2.2,
                right: 2.2
            },
            minCellHeight: 6,
            lineWidth: 0.08,
            lineColor: COLORS.border,
            valign: "middle",
            textColor: COLORS.dark
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
                right: 2
            }

        },
        columnStyles: {

            0: {
                cellWidth: 72,
                halign: "left"
            },

            1: {
                cellWidth: 22,
                halign: "center"
            },

            2: {
                cellWidth: 18,
                halign: "right"
            },

            3: {
                cellWidth: 30,
                halign: "center"
            },

            4: {
                cellWidth: 34,
                halign: "right"
            }
        },
        didParseCell: (data) => {

            if (data.section === "head") {

                data.cell.styles.lineColor =
                    COLORS.primary;

                return;

            }


            if (
                data.section === "body" &&
                data.column.index === 3
            ) {
                data.cell.styles.textColor = [22, 163, 74];
                data.cell.styles.fontStyle = "bold";
                data.cell.styles.halign = "center";
            }

            if (
                data.section === "body" &&
                data.column.index === 4
            ) {

                data.cell.styles.fontStyle = "bold";
                data.cell.styles.textColor = COLORS.primary;

            }

        }
    });
    let summaryStartY = (doc as any).lastAutoTable.finalY + 2;
    const SUMMARY_WIDTH = 80;
    const SUMMARY_X = RIGHT - SUMMARY_WIDTH;
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
            bold ? "bold" : "normal"
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
                : String(value ?? "");

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

    drawSummaryRow(
        "Product Total",
        order.pricing.productTotal
    );

    drawSummaryRow(
        `Packaging (${order.pricing.packagingPercent}%)`,
        order.pricing.packagingCharge
    );
    const gstPercent = Number(
        order.pricing?.gstPercent ?? 0
    );

    if (gstPercent > 0) {
        drawSummaryRow(
            `GST (${gstPercent}%)`,
            Number(order.pricing?.gstAmount ?? 0)
        );
    }

    drawSummaryRow(
        "Grand Total",
        order.pricing.grandTotal,
        true
    );

    doc.setDrawColor(...COLORS.border);
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
        money(order.pricing.grandTotal),
        RIGHT,
        summaryStartY,
        {
            align: "right",
        }
    );

    summaryStartY += 8;
    normal();
    doc.setFontSize(8);

    doc.setFont("helvetica", "italic");
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