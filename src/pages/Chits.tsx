import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    FaArrowLeft,
    FaCheckCircle,
    FaChevronDown,
    FaChevronLeft,
    FaChevronRight,
    FaClock,
    FaCoins,
    FaSearch,
} from "react-icons/fa";
import { useAlert } from "../store/alert.store";
import {
    joinChit,
} from "../services/chit.api";
import type { ChitScheme } from "../types/chit";
import { useChitStore } from "../store/chit.store";

const currency = (amount: number) =>
    `₹${Number(amount || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

const formatDate = (date: string) =>
    new Date(`${date}T00:00:00`).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
    });
const today = () => {
    const parts = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Kolkata",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    }).formatToParts(new Date());
    const datePart = (type: string) =>
        parts.find((part) => part.type === type)?.value ?? "";
    return `${datePart("year")}-${datePart("month")}-${datePart("day")}`;
};
const PAGE_SIZE = 6;

function ChitCardSkeleton() {
    return (
        <div className="animate-pulse rounded-2xl border border-gray-200 bg-white p-5">
            <div className="h-5 w-36 rounded bg-gray-200" />
            <div className="mt-5 grid grid-cols-2 gap-3">
                {Array.from({ length: 4 }).map((_, index) => (
                    <div key={index} className="h-16 rounded-xl bg-gray-100" />
                ))}
            </div>
            <div className="mt-5 h-10 rounded-lg bg-gray-100" />
        </div>
    );
}

export default function Chits() {
    const navigate = useNavigate();
    const { showAlert } = useAlert();
    const available = useChitStore((state) => state.availableChits);
    const myChits = useChitStore((state) => state.myChits);
    const fetchCustomerData = useChitStore((state) => state.fetchCustomerData);
    const [loading, setLoading] = useState(true);
    const [joiningId, setJoiningId] = useState<string | null>(null);
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [openHistory, setOpenHistory] = useState<string | null>(null);
    const hasLoadedChits = useRef(false);

    const load = useCallback(async (force = false) => {
        try {
            if (!hasLoadedChits.current) setLoading(true);
            await fetchCustomerData(force);
        } catch (error) {
            console.error("Unable to load chit schemes:", error);
            showAlert({
                type: "error",
                message: error instanceof Error ? error.message : "Unable to load chit schemes.",
            });
        } finally {
            hasLoadedChits.current = true;
            setLoading(false);
        }
    }, [fetchCustomerData, showAlert]);

    useEffect(() => {
        void load();
    }, [load]);

    const joinedIds = useMemo(
        () => new Set(myChits.map(({ member }) => member.chitId)),
        [myChits]
    );
    const filteredSchemes = useMemo(() => {
        const query = search.trim().toLowerCase();
        return available.filter((scheme) =>
            !query ||
            `${scheme.name} ${scheme.description ?? ""}`.toLowerCase().includes(query)
        );
    }, [available, search]);
    const totalPages = Math.max(1, Math.ceil(filteredSchemes.length / PAGE_SIZE));
    const pagedSchemes = filteredSchemes.slice(
        (page - 1) * PAGE_SIZE,
        page * PAGE_SIZE
    );
    const currentDay = today();

    const handleJoin = async (scheme: ChitScheme) => {
        try {
            setJoiningId(scheme.chitId);
            await joinChit(scheme.chitId);
            showAlert({ type: "success", message: `You joined ${scheme.name}.` });
            await load(true);
        } catch (error) {
            console.error("Unable to join chit scheme:", error);
            showAlert({
                type: "error",
                message: error instanceof Error ? error.message : "Unable to join this scheme.",
            });
        } finally {
            setJoiningId(null);
        }
    };

    return (
        <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
            <header className="overflow-hidden rounded-2xl bg-[var(--color-primary)] text-white shadow-md">
                <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-7">
                    <div className="flex min-w-0 items-start gap-3 sm:items-center sm:gap-4">
                        <button
                            type="button"
                            onClick={() => navigate(-1)}
                            aria-label="Go back"
                            className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 sm:mt-0"
                        >
                            <FaArrowLeft />
                        </button>
                        <div className="min-w-0">
                            <div className="flex items-center gap-2 text-sm text-white/70">
                                <FaCoins className="text-amber-300" />
                                Monthly savings plans
                            </div>
                            <h1 className="mt-1 text-2xl font-bold sm:text-3xl">Chit schemes</h1>
                            <p className="mt-1 max-w-2xl text-sm leading-6 text-white/70">
                                Explore available plans, join before the deadline, and track every installment.
                            </p>
                        </div>
                    </div>
                    {!loading && (
                        <div className="grid grid-cols-2 gap-2 sm:min-w-52">
                            <div className="rounded-xl bg-white/10 px-4 py-3">
                                <p className="text-xs text-white/60">Available plans</p>
                                <p className="mt-1 text-2xl font-bold">{available.length}</p>
                            </div>
                            <div className="rounded-xl bg-white/10 px-4 py-3">
                                <p className="text-xs text-white/60">My plans</p>
                                <p className="mt-1 text-2xl font-bold">{myChits.length}</p>
                            </div>
                        </div>
                    )}
                </div>
            </header>

            {loading ? (
                <div className="space-y-8" aria-label="Loading chit schemes">
                    <section className="space-y-4">
                        <div className="h-6 w-48 animate-pulse rounded bg-gray-200" />
                        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                            {Array.from({ length: 3 }).map((_, index) => (
                                <ChitCardSkeleton key={index} />
                            ))}
                        </div>
                    </section>
                    <section className="space-y-4">
                        <div className="h-6 w-36 animate-pulse rounded bg-gray-200" />
                        <div className="h-36 animate-pulse rounded-2xl border bg-white" />
                    </section>
                </div>
            ) : (
                <>
                    <section className="space-y-4">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                            <div>
                                <h2 className="text-xl font-semibold text-gray-900">Current & upcoming schemes</h2>
                                <p className="mt-1 text-sm text-gray-500">
                                    Join a plan before its payment start date.
                                </p>
                            </div>
                            {available.length > 0 && (
                                <label className="relative block sm:w-72">
                                    <FaSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="search"
                                        value={search}
                                        onChange={(event) => {
                                            setSearch(event.target.value);
                                            setPage(1);
                                        }}
                                        placeholder="Find a scheme"
                                        aria-label="Search available chit schemes"
                                        className="w-full rounded-xl border border-gray-300 bg-white py-2.5 pl-10 pr-3 text-sm outline-none focus:border-[var(--color-primary)]"
                                    />
                                </label>
                            )}
                        </div>
                        {available.length === 0 ? (
                            <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-10 text-center">
                                <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-700">
                                    <FaCoins />
                                </span>
                                <h3 className="mt-3 font-semibold text-gray-900">No current or upcoming schemes</h3>
                                <p className="mt-1 text-sm text-gray-500">New plans will appear here when they become available.</p>
                            </div>
                        ) : filteredSchemes.length === 0 ? (
                            <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-10 text-center text-sm text-gray-500">
                                No schemes match “{search}”.
                            </div>
                        ) : (
                            <>
                                <div className="grid items-stretch gap-4 sm:grid-cols-2 xl:grid-cols-3">
                                    {pagedSchemes.map((scheme) => {
                                        const alreadyJoined = joinedIds.has(scheme.chitId);
                                        const canJoin = scheme.joinDeadline >= currentDay &&
                                            scheme.startDate > currentDay;
                                        const installmentCount = Math.ceil(
                                            scheme.payableAmount / scheme.monthlyAmount
                                        );
                                        const finalInstallment = Math.round(
                                            (scheme.payableAmount -
                                                scheme.monthlyAmount * (installmentCount - 1)) * 100
                                        ) / 100;
                                        return (
                                            <article key={scheme.chitId} className="flex min-w-0 flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                                                <div className="h-1.5 bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500" />
                                                <div className="flex flex-1 flex-col p-5">
                                                    <div className="flex items-start justify-between gap-3">
                                                        <div className="flex min-w-0 items-center gap-3">
                                                            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
                                                                <FaCoins />
                                                            </span>
                                                            <div className="min-w-0">
                                                                <h3 className="truncate font-semibold text-gray-900" title={scheme.name}>{scheme.name}</h3>
                                                                <p className="mt-0.5 text-xs text-gray-500">
                                                                    {scheme.discountType === "percentage"
                                                                        ? `${scheme.discountValue}% savings`
                                                                        : `${currency(scheme.discountValue)} savings`}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${canJoin ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-600"}`}>
                                                            {canJoin ? "Open" : "Started"}
                                                        </span>
                                                    </div>
                                                    <p className="mt-4 line-clamp-2 min-h-10 text-sm leading-5 text-gray-500">
                                                        {scheme.description || "A flexible monthly payment plan with a special scheme discount."}
                                                    </p>
                                                    <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                                                        <div className="rounded-xl bg-gray-50 p-3">
                                                            <span className="block text-xs text-gray-500">Package</span>
                                                            <strong className="mt-1 block truncate text-gray-800">{currency(scheme.packageAmount)}</strong>
                                                        </div>
                                                        <div className="rounded-xl bg-amber-50 p-3">
                                                            <span className="block text-xs text-amber-800">Your total</span>
                                                            <strong className="mt-1 block truncate text-amber-950">{currency(scheme.payableAmount)}</strong>
                                                        </div>
                                                        <div className="rounded-xl bg-gray-50 p-3">
                                                            <span className="block text-xs text-gray-500">Monthly up to</span>
                                                            <strong className="mt-1 block truncate text-gray-800">{currency(scheme.monthlyAmount)}</strong>
                                                        </div>
                                                        <div className="rounded-xl bg-gray-50 p-3">
                                                            <span className="block text-xs text-gray-500">Payment period</span>
                                                            <strong className="mt-1 block truncate text-gray-800">{installmentCount} months</strong>
                                                        </div>
                                                    </div>
                                                    <div className="mt-3 flex items-start justify-between gap-2 rounded-xl border border-gray-100 px-3 py-2.5 text-xs">
                                                        <span className="text-gray-500">Final installment</span>
                                                        <strong className="text-gray-800">{currency(finalInstallment)}</strong>
                                                    </div>
                                                    <div className="mt-4 space-y-2 text-xs text-gray-500">
                                                        <div className="flex items-center justify-between gap-2">
                                                            <span className="inline-flex items-center gap-1.5"><FaClock />Join by</span>
                                                            <strong className="text-gray-700">{formatDate(scheme.joinDeadline)}</strong>
                                                        </div>
                                                        <div className="flex items-center justify-between gap-2">
                                                            <span className="inline-flex items-center gap-1.5"><FaClock />Starts</span>
                                                            <strong className="text-gray-700">{formatDate(scheme.startDate)}</strong>
                                                        </div>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        disabled={alreadyJoined || !canJoin || joiningId === scheme.chitId}
                                                        onClick={() => void handleJoin(scheme)}
                                                        className="mt-auto w-full rounded-xl bg-[var(--color-primary)] px-4 py-3 font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-500"
                                                    >
                                                        {alreadyJoined
                                                            ? "Already joined"
                                                            : joiningId === scheme.chitId
                                                                ? "Joining..."
                                                                : canJoin
                                                                    ? "Join this scheme"
                                                                    : "Joining closed"}
                                                    </button>
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

                    <section className="space-y-4">
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900">My schemes</h2>
                            <p className="mt-1 text-sm text-gray-500">Track your balance and payment history in one place.</p>
                        </div>
                        {myChits.length === 0 ? (
                            <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-10 text-center">
                                <h3 className="font-semibold text-gray-900">You haven’t joined a scheme yet</h3>
                                <p className="mt-1 text-sm text-gray-500">Choose an open scheme above to get started.</p>
                            </div>
                        ) : (
                            <div className="grid items-start gap-4 xl:grid-cols-2">
                                {myChits.map(({ member, scheme }) => {
                                    const remaining = Math.max(0, member.payableAmount - member.totalPaid);
                                    const nextInstallment = member.installments.find(
                                        (installment) => installment.status !== "paid"
                                    );
                                    const progress = member.payableAmount > 0
                                        ? Math.min(100, Math.round(member.totalPaid / member.payableAmount * 100))
                                        : 0;
                                    const historyOpen = openHistory === member.chitId;
                                    return (
                                        <article key={member.chitId} className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                                            <div className="h-1.5 bg-gradient-to-r from-[var(--color-primary)] to-slate-500" />
                                            <div className="p-5 sm:p-6">
                                                <div className="flex items-start justify-between gap-4">
                                                    <div className="min-w-0">
                                                        <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Joined plan</p>
                                                        <h3 className="mt-1 truncate text-lg font-semibold text-gray-900">{scheme?.name ?? "Chit scheme"}</h3>
                                                        <p className="mt-1 text-xs text-gray-500">
                                                            Joined {new Date(member.joinedAt).toLocaleDateString("en-IN")}
                                                        </p>
                                                    </div>
                                                    {remaining === 0 ? (
                                                        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                                                            <FaCheckCircle /> Complete
                                                        </span>
                                                    ) : nextInstallment?.dueDate && nextInstallment.dueDate < currentDay ? (
                                                        <span className="shrink-0 rounded-full bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700">
                                                            Payment overdue
                                                        </span>
                                                    ) : (
                                                        <span className="shrink-0 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                                                            In progress
                                                        </span>
                                                    )}
                                                </div>

                                                <div className="mt-5 grid grid-cols-3 gap-2">
                                                    <div className="rounded-xl bg-gray-50 p-3">
                                                        <p className="text-[11px] text-gray-500">Total</p>
                                                        <p className="mt-1 truncate text-sm font-bold text-gray-900">{currency(member.payableAmount)}</p>
                                                    </div>
                                                    <div className="rounded-xl bg-emerald-50 p-3">
                                                        <p className="text-[11px] text-emerald-700">Paid</p>
                                                        <p className="mt-1 truncate text-sm font-bold text-emerald-900">{currency(member.totalPaid)}</p>
                                                    </div>
                                                    <div className="rounded-xl bg-amber-50 p-3">
                                                        <p className="text-[11px] text-amber-700">Remaining</p>
                                                        <p className="mt-1 truncate text-sm font-bold text-amber-950">{currency(remaining)}</p>
                                                    </div>
                                                </div>
                                                <div className="mt-4">
                                                    <div className="mb-2 flex justify-between text-xs text-gray-500">
                                                        <span>Overall progress</span><span>{progress}%</span>
                                                    </div>
                                                    <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                                                        <div className={`h-full rounded-full ${progress === 100 ? "bg-emerald-500" : "bg-[var(--color-accent)]"}`} style={{ width: `${progress}%` }} />
                                                    </div>
                                                </div>

                                                {nextInstallment && (
                                                    <div className={`mt-4 rounded-xl border p-4 ${nextInstallment.dueDate < currentDay ? "border-rose-200 bg-rose-50/60" : "border-gray-200 bg-gray-50"}`}>
                                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                                            <span className="text-xs font-medium text-gray-500">
                                                                {nextInstallment.dueDate < currentDay ? "Overdue installment" : "Next installment"}
                                                            </span>
                                                            <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-gray-700">
                                                                {formatDate(nextInstallment.dueDate)}
                                                            </span>
                                                        </div>
                                                        <p className="mt-2 text-lg font-bold text-gray-900">
                                                            {currency(nextInstallment.amount - nextInstallment.paidAmount)}
                                                            <span className="ml-1 text-xs font-normal text-gray-500">remaining this month</span>
                                                        </p>
                                                    </div>
                                                )}

                                                <button
                                                    type="button"
                                                    onClick={() => setOpenHistory(historyOpen ? null : member.chitId)}
                                                    aria-expanded={historyOpen}
                                                    className="mt-4 flex w-full items-center justify-between rounded-xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                                                >
                                                    <span>Payment history ({member.installments.length} installments)</span>
                                                    <FaChevronDown className={`transition ${historyOpen ? "rotate-180" : ""}`} />
                                                </button>
                                                {historyOpen && (
                                                    <div className="mt-2 max-h-80 space-y-2 overflow-y-auto pr-1">
                                                        {member.installments.map((installment) => {
                                                            const overdue = installment.status !== "paid" && installment.dueDate < currentDay;
                                                            return (
                                                                <div key={installment.dueDate} className="rounded-xl border border-gray-100 bg-gray-50 p-3">
                                                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                                                        <span className="text-sm font-semibold text-gray-800">Due {formatDate(installment.dueDate)}</span>
                                                                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${installment.status === "paid" ? "bg-emerald-100 text-emerald-700" : overdue ? "bg-rose-100 text-rose-700" : installment.status === "partial" ? "bg-amber-100 text-amber-800" : "bg-gray-200 text-gray-600"}`}>
                                                                            {overdue ? "Overdue" : installment.status}
                                                                        </span>
                                                                    </div>
                                                                    <p className="mt-1 text-xs text-gray-500">
                                                                        {currency(installment.paidAmount)} / {currency(installment.amount)}
                                                                    </p>
                                                                    {installment.paymentHistory.map((payment, index) => (
                                                                        <p key={`${payment.receivedAt}-${index}`} className="mt-2 border-t border-gray-200 pt-2 text-xs text-gray-500">
                                                                            Received {currency(payment.amount)} · {new Date(payment.receivedAt).toLocaleDateString("en-IN")}
                                                                            {payment.note ? ` · ${payment.note}` : ""}
                                                                        </p>
                                                                    ))}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                            </div>
                                        </article>
                                    );
                                })}
                            </div>
                        )}
                    </section>
                </>
            )}
        </div>
    );
}
