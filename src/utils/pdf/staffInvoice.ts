import { buildStaffPackingPdf } from "./staffInvoiceBuilder";
import type { DownloadInvoiceOptions } from "./invoice.types";

export async function downloadStaffPackingList({
    order,
    config,
    categories,
    fileName,
}: DownloadInvoiceOptions) {
    const pdf = await buildStaffPackingPdf(
        order,
        config,
        categories
    );

    pdf.save(
        fileName ??
        `packing-list-${order.orderId}.pdf`
    );
}