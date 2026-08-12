import {
    memo,
    useEffect,
    useRef,
    useState,
} from "react";

import type { BulkOrderAddress } from "../../types/bulkOrder";
import { useAlert } from "../../store/alert.store";

interface Props {
    loading: boolean;
    addressMode: "PROFILE" | "NEW";
    profileAddress: BulkOrderAddress | null;
    newAddress: BulkOrderAddress;
    onModeChange: (
        mode: "PROFILE" | "NEW"
    ) => void;
    onAddressChange: (
        address: BulkOrderAddress
    ) => void;
}

interface PincodeResponse {
    Status?: string;
    Message?: string;
    PostOffice?: Array<{
        State?: string;
        District?: string;
        Name?: string;
    }>;
}

function BulkAddressSection({
    loading,
    addressMode,
    profileAddress,
    newAddress,
    onModeChange,
    onAddressChange,
}: Props) {
    const { showAlert } = useAlert();

    const [
        pincodeLoading,
        setPincodeLoading,
    ] = useState(false);

    const [
        pincodeError,
        setPincodeError,
    ] = useState("");

    /*
     * Keep the latest address available to
     * asynchronous pincode validation.
     *
     * This prevents an API response from
     * overwriting other fields that the user
     * changed while the lookup was running.
     */
    const latestAddressRef =
        useRef(newAddress);

    useEffect(() => {
        latestAddressRef.current =
            newAddress;
    }, [newAddress]);

    /*
     * Update a single address field.
     */
    const update = (
        key: keyof BulkOrderAddress,
        value: BulkOrderAddress[keyof BulkOrderAddress]
    ) => {
        onAddressChange({
            ...latestAddressRef.current,
            [key]: value,
        });
    };

    /*
     * Resolve state and city automatically
     * from the pincode.
     *
     * Only NEW addresses need pincode lookup.
     */
    useEffect(() => {
        if (addressMode !== "NEW") {
            setPincodeLoading(false);
            setPincodeError("");
            return;
        }

        const pincode =
            newAddress.pincode.trim();

        /*
         * Do not call the API until we have
         * exactly 6 digits.
         */
        if (pincode.length !== 6) {
            setPincodeLoading(false);
            setPincodeError("");
            return;
        }

        let cancelled = false;

        const timer =
            window.setTimeout(
                async () => {
                    setPincodeLoading(true);
                    setPincodeError("");

                    try {
                        const response =
                            await fetch(
                                `https://api.postalpincode.in/pincode/${pincode}`
                            );

                        if (!response.ok) {
                            throw new Error(
                                "Unable to lookup pincode."
                            );
                        }

                        const data: PincodeResponse[] =
                            await response.json();

                        if (cancelled) {
                            return;
                        }

                        const result =
                            data?.[0];

                        const postOffice =
                            result
                                ?.PostOffice?.[0];

                        const state =
                            postOffice?.State?.trim() ??
                            "";

                        const city =
                            postOffice?.District?.trim() ??
                            "";

                        /*
                         * Pincode does not exist
                         * or API did not return a state.
                         */
                        if (
                            result?.Status !==
                            "Success" ||
                            !state
                        ) {
                            setPincodeError(
                                "Invalid pincode. Please check and try again."
                            );

                            onAddressChange({
                                ...latestAddressRef.current,
                                pincode: "",
                                state: "",
                                city: "",
                            });

                            showAlert({
                                type: "error",
                                message:
                                    "Invalid pincode. Please select a valid delivery pincode.",
                            });

                            return;
                        }

                        /*
                         * Make sure the response still
                         * belongs to the current pincode.
                         *
                         * The user may have changed the
                         * pincode while this request was running.
                         */
                        if (
                            latestAddressRef
                                .current
                                .pincode
                                .trim() !==
                            pincode
                        ) {
                            return;
                        }

                        /*
                         * Valid pincode:
                         *
                         * State comes from the pincode.
                         * City is populated when available.
                         */
                        onAddressChange({
                            ...latestAddressRef.current,
                            state,
                            ...(city
                                ? { city }
                                : {}),
                        });

                        setPincodeError("");
                    } catch (error) {
                        if (cancelled) {
                            return;
                        }

                        console.error(
                            "Pincode lookup failed:",
                            error
                        );

                        setPincodeError(
                            "Unable to verify pincode. Please try again."
                        );

                        showAlert({
                            type: "error",
                            message:
                                "Unable to verify pincode. Please try again.",
                        });
                    } finally {
                        if (!cancelled) {
                            setPincodeLoading(
                                false
                            );
                        }
                    }
                },
                400
            );

        return () => {
            cancelled = true;
            window.clearTimeout(timer);
        };
    }, [
        addressMode,
        newAddress.pincode,
        onAddressChange,
        showAlert,
    ]);

    return (
        <div className="rounded-2xl border bg-white p-6 shadow-sm">

            <h2 className="text-xl font-semibold">
                Delivery Address
            </h2>

            <p className="mt-1 text-sm text-gray-500">
                Choose your saved profile address or enter a
                different delivery address.
            </p>

            {loading ? (
                <div className="mt-6 h-36 animate-pulse rounded-xl bg-gray-100" />
            ) : (
                <>
                    {/* =========================
                        PROFILE ADDRESS
                    ========================== */}

                    {profileAddress && (
                        <label className="mt-6 flex cursor-pointer gap-3 rounded-xl border p-4 transition hover:border-primary">

                            <input
                                type="radio"
                                checked={
                                    addressMode ===
                                    "PROFILE"
                                }
                                onChange={() =>
                                    onModeChange(
                                        "PROFILE"
                                    )
                                }
                                className="mt-1"
                            />

                            <div className="text-sm leading-6">

                                <div className="font-semibold">
                                    {
                                        profileAddress.fullName
                                    }
                                </div>

                                <div>
                                    {
                                        profileAddress.mobile
                                    }
                                </div>

                                <div>
                                    {
                                        profileAddress.addressLine1
                                    }
                                </div>

                                {profileAddress.addressLine2 && (
                                    <div>
                                        {
                                            profileAddress.addressLine2
                                        }
                                    </div>
                                )}

                                <div>
                                    {
                                        profileAddress.city
                                    }
                                    ,{" "}
                                    {
                                        profileAddress.state
                                    }
                                </div>

                                <div>
                                    {
                                        profileAddress.pincode
                                    }
                                </div>

                            </div>

                        </label>
                    )}

                    {/* =========================
                        NEW ADDRESS
                    ========================== */}

                    <label className="mt-5 flex cursor-pointer gap-3">

                        <input
                            type="radio"
                            checked={
                                addressMode ===
                                "NEW"
                            }
                            onChange={() =>
                                onModeChange(
                                    "NEW"
                                )
                            }
                        />

                        <span className="font-medium">
                            Use Different Address
                        </span>

                    </label>

                    {addressMode === "NEW" && (
                        <div className="mt-6 space-y-4">

                            {/* Full Name */}

                            <input
                                type="text"
                                placeholder="Full Name *"
                                value={
                                    newAddress.fullName
                                }
                                onChange={(e) =>
                                    update(
                                        "fullName",
                                        e.target.value
                                    )
                                }
                                className="w-full rounded-xl border p-3 outline-none transition focus:border-primary"
                            />

                            {/* Mobile */}

                            <input
                                type="text"
                                placeholder="Mobile Number *"
                                value={
                                    newAddress.mobile
                                }
                                maxLength={10}
                                inputMode="numeric"
                                onChange={(e) =>
                                    update(
                                        "mobile",
                                        e.target.value.replace(
                                            /\D/g,
                                            ""
                                        )
                                    )
                                }
                                className="w-full rounded-xl border p-3 outline-none transition focus:border-primary"
                            />

                            {/* Address Line 1 */}

                            <input
                                type="text"
                                placeholder="Address Line 1 *"
                                value={
                                    newAddress.addressLine1
                                }
                                onChange={(e) =>
                                    update(
                                        "addressLine1",
                                        e.target.value
                                    )
                                }
                                className="w-full rounded-xl border p-3 outline-none transition focus:border-primary"
                            />

                            {/* Address Line 2 */}

                            <input
                                type="text"
                                placeholder="Address Line 2"
                                value={
                                    newAddress.addressLine2 ??
                                    ""
                                }
                                onChange={(e) =>
                                    update(
                                        "addressLine2",
                                        e.target.value
                                    )
                                }
                                className="w-full rounded-xl border p-3 outline-none transition focus:border-primary"
                            />

                            {/* City */}

                            <input
                                type="text"
                                placeholder="City *"
                                value={
                                    newAddress.city
                                }
                                readOnly
                                className="w-full cursor-not-allowed rounded-xl border bg-gray-100 p-3 text-gray-600 outline-none"
                            />

                            {/* State */}

                            <input
                                type="text"
                                placeholder="State *"
                                value={
                                    newAddress.state
                                }
                                readOnly
                                className="w-full cursor-not-allowed rounded-xl border bg-gray-100 p-3 text-gray-600 outline-none"
                            />

                            {/* Pincode */}

                            <div>
                                <div className="relative">

                                    <input
                                        type="text"
                                        placeholder="Pincode *"
                                        maxLength={6}
                                        inputMode="numeric"
                                        value={
                                            newAddress.pincode
                                        }
                                        onChange={(e) => {
                                            const pincode =
                                                e.target.value.replace(
                                                    /\D/g,
                                                    ""
                                                );

                                            onAddressChange({
                                                ...latestAddressRef.current,
                                                pincode,
                                                state: "",
                                                city: "",
                                            });

                                            setPincodeError(
                                                ""
                                            );
                                        }}
                                        className={[
                                            "w-full rounded-xl border p-3 pr-28 outline-none transition",
                                            pincodeError
                                                ? "border-red-400 focus:border-red-500"
                                                : "border-gray-300 focus:border-primary",
                                        ].join(
                                            " "
                                        )}
                                    />

                                    {pincodeLoading && (
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500">
                                            Checking...
                                        </span>
                                    )}

                                </div>

                                {pincodeError && (
                                    <p className="mt-1 text-sm text-red-600">
                                        {
                                            pincodeError
                                        }
                                    </p>
                                )}

                                {!pincodeError &&
                                    newAddress.pincode.length ===
                                    6 &&
                                    newAddress.state && (
                                        <p className="mt-1 text-sm text-green-600">
                                            State detected:{" "}
                                            <strong>
                                                {
                                                    newAddress.state
                                                }
                                            </strong>
                                        </p>
                                    )}

                            </div>

                        </div>
                    )}
                </>
            )}

        </div>
    );
}

export default memo(
    BulkAddressSection
);