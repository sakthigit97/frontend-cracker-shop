import { memo } from "react";
import { INDIA_STATES } from "../../utils/states";
import type { BulkOrderAddress } from "../../types/bulkOrder";

interface Props {
    loading: boolean;
    addressMode: "PROFILE" | "NEW";
    profileAddress: BulkOrderAddress | null;
    newAddress: BulkOrderAddress;
    onModeChange: (mode: "PROFILE" | "NEW") => void;
    onAddressChange: (address: BulkOrderAddress) => void;
}

function BulkAddressSection({
    loading,
    addressMode,
    profileAddress,
    newAddress,
    onModeChange,
    onAddressChange,
}: Props) {
    const update = <K extends keyof BulkOrderAddress>(
        key: K,
        value: BulkOrderAddress[K]
    ) => {
        onAddressChange({
            ...newAddress,
            [key]: value,
        });
    };

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
                        <label className="mt-6 flex cursor-pointer gap-3 rounded-xl border p-4 hover:border-primary">

                            <input
                                type="radio"
                                checked={addressMode === "PROFILE"}
                                onChange={() =>
                                    onModeChange("PROFILE")
                                }
                                className="mt-1"
                            />

                            <div className="text-sm leading-6">

                                <div className="font-semibold">
                                    {profileAddress.fullName}
                                </div>

                                <div>
                                    {profileAddress.mobile}
                                </div>

                                <div>
                                    {profileAddress.addressLine1}
                                </div>

                                {profileAddress.addressLine2 && (
                                    <div>
                                        {profileAddress.addressLine2}
                                    </div>
                                )}

                                <div>
                                    {profileAddress.city},{" "}
                                    {profileAddress.state}
                                </div>

                                <div>
                                    {profileAddress.pincode}
                                </div>

                            </div>

                        </label>
                    )}

                    <label className="mt-5 flex cursor-pointer gap-3">

                        <input
                            type="radio"
                            checked={addressMode === "NEW"}
                            onChange={() =>
                                onModeChange("NEW")
                            }
                        />

                        <span className="font-medium">
                            Use Different Address
                        </span>

                    </label>

                    {addressMode === "NEW" && (

                        <div className="mt-6 space-y-4">

                            <input
                                type="text"
                                placeholder="Full Name *"
                                value={newAddress.fullName}
                                onChange={(e) =>
                                    update(
                                        "fullName",
                                        e.target.value
                                    )
                                }
                                className="w-full rounded-xl border p-3"
                            />

                            <input
                                type="text"
                                placeholder="Mobile Number *"
                                value={newAddress.mobile}
                                maxLength={10}
                                onChange={(e) =>
                                    update(
                                        "mobile",
                                        e.target.value.replace(
                                            /\D/g,
                                            ""
                                        )
                                    )
                                }
                                className="w-full rounded-xl border p-3"
                            />

                            <input
                                type="text"
                                placeholder="Address Line 1 *"
                                value={newAddress.addressLine1}
                                onChange={(e) =>
                                    update(
                                        "addressLine1",
                                        e.target.value
                                    )
                                }
                                className="w-full rounded-xl border p-3"
                            />

                            <input
                                type="text"
                                placeholder="Address Line 2"
                                value={newAddress.addressLine2}
                                onChange={(e) =>
                                    update(
                                        "addressLine2",
                                        e.target.value
                                    )
                                }
                                className="w-full rounded-xl border p-3"
                            />

                            <input
                                type="text"
                                placeholder="City *"
                                value={newAddress.city}
                                onChange={(e) =>
                                    update(
                                        "city",
                                        e.target.value
                                    )
                                }
                                className="w-full rounded-xl border p-3"
                            />

                            <select
                                value={newAddress.state}
                                onChange={(e) =>
                                    update(
                                        "state",
                                        e.target.value
                                    )
                                }
                                className="w-full rounded-xl border bg-white p-3"
                            >
                                <option value="">
                                    Select State
                                </option>

                                {INDIA_STATES.map((state) => (
                                    <option
                                        key={state}
                                        value={state}
                                    >
                                        {state}
                                    </option>
                                ))}
                            </select>

                            <input
                                type="text"
                                placeholder="Pincode *"
                                maxLength={6}
                                value={newAddress.pincode}
                                onChange={(e) =>
                                    update(
                                        "pincode",
                                        e.target.value.replace(
                                            /\D/g,
                                            ""
                                        )
                                    )
                                }
                                className="w-full rounded-xl border p-3"
                            />

                        </div>

                    )}
                </>
            )}
        </div>
    );
}

export default memo(BulkAddressSection);