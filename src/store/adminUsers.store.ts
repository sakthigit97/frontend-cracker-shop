import { create } from "zustand";
import { getAdminUsers } from "../services/adminUsers.api";

interface UserState {
    cache: Record<string, any>;
    loading: boolean;
    fetchPage: (filters: any, page: number) => Promise<any>;
    clearCache: () => void;
}

export const useAdminUsersStore = create<UserState>((set, get) => ({
    cache: {},
    loading: false,

    async fetchPage(filters, page) {
        const key = JSON.stringify({ filters, page });
        const cached = get().cache[key];
        if (cached) return cached;
        set({ loading: true });

        try {
            const res = await getAdminUsers(filters);

            set((state) => ({
                cache: {
                    ...state.cache,
                    [key]: res,
                },
            }));

            return res;
        } finally {
            set({ loading: false });
        }
    },

    clearCache() {
        set({ cache: {} });
    },
}));
