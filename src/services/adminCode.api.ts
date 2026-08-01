import { apiFetch } from "./api";

import type {
    AdminCode,
    CreateAdminCodeRequest,
} from "../types/adminCode";

export const adminCodeApi = {

    async getCodes(): Promise<AdminCode[]> {
        const response = await apiFetch(
            "/admin/codes"
        );
        return response.data;
    },

    async createCode(
        payload: CreateAdminCodeRequest
    ) {

        return await apiFetch(
            "/admin/codes",
            {
                method: "POST",
                body: JSON.stringify(payload),
            }
        );

    },

    async deleteCode(
        code: string
    ) {

        return await apiFetch(
            `/admin/codes/${code}`,
            {
                method: "DELETE",
            }
        );

    },

    async validateCode(
        userId: string,
        code: string
    ) {

        return await apiFetch(
            "/bulk-order/validate-code",
            {
                method: "POST",
                body: JSON.stringify({
                    userId,
                    code,
                }),
            }
        );

    },
};