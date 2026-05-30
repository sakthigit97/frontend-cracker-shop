import { apiFetch } from "./api";

export async function getPackagesApi() {
    return apiFetch("/packages");
}

export async function getPackageDetailsApi(
    packageId: string
) {
    return apiFetch(`/packages/${packageId}`);
}