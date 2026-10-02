import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import Icon from "../../assets/icon-new.png";

type ReportType = "retail" | "bulk";

type AccountSummary = {
    paymentAccountId: string;
    orderCount: number;
    totalAmount: number;
};

type PaymentOrder = {
    orderId: string;
    createdAt: number;
    status: string;
    paymentAccountId: string;
    amount: number;
};

type ReportResponse = {
    accounts: AccountSummary[];
    orders: PaymentOrder[];
    totals: {
        orderCount: number;
        totalAmount: number;
        accountCount: number;
    };
};

interface GenerateAccountCreditPdfOptions {
    report: ReportResponse;
    reportType: ReportType;
    fromDate: string;
    toDate: string;
    selectedAccount?: string;
    companyName?: string;
    adminMobile?: string;
    adminEmail?: string;
}

const PAGE_MARGIN = 12;
const CONTENT_WIDTH = 210 - PAGE_MARGIN * 2;
const HEADER_HEIGHT = 34;

const formatMoney = (amount: number) =>
    `Rs. ${Number(amount || 0).toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`;

const formatDate = (timestamp: number) => {
    if (!timestamp) return "-";

    return new Date(timestamp).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    });
};

const formatReportDate = (value: string) => {
    if (!value) return "-";

    const [year, month, day] = value.split("-");

    if (!year || !month || !day) {
        return value;
    }

    return `${day}/${month}/${year}`;
};

const formatStatus = (status: string) =>
    status
        .replace(/_/g, " ")
        .toLowerCase()
        .replace(/\b\w/g, (char) => char.toUpperCase());

const drawHeader = (
    doc: jsPDF,
    reportType: ReportType,
    companyName: string
) => {
    const pageWidth = doc.internal.pageSize.getWidth();

    // Logo
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
        // Keep PDF generation working even if image fails.
    }

    // Company name
    doc.setFont("helvetica", "bold");
    doc.setFontSize(17);
    doc.setTextColor(15, 23, 42);

    doc.text(
        companyName,
        PAGE_MARGIN + 17,
        15
    );

    // Company subtitle
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(90);

    doc.text(
        "Premium Fireworks & Crackers",
        PAGE_MARGIN + 17,
        21
    );

    // Report title
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(15, 23, 42);

    doc.text(
        "Account-wise Credit Summary",
        PAGE_MARGIN,
        31
    );

    // Report type
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(90);

    doc.text(
        reportType === "bulk"
            ? "Bulk Orders"
            : "Retail Orders",
        PAGE_MARGIN + 75,
        31
    );

    // Separator
    doc.setDrawColor(210);
    doc.line(
        PAGE_MARGIN,
        HEADER_HEIGHT + 1,
        pageWidth - PAGE_MARGIN,
        HEADER_HEIGHT + 1
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
        "Generated from Admin Account Credit Report",
        PAGE_MARGIN,
        pageHeight - 5
    );

    const pageNumber = `Page ${
        doc.getCurrentPageInfo().pageNumber
    } of ${doc.getNumberOfPages()}`;

    doc.text(
        pageNumber,
        pageWidth - PAGE_MARGIN,
        pageHeight - 5,
        {
            align: "right",
        }
    );
};

export const generateAccountCreditPdf = ({
    report,
    reportType,
    fromDate,
    toDate,
    selectedAccount,
    companyName = "SIVAKASI PYRO PARK",
}: GenerateAccountCreditPdfOptions) => {
    const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
    });

    const reportLabel =
        reportType === "bulk"
            ? "Bulk Orders"
            : "Retail Orders";

    const accountLabel =
        selectedAccount?.trim()
            ? selectedAccount
            : "All Accounts";


    drawHeader(
        doc,
        reportType,
        companyName
    );

    let currentY = 41;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(15, 23, 42);

    doc.text(
        "Report Details",
        PAGE_MARGIN,
        currentY
    );

    currentY += 6;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(70);

    const leftX = PAGE_MARGIN;
    const rightX = 108;

    doc.text(
        `Report Type : ${reportLabel}`,
        leftX,
        currentY
    );

    doc.text(
        `Account : ${accountLabel}`,
        rightX,
        currentY
    );

    currentY += 5;

    // Row 2
    doc.text(
        `From Date : ${formatReportDate(fromDate)}`,
        leftX,
        currentY
    );

    doc.text(
        `Total Accounts : ${report.totals.accountCount}`,
        rightX,
        currentY
    );

    currentY += 5;

    // Row 3
    doc.text(
        `To Date : ${formatReportDate(toDate)}`,
        leftX,
        currentY
    );

    doc.text(
        `Total Orders : ${report.totals.orderCount}`,
        rightX,
        currentY
    );

    currentY += 8;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);

    doc.text(
        "Account-wise Credit Summary",
        PAGE_MARGIN,
        currentY
    );

    currentY += 4;

    const totalAmount =
        Number(report.totals.totalAmount) || 0;

    autoTable(doc, {
        startY: currentY,

        margin: {
            left: PAGE_MARGIN,
            right: PAGE_MARGIN,
            top: 43,
            bottom: 14,
        },

        tableWidth: CONTENT_WIDTH,

        head: [[
            "Account",
            "Orders",
            "Amount Credited",
            "%",
        ]],

        body: report.accounts.map(
            (account) => {
                const percentage =
                    totalAmount > 0
                        ? (account.totalAmount /
                            totalAmount) *
                        100
                        : 0;

                return [
                    account.paymentAccountId,
                    String(account.orderCount),
                    formatMoney(
                        account.totalAmount
                    ),
                    `${percentage.toFixed(2)}%`,
                ];
            }
        ),

        foot: [[
            "TOTAL",
            String(
                report.totals.orderCount
            ),
            formatMoney(
                report.totals.totalAmount
            ),
            "100.00%",
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
            overflow: "linebreak",
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
                cellWidth: 88,
                halign: "left",
            },
            1: {
                cellWidth: 22,
                halign: "right",
            },
            2: {
                cellWidth: 48,
                halign: "right",
            },
            3: {
                cellWidth: 24,
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

            drawFooter(doc);
        },
    });

    const accountTableY =
        (doc as any).lastAutoTable?.finalY ??
        currentY;

    let paymentStartY =
        accountTableY + 7;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);

    doc.text(
        "Payment Details",
        PAGE_MARGIN,
        paymentStartY
    );

    paymentStartY += 4;


    const paymentRows = report.orders.map(
        (order) => [
            order.orderId,
            formatDate(order.createdAt),
            order.paymentAccountId,
            formatStatus(order.status),
            formatMoney(order.amount),
        ]
    );

    autoTable(doc, {
        startY: paymentStartY,

        margin: {
            left: PAGE_MARGIN,
            right: PAGE_MARGIN,
            top: 43,
            bottom: 14,
        },

        tableWidth: CONTENT_WIDTH,

        head: [[
            "Order ID",
            "Date",
            "Account",
            "Status",
            "Amount",
        ]],

        body: paymentRows,

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
                cellWidth: 42,
                halign: "left",
            },
            1: {
                cellWidth: 25,
                halign: "left",
            },
            2: {
                cellWidth: 55,
                halign: "left",
            },
            3: {
                cellWidth: 35,
                halign: "left",
            },
            4: {
                cellWidth: 25,
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

            drawFooter(doc);
        },
    });


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


    const typeName =
        reportType === "bulk"
            ? "bulk"
            : "retail";

    doc.save(
        `account-credit-summary-${typeName}-${Date.now()}.pdf`
    );
};