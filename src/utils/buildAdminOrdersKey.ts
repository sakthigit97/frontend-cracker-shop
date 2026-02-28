export interface AdminOrderFilters {
    status: string;
    dateRange?: string;
    orderId?: string;
}

export function buildAdminOrdersKey(filters: AdminOrderFilters) {
    return [
        filters.status,
        filters.dateRange ?? "all",
        (filters.orderId ?? "").trim().toUpperCase(),
    ].join("|");
}