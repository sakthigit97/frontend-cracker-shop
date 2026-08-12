import { memo } from "react";
import { CheckCircle2, Lock } from "lucide-react";
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
            className={[
                "group relative w-full rounded-2xl border bg-white p-4 text-left transition-all duration-300 sm:p-6",
                "hover:-translate-y-1 hover:border-primary hover:shadow-lg",
                selected
                    ? "border-primary ring-2 ring-primary/20 shadow-lg"
                    : "border-gray-200",
            ].join(" ")}
        >
            {/* Selection / Approval Icon */}
            <div className="absolute right-4 top-4">
                {selected ? (
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                        <CheckCircle2
                            size={24}
                            className="text-primary"
                        />
                    </div>
                ) : requiresAdminApproval ? (
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100">
                        <Lock
                            size={18}
                            className="text-amber-600"
                        />
                    </div>
                ) : null}
            </div>

            {/* Scheme Details */}
            <div className="mt-5 space-y-3">
                {/* Scheme Name */}
                <div>
                    <span className="inline-flex w-fit rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
                        {scheme.schemeName}
                    </span>
                </div>

                {/* Approval Status */}
                {requiresAdminApproval ? (
                    <div className="flex items-start gap-2 text-sm font-semibold text-amber-600">
                        <Lock
                            size={16}
                            className="mt-0.5 shrink-0"
                        />

                        <span>
                            Admin Approval Required
                        </span>
                    </div>
                ) : (
                    <div className="flex items-start gap-2 text-sm font-semibold text-green-600">
                        <CheckCircle2
                            size={16}
                            className="mt-0.5 shrink-0"
                        />

                        <span>
                            No Approval Required
                        </span>
                    </div>
                )}
            </div>

            {/* Order Range */}
            <div className="mt-4 rounded-xl bg-gray-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Order Value
                </p>

                <p className="mt-2 text-lg font-bold text-gray-900">
                    {orderRange}
                </p>
            </div>

            {/* Footer */}
            <div className="mt-5 flex flex-col gap-3 pr-4 sm:flex-row sm:items-center sm:justify-between sm:pr-0">
                <span className="inline-flex w-fit rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
                    Bulk Pricing
                </span>
            </div>
        </button>
    );
}

export default memo(BulkSchemeCard);