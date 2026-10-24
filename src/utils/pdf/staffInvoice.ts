import { buildStaffPackingPdf } from "./staffInvoiceBuilder";
import type { DownloadInvoiceOptions } from "./invoice.types";
import { savePdf } from "./savePdf";

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

    await savePdf(
        pdf,
        fileName ?? `packing-list-${order.orderId}.pdf`
    );
}