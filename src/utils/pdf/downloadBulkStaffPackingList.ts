import { buildBulkStaffPackingPdf } from "./buildBulkStaffPackingPdf";

export async function downloadBulkStaffPackingList(
    order: any,
    config: any
) {
    const pdf = await buildBulkStaffPackingPdf(
        order,
        config
    );

    pdf.save(
        `packing-list-${order.orderId}.pdf`
    );
}