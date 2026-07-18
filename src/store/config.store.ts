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
                try {
                    const config = await fetchGlobalConfig();
                    set({
                        config,
                        configReady: true,
                    });
                } catch (err) {
                    if (get().config) {
                        set({ configReady: true });
                        return;
                    }
                    throw err;
                }
            },
            clearConfig: () => {
                set({
                    config: null,
                    configReady: false,
                });
            },
            setConfig: (data) => {
                set({
                    config: data,
                    configReady: true,
                });
            },
        }),
        {
            name: "global-admin-config",
        }
    )
);