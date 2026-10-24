
import { buildBulkStaffPackingPdf } from "./buildBulkStaffPackingPdf";
import { savePdf } from "./savePdf";

export async function downloadBulkStaffPackingList(
    order: any,
    config: any
) {
    const pdf = await buildBulkStaffPackingPdf(
        order,
        config
    );

    await savePdf(
        pdf,
        `packing-list-${order.orderId}.pdf`
    );
}