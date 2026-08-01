import { create } from "zustand";

import { adminCodeApi } from "../services/adminCode.api";

import type {
    AdminCode,
    CreateAdminCodeRequest,
} from "../types/adminCode";

interface AdminCodeStore {

    codes: AdminCode[];

    loading: boolean;
    loaded: boolean;
    creating: boolean;

    deleting: boolean;
    fetchCodes: (
        force?: boolean
    ) => Promise<void>;

    createCode: (
        payload: CreateAdminCodeRequest
    ) => Promise<void>;

    deleteCode: (
        code: string
    ) => Promise<void>;

    clear: () => void;
}

export const useAdminCodeStore =
    create<AdminCodeStore>((set, get) => ({

        codes: [],
        loaded: false,

        loading: false,

        creating: false,

        deleting: false,

        async fetchCodes(force = false) {

            const {
                loaded,
                loading,
            } = get();

            if (
                loaded &&
                !force
            ) {

                return;

            }

            if (loading) {

                return;

            }

            set({
                loading: true,
            });

            try {

                const response =
                    await adminCodeApi.getCodes();

                set({

                    codes: response,

                    loaded: true,

                });

            } finally {

                set({
                    loading: false,
                });

            }

        },

        async createCode(payload) {

            set({
                creating: true,
            });

            try {

                await adminCodeApi.createCode(
                    payload
                );
                await get().fetchCodes(true);

            } finally {

                set({
                    creating: false,
                });

            }

        },

        async deleteCode(code) {

            set({
                deleting: true,
            });

            try {

                await adminCodeApi.deleteCode(
                    code
                );

                set((state) => ({
                    codes:
                        state.codes.filter(
                            x => x.code !== code
                        ),
                }));

            } finally {

                set({
                    deleting: false,
                });

            }

        },
        clear() {

            set({

                codes: [],

                loading: false,

                creating: false,

                deleting: false,

                loaded: false,

            });

        }

    }));