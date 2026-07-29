import { useState } from "react";
import type { BulkOrderAddress } from "../types/bulkOrder";

export function useBulkAddresses() {
    const [addresses] = useState<BulkOrderAddress[]>([]);
    const [selectedAddress, setSelectedAddress] =
        useState<BulkOrderAddress | null>(null);
    const [loading] = useState(false);

    const selectAddress = (
        address: BulkOrderAddress
    ) => {
        setSelectedAddress(address);
    };

    const addNewAddress = () => {
    };

    return {
        addresses,
        selectedAddress,
        loading,
        selectAddress,
        addNewAddress,
    };
}