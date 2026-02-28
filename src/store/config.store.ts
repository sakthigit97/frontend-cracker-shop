import { create } from "zustand";
import { persist } from "zustand/middleware";
import { fetchGlobalConfig } from "../services/config.api";
import type { GlobalConfig } from "../services/config.api";

type ConfigState = {
    config: GlobalConfig | null;
    configReady: boolean;
    loadConfig: () => Promise<void>;
    clearConfig: () => void;
    setConfig: (data: any) => void;
};

export const useConfigStore = create<ConfigState>()(
    persist(
        (set, get) => ({
            config: null,
            configReady: false,
            loadConfig: async () => {
                if (get().configReady && get().config) return;
                const config = await fetchGlobalConfig();
                set({
                    config,
                    configReady: true,
                });
            },
            clearConfig: () => {
                set({
                    config: null,
                    configReady: false,
                });
            },
            setConfig: (data) => {
                localStorage.setItem("adminConfig", JSON.stringify(data));
                set({ config: data });
            },
        }),
        {
            name: "global-admin-config",
        }
    )
);