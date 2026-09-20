import React, { useEffect, useMemo, useState } from "react";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
} from "recharts";
import { useAdminRevenueStore } from "../../../store/adminRevenue.store";
import ProductSkeleton from "../../../components/product/ProductSkeleton";
import Button from "../../../components/ui/Button";
import EmptyState from "../../../components/ui/EmptyState";
import { useNavigate } from "react-router-dom";
import { getBulkSalesReport } from "../../../services/product.api";

const ROWS_PER_PAGE = 10;

const SALES_STATUSES = [
    "PAYMENT_CONFIRMED",
    "ORDER_PACKED",
    "DISPATCHED",
];

type ReportType = "retail" | "bulk";

const formatCurrency = (value: number) =>
    `₹${Number(value || 0).toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`;

const formatBulkCurrency = (value: number) =>
    `₹${Number(value || 0).toLocaleString("en-IN", {
        maximumFractionDigits: 0,
    })}`;

const formatDate = (timestamp: number) =>
    new Date(timestamp).toLocaleDateString("en-IN");

const getToday = () =>
    new Date().toISOString().split("T")[0];

const getFirstDayOfMonth = () => {
    const date = new Date();

    date.setDate(1);

    return date.toISOString().split("T")[0];
};

export default function RevenueReport() {
    const navigate = useNavigate();

    const {
        data,
        loading: retailLoading,
        error: retailError,
        fetch,
    } = useAdminRevenueStore();

    /*
     * ---------------------------------------------------------
     * Report Type
     * ---------------------------------------------------------
     *
     * Retail is always selected by default.
     */
    const [reportType, setReportType] =
        useState<ReportType>("retail");

    /*
     * ---------------------------------------------------------
     * Retail Filters
     * ---------------------------------------------------------
     */
    const [range, setRange] = useState("7d");

    const [retailFromDate, setRetailFromDate] =
        useState("");

    const [retailToDate, setRetailToDate] =
        useState("");

    /*
     * ---------------------------------------------------------
     * Bulk Filters
     * ---------------------------------------------------------
     */
    const [bulkFromDate, setBulkFromDate] =
        useState(getFirstDayOfMonth());

    const [bulkToDate, setBulkToDate] =
        useState(getToday());

    const [bulkReport, setBulkReport] =
        useState<any>(null);

    const [bulkLoading, setBulkLoading] =
        useState(false);

    const [bulkError, setBulkError] =
        useState("");

    const [bulkCurrentPage, setBulkCurrentPage] =
        useState(1);

    /*
     * ---------------------------------------------------------
     * Retail Initial Load
     * ---------------------------------------------------------
     */
    useEffect(() => {
        fetch(range);
    }, [range]);

    /*
     * ---------------------------------------------------------
     * Bulk Report
     * ---------------------------------------------------------
     */
    const loadBulkReport = async () => {
        if (!bulkFromDate || !bulkToDate) {
            return;
        }

        if (bulkFromDate > bulkToDate) {
            setBulkError(
                "From Date cannot be greater than To Date."
            );
            return;
        }

        setBulkLoading(true);
        setBulkError("");

        try {
            const result =
                await getBulkSalesReport({
                    fromDate: bulkFromDate,
                    toDate: bulkToDate,
                });

            setBulkReport(result);
            setBulkCurrentPage(1);
        } catch (err: any) {
            console.error(
                "Bulk Sales Report error",
                err
            );

            setBulkError(
                err?.message ||
                "Failed to load sales report"
            );
        } finally {
            setBulkLoading(false);
        }
    };

    /*
     * ---------------------------------------------------------
     * Bulk Initial Load
     * ---------------------------------------------------------
     */
    useEffect(() => {
        if (reportType === "bulk") {
            loadBulkReport();
        }
    }, []);

    /*
     * ---------------------------------------------------------
     * Retail Custom Filter
     * ---------------------------------------------------------
     */
    const handleRetailCustomFilter = () => {
        if (
            !retailFromDate ||
            !retailToDate
        ) {
            return;
        }

        if (
            retailFromDate >
            retailToDate
        ) {
            return;
        }

        fetch(
            undefined,
            retailFromDate,
            retailToDate
        );
    };

    /*
     * ---------------------------------------------------------
     * Tab Change
     * ---------------------------------------------------------
     */
    const handleTabChange = (
        type: ReportType
    ) => {
        if (type === reportType) {
            return;
        }

        setReportType(type);

        /*
         * Retail is already maintained by the
         * existing revenue store.
         *
         * Bulk loads its own report.
         */
        if (type === "bulk") {
            loadBulkReport();
        }
    };

    /*
     * ---------------------------------------------------------
     * Bulk Orders
     * ---------------------------------------------------------
     */
    const bulkOrders = useMemo(() => {
        return (
            bulkReport?.orders || []
        ).filter((order: any) =>
            SALES_STATUSES.includes(
                order.status
            )
        );
    }, [bulkReport]);

    /*
     * ---------------------------------------------------------
     * Bulk Pagination
     * ---------------------------------------------------------
     */
    const bulkTotalPages = Math.max(
        1,
        Math.ceil(
            bulkOrders.length /
            ROWS_PER_PAGE
        )
    );

    const paginatedBulkOrders =
        bulkOrders.slice(
            (bulkCurrentPage - 1) *
            ROWS_PER_PAGE,
            bulkCurrentPage *
            ROWS_PER_PAGE
        );

    const goToBulkPage = (
        page: number
    ) => {
        setBulkCurrentPage(
            Math.min(
                Math.max(page, 1),
                bulkTotalPages
            )
        );
    };

    /*
     * ---------------------------------------------------------
     * Retail Loading
     * ---------------------------------------------------------
     */
    if (
        reportType === "retail" &&
        retailLoading &&
        !data
    ) {
        return (
            <div className="space-y-6">
                <ReportTabs
                    reportType={reportType}
                    onChange={handleTabChange}
                />

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {Array.from({
                        length: 4,
                    }).map((_, i) => (
                        <ProductSkeleton
                            key={i}
                        />
                    ))}
                </div>
            </div>
        );
    }

    /*
     * ---------------------------------------------------------
     * Retail Error
     * ---------------------------------------------------------
     */
    if (
        reportType === "retail" &&
        retailError
    ) {
        return (
            <div className="space-y-6">
                <ReportTabs
                    reportType={reportType}
                    onChange={handleTabChange}
                />

                <div className="py-20 text-center">
                    <p className="text-red-500 mb-4">
                        Failed to load
                        revenue data
                    </p>

                    <Button
                        onClick={() =>
                            fetch(range)
                        }
                    >
                        Retry
                    </Button>
                </div>
            </div>
        );
    }

    /*
     * ---------------------------------------------------------
     * Main Render
     * ---------------------------------------------------------
     */
    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center gap-3">
                <button
                    onClick={() =>
                        navigate(-1)
                    }
                    className="
                        flex items-center justify-center
                        w-9 h-9
                        rounded-full
                        bg-[var(--color-primary)]
                        text-white
                        shadow-sm
                        hover:scale-105
                        active:scale-95
                        transition-all
                    "
                >
                    ←
                </button>

                <div>
                    <h1 className="text-xl md:text-2xl font-semibold text-[var(--color-primary)]">
                        Revenue Report
                    </h1>

                    <p className="text-sm text-gray-500 mt-1">
                        View retail and bulk
                        order sales reports.
                    </p>
                </div>
            </div>

            {/* Report Tabs */}
            <ReportTabs
                reportType={reportType}
                onChange={handleTabChange}
            />

            {reportType === "retail" && (
                <div className="space-y-8">
                    {/* Retail Header / Quick Filters */}
                    <div className="flex flex-wrap justify-between gap-4 items-center">
                        <div>
                            <h2 className="text-lg font-semibold text-gray-800">
                                Retail Orders
                            </h2>
                        </div>

                        <div className="flex gap-2">
                            <button
                                onClick={() =>
                                    setRange(
                                        "7d"
                                    )
                                }
                                className={`px-3 py-1 rounded ${range ===
                                        "7d"
                                        ? "bg-[var(--color-primary)] text-white"
                                        : "bg-gray-100"
                                    }`}
                            >
                                7 Days
                            </button>

                            <button
                                onClick={() =>
                                    setRange(
                                        "30d"
                                    )
                                }
                                className={`px-3 py-1 rounded ${range ===
                                        "30d"
                                        ? "bg-[var(--color-primary)] text-white"
                                        : "bg-gray-100"
                                    }`}
                            >
                                30 Days
                            </button>
                        </div>
                    </div>

                    {/* Retail Custom Date Filter */}
                    <div className="bg-white border rounded-xl p-4 sm:p-5 shadow-sm">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                                {/* From */}
                                <div className="flex flex-col text-sm w-full sm:w-auto">
                                    <label className="text-gray-500 mb-1">
                                        From
                                    </label>

                                    <input
                                        type="date"
                                        value={
                                            retailFromDate
                                        }
                                        onChange={(
                                            e
                                        ) =>
                                            setRetailFromDate(
                                                e
                                                    .target
                                                    .value
                                            )
                                        }
                                        className="border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                                    />
                                </div>

                                {/* To */}
                                <div className="flex flex-col text-sm w-full sm:w-auto">
                                    <label className="text-gray-500 mb-1">
                                        To
                                    </label>

                                    <input
                                        type="date"
                                        value={
                                            retailToDate
                                        }
                                        onChange={(
                                            e
                                        ) =>
                                            setRetailToDate(
                                                e
                                                    .target
                                                    .value
                                            )
                                        }
                                        className="border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-2 w-full sm:w-auto">
                                <Button
                                    onClick={
                                        handleRetailCustomFilter
                                    }
                                    className="w-full sm:w-auto"
                                >
                                    Apply
                                </Button>

                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setRetailFromDate(
                                            ""
                                        );
                                        setRetailToDate(
                                            ""
                                        );
                                        setRange(
                                            "7d"
                                        );
                                        fetch(
                                            "7d"
                                        );
                                    }}
                                    className="w-full sm:w-auto"
                                >
                                    Reset
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Retail Report Data */}
                    {data &&
                        data.trend.length >
                        0 ? (
                        <>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                <StatCard
                                    label="Revenue"
                                    value={formatCurrency(
                                        data.totalRevenue
                                    )}
                                />

                                <StatCard
                                    label="Orders"
                                    value={
                                        data.totalOrders
                                    }
                                />

                                <StatCard
                                    label="Avg Order"
                                    value={formatCurrency(
                                        data.avgOrderValue
                                    )}
                                />

                                <StatCard
                                    label="Growth"
                                    value={`${data.growth.toFixed(
                                        1
                                    )}%`}
                                />
                            </div>

                            <div className="bg-white rounded-xl border p-5">
                                <h2 className="font-semibold mb-4">
                                    Revenue
                                    Trend
                                </h2>

                                <div className="h-[300px]">
                                    <ResponsiveContainer>
                                        <LineChart
                                            data={
                                                data.trend
                                            }
                                        >
                                            <XAxis
                                                dataKey="date"
                                            />

                                            <YAxis />

                                            <Tooltip />

                                            <Line
                                                dataKey="revenue"
                                                stroke="#6366f1"
                                            />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="bg-white border rounded-xl p-10 text-center">
                            <EmptyState
                                title="No records found"
                                description="No revenue data for selected filters"
                            />
                        </div>
                    )}
                </div>
            )}

            {reportType === "bulk" && (
                <div className="space-y-6">
                    {/* Bulk Filters */}
                    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                            {/* From Date */}
                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">
                                    From Date
                                </label>

                                <input
                                    type="date"
                                    value={
                                        bulkFromDate
                                    }
                                    onChange={(
                                        e
                                    ) =>
                                        setBulkFromDate(
                                            e
                                                .target
                                                .value
                                        )
                                    }
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                                />
                            </div>

                            {/* To Date */}
                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">
                                    To Date
                                </label>

                                <input
                                    type="date"
                                    value={
                                        bulkToDate
                                    }
                                    onChange={(
                                        e
                                    ) =>
                                        setBulkToDate(
                                            e
                                                .target
                                                .value
                                        )
                                    }
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                                />
                            </div>

                            {/* Apply */}
                            <div className="flex items-end">
                                <button
                                    type="button"
                                    onClick={
                                        loadBulkReport
                                    }
                                    disabled={
                                        bulkLoading
                                    }
                                    className="w-full rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {bulkLoading
                                        ? "Loading..."
                                        : "Apply Filter"}
                                </button>
                            </div>
                        </div>

                        {bulkError && (
                            <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                                {
                                    bulkError
                                }
                            </div>
                        )}
                    </div>

                    {/* Bulk Summary */}
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                            <p className="text-sm text-gray-500">
                                Total Orders
                            </p>

                            <p className="mt-2 text-2xl font-bold text-gray-800">
                                {bulkReport
                                    ?.summary
                                    ?.totalOrders ??
                                    0}
                            </p>
                        </div>

                        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                            <p className="text-sm text-gray-500">
                                Total Sales
                            </p>

                            <p className="mt-2 text-2xl font-bold text-gray-800">
                                {formatBulkCurrency(
                                    bulkReport
                                        ?.summary
                                        ?.totalSales ??
                                    0
                                )}
                            </p>
                        </div>

                        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                            <p className="text-sm text-gray-500">
                                Average Order
                                Value
                            </p>

                            <p className="mt-2 text-2xl font-bold text-gray-800">
                                {formatBulkCurrency(
                                    bulkReport
                                        ?.summary
                                        ?.averageOrderValue ??
                                    0
                                )}
                            </p>
                        </div>
                    </div>

                    {/* Daily Sales */}
                    <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
                        <div className="border-b border-gray-200 p-4">
                            <h2 className="text-lg font-semibold text-gray-800">
                                Daily Sales
                                Summary
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
                                        bulkReport?.dailySales ||
                                        []
                                    ).length ===
                                        0 ? (
                                        <tr>
                                            <td
                                                colSpan={
                                                    3
                                                }
                                                className="px-4 py-8 text-center text-gray-500"
                                            >
                                                No sales
                                                found
                                                for
                                                this
                                                date
                                                range.
                                            </td>
                                        </tr>
                                    ) : (
                                        bulkReport.dailySales.map(
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
                                                        {
                                                            item.date
                                                        }
                                                    </td>

                                                    <td className="px-4 py-3 text-right text-gray-700">
                                                        {
                                                            item.orderCount
                                                        }
                                                    </td>

                                                    <td className="px-4 py-3 text-right font-medium text-gray-800">
                                                        {formatBulkCurrency(
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
                                Order
                                Details
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
                                    {paginatedBulkOrders.length ===
                                        0 ? (
                                        <tr>
                                            <td
                                                colSpan={
                                                    4
                                                }
                                                className="px-4 py-8 text-center text-gray-500"
                                            >
                                                No
                                                orders
                                                found
                                                for
                                                this
                                                date
                                                range.
                                            </td>
                                        </tr>
                                    ) : (
                                        paginatedBulkOrders.map(
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
                                                        {
                                                            order.status
                                                        }
                                                    </td>

                                                    <td className="px-4 py-3 text-right font-medium text-gray-800">
                                                        {formatBulkCurrency(
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

                        {/* Bulk Pagination */}
                        {bulkOrders.length >
                            ROWS_PER_PAGE && (
                                <div className="flex flex-wrap items-center justify-center gap-2 border-t border-gray-200 p-4">
                                    <button
                                        type="button"
                                        onClick={() =>
                                            goToBulkPage(
                                                1
                                            )
                                        }
                                        disabled={
                                            bulkCurrentPage ===
                                            1
                                        }
                                        className="rounded border px-3 py-1.5 text-sm disabled:cursor-not-allowed disabled:opacity-40"
                                    >
                                        First
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() =>
                                            goToBulkPage(
                                                bulkCurrentPage -
                                                1
                                            )
                                        }
                                        disabled={
                                            bulkCurrentPage ===
                                            1
                                        }
                                        className="rounded border px-3 py-1.5 text-sm disabled:cursor-not-allowed disabled:opacity-40"
                                    >
                                        Previous
                                    </button>

                                    {Array.from(
                                        {
                                            length: bulkTotalPages,
                                        },
                                        (
                                            _,
                                            index
                                        ) =>
                                            index +
                                            1
                                    ).map(
                                        (
                                            page
                                        ) => (
                                            <button
                                                key={
                                                    page
                                                }
                                                type="button"
                                                onClick={() =>
                                                    goToBulkPage(
                                                        page
                                                    )
                                                }
                                                className={`rounded border px-3 py-1.5 text-sm ${bulkCurrentPage ===
                                                        page
                                                        ? "bg-[var(--color-primary)] text-white"
                                                        : "bg-white text-gray-700"
                                                    }`}
                                            >
                                                {
                                                    page
                                                }
                                            </button>
                                        )
                                    )}

                                    <button
                                        type="button"
                                        onClick={() =>
                                            goToBulkPage(
                                                bulkCurrentPage +
                                                1
                                            )
                                        }
                                        disabled={
                                            bulkCurrentPage ===
                                            bulkTotalPages
                                        }
                                        className="rounded border px-3 py-1.5 text-sm disabled:cursor-not-allowed disabled:opacity-40"
                                    >
                                        Next
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() =>
                                            goToBulkPage(
                                                bulkTotalPages
                                            )
                                        }
                                        disabled={
                                            bulkCurrentPage ===
                                            bulkTotalPages
                                        }
                                        className="rounded border px-3 py-1.5 text-sm disabled:cursor-not-allowed disabled:opacity-40"
                                    >
                                        Last
                                    </button>
                                </div>
                            )}
                    </div>
                </div>
            )}
        </div>
    );
}

/*
 * =============================================================
 * Report Tabs
 * =============================================================
 */

function ReportTabs({
    reportType,
    onChange,
}: {
    reportType: ReportType;
    onChange: (
        type: ReportType
    ) => void;
}) {
    return (
        <div className="bg-white rounded-xl border shadow-sm p-2">
            <div className="grid grid-cols-2 gap-2">
                <button
                    type="button"
                    onClick={() =>
                        onChange("retail")
                    }
                    className={`
                        px-4
                        py-2.5
                        rounded-lg
                        text-sm
                        font-medium
                        transition
                        ${reportType ===
                            "retail"
                            ? "bg-[var(--color-primary)] text-white"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }
                    `}
                >
                    Retail Orders
                </button>

                <button
                    type="button"
                    onClick={() =>
                        onChange("bulk")
                    }
                    className={`
                        px-4
                        py-2.5
                        rounded-lg
                        text-sm
                        font-medium
                        transition
                        ${reportType ===
                            "bulk"
                            ? "bg-[var(--color-primary)] text-white"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }
                    `}
                >
                    Bulk Orders
                </button>
            </div>
        </div>
    );
}

/*
 * =============================================================
 * Retail Stat Card
 * =============================================================
 */

function StatCard({
    label,
    value,
}: {
    label: string;
    value: React.ReactNode;
}) {
    return (
        <div className="bg-white rounded-xl border p-4 text-center">
            <p className="text-xs text-gray-500">
                {label}
            </p>

            <p className="text-2xl font-bold text-[var(--color-primary)]">
                {value}
            </p>
        </div>
    );
}