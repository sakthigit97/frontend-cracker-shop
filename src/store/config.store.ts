import { create } from "zustand";
import { persist } from "zustand/middleware";
import { fetchGlobalConfig } from "../services/config.api";
import type { GlobalConfig } from "../services/config.api";

type ConfigState = {
    config: GlobalConfig | null;
    configReady: boolean;
    loading: boolean;
    loadedAt: number | null;
    loadConfig: () => Promise<void>;
    refreshConfig: () => Promise<void>;
    clearConfig: () => void;
};

let inFlightRequest: Promise<void> | null = null;
export const useConfigStore = create<ConfigState>()(
    persist(
        (set, get) => {
            const fetchAndStoreConfig = async () => {
                set({ loading: true });

                try {
                    const config = await fetchGlobalConfig();

                    set({
                        config,
                        configReady: true,
                        loading: false,
                        loadedAt: Date.now(),
                    });
                } catch (err) {
                    set({ loading: false });
                    if (get().config) {
                        set({ configReady: true });
                        return;
                    }

                    throw err;
                }
            };

            const executeRequest = async (force: boolean) => {
                const state = get();
                if (!force && state.configReady) {
                    return;
                }

                if (inFlightRequest) {
                    return inFlightRequest;
                }

                inFlightRequest = (async () => {
                    try {
                        await fetchAndStoreConfig();
                    } finally {
                        inFlightRequest = null;
                    }
                })();

                return inFlightRequest;
            };

            return {
                config: null,
                configReady: false,
                loading: false,
                loadedAt: null,
                loadConfig: () => executeRequest(false),
                refreshConfig: () => executeRequest(true),
                clearConfig: () => {
                    inFlightRequest = null;
                    set({
                        config: null,
                        configReady: false,
                        loading: false,
                        loadedAt: null,
                    });
                },
            };
        },
        {
            name: "global-admin-config",
            partialize: (state) => ({
                config: state.config,
                configReady: state.configReady,
            }),
        }
    )
);