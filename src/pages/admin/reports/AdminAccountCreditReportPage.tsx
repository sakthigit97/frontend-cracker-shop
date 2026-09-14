import React, { useEffect, useMemo, useState } from "react";
import { getAccountCreditReport } from "../../../services/product.api";

const ALLOWED_STATUSES = [
    "PAYMENT_CONFIRMED",
    "ORDER_PACKED",
    "DISPATCHED",
];

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

            const result = await getAccountCreditReport({
                fromDate,
                toDate,
                paymentAccountId:
                    selectedAccount || undefined,
            });

            setReport(result);
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

    useEffect(() => {
        loadReport();
    }, []);

    const accountOptions = useMemo(() => {
        if (!report?.accounts) return [];

        return [...report.accounts].sort((a, b) =>
            a.paymentAccountId.localeCompare(
                b.paymentAccountId
            )
        );
    }, [report]);

    const filteredOrders = useMemo(() => {
        if (!report?.orders) return [];

        return report.orders.filter((order) =>
            ALLOWED_STATUSES.includes(order.status)
        );
    }, [report]);

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

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Account
                        </label>

                        <select
                            value={selectedAccount}
                            onChange={(e) =>
                                setSelectedAccount(
                                    e.target.value
                                )
                            }
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
                <div className="bg-white border rounded-xl p-5 shadow-sm">
                    <p className="text-sm text-gray-500">
                        Total Orders
                    </p>

                    <p className="text-2xl font-bold text-gray-800 mt-1">
                        {report?.totals.orderCount ?? 0}
                    </p>
                </div>

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

                <div className="bg-white border rounded-xl p-5 shadow-sm">
                    <p className="text-sm text-gray-500">
                        Accounts
                    </p>

                    <p className="text-2xl font-bold text-gray-800 mt-1">
                        {report?.totals.accountCount ?? 0}
                    </p>
                </div>
            </div>

            {/* Account-wise Summary */}
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
                                filteredOrders.map(
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
            </div>
        </div>
    );
};

export default AdminAccountCreditReportPage;