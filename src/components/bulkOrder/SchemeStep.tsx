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
import { getMyAdminCodes } from "../../services/adminCode.api";

interface AdminCode {
    code: string;
    schemeId: string;
}

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
    const [adminCodes, setAdminCodes] = useState<AdminCode[]>([]);
    const [adminCodesLoading, setAdminCodesLoading] = useState(false);

    useEffect(() => {
        const loadAdminCodes = async () => {
            try {
                setAdminCodesLoading(true);

                const response = await getMyAdminCodes();

                setAdminCodes(
                    Array.isArray(response)
                        ? response
                        : response?.data ?? []
                );
            } catch (error) {
                console.error(
                    "Failed to load admin codes:",
                    error
                );

                setAdminCodes([]);
            } finally {
                setAdminCodesLoading(false);
            }
        };

        loadAdminCodes();
    }, []);

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
                {/* Wholesale Access Notice */}
                <div className="rounded-2xl border border-orange-200 bg-orange-50/70 p-4 sm:p-5">
                    <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-orange-100 text-lg">
                            🔒
                        </div>

                        <div className="min-w-0">
                            <h3 className="text-base font-bold text-gray-900 sm:text-lg">
                                Restricted Wholesale Access
                            </h3>

                            <p className="mt-1 text-sm leading-5 text-gray-600">
                                Wholesale pricing is available only to verified
                                B2B buyers.
                            </p>
                        </div>
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        <div className="rounded-xl bg-white/80 p-3">
                            <p className="text-sm font-semibold text-gray-900">
                                ✓ Verification Required
                            </p>
                            <p className="mt-1 text-xs leading-5 text-gray-600">
                                Valid GST Certificate and PESO/Explosives
                                License.
                            </p>
                        </div>

                        <div className="rounded-xl bg-white/80 p-3">
                            <p className="text-sm font-semibold text-gray-900">
                                ✓ Access Activation
                            </p>
                            <p className="mt-1 text-xs leading-5 text-gray-600">
                                Our Sales Team will verify your details and
                                activate your access code.
                            </p>
                        </div>

                        <div className="rounded-xl bg-white/80 p-3">
                            <p className="text-sm font-semibold text-gray-900">
                                ✓ Unlimited Bulk Orders
                            </p>
                            <p className="mt-1 text-xs leading-5 text-gray-600">
                                Place multiple orders while your access code
                                remains active.
                            </p>
                        </div>

                        <div className="rounded-xl bg-white/80 p-3">
                            <p className="text-sm font-semibold text-gray-900">
                                ⏳ Code Expiry
                            </p>
                            <p className="mt-1 text-xs leading-5 text-gray-600">
                                All orders must be submitted before your code
                                expires.
                            </p>
                        </div>
                    </div>

                    <div className="mt-4 rounded-xl border border-orange-200 bg-white/70 px-3 py-2.5">
                        <p className="text-sm font-medium text-orange-800">
                            Need access?
                            <span className="ml-1 font-normal text-gray-600">
                                Contact our Sales Team for verification and
                                activation.
                            </span>
                        </p>
                    </div>
                </div>

                {adminCodesLoading ? (
                    <div className="mt-4 rounded-xl border border-gray-200 bg-white p-4">
                        <p className="text-sm text-gray-500">
                            Loading your access codes...
                        </p>
                    </div>
                ) : adminCodes.length > 0 ? (
                    <div className="mt-4 rounded-xl border border-green-200 bg-white p-4">
                        <h4 className="text-sm font-bold text-gray-900">
                            Your Active Access Codes
                        </h4>

                        <p className="mt-1 text-xs text-gray-500">
                            Use the code assigned to the scheme you want to select.
                        </p>

                        <div className="mt-3 space-y-2">
                            {adminCodes.map((item) => (
                                <div
                                    key={`${item.code}-${item.schemeId}`}
                                    className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-3 py-2"
                                >
                                    <div>
                                        <p className="text-sm font-semibold text-gray-900">
                                            {item.code}
                                        </p>

                                        <p className="text-xs text-gray-500">
                                            Scheme: {item.schemeId}
                                        </p>
                                    </div>

                                    <span className="rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700">
                                        Active
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="mt-4 rounded-xl border border-gray-200 bg-white p-4">
                        <p className="text-sm font-medium text-gray-700">
                            No active access codes assigned to your account.
                        </p>

                        <p className="mt-1 text-xs text-gray-500">
                            Contact our Sales Team to request wholesale access.
                        </p>
                    </div>
                )}

                {/* Admin approval */}
                {requiresAdminCode && (
                    <AdminCodeSection
                        code={adminCode}
                        verified={adminCodeVerified}
                        loading={loading}
                        error={error}
                        onChange={handleAdminCodeChange}
                        onValidate={handleValidate}
                    />
                )}
            </div>
        </BulkStepLayout>
    );
}