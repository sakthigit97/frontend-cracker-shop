
import { buildInvoicePdf } from "./invoiceBuilder";
import type { DownloadInvoiceOptions } from "./invoice.types";
import { savePdf } from "./savePdf";

export async function downloadInvoice({
    order,
    config,
    fileName,
}: DownloadInvoiceOptions) {
    const pdf = await buildInvoicePdf(
        order,
        config
    );

    await savePdf(
        pdf,
        fileName ?? `invoice-${order.orderId}.pdf`
    );
}
