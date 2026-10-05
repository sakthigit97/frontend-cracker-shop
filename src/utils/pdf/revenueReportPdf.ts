import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import Icon from "../../assets/icon-new.png";

type ReportType = "retail" | "bulk";

interface GenerateRevenueReportPdfOptions {
    reportType: ReportType;
    retailReport?: any;
    bulkReport?: any;
    fromDate?: string;
    toDate?: string;
    range?: string;
    companyName?: string;
}

const PAGE_MARGIN = 12;
const CONTENT_WIDTH = 210 - PAGE_MARGIN * 2;

const formatCurrency = (value: number) =>
    `Rs. ${Number(value || 0).toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`;

const formatBulkCurrency = (value: number) =>
    `Rs. ${Number(value || 0).toLocaleString("en-IN", {
        maximumFractionDigits: 0,
    })}`;

const formatDate = (timestamp: number) => {
    if (!timestamp) return "-";

    return new Date(timestamp).toLocaleDateString("en-IN");
};

const formatReportDate = (value?: string) => {
    if (!value) return "-";

    const [year, month, day] = value.split("-");

    if (!year || !month || !day) {
        return value;
    }

    return `${day}/${month}/${year}`;
};

const formatStatus = (status?: string) =>
    String(status || "-")
        .replace(/_/g, " ")
        .toLowerCase()
        .replace(/\b\w/g, (char) => char.toUpperCase());

