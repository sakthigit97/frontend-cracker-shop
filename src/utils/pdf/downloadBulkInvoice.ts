
import { buildBulkInvoicePdf } from "./buildBulkInvoicePdf";
import { savePdf } from "./savePdf";

export async function downloadBulkInvoice(order: any, config: any) {
    const pdf = await buildBulkInvoicePdf(order, config);

    await savePdf(
        pdf,
        `invoice-${order.orderId}.pdf`
    );
}
