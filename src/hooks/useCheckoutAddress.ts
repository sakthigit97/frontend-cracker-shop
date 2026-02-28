import { useEffect, useState } from "react";
import { apiFetch } from "../services/api";

type CheckoutAddress = {
    name: string;
    mobile: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
};

export function useCheckoutAddress() {
    const [savedAddress, setSavedAddress] = useState<CheckoutAddress | null>(null);
    const [customAddress, setCustomAddress] = useState<CheckoutAddress | null>(null);
    const [useCustom, setUseCustom] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            const res = await apiFetch("/user/profile");

            const data = res?.data;
            if (data) {
                setSavedAddress({
                    name: data.name,
                    mobile: data.mobile,
                    address: data.address,
                    city: data.city,
                    state: data.state,
                    pincode: data.pincode,
                });
            }

            setLoading(false);
        })();
    }, []);

    const activeAddress = useCustom
        ? customAddress
        : savedAddress;

    return {
        savedAddress,
        customAddress,
        setCustomAddress,
        useCustom,
        setUseCustom,
        activeAddress,
        loading,
    };
}