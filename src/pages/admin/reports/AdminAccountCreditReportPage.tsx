import React, { useEffect, useMemo, useState } from "react";
import { getAccountCreditReport } from "../../../services/product.api";

const ALLOWED_STATUSES = [
    "PAYMENT_CONFIRMED",
    "ORDER_PACKED",
    "DISPATCHED",
];

const ITEMS_PER_PAGE = 10;
type AccountSummary = {
    paymentAccountId: string;
    orderCount: number;
    totalAmount: number;
};

type PaymentOrder = {
    orderId: string;
    createdAt: number;
    status: string;
    paymentAccountId: string;
    amount: number;
};

type ReportResponse = {
    accounts: AccountSummary[];
    orders: PaymentOrder[];
    totals: {
        orderCount: number;
        totalAmount: number;
        accountCount: number;
    };
};

const formatAmount = (amount: number) =>
    `₹${Number(amount || 0).toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`;

const formatDate = (timestamp: number) => {
    if (!timestamp) return "-";

    return new Date(timestamp).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    });
};


const AdminAccountCreditReportPage: React.FC = () => {
    const today = new Date();

    const formatInputDate = (date: Date) =>
        `${date.getFullYear()}-${String(
            date.getMonth() + 1
        ).padStart(2, "0")}-${String(
            date.getDate()
        ).padStart(2, "0")}`;

    const [currentPage, setCurrentPage] = useState(1);

    const [fromDate, setFromDate] = useState(
        formatInputDate(
            new Date(
                today.getFullYear(),
                today.getMonth(),
                1
            )
        )
    );

    const [toDate, setToDate] = useState(
        formatInputDate(today)
    );

    const [selectedAccount, setSelectedAccount] =
        useState("");

    const [report, setReport] =
        useState<ReportResponse | null>(null);

    /*
     * Keep account options separately so that after selecting
     * one account, the dropdown still contains the other accounts.
     */
    const [accountOptions, setAccountOptions] = useState<
        AccountSummary[]
    >([]);

    const [loading, setLoading] = useState(false);

    const [error, setError] = useState("");

    const loadReport = async () => {
        if (!fromDate || !toDate) {
            setError("Please select both dates.");
            return;
        }

        if (fromDate > toDate) {
            setError(
                "From Date cannot be greater than To Date."
            );
            return;
        }

        try {
            setLoading(true);
            setError("");

            const result =
                (await getAccountCreditReport({
                    fromDate,
                    toDate,
                    paymentAccountId:
                        selectedAccount || undefined,
                })) as ReportResponse;

            setReport(result);

            /*
             * Only update the dropdown options when loading
             * the complete report. This keeps all accounts
             * available even when one account is selected.
             */
            if (!selectedAccount) {
                const sortedAccounts = [
                    ...(result?.accounts || []),
                ].sort((a, b) =>
                    a.paymentAccountId.localeCompare(
                        b.paymentAccountId
                    )
                );

                setAccountOptions(sortedAccounts);
            }

            setCurrentPage(1);
        } catch (err: any) {
            console.error(
                "Account credit report error",
                err
            );

            setError(
                err?.message ||
                "Failed to load account credit report."
            );

            setReport(null);
            setCurrentPage(1);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const loadInitialReport = async () => {
            try {
                setLoading(true);
                setError("");

                const result =
                    (await getAccountCreditReport({
                        fromDate,
                        toDate,
                    })) as ReportResponse;

                setReport(result);

                const sortedAccounts = [
                    ...(result?.accounts || []),
                ].sort((a, b) =>
                    a.paymentAccountId.localeCompare(
                        b.paymentAccountId
                    )
                );

                setAccountOptions(sortedAccounts);

                setCurrentPage(1);
            } catch (err: any) {
                console.error(
                    "Account credit report error",
                    err
                );

                setError(
                    err?.message ||
                    "Failed to load account credit report."
                );

                setReport(null);
            } finally {
                setLoading(false);
            }
        };

        loadInitialReport();
    }, []);

    const filteredOrders = useMemo(() => {
        if (!report?.orders) return [];

        return report.orders.filter((order) =>
            ALLOWED_STATUSES.includes(order.status)
        );
    }, [report]);

    const totalPages = Math.ceil(
        filteredOrders.length / ITEMS_PER_PAGE
    );

    const paginatedOrders = useMemo(() => {
        const startIndex =
            (currentPage - 1) * ITEMS_PER_PAGE;

        return filteredOrders.slice(
            startIndex,
            startIndex + ITEMS_PER_PAGE
        );
    }, [filteredOrders, currentPage]);

    /*
     * Keep current page valid if the number of pages changes.
     */
    useEffect(() => {
        if (totalPages === 0) {
            setCurrentPage(1);
            return;
        }

        if (currentPage > totalPages) {
            setCurrentPage(totalPages);
        }
    }, [currentPage, totalPages]);

    /*
     * Generate pagination buttons.
     *
     * Example for many pages:
     *
     * 1 ... 4 5 6 7 8 ... 20
     */
    const paginationPages = useMemo(() => {
        if (totalPages <= 1) {
            return [];
        }

        if (totalPages <= 7) {
            return Array.from(
                { length: totalPages },
                (_, index) => index + 1
            );
        }

        const pages: (number | "...")[] = [];

        pages.push(1);

        if (currentPage > 4) {
            pages.push("...");
        }

        const startPage = Math.max(
            2,
            currentPage - 2
        );

        const endPage = Math.min(
            totalPages - 1,
            currentPage + 2
        );

        for (
            let page = startPage;
            page <= endPage;
            page++
        ) {
            pages.push(page);
        }

        if (currentPage < totalPages - 3) {
            pages.push("...");
        }

        pages.push(totalPages);

        return pages;
    }, [currentPage, totalPages]);

    const startRecord =
        filteredOrders.length === 0
            ? 0
            : (currentPage - 1) *
            ITEMS_PER_PAGE +
            1;

    const endRecord = Math.min(
        currentPage * ITEMS_PER_PAGE,
        filteredOrders.length
    );

    return (
        <div className="p-4 md:p-6 space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-800">
                    Account Credit Report
                </h1>

                <p className="text-sm text-gray-500 mt-1">
                    View credited order amounts account-wise
                    for a selected date range.
                </p>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl shadow-sm border p-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    {/* From Date */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            From Date
                        </label>

                        <input
                            type="date"
                            value={fromDate}
                            onChange={(e) =>
                                setFromDate(
                                    e.target.value
                                )
                            }
                            className="w-full border rounded-lg px-3 py-2"
                        />
                    </div>

                    {/* To Date */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            To Date
                        </label>

                        <input
                            type="date"
                            value={toDate}
                            onChange={(e) =>
                                setToDate(
                                    e.target.value
                                )
                            }
                            className="w-full border rounded-lg px-3 py-2"
                        />
                    </div>

                    {/* Account */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Account
                        </label>

                        <select
                            value={selectedAccount}
                            onChange={(e) => {
                                setSelectedAccount(
                                    e.target.value
                                );
                                setCurrentPage(1);
                            }}
                            className="w-full border rounded-lg px-3 py-2"
                        >
                            <option value="">
                                All Accounts
                            </option>

                            {accountOptions.map(
                                (account) => (
                                    <option
                                        key={
                                            account.paymentAccountId
                                        }
                                        value={
                                            account.paymentAccountId
                                        }
                                    >
                                        {
                                            account.paymentAccountId
                                        }
                                    </option>
                                )
                            )}
                        </select>
                    </div>

                    {/* Apply Filter */}
                    <button
                        type="button"
                        onClick={loadReport}
                        disabled={loading}
                        className="bg-blue-600 text-white rounded-lg px-4 py-2 font-medium hover:bg-blue-700 disabled:opacity-50"
                    >
                        {loading
                            ? "Loading..."
                            : "Apply Filter"}
                    </button>
                </div>

                {error && (
                    <div className="mt-3 text-sm text-red-600">
                        {error}
                    </div>
                )}
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Total Orders */}
                <div className="bg-white border rounded-xl p-5 shadow-sm">
                    <p className="text-sm text-gray-500">
                        Total Orders
                    </p>

                    <p className="text-2xl font-bold text-gray-800 mt-1">
                        {report?.totals.orderCount ?? 0}
                    </p>
                </div>

                {/* Total Amount */}
                <div className="bg-white border rounded-xl p-5 shadow-sm">
                    <p className="text-sm text-gray-500">
                        Total Amount
                    </p>

                    <p className="text-2xl font-bold text-gray-800 mt-1">
                        {formatAmount(
                            report?.totals.totalAmount ?? 0
                        )}
                    </p>
                </div>

                {/* Accounts */}
                <div className="bg-white border rounded-xl p-5 shadow-sm">
                    <p className="text-sm text-gray-500">
                        Accounts
                    </p>

                    <p className="text-2xl font-bold text-gray-800 mt-1">
                        {report?.totals.accountCount ?? 0}
                    </p>
                </div>
            </div>

            {/* Account-wise Credit Summary */}
            <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
                <div className="p-4 border-b">
                    <h2 className="text-lg font-semibold text-gray-800">
                        Account-wise Credit Summary
                    </h2>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="text-left px-4 py-3">
                                    Account
                                </th>

                                <th className="text-right px-4 py-3">
                                    Orders
                                </th>

                                <th className="text-right px-4 py-3">
                                    Amount Credited
                                </th>

                                <th className="text-right px-4 py-3">
                                    %
                                </th>
                            </tr>
                        </thead>

                        <tbody>
                            {!report ||
                                report.accounts.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={4}
                                        className="text-center py-8 text-gray-500"
                                    >
                                        No account data found.
                                    </td>
                                </tr>
                            ) : (
                                report.accounts.map(
                                    (account) => {
                                        const percentage =
                                            report.totals
                                                .totalAmount >
                                                0
                                                ? (account.totalAmount /
                                                    report
                                                        .totals
                                                        .totalAmount) *
                                                100
                                                : 0;

                                        return (
                                            <tr
                                                key={
                                                    account.paymentAccountId
                                                }
                                                className="border-t"
                                            >
                                                <td className="px-4 py-3 font-medium">
                                                    {
                                                        account.paymentAccountId
                                                    }
                                                </td>

                                                <td className="px-4 py-3 text-right">
                                                    {
                                                        account.orderCount
                                                    }
                                                </td>

                                                <td className="px-4 py-3 text-right font-medium">
                                                    {formatAmount(
                                                        account.totalAmount
                                                    )}
                                                </td>

                                                <td className="px-4 py-3 text-right">
                                                    {percentage.toFixed(
                                                        2
                                                    )}
                                                    %
                                                </td>
                                            </tr>
                                        );
                                    }
                                )
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Payment Details */}
            <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
                <div className="p-4 border-b">
                    <h2 className="text-lg font-semibold text-gray-800">
                        Payment Details
                    </h2>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="text-left px-4 py-3">
                                    Order ID
                                </th>

                                <th className="text-left px-4 py-3">
                                    Date
                                </th>

                                <th className="text-left px-4 py-3">
                                    Account
                                </th>

                                <th className="text-left px-4 py-3">
                                    Status
                                </th>

                                <th className="text-right px-4 py-3">
                                    Amount
                                </th>
                            </tr>
                        </thead>

                        <tbody>
                            {filteredOrders.length ===
                                0 ? (
                                <tr>
                                    <td
                                        colSpan={5}
                                        className="text-center py-8 text-gray-500"
                                    >
                                        No payment details
                                        found.
                                    </td>
                                </tr>
                            ) : (
                                paginatedOrders.map(
                                    (order) => (
                                        <tr
                                            key={`${order.orderId}-${order.createdAt}`}
                                            className="border-t"
                                        >
                                            <td className="px-4 py-3 font-medium">
                                                {
                                                    order.orderId
                                                }
                                            </td>

                                            <td className="px-4 py-3">
                                                {formatDate(
                                                    order.createdAt
                                                )}
                                            </td>

                                            <td className="px-4 py-3">
                                                {
                                                    order.paymentAccountId
                                                }
                                            </td>

                                            <td className="px-4 py-3">
                                                <span className="px-2 py-1 rounded-full bg-gray-100 text-xs font-medium">
                                                    {
                                                        order.status
                                                    }
                                                </span>
                                            </td>

                                            <td className="px-4 py-3 text-right font-medium">
                                                {formatAmount(
                                                    order.amount
                                                )}
                                            </td>
                                        </tr>
                                    )
                                )
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="border-t px-4 py-4">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            {/* Record Count */}
                            <div className="text-sm text-gray-500">
                                Showing{" "}
                                <span className="font-medium text-gray-700">
                                    {startRecord}
                                </span>{" "}
                                to{" "}
                                <span className="font-medium text-gray-700">
                                    {endRecord}
                                </span>{" "}
                                of{" "}
                                <span className="font-medium text-gray-700">
                                    {filteredOrders.length}
                                </span>{" "}
                                records
                            </div>

                            {/* Pagination Buttons */}
                            <div className="flex items-center gap-1 flex-wrap">
                                {/* First */}
                                <button
                                    type="button"
                                    onClick={() =>
                                        setCurrentPage(1)
                                    }
                                    disabled={
                                        currentPage === 1
                                    }
                                    className="px-3 py-2 text-sm border rounded-lg bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                    First
                                </button>

                                {/* Previous */}
                                <button
                                    type="button"
                                    onClick={() =>
                                        setCurrentPage(
                                            (page) =>
                                                Math.max(
                                                    1,
                                                    page - 1
                                                )
                                        )
                                    }
                                    disabled={
                                        currentPage === 1
                                    }
                                    className="px-3 py-2 text-sm border rounded-lg bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                    Previous
                                </button>

                                {/* Page Numbers */}
                                {paginationPages.map(
                                    (page, index) =>
                                        page === "..." ? (
                                            <span
                                                key={`ellipsis-${index}`}
                                                className="px-2 py-2 text-sm text-gray-500"
                                            >
                                                ...
                                            </span>
                                        ) : (
                                            <button
                                                key={page}
                                                type="button"
                                                onClick={() =>
                                                    setCurrentPage(
                                                        page
                                                    )
                                                }
                                                className={`min-w-[40px] px-3 py-2 text-sm border rounded-lg font-medium ${currentPage ===
                                                        page
                                                        ? "bg-blue-600 text-white border-blue-600"
                                                        : "bg-white text-gray-700 hover:bg-gray-50"
                                                    }`}
                                            >
                                                {page}
                                            </button>
                                        )
                                )}

                                {/* Next */}
                                <button
                                    type="button"
                                    onClick={() =>
                                        setCurrentPage(
                                            (page) =>
                                                Math.min(
                                                    totalPages,
                                                    page + 1
                                                )
                                        )
                                    }
                                    disabled={
                                        currentPage ===
                                        totalPages
                                    }
                                    className="px-3 py-2 text-sm border rounded-lg bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                    Next
                                </button>

                                {/* Last */}
                                <button
                                    type="button"
                                    onClick={() =>
                                        setCurrentPage(
                                            totalPages
                                        )
                                    }
                                    disabled={
                                        currentPage ===
                                        totalPages
                                    }
                                    className="px-3 py-2 text-sm border rounded-lg bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                    Last
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminAccountCreditReportPage;