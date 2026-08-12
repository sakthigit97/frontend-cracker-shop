import {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from "react";
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

    const [loading, setLoading] =
        useState(false);

    const [error, setError] =
        useState("");

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

    /*
     * Changing the admin code invalidates
     * the previous verification.
     */
    const handleAdminCodeChange =
        useCallback(
            (value: string) => {
                setAdminCode(value);

                if (adminCodeVerified) {
                    setAdminCodeVerified(
                        false
                    );
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

    /*
     * Scheme selection.
     */
    const handleSchemeSelect =
        useCallback(
            (selected: BulkScheme) => {
                setScheme(selected);
                setAdminCode("");
                setAdminCodeVerified(
                    false
                );
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
                    setAdminCodeVerified(
                        false
                    );

                    setError(
                        "Please enter the admin code."
                    );

                    return;
                }

                setLoading(true);
                setError("");

                try {
                    const response =
                        await validateBulkAdminCode(
                            {
                                schemeId:
                                    selectedScheme.schemeId,
                                code,
                            }
                        );

                    if (
                        !response.valid
                    ) {
                        setAdminCodeVerified(
                            false
                        );

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
                        setAdminCodeVerified(
                            false
                        );

                        setError(
                            "This Admin Code is not valid for the selected bulk scheme."
                        );

                        return;
                    }

                    setAdminCodeVerified(
                        true
                    );

                    setError("");
                } catch (error) {
                    console.error(
                        "Bulk admin code validation failed:",
                        error
                    );

                    setAdminCodeVerified(
                        false
                    );

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
        (
            !requiresAdminCode ||
            adminCodeVerified
        );

    const handleContinue =
        useCallback(() => {
            if (!canContinue) {
                return;
            }

            nextStep();
        }, [
            canContinue,
            nextStep,
        ]);

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

            {bulkSchemes.length === 0 ? (
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-8 text-center">
                    <p className="font-medium text-gray-700">
                        No bulk schemes are currently
                        available.
                    </p>

                    <p className="mt-1 text-sm text-gray-500">
                        Please try again later.
                    </p>
                </div>
            ) : (
                <div className="grid gap-6 lg:grid-cols-2">
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

            <div className="flex justify-end border-t pt-6">
                <button
                    type="button"
                    disabled={
                        !canContinue ||
                        loading
                    }
                    onClick={
                        handleContinue
                    }
                    className={[
                        "rounded-xl px-8 py-3 font-semibold transition",
                        canContinue &&
                        !loading
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