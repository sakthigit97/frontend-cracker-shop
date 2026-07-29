import { useCallback, useMemo, useState } from "react";
import BulkSchemeCard from "./BulkSchemeCard";
import AdminCodeSection from "./AdminCodeSection";
import { BULK_SCHEMES } from "../../constants/bulkScheme";
import { bulkOrderStore } from "../../store/bulkOrder.store";
import { validateBulkAdminCode } from "../../services/bulkOrder.api";

export default function SchemeStep() {
    const {
        scheme,
        setScheme,
        adminCode,
        setAdminCode,
        adminCodeVerified,
        setAdminCodeVerified,
        nextStep,
    } = bulkOrderStore();

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const selectedScheme = scheme;
    const requiresAdminCode = selectedScheme?.requireAdminCode ?? false;

    const handleSchemeSelect = useCallback(
        (scheme: (typeof BULK_SCHEMES)[number]) => {
            setScheme(scheme);
            setAdminCode("");
            setAdminCodeVerified(false);
            setError("");
        },
        [
            setScheme,
            setAdminCode,
            setAdminCodeVerified,
        ]
    );

    const handleValidate = useCallback(async () => {
        if (!selectedScheme) return;

        setLoading(true);
        setError("");

        try {
            const response =
                await validateBulkAdminCode({
                    schemeId: selectedScheme.id,
                    code: adminCode.trim(),
                });

            if (!response.valid) {
                setAdminCodeVerified(false);
                setError(
                    response.message ??
                    "Invalid admin code."
                );
                return;
            }

            setAdminCodeVerified(true);
        } catch (error) {
            console.error(error);

            setAdminCodeVerified(false);

            setError(
                "Unable to validate the admin code. Please try again."
            );
        } finally {
            setLoading(false);
        }
    }, [
        adminCode,
        selectedScheme,
        setAdminCodeVerified,
    ]);

    const canContinue = useMemo(() => {
        if (!selectedScheme) return false;

        if (
            requiresAdminCode &&
            !adminCodeVerified
        ) {
            return false;
        }

        return true;
    }, [
        selectedScheme,
        requiresAdminCode,
        adminCodeVerified,
    ]);

    const handleContinue = () => {
        if (!canContinue) return;

        nextStep();
    };

    return (
        <div className="space-y-8">

            <div>

                <h2 className="text-2xl font-bold">
                    Select Your Bulk Scheme
                </h2>

                <p className="mt-2 text-gray-600">
                    Choose the pricing scheme applicable
                    to your bulk purchase.
                </p>

            </div>

            <div className="grid gap-6 lg:grid-cols-2">

                {BULK_SCHEMES.map((scheme) => (
                    <BulkSchemeCard
                        key={scheme.id}
                        scheme={scheme}
                        selected={
                            scheme.id === selectedScheme?.id
                        }
                        onSelect={handleSchemeSelect}
                    />
                ))}

            </div>

            {requiresAdminCode && (
                <AdminCodeSection
                    code={adminCode}
                    verified={adminCodeVerified}
                    loading={loading}
                    error={error}
                    onChange={setAdminCode}
                    onValidate={handleValidate}
                />
            )}

            <div className="flex justify-end border-t pt-6">

                <button
                    type="button"
                    disabled={!canContinue}
                    onClick={handleContinue}
                    className={[
                        "rounded-xl px-8 py-3 font-semibold transition",

                        canContinue
                            ? "bg-primary text-white hover:opacity-90"
                            : "cursor-not-allowed bg-gray-300 text-gray-500",
                    ].join(" ")}
                >
                    Continue
                </button>

            </div>

        </div>
    );
}