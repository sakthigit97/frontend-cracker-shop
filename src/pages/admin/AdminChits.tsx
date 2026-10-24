import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
    FaArrowLeft,
    FaCalendarAlt,
    FaChevronLeft,
    FaChevronRight,
    FaCoins,
    FaSearch,
    FaUsers,
} from "react-icons/fa";
import { useAlert } from "../../store/alert.store";
import { createChit, listAdminChits } from "../../services/chit.api";
import type { ChitScheme } from "../../types/chit";

const fieldClass = "mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm";
const currency = (amount: number) =>
    `₹${Number(amount || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
const formatDate = (date: string) =>
    new Date(`${date}T00:00:00`).toLocaleDateString("en-IN");
const PAGE_SIZE = 9;

function getSchemeStatus(scheme: ChitScheme, today: string) {
    if (scheme.endDate < today) return "Completed";
    if (scheme.startDate <= today) return "Active";
    return "Upcoming";
}

function SchemeCardSkeleton() {
    return (
        <div className="animate-pulse rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
                <div className="h-5 w-36 rounded bg-gray-200" />
                <div className="h-6 w-20 rounded-full bg-gray-200" />
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="h-16 rounded-xl bg-gray-100" />
                <div className="h-16 rounded-xl bg-gray-100" />
                <div className="h-16 rounded-xl bg-gray-100" />
                <div className="h-16 rounded-xl bg-gray-100" />
            </div>
            <div className="mt-5 h-10 rounded-lg bg-gray-100" />
        </div>
    );
}

interface FormState {
    name: string;
    description: string;
    packageAmount: string;
    discountType: "flat" | "percentage";
    discountValue: string;
    monthlyAmount: string;
    joinDeadline: string;
    startDate: string;
    endDate: string;
    reminderDate: string;
}

const emptyForm: FormState = {
    name: "",
    description: "",
    packageAmount: "",
    discountType: "flat",
    discountValue: "0",
    monthlyAmount: "",
    joinDeadline: "",
    startDate: "",
    endDate: "",
    reminderDate: "",
};

export default function AdminChits() {
    const navigate = useNavigate();
    const { showAlert } = useAlert();
    const [schemes, setSchemes] = useState<ChitScheme[]>([]);
    const [form, setForm] = useState<FormState>(emptyForm);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");
    const [page, setPage] = useState(1);
    const hasLoadedSchemes = useRef(false);

    const loadSchemes = useCallback(async () => {
        try {
            if (!hasLoadedSchemes.current) setLoading(true);
            setSchemes(await listAdminChits());
        } catch (error) {
            console.error("Unable to load chit schemes:", error);
            showAlert({
                type: "error",
                message: error instanceof Error ? error.message : "Unable to load chit schemes.",
            });
        } finally {
            hasLoadedSchemes.current = true;
            setLoading(false);
        }
    }, [showAlert]);

    useEffect(() => {
        void loadSchemes();
    }, [loadSchemes]);

    const payableAmount = useMemo(() => {
        const amount = Number(form.packageAmount);
        const discount = Number(form.discountValue);
        if (!Number.isFinite(amount) || !Number.isFinite(discount)) return 0;
        const value = form.discountType === "flat" ? discount : amount * discount / 100;
        return Math.max(0, Math.round((amount - value) * 100) / 100);
    }, [form.packageAmount, form.discountType, form.discountValue]);
    const installmentCount = Number(form.monthlyAmount) > 0
        ? Math.ceil(payableAmount / Number(form.monthlyAmount))
        : 0;
    const finalInstallment = installmentCount > 0
        ? Math.round(
            (payableAmount -
                Number(form.monthlyAmount) * (installmentCount - 1)) * 100
        ) / 100
        : 0;
    const today = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Kolkata",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    }).format(new Date());
    const filteredSchemes = useMemo(() => {
        const query = search.trim().toLowerCase();
        return schemes.filter((scheme) => {
            const matchesSearch =
                !query ||
                `${scheme.name} ${scheme.description ?? ""}`.toLowerCase().includes(query);
            const matchesStatus =
                statusFilter === "All" ||
                getSchemeStatus(scheme, today) === statusFilter;
            return matchesSearch && matchesStatus;
        });
    }, [schemes, search, statusFilter, today]);
    const totalPages = Math.max(1, Math.ceil(filteredSchemes.length / PAGE_SIZE));
    const pagedSchemes = filteredSchemes.slice(
        (page - 1) * PAGE_SIZE,
        page * PAGE_SIZE
    );
    const statusCounts = schemes.reduce(
        (counts, scheme) => {
            counts[getSchemeStatus(scheme, today)] += 1;
            return counts;
        },
        { Upcoming: 0, Active: 0, Completed: 0 }
    );

    const updateField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
        setForm((current) => ({ ...current, [key]: value }));
    };

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        try {
            setSubmitting(true);
            await createChit({
                ...form,
                packageAmount: Number(form.packageAmount),
                discountValue: Number(form.discountValue),
                monthlyAmount: Number(form.monthlyAmount),
            });
            setForm(emptyForm);
            showAlert({ type: "success", message: "Chit scheme created successfully." });
            await loadSchemes();
        } catch (error) {
            console.error("Unable to create chit scheme:", error);
            showAlert({
                type: "error",
                message: error instanceof Error ? error.message : "Unable to create chit scheme.",
            });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="mx-auto w-full max-w-7xl space-y-6">
            <header className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <button
                    type="button"
                    onClick={() => navigate(-1)}
                    aria-label="Go back"
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)] text-white shadow-sm transition hover:scale-105 active:scale-95"
                >
                    <FaArrowLeft />
                </button>
                <div>
                    <h1 className="text-2xl font-semibold text-[var(--color-primary)] sm:text-3xl">Chit schemes</h1>
                    <p className="mt-1 text-sm text-gray-500">Create payment plans and manage members and installments.</p>
                </div>
            </header>

            <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl border bg-white p-6 shadow-sm">
                <h2 className="text-lg font-semibold">Create a scheme</h2>
                <div className="grid gap-4 md:grid-cols-2">
                    <label className="text-sm font-medium">Scheme name
                        <input className={fieldClass} required maxLength={100} value={form.name} onChange={(event) => updateField("name", event.target.value)} />
                    </label>
                    <label className="text-sm font-medium">Package amount (₹)
                        <input className={fieldClass} required type="number" min="0.01" step="0.01" value={form.packageAmount} onChange={(event) => updateField("packageAmount", event.target.value)} />
                    </label>
                    <label className="text-sm font-medium">Description
                        <input className={fieldClass} maxLength={300} value={form.description} onChange={(event) => updateField("description", event.target.value)} />
                    </label>
                    <div className="grid grid-cols-[1fr_1fr] gap-3">
                        <label className="text-sm font-medium">Discount type
                            <select className={fieldClass} value={form.discountType} onChange={(event) => updateField("discountType", event.target.value as FormState["discountType"])}>
                                <option value="flat">Flat amount</option>
                                <option value="percentage">Percentage</option>
                            </select>
                        </label>
                        <label className="text-sm font-medium">Discount
                            <input className={fieldClass} required type="number" min="0" step="0.01" max={form.discountType === "percentage" ? 100 : undefined} value={form.discountValue} onChange={(event) => updateField("discountValue", event.target.value)} />
                        </label>
                    </div>
                    <label className="text-sm font-medium">Monthly installment (₹)
                        <input className={fieldClass} required type="number" min="0.01" step="0.01" value={form.monthlyAmount} onChange={(event) => updateField("monthlyAmount", event.target.value)} />
                    </label>
                    <div className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
                        Discounted payable amount: <strong>{currency(payableAmount)}</strong>. The last installment is reduced to the remaining balance.
                        {installmentCount > 0 && (
                            <span className="mt-1 block">
                                Schedule: {installmentCount} installments, final installment {currency(finalInstallment)}.
                            </span>
                        )}
                    </div>
                </div>

                <div>
                    <h3 className="mb-3 font-semibold">Scheme dates</h3>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <label className="text-sm font-medium">Join deadline
                            <input className={fieldClass} required type="date" value={form.joinDeadline} onChange={(event) => updateField("joinDeadline", event.target.value)} />
                        </label>
                        <label className="text-sm font-medium">First payment date
                            <input className={fieldClass} required type="date" value={form.startDate} onChange={(event) => updateField("startDate", event.target.value)} />
                        </label>
                        <label className="text-sm font-medium">Planned payment end
                            <input className={fieldClass} required type="date" value={form.endDate} onChange={(event) => updateField("endDate", event.target.value)} />
                        </label>
                        <label className="text-sm font-medium">One-time reminder date
                            <input className={fieldClass} required type="date" value={form.reminderDate} onChange={(event) => updateField("reminderDate", event.target.value)} />
                        </label>
                    </div>
                    <p className="mt-2 text-xs text-gray-500">
                        Members can join before the first payment date. Reminders go to enrolled members with a balance remaining, using the channels enabled in admin settings.
                    </p>
                </div>

                <button type="submit" disabled={submitting} className="rounded-lg bg-[var(--color-primary)] px-5 py-2.5 font-semibold text-white disabled:opacity-50">
                    {submitting ? "Creating..." : "Create scheme"}
                </button>
            </form>

            <section className="space-y-5">
                <div className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="text-xl font-semibold text-gray-900">All schemes</h2>
                        <p className="mt-1 text-sm text-gray-500">
                            Browse schemes, check dates, and open member payment records.
                        </p>
                    </div>
                    <div className="grid grid-cols-3 gap-2 sm:min-w-[330px]">
                        {[
                            ["Upcoming", statusCounts.Upcoming, "text-blue-700 bg-blue-50"],
                            ["Active", statusCounts.Active, "text-emerald-700 bg-emerald-50"],
                            ["Completed", statusCounts.Completed, "text-gray-600 bg-gray-100"],
                        ].map(([label, count, color]) => (
                            <div key={label} className={`rounded-xl px-3 py-2 text-center ${color}`}>
                                <p className="text-lg font-bold">{count}</p>
                                <p className="text-xs">{label}</p>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_190px]">
                    <label className="relative block">
                        <FaSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="search"
                            value={search}
                            onChange={(event) => {
                                setSearch(event.target.value);
                                setPage(1);
                            }}
                            placeholder="Search schemes"
                            aria-label="Search chit schemes"
                            className="w-full rounded-xl border border-gray-300 bg-white py-3 pl-10 pr-4 text-sm outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/10"
                        />
                    </label>
                    <select
                        value={statusFilter}
                        onChange={(event) => {
                            setStatusFilter(event.target.value);
                            setPage(1);
                        }}
                        aria-label="Filter schemes by status"
                        className="w-full rounded-xl border border-gray-300 bg-white px-3 py-3 text-sm outline-none focus:border-[var(--color-primary)]"
                    >
                        <option>All</option>
                        <option>Upcoming</option>
                        <option>Active</option>
                        <option>Completed</option>
                    </select>
                </div>

                {loading ? (
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                        {Array.from({ length: 6 }).map((_, index) => (
                            <SchemeCardSkeleton key={index} />
                        ))}
                    </div>
                ) : schemes.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-14 text-center">
                        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-700">
                            <FaCoins size={22} />
                        </span>
                        <h3 className="mt-4 text-lg font-semibold text-gray-900">No schemes created yet</h3>
                        <p className="mt-1 text-sm text-gray-500">Create your first chit scheme using the form above.</p>
                    </div>
                ) : filteredSchemes.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-12 text-center">
                        <h3 className="font-semibold text-gray-900">No matching schemes</h3>
                        <p className="mt-1 text-sm text-gray-500">Try a different search term or status filter.</p>
                    </div>
                ) : (
                    <>
                        <div className="grid items-stretch gap-4 sm:grid-cols-2 xl:grid-cols-3">
                            {pagedSchemes.map((scheme) => {
                                const status = getSchemeStatus(scheme, today);
                                const statusClass = status === "Active"
                                    ? "bg-emerald-50 text-emerald-700 ring-emerald-600/10"
                                    : status === "Upcoming"
                                        ? "bg-blue-50 text-blue-700 ring-blue-600/10"
                                        : "bg-gray-100 text-gray-600 ring-gray-500/10";
                                const joinOpen = scheme.joinDeadline >= today && scheme.startDate > today;
                                return (
                                    <article key={scheme.chitId} className="flex min-w-0 flex-col rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-gray-300 hover:shadow-md">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex min-w-0 items-center gap-3">
                                                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
                                                    <FaCoins />
                                                </span>
                                                <div className="min-w-0">
                                                    <h3 className="truncate font-semibold text-gray-900" title={scheme.name}>{scheme.name}</h3>
                                                    <p className="mt-0.5 text-xs text-gray-500">
                                                        {scheme.discountType === "percentage"
                                                            ? `${scheme.discountValue}% discount`
                                                            : `${currency(scheme.discountValue)} discount`}
                                                    </p>
                                                </div>
                                            </div>
                                            <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${statusClass}`}>
                                                {status}
                                            </span>
                                        </div>

                                        {scheme.description && (
                                            <p className="mt-4 line-clamp-2 min-h-10 text-sm leading-5 text-gray-500">{scheme.description}</p>
                                        )}

                                        <div className="mt-4 grid grid-cols-2 gap-2">
                                            <div className="rounded-xl bg-gray-50 p-3">
                                                <p className="text-xs text-gray-500">Package</p>
                                                <p className="mt-1 truncate font-semibold text-gray-900">{currency(scheme.packageAmount)}</p>
                                            </div>
                                            <div className="rounded-xl bg-amber-50 p-3">
                                                <p className="text-xs text-amber-800">Payable</p>
                                                <p className="mt-1 truncate font-semibold text-amber-950">{currency(scheme.payableAmount)}</p>
                                            </div>
                                            <div className="rounded-xl bg-gray-50 p-3">
                                                <p className="text-xs text-gray-500">Monthly up to</p>
                                                <p className="mt-1 truncate font-semibold text-gray-900">{currency(scheme.monthlyAmount)}</p>
                                            </div>
                                            <div className="rounded-xl bg-gray-50 p-3">
                                                <p className="text-xs text-gray-500">Join deadline</p>
                                                <p className="mt-1 truncate font-semibold text-gray-900">{formatDate(scheme.joinDeadline)}</p>
                                            </div>
                                        </div>

                                        <div className="mt-4 flex items-center gap-2 text-xs text-gray-500">
                                            <FaCalendarAlt className="shrink-0" />
                                            <span className="truncate">{formatDate(scheme.startDate)} – {formatDate(scheme.endDate)}</span>
                                        </div>

                                        <div className="mt-auto pt-5">
                                            <span className={`mb-3 inline-flex items-center gap-1.5 text-xs font-medium ${joinOpen ? "text-emerald-700" : "text-gray-500"}`}>
                                                <FaUsers />
                                                {joinOpen ? "Joining open" : "Joining closed"}
                                            </span>
                                            <Link
                                                className="flex w-full items-center justify-center rounded-xl bg-[var(--color-primary)] px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90"
                                                to={`/admin/chits/${scheme.chitId}`}
                                            >
                                                Manage members & payments
                                                <FaChevronRight className="ml-2 text-xs" />
                                            </Link>
                                        </div>
                                    </article>
                                );
                            })}
                        </div>
                        <div className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-600 sm:flex-row sm:items-center sm:justify-between">
                            <span>
                                Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filteredSchemes.length)} of {filteredSchemes.length} schemes
                            </span>
                            <div className="flex items-center justify-between gap-2 sm:justify-end">
                                <button
                                    type="button"
                                    disabled={page === 1}
                                    onClick={() => setPage((current) => Math.max(1, current - 1))}
                                    className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 font-medium disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                    <FaChevronLeft /> Previous
                                </button>
                                <span className="px-2 font-medium text-gray-900">{page} / {totalPages}</span>
                                <button
                                    type="button"
                                    disabled={page >= totalPages}
                                    onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                                    className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 font-medium disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                    Next <FaChevronRight />
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </section>
        </div>
    );
}
