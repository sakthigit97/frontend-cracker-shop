import { apiFetch } from "./api";

export interface RevenueTrend {
    date: string;
    revenue: number;
}

export interface RevenueResponse {
    totalRevenue: number;
    totalOrders: number;
    avgOrderValue: number;
    todayRevenue: number;
    yesterdayRevenue: number;
    growth: number;
    trend: RevenueTrend[];
}

export async function getRevenueReport(params: {
    range?: string;
    fromDate?: string;
    toDate?: string;
    paymentMethod?: string;
}): Promise<RevenueResponse> {
    const query = new URLSearchParams();

    if (params.range) query.set("range", params.range);
    if (params.fromDate) query.set("fromDate", params.fromDate);
    if (params.toDate) query.set("toDate", params.toDate);
    if (params.paymentMethod)
        query.set("paymentMethod", params.paymentMethod);

    return apiFetch(`/admin/reports/revenue?${query.toString()}`);
}