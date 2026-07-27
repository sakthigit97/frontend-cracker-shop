import { buildInvoicePdf } from "./invoiceBuilder";
import type { DownloadInvoiceOptions } from "./invoice.types";

export async function downloadInvoice({
    order,
    config,
    fileName,
}: DownloadInvoiceOptions) {
    const pdf = await buildInvoicePdf(
        order,
        config
    );

    pdf.save(
        fileName ??
        `invoice-${order.orderId}.pdf`
    );
}