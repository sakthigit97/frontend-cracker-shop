import { buildBulkInvoicePdf } from "./buildBulkInvoicePdf";
export async function downloadBulkInvoice(order: any, config: any) {
    const pdf = await buildBulkInvoicePdf(order, config);
    pdf.save(`invoice-${order.orderId}.pdf`);
}