const drawHeader = (
    doc: jsPDF,
    reportType: ReportType,
    companyName: string
) => {
    const pageWidth =
        doc.internal.pageSize.getWidth();

    try {
        doc.addImage(
            Icon,
            "PNG",
            PAGE_MARGIN,
            9,
            12,
            12
        );
    } catch {
        // Continue without logo if the asset cannot be loaded.
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(17);
    doc.setTextColor(15, 23, 42);

    doc.text(
        companyName,
        PAGE_MARGIN + 17,
        15
    );

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(90);

    doc.text(
        "Premium Fireworks & Crackers",
        PAGE_MARGIN + 17,
        21
    );

    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(15, 23, 42);

    doc.text(
        "Revenue Report",
        PAGE_MARGIN,
        31
    );

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(90);

    doc.text(
        reportType === "bulk"
            ? "Bulk Orders"
            : "Retail Orders",
        PAGE_MARGIN + 45,
        31
    );

    doc.setDrawColor(210);

    doc.line(
        PAGE_MARGIN,
        35,
        pageWidth - PAGE_MARGIN,
        35
    );
};

const drawFooter = (doc: jsPDF) => {
    const pageWidth =
        doc.internal.pageSize.getWidth();

    const pageHeight =
        doc.internal.pageSize.getHeight();

    doc.setDrawColor(220);

    doc.line(
        PAGE_MARGIN,
        pageHeight - 10,
        pageWidth - PAGE_MARGIN,
        pageHeight - 10
    );

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(110);

    doc.text(
        "Generated from Admin Revenue Report",
        PAGE_MARGIN,
        pageHeight - 5
    );

    const pageNumber =
        `Page ${doc.getCurrentPageInfo().pageNumber} of ${doc.getNumberOfPages()}`;

    doc.text(
        pageNumber,
        pageWidth - PAGE_MARGIN,
        pageHeight - 5,
        { align: "right" }
    );
};

const drawReportDetails = (
    doc: jsPDF,
    reportType: ReportType,
    report: any,
    fromDate?: string,
    toDate?: string,
    range?: string
) => {
    let y = 42;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(15, 23, 42);

    doc.text(
        "Report Details",
        PAGE_MARGIN,
        y
    );

    y += 6;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(70);

    const rightX = 108;

    const period =
        fromDate && toDate
            ? `${formatReportDate(fromDate)} - ${formatReportDate(toDate)}`
            : range === "30d"
                ? "Last 30 Days"
                : "Last 7 Days";

    doc.text(
        `Report Type : ${reportType === "bulk"
            ? "Bulk Orders"
            : "Retail Orders"
        }`,
        PAGE_MARGIN,
        y
    );

    doc.text(
        `Period : ${period}`,
        rightX,
        y
    );

    y += 5;

    if (reportType === "retail") {
        doc.text(
            `Revenue : ${formatCurrency(
                report?.totalRevenue
            )}`,
            PAGE_MARGIN,
            y
        );

        doc.text(
            `Orders : ${report?.totalOrders ?? 0}`,
            rightX,
            y
        );

        y += 5;

        doc.text(
            `Average Order : ${formatCurrency(
                report?.avgOrderValue
            )}`,
            PAGE_MARGIN,
            y
        );

        doc.text(
            `Growth : ${Number(
                report?.growth || 0
            ).toFixed(1)}%`,
            rightX,
            y
        );
    } else {
        doc.text(
            `Orders : ${report?.summary?.totalOrders ?? 0
            }`,
            PAGE_MARGIN,
            y
        );

        doc.text(
            `Sales : ${formatBulkCurrency(
                report?.summary?.totalSales
            )}`,
            rightX,
            y
        );

        y += 5;

        doc.text(
            `Average Order : ${formatBulkCurrency(
                report?.summary?.averageOrderValue
            )}`,
            PAGE_MARGIN,
            y
        );
    }

    return y + 7;
};

export const generateRevenueReportPdf = ({
    reportType,
    retailReport,
    bulkReport,
    fromDate,
    toDate,
    range,
    companyName = "SIVAKASI PYRO PARK",
}: GenerateRevenueReportPdfOptions) => {
    const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
    });

    const report =
        reportType === "retail"
            ? retailReport
            : bulkReport;

    if (!report) {
        return;
    }

    drawHeader(
        doc,
        reportType,
        companyName
    );

    let startY = drawReportDetails(
        doc,
        reportType,
        report,
        fromDate,
        toDate,
        range
    );

    /*
     * ---------------------------------------------------------
     * Retail: Revenue Trend
     * ---------------------------------------------------------
     */
    if (reportType === "retail") {
        const trendRows = (
            report?.trend || []
        ).map((item: any) => [
            item.date ?? "-",
            formatCurrency(
                Number(item.revenue || 0)
            ),
        ]);

        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.setTextColor(15, 23, 42);

        doc.text(
            "Revenue Trend",
            PAGE_MARGIN,
            startY
        );

        startY += 4;

        autoTable(doc, {
            startY,
            margin: {
                left: PAGE_MARGIN,
                right: PAGE_MARGIN,
                top: 39,
                bottom: 14,
            },
            tableWidth: CONTENT_WIDTH,
            head: [["Date", "Revenue"]],
            body: trendRows,
            foot: [[
                "TOTAL",
                formatCurrency(
                    report?.totalRevenue
                ),
            ]],
            theme: "striped",
            styles: {
                font: "helvetica",
                fontSize: 8,
                cellPadding: {
                    top: 2.5,
                    bottom: 2.5,
                    left: 3,
                    right: 3,
                },
                lineWidth: 0,
                valign: "middle",
            },
            headStyles: {
                fillColor: [15, 23, 42],
                textColor: 255,
                fontStyle: "bold",
                fontSize: 8,
                cellPadding: 3,
                halign: "center",
            },
            bodyStyles: {
                textColor: [30, 41, 59],
            },
            footStyles: {
                fillColor: [241, 245, 249],
                textColor: [15, 23, 42],
                fontStyle: "bold",
                fontSize: 8,
            },
            columnStyles: {
                0: {
                    cellWidth: 120,
                    halign: "left",
                },
                1: {
                    cellWidth: 60,
                    halign: "right",
                },
            },
            didParseCell: (data) => {
                if (data.section === "foot") {
                    if (data.column.index === 0) {
                        data.cell.styles.halign = "left";
                    } else {
                        data.cell.styles.halign = "right";
                    }
                }
            },
            showHead: "everyPage",
            pageBreak: "auto",
            rowPageBreak: "avoid",
            didDrawPage: () => {
                drawHeader(
                    doc,
                    reportType,
                    companyName
                );
            },
        });
    }

    /*
     * ---------------------------------------------------------
     * Bulk: Daily Sales
     * ---------------------------------------------------------
     */
    if (reportType === "bulk") {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.setTextColor(15, 23, 42);

        doc.text(
            "Daily Sales Summary",
            PAGE_MARGIN,
            startY
        );

        startY += 4;

        const dailyRows = (
            report?.dailySales || []
        ).map((item: any) => [
            item.date ?? "-",
            String(item.orderCount ?? 0),
            formatBulkCurrency(
                item.totalAmount
            ),
        ]);

        autoTable(doc, {
            startY,
            margin: {
                left: PAGE_MARGIN,
                right: PAGE_MARGIN,
                top: 39,
                bottom: 14,
            },
            tableWidth: CONTENT_WIDTH,
            head: [[
                "Date",
                "Orders",
                "Sales",
            ]],
            body: dailyRows,
            foot: [[
                "TOTAL",
                String(
                    report?.summary?.totalOrders ??
                    0
                ),
                formatBulkCurrency(
                    report?.summary?.totalSales
                ),
            ]],
            didParseCell: (data) => {
                if (data.section === "foot") {
                    if (data.column.index === 0) {
                        data.cell.styles.halign = "left";
                    } else {
                        data.cell.styles.halign = "right";
                    }
                }
            },
            theme: "striped",
            styles: {
                font: "helvetica",
                fontSize: 8,
                cellPadding: {
                    top: 2.5,
                    bottom: 2.5,
                    left: 3,
                    right: 3,
                },
                lineWidth: 0,
                valign: "middle",
            },
            headStyles: {
                fillColor: [15, 23, 42],
                textColor: 255,
                fontStyle: "bold",
                fontSize: 8,
                cellPadding: 3,
                halign: "center",
            },
            bodyStyles: {
                textColor: [30, 41, 59],
            },
            footStyles: {
                fillColor: [241, 245, 249],
                textColor: [15, 23, 42],
                fontStyle: "bold",
                fontSize: 8,
            },
            columnStyles: {
                0: {
                    cellWidth: 100,
                    halign: "left",
                },
                1: {
                    cellWidth: 35,
                    halign: "right",
                },
                2: {
                    cellWidth: 45,
                    halign: "right",
                },
            },
            showHead: "everyPage",
            pageBreak: "auto",
            rowPageBreak: "avoid",
            didDrawPage: () => {
                drawHeader(
                    doc,
                    reportType,
                    companyName
                );
            },
        });

        const dailyTableY =
            (doc as any).lastAutoTable?.finalY ??
            startY;

        let orderStartY =
            dailyTableY + 7;

        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.setTextColor(15, 23, 42);

        doc.text(
            "Order Details",
            PAGE_MARGIN,
            orderStartY
        );

        orderStartY += 4;

        const orders = (
            report?.orders || []
        );

        const orderRows = orders.map(
            (order: any) => [
                order.orderId ?? "-",
                formatDate(order.createdAt),
                formatStatus(order.status),
                formatBulkCurrency(
                    order.amount
                ),
            ]
        );

        autoTable(doc, {
            startY: orderStartY,
            margin: {
                left: PAGE_MARGIN,
                right: PAGE_MARGIN,
                top: 39,
                bottom: 14,
            },
            tableWidth: CONTENT_WIDTH,
            head: [[
                "Order ID",
                "Date",
                "Status",
                "Amount",
            ]],
            body: orderRows,
            theme: "striped",
            styles: {
                font: "helvetica",
                fontSize: 7.5,
                cellPadding: {
                    top: 2.2,
                    bottom: 2.2,
                    left: 2.5,
                    right: 2.5,
                },
                lineWidth: 0,
                overflow: "linebreak",
                valign: "middle",
            },
            headStyles: {
                fillColor: [15, 23, 42],
                textColor: 255,
                fontStyle: "bold",
                fontSize: 7.5,
                cellPadding: 2.8,
                halign: "center",
            },
            bodyStyles: {
                textColor: [30, 41, 59],
            },
            columnStyles: {
                0: {
                    cellWidth: 55,
                    halign: "left",
                },
                1: {
                    cellWidth: 35,
                    halign: "left",
                },
                2: {
                    cellWidth: 55,
                    halign: "left",
                },
                3: {
                    cellWidth: 35,
                    halign: "right",
                },
            },
            showHead: "everyPage",
            pageBreak: "auto",
            rowPageBreak: "avoid",
            didDrawPage: () => {
                drawHeader(
                    doc,
                    reportType,
                    companyName
                );
            },
        });
    }

    /*
     * ---------------------------------------------------------
     * Footer on every page
     * ---------------------------------------------------------
     */
    const totalPages =
        doc.getNumberOfPages();

    for (
        let page = 1;
        page <= totalPages;
        page++
    ) {
        doc.setPage(page);
        drawFooter(doc);
    }

    doc.save(
        `revenue-report-${reportType}-${Date.now()}.pdf`
    );
};
