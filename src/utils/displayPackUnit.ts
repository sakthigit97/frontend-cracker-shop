import { useConfigStore } from "../store/config.store";

export const getDisplayPackUnit = (
    packUnit?: string | null
): string => {
    if (!packUnit) {
        return "";
    }

    const packUnits = useConfigStore.getState().config?.packUnits ?? [];
    const matchedPackUnit = packUnits.find(
        (unit) => unit.id === packUnit
    );

    return matchedPackUnit?.name ?? packUnit;
};