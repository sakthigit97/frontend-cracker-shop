import { apiFetch } from "./api";

export const fetchProductsBatch = async (
    productIds: string[]
) => {
    if (productIds.length === 0) return [];

    const res = await apiFetch("/products/batch", {
        method: "POST",
        body: JSON.stringify({ productIds }),
    });

    return res.items as Array<{
        id: string;
        name: string;
        price: number;
        image: string;
        brand?: string;
        stock?: number;
    }>;
};

export const createComboPackage = async (payload: {
    name: string;
    price: number;
    productIds: string[];
}) =>
    apiFetch(
        "/admin/combo-packages",
        {
            method: "POST",
            body: JSON.stringify(payload),
        },
        import.meta.env.VITE_API_BASE_URL_V1
    );

export const getComboPackages = async () =>
    apiFetch(
        "/admin/combo-packages",
        {
            method: "GET",
        },
        import.meta.env.VITE_API_BASE_URL_V1
    );

export const getComboPackage = async (comboId: string) =>
    apiFetch(
        `/admin/combo-packages/${comboId}`,
        {
            method: "GET",
        },
        import.meta.env.VITE_API_BASE_URL_V1
    );

export const updateComboPackage = async (
    comboId: string,
    payload: {
        productIds: string[];
    }
) =>
    apiFetch(
        `/admin/combo-packages/${comboId}`,
        {
            method: "PUT",
            body: JSON.stringify(payload),
        },
        import.meta.env.VITE_API_BASE_URL_V1
    );

export const getAccountCreditReport = async (params: {
    fromDate: string;
    toDate: string;
    paymentAccountId?: string;
}) => {
    const query = new URLSearchParams({
        fromDate: params.fromDate,
        toDate: params.toDate,
    });

    if (params.paymentAccountId) {
        query.append(
            "paymentAccountId",
            params.paymentAccountId
        );
    }

    return apiFetch(
        `/admin/reports/account-credits?${query.toString()}`,
        {
            method: "GET",
        },
        import.meta.env.VITE_API_BASE_URL_V1
    );
};

export const getBulkAccountCreditReport = async (params: {
    fromDate: string;
    toDate: string;
    paymentAccountId?: string;
}) => {
    const query = new URLSearchParams({
        fromDate: params.fromDate,
        toDate: params.toDate,
    });

    if (params.paymentAccountId) {
        query.set(
            "paymentAccountId",
            params.paymentAccountId
        );
    }

    return apiFetch(
        `/admin/reports/bulk-account-credits?${query.toString()}`,
        {
            method: "GET",
        },
        import.meta.env.VITE_API_BASE_URL_V1
    );
};

export const getBulkSalesReport = async (params: {
    fromDate: string;
    toDate: string;
}) => {
    const query = new URLSearchParams({
        fromDate: params.fromDate,
        toDate: params.toDate,
    });

    return apiFetch(
        `/admin/reports/bulk-sales?${query.toString()}`,
        {
            method: "GET",
        },
        import.meta.env.VITE_API_BASE_URL_V1
    );
};