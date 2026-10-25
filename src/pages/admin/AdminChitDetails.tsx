import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
    FaArrowLeft,
    FaCalendarAlt,
    FaCheckCircle,
    FaChevronDown,
    FaClock,
    FaSearch,
    FaUsers,
} from "react-icons/fa";
import { useAlert } from "../../store/alert.store";
import { recordChitPayment } from "../../services/chit.api";
import type { ChitMember } from "../../types/chit";
import { useChitStore } from "../../store/chit.store";

const EMPTY_MEMBERS: ChitMember[] = [];

const currency = (amount: number) =>
    `₹${Number(amount || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
const dateLabel = (value: string) =>
    new Date(`${value}T00:00:00`).toLocaleDateString("en-IN");
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

export default function AdminChitDetails() {
    const { chitId = "" } = useParams();
    const navigate = useNavigate();
    const { showAlert } = useAlert();
    const cachedDetails = useChitStore((state) => state.membersByChitId[chitId]);
    const scheme = cachedDetails?.scheme ?? null;
    const members = cachedDetails?.members ?? EMPTY_MEMBERS;
    const fetchChitMembers = useChitStore((state) => state.fetchChitMembers);
    const [loading, setLoading] = useState(true);
    const [savingKey, setSavingKey] = useState<string | null>(null);
    const [amounts, setAmounts] = useState<Record<string, string>>({});
    const [notes, setNotes] = useState<Record<string, string>>({});
    const [search, setSearch] = useState("");
    const hasLoadedScheme = useRef(false);

    const load = useCallback(async (force = false) => {
        try {
            if (!hasLoadedScheme.current) setLoading(true);
            await fetchChitMembers(chitId, force);
        } catch (error) {
            console.error("Unable to load chit members:", error);
            showAlert({
                type: "error",
                message: error instanceof Error ? error.message : "Unable to load scheme members.",
            });
        } finally {
            hasLoadedScheme.current = true;
            setLoading(false);
        }
    }, [chitId, fetchChitMembers, showAlert]);

    useEffect(() => {
        void load();
    }, [load]);

    const filteredMembers = useMemo(() => {
        const query = search.trim().toLowerCase();
        if (!query) return members;
        return members.filter((member) =>
            `${member.name} ${member.phone}`.toLowerCase().includes(query)
        );
    }, [members, search]);

    const handlePayment = async (
        member: ChitMember,
        installment: ChitMember["installments"][number],
        key: string
    ) => {
        const amount = amounts[key]?.trim()
            ? Number(amounts[key])
            : installment.amount - installment.paidAmount;
        try {
            setSavingKey(key);
            const updatedMember: ChitMember = await recordChitPayment(chitId, member.userId, {
                dueDate: installment.dueDate,
                amount,
                note: notes[key],
            });
            const payoutCredited = updatedMember.installments.every(
                (item) => item.status === "paid" && item.paidAmount >= item.amount
            );
            showAlert({
                type: "success",
                message: payoutCredited
                    ? `Final payment recorded. ${currency(scheme?.packageAmount ?? 0)} credited to the user's chit balance.`
                    : "Payment recorded.",
            });
            await load(true);
        } catch (error) {
            console.error("Unable to record chit payment:", error);
            showAlert({
                type: "error",
                message: error instanceof Error ? error.message : "Unable to record payment.",
            });
        } finally {
            setSavingKey(null);
        }
    };

    return (
        <div className="mx-auto w-full max-w-7xl space-y-6">
            {loading ? (
                <div className="space-y-5" aria-label="Loading chit scheme">
                    <div className="h-10 w-40 animate-pulse rounded-lg bg-gray-200" />
                    <div className="animate-pulse rounded-2xl border bg-white p-6">
                        <div className="h-7 w-56 rounded bg-gray-200" />
                        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                            {Array.from({ length: 4 }).map((_, index) => (
                                <div key={index} className="h-20 rounded-xl bg-gray-100" />
                            ))}
                        </div>
                    </div>
                    {Array.from({ length: 2 }).map((_, index) => (
                        <div key={index} className="animate-pulse rounded-2xl border bg-white p-6">
                            <div className="h-5 w-40 rounded bg-gray-200" />
                            <div className="mt-4 h-14 rounded-xl bg-gray-100" />
                            <div className="mt-3 h-24 rounded-xl bg-gray-100" />
                        </div>
                    ))}
                </div>
            ) : !scheme ? (
                <div className="rounded-2xl border border-dashed bg-white px-6 py-14 text-center">
                    <h1 className="text-xl font-semibold text-gray-900">Scheme not found</h1>
                    <p className="mt-2 text-sm text-gray-500">This scheme may have been removed or is unavailable.</p>
                    <button
                        type="button"
                        onClick={() => navigate("/admin/chits")}
                        className="mt-5 rounded-lg bg-[var(--color-primary)] px-4 py-2 font-semibold text-white"
                    >
                        Back to chit schemes
                    </button>
                </div>
            ) : (
                <>
                    <header className="flex flex-col gap-4 sm:flex-row sm:items-center">
                        <button
                            type="button"
                            onClick={() => navigate("/admin/chits")}
                            aria-label="Back to chit schemes"
                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)] text-white shadow-sm transition hover:scale-105 active:scale-95"
                        >
                            <FaArrowLeft />
                        </button>
                        <div className="min-w-0">
                            <p className="text-xs font-semibold uppercase tracking-wider text-amber-700">Scheme member management</p>
                            <h1 className="truncate text-2xl font-semibold text-[var(--color-primary)] sm:text-3xl">{scheme.name}</h1>
                        </div>
                    </header>

                    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
                        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                            {[
                                ["Total payable", currency(scheme.payableAmount), "bg-amber-50 text-amber-900"],
                                ["Monthly installment", currency(scheme.monthlyAmount), "bg-blue-50 text-blue-900"],
                                ["Payment starts", dateLabel(scheme.startDate), "bg-gray-50 text-gray-900"],
                                ["Payment ends", dateLabel(scheme.endDate), "bg-gray-50 text-gray-900"],
                            ].map(([label, value, color]) => (
                                <div key={label} className={`rounded-xl p-4 ${color}`}>
                                    <p className="text-xs opacity-75">{label}</p>
                                    <p className="mt-1 truncate text-lg font-bold">{value}</p>
                                </div>
                            ))}
                        </div>
                    </section>

                    <section className="space-y-4">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                            <div>
                                <h2 className="text-xl font-semibold text-gray-900">Joined members</h2>
                                <p className="mt-1 text-sm text-gray-500">Review installment progress and record payments.</p>
                            </div>
                            <div className="flex flex-col gap-2 sm:flex-row">
                                <label className="relative block sm:w-72">
                                    <FaSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="search"
                                        value={search}
                                        onChange={(event) => setSearch(event.target.value)}
                                        placeholder="Search name or mobile"
                                        aria-label="Search chit members"
                                        className="w-full rounded-xl border border-gray-300 bg-white py-2.5 pl-10 pr-3 text-sm outline-none focus:border-[var(--color-primary)]"
                                    />
                                </label>
                                <span className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-medium text-gray-700 ring-1 ring-gray-200">
                                    <FaUsers className="text-gray-400" />
                                    {members.length} {members.length === 1 ? "member" : "members"}
                                </span>
                            </div>
                        </div>
                        {members.length === 0 ? (
                            <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-14 text-center">
                                <FaUsers className="mx-auto text-2xl text-gray-300" />
                                <h3 className="mt-3 font-semibold text-gray-900">No members yet</h3>
                                <p className="mt-1 text-sm text-gray-500">Members will appear here after they join this scheme.</p>
                            </div>
                        ) : filteredMembers.length === 0 ? (
                            <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-10 text-center text-sm text-gray-500">
                                No members match that search.
                            </div>
                        ) : filteredMembers.map((member) => {
                            const remaining = Math.max(0, member.payableAmount - member.totalPaid);
                            const nextInstallment = member.installments.find(
                                (installment) => installment.status !== "paid"
                            );
                            const progress = member.payableAmount > 0
                                ? Math.min(100, Math.round(member.totalPaid / member.payableAmount * 100))
                                : 0;
                            const nextOutstanding = nextInstallment
                                ? nextInstallment.amount - nextInstallment.paidAmount
                                : 0;
                            const nextKey = nextInstallment
                                ? `${member.userId}:${nextInstallment.dueDate}`
                                : "";
                            const isOverdue = Boolean(
                                nextInstallment && nextInstallment.dueDate < today()
                            );
                            return (
                                <article key={member.userId} className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                                    <div className="p-5 sm:p-6">
                                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                                            <div className="flex min-w-0 items-start gap-3">
                                                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)] text-sm font-bold text-white">
                                                    {(member.name || "C").trim().charAt(0).toUpperCase()}
                                                </span>
                                                <div className="min-w-0">
                                                    <h3 className="truncate font-semibold text-gray-900">{member.name || "Customer"}</h3>
                                                    <p className="mt-0.5 text-sm text-gray-500">{member.phone}</p>
                                                    <p className="mt-1 text-xs text-gray-400">
                                                        Joined {new Date(member.joinedAt).toLocaleDateString("en-IN")}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-2 sm:min-w-64">
                                                <div className="rounded-xl bg-emerald-50 px-3 py-2">
                                                    <p className="text-xs text-emerald-700">Paid</p>
                                                    <p className="mt-0.5 font-semibold text-emerald-900">{currency(member.totalPaid)}</p>
                                                </div>
                                                <div className={`rounded-xl px-3 py-2 ${remaining > 0 ? "bg-amber-50" : "bg-gray-100"}`}>
                                                    <p className={`text-xs ${remaining > 0 ? "text-amber-700" : "text-gray-500"}`}>Remaining</p>
                                                    <p className={`mt-0.5 font-semibold ${remaining > 0 ? "text-amber-950" : "text-gray-700"}`}>{currency(remaining)}</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mt-5">
                                            <div className="mb-2 flex items-center justify-between text-xs text-gray-500">
                                                <span>Payment progress</span>
                                                <span className="font-semibold text-gray-700">{progress}%</span>
                                            </div>
                                            <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                                                <div
                                                    className={`h-full rounded-full transition-all ${progress === 100 ? "bg-emerald-500" : "bg-[var(--color-accent)]"}`}
                                                    style={{ width: `${progress}%` }}
                                                />
                                            </div>
                                        </div>

                                        {nextInstallment ? (
                                            <div className={`mt-5 rounded-xl border p-4 ${isOverdue ? "border-rose-200 bg-rose-50/60" : "border-gray-200 bg-gray-50/70"}`}>
                                                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                                    <div>
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            <p className="text-sm font-semibold text-gray-900">
                                                                {isOverdue ? "Overdue installment" : "Next installment"}
                                                            </p>
                                                            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${isOverdue ? "bg-rose-100 text-rose-700" : "bg-blue-100 text-blue-700"}`}>
                                                                <FaCalendarAlt className="mr-1 inline" />
                                                                {dateLabel(nextInstallment.dueDate)}
                                                            </span>
                                                        </div>
                                                        <p className="mt-1 text-sm text-gray-600">
                                                            {currency(nextOutstanding)} remaining of {currency(nextInstallment.amount)}
                                                        </p>
                                                    </div>
                                                    <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-700">
                                                        <FaClock className="text-gray-400" />
                                                        {member.installments.filter((item) => item.status === "paid").length} of {member.installments.length} installments paid
                                                    </span>
                                                </div>
                                                <form
                                                    className="mt-4 grid gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]"
                                                    onSubmit={(event) => {
                                                        event.preventDefault();
                                                        void handlePayment(member, nextInstallment, nextKey);
                                                    }}
                                                >
                                                    <input
                                                        aria-label={`Payment amount for ${dateLabel(nextInstallment.dueDate)}`}
                                                        type="number"
                                                        min="0.01"
                                                        max={nextOutstanding}
                                                        step="0.01"
                                                        placeholder={`Amount up to ${currency(nextOutstanding)}`}
                                                        value={amounts[nextKey] ?? ""}
                                                        onChange={(event) => setAmounts((current) => ({ ...current, [nextKey]: event.target.value }))}
                                                        className="min-w-0 rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-[var(--color-primary)]"
                                                    />
                                                    <input
                                                        aria-label={`Payment note for ${dateLabel(nextInstallment.dueDate)}`}
                                                        maxLength={120}
                                                        placeholder="Optional payment note"
                                                        value={notes[nextKey] ?? ""}
                                                        onChange={(event) => setNotes((current) => ({ ...current, [nextKey]: event.target.value }))}
                                                        className="min-w-0 rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-[var(--color-primary)]"
                                                    />
                                                    <button
                                                        type="submit"
                                                        disabled={savingKey === nextKey}
                                                        className="rounded-lg bg-[var(--color-primary)] px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-wait disabled:opacity-50"
                                                    >
                                                        {savingKey === nextKey ? "Saving..." : "Record payment"}
                                                    </button>
                                                </form>
                                            </div>
                                        ) : (
                                            <div className="mt-5 flex items-center gap-2 rounded-xl bg-emerald-50 p-4 text-sm font-medium text-emerald-800">
                                                <FaCheckCircle />
                                                This member has completed all installments.
                                            </div>
                                        )}

                                        <details className="group mt-4 rounded-xl border border-gray-200">
                                            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-4 text-sm font-semibold text-gray-800">
                                                <span>Installment & payment history</span>
                                                <span className="flex items-center gap-2 text-xs font-normal text-gray-500">
                                                    {member.installments.length} installments
                                                    <FaChevronDown className="transition group-open:rotate-180" />
                                                </span>
                                            </summary>
                                            <div className="space-y-2 border-t border-gray-100 p-3 sm:p-4">
                                                {member.installments.map((installment) => {
                                                    const outstanding = installment.amount - installment.paidAmount;
                                                    const overdue = installment.status !== "paid" && installment.dueDate < today();
                                                    return (
                                                        <div key={installment.dueDate} className="rounded-lg bg-gray-50 p-3 sm:flex sm:items-start sm:justify-between sm:gap-4">
                                                            <div>
                                                                <div className="flex flex-wrap items-center gap-2">
                                                                    <span className="text-sm font-semibold text-gray-800">Due {dateLabel(installment.dueDate)}</span>
                                                                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${installment.status === "paid" ? "bg-emerald-100 text-emerald-700" : overdue ? "bg-rose-100 text-rose-700" : installment.status === "partial" ? "bg-amber-100 text-amber-800" : "bg-gray-200 text-gray-600"}`}>
                                                                        {overdue ? "Overdue" : installment.status}
                                                                    </span>
                                                                </div>
                                                                <p className="mt-1 text-xs text-gray-500">
                                                                    {currency(installment.paidAmount)} paid of {currency(installment.amount)}
                                                                    {outstanding > 0 ? ` · ${currency(outstanding)} remaining` : ""}
                                                                </p>
                                                                {installment.paymentHistory.length > 0 ? (
                                                                    <div className="mt-2 space-y-1">
                                                                        {installment.paymentHistory.map((payment, paymentIndex) => (
                                                                            <p key={`${payment.receivedAt}-${paymentIndex}`} className="text-xs text-gray-500">
                                                                                Received {currency(payment.amount)} on {new Date(payment.receivedAt).toLocaleString("en-IN")}
                                                                                {payment.note ? ` · ${payment.note}` : ""}
                                                                            </p>
                                                                        ))}
                                                                    </div>
                                                                ) : (
                                                                    <p className="mt-2 text-xs text-gray-400">No payment recorded yet.</p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </details>
                                    </div>
                                </article>
                            );
                        })}
                    </section>
                </>
            )}
        </div>
    );
}
