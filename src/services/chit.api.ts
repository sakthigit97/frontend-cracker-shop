import { apiFetch } from "./api";
import type { ChitScheme, MyChit } from "../types/chit";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL_V1;

export function listAvailableChits(): Promise<ChitScheme[]> {
    return apiFetch("/chits/available", {}, API_BASE_URL);
}

export function listMyChits(): Promise<MyChit[]> {
    return apiFetch("/chits/mine", {}, API_BASE_URL);
}

export function joinChit(chitId: string) {
    return apiFetch(`/chits/${encodeURIComponent(chitId)}/join`, {
        method: "POST",
    }, API_BASE_URL);
}

export function listAdminChits(): Promise<ChitScheme[]> {
    return apiFetch("/admin/chits", {}, API_BASE_URL);
}

export function createChit(payload: {
    name: string;
    description: string;
    packageAmount: number;
    discountType: "flat" | "percentage";
    discountValue: number;
    monthlyAmount: number;
    joinDeadline: string;
    startDate: string;
    endDate: string;
    reminderDate: string;
}): Promise<ChitScheme> {
    return apiFetch("/admin/chits", {
        method: "POST",
        body: JSON.stringify(payload),
    }, API_BASE_URL);
}

export function listChitMembers(chitId: string): Promise<{
    scheme: ChitScheme;
    members: MyChit["member"][];
}> {
    return apiFetch(`/admin/chits/${encodeURIComponent(chitId)}/members`, {}, API_BASE_URL);
}

export function recordChitPayment(
    chitId: string,
    userId: string,
    payload: { dueDate: string; amount: number; note?: string }
) {
    return apiFetch(
        `/admin/chits/${encodeURIComponent(chitId)}/members/${encodeURIComponent(userId)}/payments`,
        {
            method: "POST",
            body: JSON.stringify(payload),
        },
        API_BASE_URL
    );
}
