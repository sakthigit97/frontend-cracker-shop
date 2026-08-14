import { memo } from "react";
import {
    Check,
    CheckCircle2,
    Lock,
} from "lucide-react";
import type { BulkScheme } from "../../types/bulkOrder";

interface BulkSchemeCardProps {
    scheme: BulkScheme;
    selected: boolean;
    onSelect: (scheme: BulkScheme) => void;
}

function BulkSchemeCard({
    scheme,
    selected,
    onSelect,
}: BulkSchemeCardProps) {
    const orderRange = `₹${scheme.minAmount.toLocaleString(
        "en-IN"
    )} - ₹${scheme.maxAmount.toLocaleString(
        "en-IN"
    )}`;

    const requiresAdminApproval =
        scheme.isAdminApprovalRequired;

    return (
        <button
            type="button"
            onClick={() => onSelect(scheme)}
            aria-pressed={selected}
            className={[
                "group relative w-full rounded-xl border bg-white text-left",
                "px-4 py-4 sm:px-5 sm:py-4",
                "transition-all duration-200",
                "focus:outline-none focus:ring-2 focus:ring-primary/20",
                "hover:border-primary/50 hover:shadow-sm",

                selected
                    ? "border-primary bg-primary/[0.015] shadow-sm ring-1 ring-primary"
                    : "border-gray-200",
            ].join(" ")}
        >
            {/* Header */}
            <div className="flex items-center justify-between gap-3">
                <h3 className="min-w-0 truncate text-base font-bold text-gray-900 sm:text-lg">
                    {scheme.schemeName}
                </h3>

                {/* Selection indicator */}
                <span
                    className={[
                        "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border",
                        "transition-all duration-200",

                        selected
                            ? "border-primary bg-primary text-white"
                            : "border-gray-300 bg-white text-transparent group-hover:border-primary",
                    ].join(" ")}
                >
                    <Check size={15} strokeWidth={3} />
                </span>
            </div>

            {/* Approval */}
            <div
                className={[
                    "mt-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",

                    requiresAdminApproval
                        ? "bg-amber-50 text-amber-700"
                        : "bg-green-50 text-green-700",
                ].join(" ")}
            >
                {requiresAdminApproval ? (
                    <Lock size={13} />
                ) : (
                    <CheckCircle2 size={13} />
                )}

                <span>
                    {requiresAdminApproval
                        ? "Admin approval required"
                        : "No approval required"}
                </span>
            </div>

            {/* Order value */}
            <div className="mt-4 border-t border-gray-100 pt-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                    Order value
                </p>

                <p className="mt-1 text-base font-bold text-gray-900 sm:text-lg">
                    {orderRange}
                </p>
            </div>

            {/* Footer */}
            <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                <span>
                    Exclusive bulk pricing
                </span>
            </div>
        </button>
    );
}

export default memo(BulkSchemeCard);