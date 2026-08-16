import { buildStaffPackingPdf } from "./staffInvoiceBuilder";
import type { DownloadInvoiceOptions } from "./invoice.types";

export async function downloadStaffPackingList({
    order,
    config,
    fileName,
}: DownloadInvoiceOptions) {
    const pdf = await buildStaffPackingPdf(
        order,
        config
    );

    pdf.save(
        fileName ??
        `packing-list-${order.orderId}.pdf`
    );
}