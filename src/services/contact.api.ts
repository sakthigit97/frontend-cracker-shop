import { apiFetch } from "./api";

export const contactUsApi = async (payload: {
    name: string;
    phone: string;
    email?: string;
    message?: string;
}) => {
    return apiFetch("/contact", {
        method: "POST",
        body: JSON.stringify(payload),
    });
};

export interface ContactItem {
    contactId: string;
    name: string;
    phone: string;
    email?: string;
    message?: string;
    status: "NEW" | "CONTACTED";
    createdAt: string;
}

export async function getContactsApi() {
    return apiFetch("/admin/contact");
}

export async function updateContactStatusApi(
    contactId: string
) {
    return apiFetch(`/admin/contact/${contactId}`, {
        method: "PUT",
    });
}