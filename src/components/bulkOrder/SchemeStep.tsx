import {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from "react";

import BulkStepLayout from "./BulkStepLayout";
import BulkSchemeCard from "./BulkSchemeCard";
import AdminCodeSection from "./AdminCodeSection";

import { bulkOrderStore } from "../../store/bulkOrder.store";
import { useConfigStore } from "../../store/config.store";
import { validateBulkAdminCode } from "../../services/bulkOrder.api";

import type { BulkScheme } from "../../types/bulkOrder";

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

    const { config } = useConfigStore();

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    /*
     * Get active bulk schemes from admin config.
     * Keep the configured sort order.
     */
    const bulkSchemes = useMemo(
        () =>
            [...(config?.bulkOrderSchemes ?? [])]
                .filter(
                    (item: BulkScheme) =>
                        item.isActive !== false
                )
                .sort(
                    (
                        a: BulkScheme,
                        b: BulkScheme
                    ) =>
                        (a.sortOrder ?? 0) -
                        (b.sortOrder ?? 0)
                ),
        [config?.bulkOrderSchemes]
    );

    /*
     * Always use the latest scheme definition
     * from Admin Config.
     */
    const selectedScheme =
        scheme?.schemeId
            ? bulkSchemes.find(
                (item) =>
                    item.schemeId ===
                    scheme.schemeId
            ) ?? null
            : null;

    const requiresAdminCode =
        selectedScheme
            ?.isAdminApprovalRequired ??
        false;

    /*
     * Keep persisted scheme synchronized
     * with the latest Admin Config.
     */
    useEffect(() => {
        if (!scheme?.schemeId) {
            return;
        }

        const latestScheme =
            (
                config?.bulkOrderSchemes ??
                []
            ).find(
                (item: BulkScheme) =>
                    item.schemeId ===
                    scheme.schemeId
            );

        /*
         * Selected scheme no longer exists.
         */
        if (!latestScheme) {
            setScheme(null);
            setAdminCode("");
            setAdminCodeVerified(false);
            setError("");
            return;
        }

        const hasChanged =
            scheme.schemeName !==
            latestScheme.schemeName ||
            scheme.minAmount !==
            latestScheme.minAmount ||
            scheme.maxAmount !==
            latestScheme.maxAmount ||
            scheme.isAdminApprovalRequired !==
            latestScheme.isAdminApprovalRequired ||
            scheme.bulkPriceAdjustmentPercent !==
            latestScheme.bulkPriceAdjustmentPercent ||
            scheme.bulkPriceAdjustmentType !==
            latestScheme.bulkPriceAdjustmentType ||
            scheme.isActive !==
            latestScheme.isActive ||
            scheme.sortOrder !==
            latestScheme.sortOrder;

        if (!hasChanged) {
            return;
        }

        setScheme(latestScheme);
        setAdminCode("");
        setAdminCodeVerified(false);
        setError("");
    }, [
        scheme,
        config?.bulkOrderSchemes,
        setScheme,
        setAdminCode,
        setAdminCodeVerified,
    ]);

    const handleAdminCodeChange =
        useCallback(
            (value: string) => {
                setAdminCode(value);

                if (adminCodeVerified) {
                    setAdminCodeVerified(false);
                }

                if (error) {
                    setError("");
                }
            },
            [
                adminCodeVerified,
                error,
                setAdminCode,
                setAdminCodeVerified,
            ]
        );

    const handleSchemeSelect =
        useCallback(
            (selected: BulkScheme) => {
                setScheme(selected);
                setAdminCode("");
                setAdminCodeVerified(false);
                setError("");
                setLoading(false);
            },
            [
                setScheme,
                setAdminCode,
                setAdminCodeVerified,
            ]
        );

    /*
     * Validate admin authorization code.
     */
    const handleValidate =
        useCallback(
            async () => {
                if (!selectedScheme) {
                    return;
                }

                const code =
                    adminCode.trim();

                if (!code) {
                    setAdminCodeVerified(false);
                    setError(
                        "Please enter the admin code."
                    );
                    return;
                }

                setLoading(true);
                setError("");

                try {
                    const response =
                        await validateBulkAdminCode({
                            schemeId:
                                selectedScheme.schemeId,
                            code,
                        });

                    if (!response.valid) {
                        setAdminCodeVerified(false);
                        setError(
                            response.message ??
                            "Invalid admin code."
                        );
                        return;
                    }

                    if (
                        response.schemeId &&
                        response.schemeId !==
                        selectedScheme.schemeId
                    ) {
                        setAdminCodeVerified(false);
                        setError(
                            "This Admin Code is not valid for the selected bulk scheme."
                        );
                        return;
                    }

                    setAdminCodeVerified(true);
                    setError("");
                } catch (error) {
                    console.error(
                        "Bulk admin code validation failed:",
                        error
                    );

                    setAdminCodeVerified(false);

                    setError(
                        error instanceof Error &&
                            error.message
                            ? error.message
                            : "Unable to validate the admin code. Please try again."
                    );
                } finally {
                    setLoading(false);
                }
            },
            [
                adminCode,
                selectedScheme,
                setAdminCodeVerified,
            ]
        );

    const canContinue =
        !!selectedScheme &&
        (!requiresAdminCode ||
            adminCodeVerified);

    const handleContinue =
        useCallback(() => {
            if (!canContinue || loading) {
                return;
            }

            nextStep();
        }, [
            canContinue,
            loading,
            nextStep,
        ]);

    return (
        <BulkStepLayout
            title="Select Your Bulk Scheme"
            description="Choose the pricing plan that fits your bulk purchase."
            showPrevious={false}
            showNext
            nextLabel="Continue"
            nextDisabled={
                !canContinue || loading
            }
            onNext={handleContinue}
        >
            <div className="space-y-4 sm:space-y-5">
                {/* Scheme list */}
                {bulkSchemes.length === 0 ? (
                    <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-6 text-center sm:px-6">
                        <p className="font-medium text-gray-700">
                            No bulk schemes are
                            currently available.
                        </p>

                        <p className="mt-1 text-sm text-gray-500">
                            Please try again later.
                        </p>
                    </div>
                ) : (
                    <div
                        className={[
                            "grid grid-cols-1 gap-4",
                            "sm:grid-cols-2",
                            "lg:grid-cols-3",
                        ].join(" ")}
                    >
                        {bulkSchemes.map(
                            (bulkScheme) => (
                                <BulkSchemeCard
                                    key={
                                        bulkScheme.schemeId
                                    }
                                    scheme={
                                        bulkScheme
                                    }
                                    selected={
                                        bulkScheme.schemeId ===
                                        selectedScheme?.schemeId
                                    }
                                    onSelect={
                                        handleSchemeSelect
                                    }
                                />
                            )
                        )}
                    </div>
                )}

                {/* Admin approval */}
                {requiresAdminCode && (
                    <AdminCodeSection
                        code={adminCode}
                        verified={
                            adminCodeVerified
                        }
                        loading={loading}
                        error={error}
                        onChange={
                            handleAdminCodeChange
                        }
                        onValidate={
                            handleValidate
                        }
                    />
                )}
            </div>
        </BulkStepLayout>
    );
}