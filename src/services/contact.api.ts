import { apiFetch } from "./api";

export const contactUsApi = async (payload: {
    name: string;
    phone: string;
    email?: string;
    message?: string;
}) => {
    return apiFetch("/contact-us", {
        method: "POST",
        body: JSON.stringify(payload),
    });
};