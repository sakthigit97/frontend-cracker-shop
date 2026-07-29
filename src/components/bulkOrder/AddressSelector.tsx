import { memo } from "react";
import { CheckCircle2, MapPin, Plus } from "lucide-react";

import type { BulkOrderAddress } from "../../types/bulkOrder";

interface AddressSelectorProps {
    addresses: BulkOrderAddress[];

    selectedAddressId?: string;

    loading?: boolean;

    onSelect: (address: BulkOrderAddress) => void;

    onAddNew: () => void;
}

function AddressSelector({
    addresses,
    selectedAddressId,
    loading = false,
    onSelect,
    onAddNew,
}: AddressSelectorProps) {
    if (loading) {
        return (
            <div className="space-y-4">
                {[1, 2].map((item) => (
                    <div
                        key={item}
                        className="h-36 animate-pulse rounded-2xl bg-gray-100"
                    />
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-5">

            <div className="flex items-center justify-between">

                <div>

                    <h3 className="text-lg font-semibold">
                        Delivery Address
                    </h3>

                    <p className="mt-1 text-sm text-gray-500">
                        Select the address where your bulk
                        order should be delivered.
                    </p>

                </div>

                <button
                    type="button"
                    onClick={onAddNew}
                    className="flex items-center gap-2 rounded-xl border border-primary px-4 py-2 font-medium text-primary transition hover:bg-primary hover:text-white"
                >
                    <Plus size={18} />

                    Add Address
                </button>

            </div>

            <div className="grid gap-5 lg:grid-cols-2">

                {addresses.map((address) => {

                    const selected =
                        selectedAddressId ===
                        address.id;

                    return (

                        <button
                            key={address.id}
                            type="button"
                            onClick={() =>
                                onSelect(address)
                            }
                            className={[
                                "relative rounded-2xl border p-5 text-left transition",

                                selected
                                    ? "border-primary ring-2 ring-primary/20"
                                    : "border-gray-200 hover:border-primary",
                            ].join(" ")}
                        >

                            {selected && (

                                <div className="absolute right-4 top-4">

                                    <CheckCircle2
                                        className="text-primary"
                                        size={22}
                                    />

                                </div>

                            )}

                            <div className="flex items-start gap-3">

                                <MapPin
                                    className="mt-1 text-primary"
                                    size={22}
                                />

                                <div>

                                    <h4 className="font-semibold">
                                        {address.fullName}
                                    </h4>

                                    <p className="mt-2 text-sm leading-6 text-gray-600">
                                        {address.addressLine1}
                                    </p>

                                    {address.addressLine2 && (
                                        <p className="text-sm leading-6 text-gray-600">
                                            {address.addressLine2}
                                        </p>
                                    )}

                                    <p className="text-sm leading-6 text-gray-600">
                                        {address.city},{" "}
                                        {address.state}
                                    </p>

                                    <p className="text-sm leading-6 text-gray-600">
                                        {address.pincode}
                                    </p>

                                    <p className="mt-2 font-medium">
                                        📞 {address.mobile}
                                    </p>

                                </div>

                            </div>

                        </button>

                    );

                })}

            </div>

            {!addresses.length && (

                <div className="rounded-2xl border border-dashed border-gray-300 py-16 text-center">

                    <MapPin
                        className="mx-auto text-gray-400"
                        size={40}
                    />

                    <h3 className="mt-4 text-lg font-semibold">
                        No Delivery Address
                    </h3>

                    <p className="mt-2 text-gray-500">
                        Add a delivery address to continue
                        with your bulk order.
                    </p>

                    <button
                        type="button"
                        onClick={onAddNew}
                        className="mt-6 rounded-xl bg-primary px-6 py-3 font-semibold text-white transition hover:opacity-90"
                    >
                        Add Address
                    </button>

                </div>

            )}

        </div>
    );
}

export default memo(AddressSelector);