import {
    memo,
    useEffect,
    useRef,
    useState,
} from "react";

import type { BulkOrderAddress } from "../../types/bulkOrder";
import { useAlert } from "../../store/alert.store";

type AddressTitle = "Mr" | "Mrs" | "Ms";
type CheckoutAddress = BulkOrderAddress & {
    title?: AddressTitle;
};

interface Props {
    loading: boolean;
    addressMode: "PROFILE" | "NEW";
    profileAddress: BulkOrderAddress | null;
    newAddress: CheckoutAddress;
    onModeChange: (
        mode: "PROFILE" | "NEW"
    ) => void;
    onAddressChange: (
        address: CheckoutAddress
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

    const latestAddressRef = useRef(newAddress);
    useEffect(() => {
        latestAddressRef.current =
            newAddress;
    }, [newAddress]);

    const update = (
        key: keyof CheckoutAddress,
        value: CheckoutAddress[keyof CheckoutAddress]
    ) => {
        onAddressChange({
            ...latestAddressRef.current,
            [key]: value,
        });
    };

    useEffect(() => {
        if (addressMode !== "NEW") {
            setPincodeLoading(false);
            setPincodeError("");
            return;
        }

        const pincode =
            newAddress.pincode.trim();

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

                            {/* Title + Full Name */}

                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-[110px_minmax(0,1fr)]">
                                <select
                                    value={newAddress.title ?? "Mr"}
                                    onChange={(e) =>
                                        update(
                                            "title",
                                            e.target.value as
                                            | "Mr"
                                            | "Mrs"
                                            | "Ms"
                                        )
                                    }
                                    className="
                                        w-full rounded-xl border
                                        bg-white p-3 outline-none
                                        transition focus:border-primary
                                    "
                                    aria-label="Title"
                                >
                                    <option value="Mr">Mr</option>
                                    <option value="Mrs">Mrs</option>
                                    <option value="Ms">Ms</option>
                                </select>

                                <input
                                    type="text"
                                    placeholder="Name *"
                                    value={newAddress.fullName}
                                    onChange={(e) =>
                                        update(
                                            "fullName",
                                            e.target.value
                                        )
                                    }
                                    className="
                                        w-full rounded-xl border
                                        p-3 outline-none transition
                                        focus:border-primary
                                    "
                                />
                            </div>

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
                            </div>

                            {/* City */}
                            <input
                                type="text"
                                placeholder="City *"
                                value={newAddress.city}
                                onChange={(e) =>
                                    update("city", e.target.value)
                                }
                                className="w-full rounded-xl border p-3 outline-none transition focus:border-primary"
                            />
                            {/* State */}

                            <input
                                type="text"
                                placeholder="State *"
                                value={newAddress.state}
                                onChange={(e) =>
                                    update("state", e.target.value)
                                }
                                className="w-full rounded-xl border p-3 outline-none transition focus:border-primary"
                            />


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