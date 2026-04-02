import { apiFetch } from "./api";

export async function getProductReport(params: {
    range?: string;
    fromDate?: string;
    toDate?: string;
}) {
    const query = new URLSearchParams();

    if (params.range) query.set("range", params.range);
    if (params.fromDate) query.set("fromDate", params.fromDate);
    if (params.toDate) query.set("toDate", params.toDate);

    return apiFetch(`/admin/reports/products?${query}`);
}