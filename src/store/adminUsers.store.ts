import { create } from "zustand";

import {
    getAdminUsers,
    type GetAdminUsersParams,
    type GetAdminUsersResponse,
} from "../services/adminUsers.api";

interface UserState {
    cache: Record<string, GetAdminUsersResponse>;
    loading: boolean;

    fetchPage: (
        params: GetAdminUsersParams
    ) => Promise<GetAdminUsersResponse>;

    clearCache: () => void;
}

export const useAdminUsersStore =
    create<UserState>((set, get) => ({
        cache: {},
        loading: false,

        async fetchPage(params) {
            const search = params.search?.trim() || "";
            const cursor = params.cursor || null;
            const limit = params.limit || 20;

            const key = JSON.stringify({
                search,
                cursor,
                limit,
            });

            const cached = get().cache[key];

            if (cached) {
                return cached;
            }

            set({
                loading: true,
            });

            try {
                const response = await getAdminUsers({
                    search: search || undefined,
                    cursor: cursor || undefined,
                    limit,
                });

                set((state) => ({
                    cache: {
                        ...state.cache,
                        [key]: response,
                    },
                }));

                return response;
            } finally {
                set({
                    loading: false,
                });
            }
        },

        clearCache() {
            set({
                cache: {},
            });
        },
    }));