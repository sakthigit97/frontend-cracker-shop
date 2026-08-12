import {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from "react";

import BulkStepLayout from "./BulkStepLayout";
import BulkPricingCard from "./BulkPricingCard";
import BulkAddressSection from "./BulkAddressSection";

import { bulkOrderStore } from "../../store/bulkOrder.store";
import { useBulkOrderPricing } from "../../hooks/useBulkOrderPricing";
import { apiFetch } from "../../services/api";

import type { BulkOrderAddress } from "../../types/bulkOrder";

import { useAlert } from "../../store/alert.store";
import { validateSchemeAmount } from "../../utils/bulkPricing";

type ProfileResponse = {
    success: boolean;
    data: {
        name: string;
        mobile: string;
        address: string;
        city: string;
        state: string;
        pincode: string;
    };
};

type ValidatedLocation = {
    pincode: string;
    state: string;
};

export default function CheckoutStep() {
    const {
        previousStep,
        nextStep,
        setAddress,
        scheme,
    } = bulkOrderStore();

    const { showAlert } = useAlert();

    const [
        addressMode,
        setAddressMode,
    ] = useState<"PROFILE" | "NEW">(
        "PROFILE"
    );

    const [
        profileAddress,
        setProfileAddress,
    ] = useState<BulkOrderAddress | null>(
        null
    );

    const [
        newAddress,
        setNewAddress,
    ] = useState<BulkOrderAddress>({
        fullName: "",
        mobile: "",
        addressLine1: "",
        addressLine2: "",
        city: "",
        state: "",
        pincode: "",
    });

    const [
        loading,
        setLoading,
    ] = useState(true);

    const [
        validatedLocation,
        setValidatedLocation,
    ] = useState<ValidatedLocation | null>(
        null
    );

    const [
        validatingPincode,
        setValidatingPincode,
    ] = useState(false);

    const [
        pincodeError,
        setPincodeError,
    ] = useState("");

    /*
     * Load profile address.
     */
    useEffect(() => {
        let mounted = true;

        async function loadProfile() {
            try {
                const res: ProfileResponse =
                    await apiFetch(
                        "/user/profile"
                    );

                if (
                    !mounted ||
                    !res?.data
                ) {
                    return;
                }

                setProfileAddress({
                    fullName:
                        res.data.name,
                    mobile:
                        res.data.mobile,
                    addressLine1:
                        res.data.address,
                    addressLine2: "",
                    city:
                        res.data.city,
                    state:
                        res.data.state,
                    pincode:
                        res.data.pincode,
                });
            } catch (error) {
                console.error(
                    "Failed to load profile address:",
                    error
                );

                if (mounted) {
                    setAddressMode("NEW");
                }
            } finally {
                if (mounted) {
                    setLoading(false);
                }
            }
        }

        loadProfile();

        return () => {
            mounted = false;
        };
    }, []);

    /*
     * Current pincode depends on the
     * selected address mode.
     */
    const currentPincode = useMemo(
        () =>
            addressMode === "PROFILE"
                ? profileAddress?.pincode?.trim() ??
                  ""
                : newAddress.pincode.trim(),
        [
            addressMode,
            profileAddress?.pincode,
            newAddress.pincode,
        ]
    );

    /*
     * Validate the current pincode.
     *
     * This is intentionally kept in CheckoutStep
     * as the single source of truth.
     */
    useEffect(() => {
        if (
            !currentPincode ||
            currentPincode.length !== 6
        ) {
            setValidatedLocation(null);
            setPincodeError("");
            setValidatingPincode(false);
            return;
        }

        if (
            validatedLocation?.pincode ===
            currentPincode
        ) {
            return;
        }

        let active = true;

        async function validatePincode() {
            setValidatingPincode(true);
            setPincodeError("");
            setValidatedLocation(null);

            try {
                const response =
                    await fetch(
                        `https://api.postalpincode.in/pincode/${currentPincode}`
                    );

                if (!response.ok) {
                    throw new Error(
                        "Pincode API request failed."
                    );
                }

                const data =
                    await response.json();

                if (!active) {
                    return;
                }

                /*
                 * Invalid pincode.
                 */
                if (
                    !data ||
                    data[0]?.Status !==
                        "Success" ||
                    !data[0]?.PostOffice?.length
                ) {
                    setValidatedLocation(
                        null
                    );

                    setPincodeError(
                        "Invalid pincode. Please enter a valid delivery pincode."
                    );

                    /*
                     * Never modify the saved
                     * profile address.
                     */
                    if (
                        addressMode === "NEW"
                    ) {
                        setNewAddress(
                            (previous) => ({
                                ...previous,
                                pincode: "",
                                state: "",
                                city: "",
                            })
                        );
                    }

                    showAlert({
                        type: "error",
                        message:
                            "Invalid pincode. Please select a valid delivery pincode.",
                    });

                    return;
                }

                const state =
                    data[0]
                        ?.PostOffice?.[0]
                        ?.State?.trim() ?? "";

                const city =
                    data[0]
                        ?.PostOffice?.[0]
                        ?.District?.trim() ?? "";

                /*
                 * Pincode exists but state
                 * could not be determined.
                 */
                if (!state) {
                    setValidatedLocation(
                        null
                    );

                    setPincodeError(
                        "Unable to determine the state for this pincode."
                    );

                    showAlert({
                        type: "error",
                        message:
                            "Unable to determine the delivery state for this pincode.",
                    });

                    return;
                }

                /*
                 * Make sure the pincode has not
                 * changed while the API request
                 * was running.
                 */
                if (
                    addressMode === "NEW" &&
                    newAddress.pincode.trim() !==
                        currentPincode
                ) {
                    return;
                }

                setValidatedLocation({
                    pincode:
                        currentPincode,
                    state,
                });

                /*
                 * State and city are derived
                 * from the validated pincode.
                 */
                if (
                    addressMode === "NEW"
                ) {
                    setNewAddress(
                        (previous) => ({
                            ...previous,
                            state,
                            ...(city
                                ? { city }
                                : {}),
                        })
                    );
                }
            } catch (error) {
                if (!active) {
                    return;
                }

                console.error(
                    "Pincode validation failed:",
                    error
                );

                setValidatedLocation(
                    null
                );

                setPincodeError(
                    "Unable to validate the pincode. Please try again."
                );

                showAlert({
                    type: "error",
                    message:
                        "Unable to validate the pincode. Please try again.",
                });
            } finally {
                if (active) {
                    setValidatingPincode(
                        false
                    );
                }
            }
        }

        validatePincode();

        return () => {
            active = false;
        };
    }, [
        currentPincode,
        validatedLocation?.pincode,
        addressMode,
        newAddress.pincode,
        showAlert,
    ]);

    /*
     * State used for pricing must always
     * come from the validated pincode.
     */
    const validatedState =
        validatedLocation?.state ?? "";

    const { pricing } =
        useBulkOrderPricing({
            state: validatedState,
        });

    /*
     * Current active address.
     */
    const activeAddress =
        addressMode === "PROFILE"
            ? profileAddress
            : newAddress;

    /*
     * Basic address validation.
     */
    const addressValid = useMemo(() => {
        if (
            addressMode === "PROFILE"
        ) {
            return !!profileAddress;
        }

        return !!(
            newAddress.fullName.trim() &&
            newAddress.mobile.trim() &&
            newAddress.addressLine1.trim() &&
            newAddress.city.trim() &&
            newAddress.pincode.trim()
        );
    }, [
        addressMode,
        profileAddress,
        newAddress,
    ]);

    /*
     * Pincode is valid only when:
     *
     * 1. Exactly 6 digits
     * 2. API validated the same pincode
     * 3. A state was returned
     */
    const pincodeValid =
        !!currentPincode &&
        /^\d{6}$/.test(
            currentPincode
        ) &&
        validatedLocation?.pincode ===
            currentPincode &&
        !!validatedState;

    /*
     * Validate bulk scheme amount
     * using product total only.
     */
    const schemeValidation =
        validateSchemeAmount(
            scheme,
            pricing.productTotal
        );

    /*
     * Continue is allowed only when
     * everything required is valid.
     */
    const canContinue =
        addressValid &&
        pincodeValid &&
        !validatingPincode &&
        schemeValidation.valid;

    /*
     * Address mode change.
     */
    const handleAddressModeChange =
        useCallback(
            (
                mode:
                    | "PROFILE"
                    | "NEW"
            ) => {
                setAddressMode(mode);

                setValidatedLocation(
                    null
                );

                setPincodeError("");

                setValidatingPincode(
                    false
                );
            },
            []
        );

    /*
     * New address change.
     *
     * BulkAddressSection clears state/city
     * when pincode changes.
     */
    const handleNewAddressChange =
        useCallback(
            (
                address: BulkOrderAddress
            ) => {
                const pincodeChanged =
                    address.pincode.trim() !==
                    newAddress.pincode.trim();

                setNewAddress(address);

                if (pincodeChanged) {
                    setValidatedLocation(
                        null
                    );

                    setPincodeError("");
                }
            },
            [newAddress.pincode]
        );

    /*
     * Continue to Review.
     */
    const handleContinue =
        useCallback(() => {
            if (!activeAddress) {
                return;
            }

            if (!addressValid) {
                showAlert({
                    type: "error",
                    message:
                        "Please complete the delivery address.",
                });

                return;
            }

            if (
                !pincodeValid ||
                !validatedState
            ) {
                showAlert({
                    type: "error",
                    message:
                        "Please select a valid delivery pincode.",
                });

                return;
            }

            if (!schemeValidation.valid) {
                showAlert({
                    type: "error",
                    message:
                        schemeValidation.message ??
                        "Bulk order amount is outside the allowed range.",
                });

                return;
            }

            /*
             * Always save the validated
             * state and pincode.
             */
            const finalAddress:
                BulkOrderAddress = {
                    ...activeAddress,
                    state: validatedState,
                    pincode:
                        currentPincode,
                };

            setAddress(finalAddress);

            nextStep();
        }, [
            activeAddress,
            addressValid,
            pincodeValid,
            validatedState,
            currentPincode,
            schemeValidation,
            showAlert,
            setAddress,
            nextStep,
        ]);

    return (
        <BulkStepLayout
            title="Checkout"
            description="Select the delivery address and review your pricing."
            previousLabel="Back"
            nextLabel="Review Order"
            previousDisabled={
                validatingPincode
            }
            nextDisabled={
                !canContinue
            }
            onPrevious={
                previousStep
            }
            onNext={
                handleContinue
            }
        >
            <div className="grid gap-8 xl:grid-cols-[2fr_420px]">

                <BulkAddressSection
                    loading={loading}
                    addressMode={
                        addressMode
                    }
                    profileAddress={
                        profileAddress
                    }
                    newAddress={
                        newAddress
                    }
                    onModeChange={
                        handleAddressModeChange
                    }
                    onAddressChange={
                        handleNewAddressChange
                    }
                />

                <div className="xl:sticky xl:top-24 xl:h-fit">
                    <BulkPricingCard
                        pricing={pricing}
                    />
                </div>

            </div>

            <div className="mt-4">

                {validatingPincode && (
                    <p className="text-sm text-gray-500">
                        Validating pincode...
                    </p>
                )}

                {!validatingPincode &&
                    pincodeError && (
                        <p className="text-sm font-medium text-red-600">
                            {pincodeError}
                        </p>
                    )}

                {!validatingPincode &&
                    !pincodeError &&
                    validatedLocation && (
                        <p className="text-sm font-medium text-green-600">
                            Delivery location verified:{" "}
                            {
                                validatedLocation.state
                            }
                        </p>
                    )}

            </div>
        </BulkStepLayout>
    );
}