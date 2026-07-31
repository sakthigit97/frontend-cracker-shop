import { useCallback, useEffect, useState } from "react";
import BulkStepLayout from "./BulkStepLayout";
import BulkPricingCard from "./BulkPricingCard";
import BulkAddressSection from "./BulkAddressSection";
import { bulkOrderStore } from "../../store/bulkOrder.store";
import { useBulkOrderPricing } from "../../hooks/useBulkOrderPricing";
import { apiFetch } from "../../services/api";
import type { BulkOrderAddress } from "../../types/bulkOrder";
import { useConfigStore } from "../../store/config.store";

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

export default function CheckoutStep() {
    const {
        previousStep,
        nextStep,
        setAddress,
    } = bulkOrderStore();

    const { pricing } = useBulkOrderPricing();
    const config = useConfigStore((s) => s.config);
    const packagingPercent = config?.packagingPercent ?? 3;
    const gstPercent = config?.gstPercent ?? 18;


    console.log(pricing)
    const [addressMode, setAddressMode] = useState<"PROFILE" | "NEW">("PROFILE");
    const [profileAddress, setProfileAddress] = useState<BulkOrderAddress | null>(null);
    const [newAddress, setNewAddress] =
        useState<BulkOrderAddress>({
            fullName: "",
            mobile: "",
            addressLine1: "",
            addressLine2: "",
            city: "",
            state: "",
            pincode: "",
        });

    const [loading, setLoading] = useState(true);
    useEffect(() => {
        let mounted = true;

        async function loadProfile() {
            try {
                const res: ProfileResponse = await apiFetch("/user/profile");
                if (!mounted || !res?.data) return;
                setProfileAddress({
                    fullName: res.data.name,
                    mobile: res.data.mobile,
                    addressLine1: res.data.address,
                    addressLine2: "",
                    city: res.data.city,
                    state: res.data.state,
                    pincode: res.data.pincode,
                });
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

    const canContinue =
        addressMode === "PROFILE"
            ? !!profileAddress
            : !!(
                newAddress.fullName &&
                newAddress.mobile &&
                newAddress.addressLine1 &&
                newAddress.city &&
                newAddress.state &&
                newAddress.pincode
            );

    const handleContinue = useCallback(() => {
        if (addressMode === "PROFILE") {
            if (!profileAddress) return;
            setAddress(profileAddress);
        } else {
            setAddress(newAddress);
        }

        nextStep();
    }, [
        addressMode,
        profileAddress,
        newAddress,
        nextStep,
        setAddress,
    ]);

    return (
        <BulkStepLayout
            title="Checkout"
            description="Select the delivery address and review your pricing."
            previousLabel="Back"
            nextLabel="Review Order"
            previousDisabled={false}
            nextDisabled={!canContinue}
            onPrevious={previousStep}
            onNext={handleContinue}
        >
            <div className="grid gap-8 xl:grid-cols-[2fr_420px]">
                <BulkAddressSection
                    loading={loading}
                    addressMode={addressMode}
                    profileAddress={profileAddress}
                    newAddress={newAddress}
                    onModeChange={setAddressMode}
                    onAddressChange={setNewAddress}
                />

                <div className="xl:sticky xl:top-24 xl:h-fit">
                    <BulkPricingCard
                        pricing={pricing}
                        packagingPercent={packagingPercent}
                        gstPercent={gstPercent}
                    />
                </div>
            </div>
        </BulkStepLayout>
    );
}