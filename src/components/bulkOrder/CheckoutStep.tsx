import {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from "react";
import { Loader2 } from "lucide-react";

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

    const validatedState =
        validatedLocation?.state ?? "";

    const { pricing } = useBulkOrderPricing({
        state: validatedState,
    });

    const activeAddress =
        addressMode === "PROFILE"
            ? profileAddress
            : newAddress;


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

    const pincodeValid =
        !!currentPincode &&
        /^\d{6}$/.test(
            currentPincode
        ) &&
        validatedLocation?.pincode ===
        currentPincode &&
        !!validatedState;


    const schemeValidation =
        validateSchemeAmount(
            scheme,
            pricing.productTotal
        );

    const pricingReady =
        !loading &&
        !validatingPincode &&
        pincodeValid &&
        !!validatedState;

    const canContinue =
        pricingReady &&
        addressValid &&
        schemeValidation.valid;

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
                    /*
                     * Immediately remove the
                     * previous validation.
                     */
                    setValidatedLocation(
                        null
                    );

                    setPincodeError("");

                    setValidatingPincode(
                        false
                    );
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

    const showPricingLoader =
        loading ||
        validatingPincode ||
        !pincodeValid ||
        !validatedState;

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
            <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">

                {/* LEFT — ADDRESS */}
                <div className="min-w-0">
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

                    {/* Validation status belongs with
                        the address, not below the
                        entire two-column layout. */}
                    <div className="mt-3">
                        {validatingPincode && (
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                                <Loader2
                                    size={16}
                                    className="animate-spin"
                                />

                                <span>
                                    Validating delivery pincode...
                                </span>
                            </div>
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
                                    Delivery location
                                    verified:{" "}
                                    {
                                        validatedLocation.state
                                    }
                                </p>
                            )}
                    </div>
                </div>

                {/* RIGHT — PRICING */}
                <div className="min-w-0 xl:sticky xl:top-24 xl:h-fit">
                    {showPricingLoader ? (
                        <div className="flex min-h-[260px] items-center justify-center rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                            <div className="flex flex-col items-center text-center">
                                <Loader2
                                    size={30}
                                    className="animate-spin text-primary"
                                />

                                <p className="mt-3 text-sm font-semibold text-gray-900">
                                    Preparing pricing
                                </p>

                                <p className="mt-1 max-w-[240px] text-xs leading-5 text-gray-500">
                                    Verifying your delivery
                                    location before
                                    calculating charges.
                                </p>
                            </div>
                        </div>
                    ) : (
                        <BulkPricingCard
                            pricing={pricing}
                        />
                    )}
                </div>
            </div>
        </BulkStepLayout>
    );
}