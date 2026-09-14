import React, {
    useEffect,
    useMemo,
    useState,
} from "react";
import { useNavigate } from "react-router-dom";
import { getBulkSalesReport } from "../../../services/product.api";

const ROWS_PER_PAGE = 10;

const SALES_STATUSES = [
    "PAYMENT_CONFIRMED",
    "ORDER_PACKED",
    "DISPATCHED",
];

const formatCurrency = (value: number) =>
    `₹${Number(value || 0).toLocaleString(
        "en-IN",
        {
            maximumFractionDigits: 0,
        }
    )}`;

const formatDate = (timestamp: number) =>
    new Date(timestamp).toLocaleDateString(
        "en-IN"
    );

const getToday = () =>
    new Date()
        .toISOString()
        .split("T")[0];

const getFirstDayOfMonth = () => {
    const date = new Date();
    date.setDate(1);

    return date
        .toISOString()
        .split("T")[0];
};

const AdminBulkSalesReportPage: React.FC =
    () => {
        const navigate = useNavigate();

        const [fromDate, setFromDate] =
            useState(getFirstDayOfMonth());

        const [toDate, setToDate] =
            useState(getToday());

        const [report, setReport] =
            useState<any>(null);

        const [loading, setLoading] =
            useState(false);

        const [error, setError] =
            useState("");

        const [currentPage, setCurrentPage] =
            useState(1);

        const loadReport = async () => {
            if (!fromDate || !toDate) {
                return;
            }

            setLoading(true);
            setError("");

            try {
                const result =
                    await getBulkSalesReport({
                        fromDate,
                        toDate,
                    });

                setReport(result);
                setCurrentPage(1);
            } catch (err: any) {
                console.error(
                    "Bulk Sales Report error",
                    err
                );

                setError(
                    err?.message ||
                    "Failed to load sales report"
                );
            } finally {
                setLoading(false);
            }
        };

        useEffect(() => {
            loadReport();
        }, []);

        const orders = useMemo(() => {
            return (report?.orders || []).filter(
                (order: any) =>
                    SALES_STATUSES.includes(
                        order.status
                    )
            );
        }, [report]);

        const totalPages = Math.max(
            1,
            Math.ceil(
                orders.length /
                ROWS_PER_PAGE
            )
        );

        const paginatedOrders =
            orders.slice(
                (currentPage - 1) *
                ROWS_PER_PAGE,
                currentPage *
                ROWS_PER_PAGE
            );

        const goToPage = (
            page: number
        ) => {
            setCurrentPage(
                Math.min(
                    Math.max(page, 1),
                    totalPages
                )
            );
        };

        return (
            <div className="p-4 sm:p-6">
                <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">
                            Bulk Sales Report
                        </h1>

                        <p className="mt-1 text-sm text-gray-500">
                            View bulk order sales for the selected date range.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={() =>
                            navigate(
                                "/admin/bulk-orders"
                            )
                        }
                        className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                        Back
                    </button>
                </div>

                {/* Filters */}
                <div className="mb-6 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">
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
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                            />
                        </div>

                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">
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
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                            />
                        </div>

                        <div className="flex items-end">
                            <button
                                type="button"
                                onClick={
                                    loadReport
                                }
                                disabled={loading}
                                className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {loading
                                    ? "Loading..."
                                    : "Apply Filter"}
                            </button>
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                        {error}
                    </div>
                )}

                {/* Summary */}
                <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                        <p className="text-sm text-gray-500">
                            Total Orders
                        </p>

                        <p className="mt-2 text-2xl font-bold text-gray-800">
                            {report?.summary
                                ?.totalOrders ??
                                0}
                        </p>
                    </div>

                    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                        <p className="text-sm text-gray-500">
                            Total Sales
                        </p>

                        <p className="mt-2 text-2xl font-bold text-gray-800">
                            {formatCurrency(
                                report?.summary
                                    ?.totalSales ??
                                0
                            )}
                        </p>
                    </div>

                    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                        <p className="text-sm text-gray-500">
                            Average Order Value
                        </p>

                        <p className="mt-2 text-2xl font-bold text-gray-800">
                            {formatCurrency(
                                report?.summary
                                    ?.averageOrderValue ??
                                0
                            )}
                        </p>
                    </div>
                </div>

                {/* Daily Sales */}
                <div className="mb-6 rounded-xl border border-gray-200 bg-white shadow-sm">
                    <div className="border-b border-gray-200 p-4">
                        <h2 className="text-lg font-semibold text-gray-800">
                            Daily Sales Summary
                        </h2>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[600px] text-sm">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left font-semibold text-gray-600">
                                        Date
                                    </th>

                                    <th className="px-4 py-3 text-right font-semibold text-gray-600">
                                        Orders
                                    </th>

                                    <th className="px-4 py-3 text-right font-semibold text-gray-600">
                                        Sales
                                    </th>
                                </tr>
                            </thead>

                            <tbody>
                                {(
                                    report?.dailySales ||
                                    []
                                ).length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={
                                                3
                                            }
                                            className="px-4 py-8 text-center text-gray-500"
                                        >
                                            No sales found for this date range.
                                        </td>
                                    </tr>
                                ) : (
                                    report.dailySales.map(
                                        (
                                            item: any
                                        ) => (
                                            <tr
                                                key={
                                                    item.date
                                                }
                                                className="border-t border-gray-100"
                                            >
                                                <td className="px-4 py-3 text-gray-700">
                                                    {item.date}
                                                </td>

                                                <td className="px-4 py-3 text-right text-gray-700">
                                                    {
                                                        item.orderCount
                                                    }
                                                </td>

                                                <td className="px-4 py-3 text-right font-medium text-gray-800">
                                                    {formatCurrency(
                                                        item.totalAmount
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

                {/* Order Details */}
                <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
                    <div className="border-b border-gray-200 p-4">
                        <h2 className="text-lg font-semibold text-gray-800">
                            Order Details
                        </h2>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[700px] text-sm">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left font-semibold text-gray-600">
                                        Order ID
                                    </th>

                                    <th className="px-4 py-3 text-left font-semibold text-gray-600">
                                        Date
                                    </th>

                                    <th className="px-4 py-3 text-left font-semibold text-gray-600">
                                        Status
                                    </th>

                                    <th className="px-4 py-3 text-right font-semibold text-gray-600">
                                        Amount
                                    </th>
                                </tr>
                            </thead>

                            <tbody>
                                {paginatedOrders.length ===
                                    0 ? (
                                    <tr>
                                        <td
                                            colSpan={
                                                4
                                            }
                                            className="px-4 py-8 text-center text-gray-500"
                                        >
                                            No orders found for this date range.
                                        </td>
                                    </tr>
                                ) : (
                                    paginatedOrders.map(
                                        (
                                            order: any
                                        ) => (
                                            <tr
                                                key={
                                                    order.orderId
                                                }
                                                className="border-t border-gray-100"
                                            >
                                                <td className="px-4 py-3 font-medium text-gray-800">
                                                    {
                                                        order.orderId
                                                    }
                                                </td>

                                                <td className="px-4 py-3 text-gray-700">
                                                    {formatDate(
                                                        order.createdAt
                                                    )}
                                                </td>

                                                <td className="px-4 py-3 text-gray-700">
                                                    {order.status}
                                                </td>

                                                <td className="px-4 py-3 text-right font-medium text-gray-800">
                                                    {formatCurrency(
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
                    {orders.length >
                        ROWS_PER_PAGE && (
                            <div className="flex flex-wrap items-center justify-center gap-2 border-t border-gray-200 p-4">
                                <button
                                    type="button"
                                    onClick={() =>
                                        goToPage(1)
                                    }
                                    disabled={
                                        currentPage ===
                                        1
                                    }
                                    className="rounded border px-3 py-1.5 text-sm disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                    First
                                </button>

                                <button
                                    type="button"
                                    onClick={() =>
                                        goToPage(
                                            currentPage -
                                            1
                                        )
                                    }
                                    disabled={
                                        currentPage ===
                                        1
                                    }
                                    className="rounded border px-3 py-1.5 text-sm disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                    Previous
                                </button>

                                {Array.from(
                                    {
                                        length: totalPages,
                                    },
                                    (_, index) =>
                                        index + 1
                                ).map((page) => (
                                    <button
                                        key={
                                            page
                                        }
                                        type="button"
                                        onClick={() =>
                                            goToPage(
                                                page
                                            )
                                        }
                                        className={`rounded border px-3 py-1.5 text-sm ${currentPage ===
                                                page
                                                ? "bg-blue-600 text-white"
                                                : "bg-white text-gray-700"
                                            }`}
                                    >
                                        {page}
                                    </button>
                                ))}

                                <button
                                    type="button"
                                    onClick={() =>
                                        goToPage(
                                            currentPage +
                                            1
                                        )
                                    }
                                    disabled={
                                        currentPage ===
                                        totalPages
                                    }
                                    className="rounded border px-3 py-1.5 text-sm disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                    Next
                                </button>

                                <button
                                    type="button"
                                    onClick={() =>
                                        goToPage(
                                            totalPages
                                        )
                                    }
                                    disabled={
                                        currentPage ===
                                        totalPages
                                    }
                                    className="rounded border px-3 py-1.5 text-sm disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                    Last
                                </button>
                            </div>
                        )}
                </div>
            </div>
        );
    };

export default AdminBulkSalesReportPage;