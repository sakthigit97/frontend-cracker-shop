import { create } from "zustand";
import {
    getPackagesApi,
    getPackageDetailsApi,
} from "../services/package.api";

interface PackageItem {
    id: string;
    name: string;
    imageUrl: string;
    productCount: number;
}

interface PackageDetails {
    package: PackageItem;
    products: any[];
}

interface PackageStore {
    packages: PackageItem[];

    packageProducts: Record<
        string,
        PackageDetails
    >;

    loading: boolean;

    fetchPackages: () => Promise<void>;

    fetchPackageProducts: (
        packageId: string
    ) => Promise<void>;
}

export const usePackageStore =
    create<PackageStore>((set, get) => ({
        packages: [],

        packageProducts: {},

        loading: false,

        async fetchPackages() {
            const { packages } = get();

            // already loaded
            if (packages.length > 0) {
                return;
            }

            try {
                set({ loading: true });

                const res =
                    await getPackagesApi();

                set({
                    packages: res || [],
                });
            } finally {
                set({ loading: false });
            }
        },

        async fetchPackageProducts(
            packageId: string
        ) {
            const {
                packageProducts,
            } = get();

            // already loaded
            if (
                packageProducts[
                packageId
                ]
            ) {
                return;
            }

            try {
                set({ loading: true });

                const res =
                    await getPackageDetailsApi(
                        packageId
                    );

                set((state) => ({
                    packageProducts: {
                        ...state.packageProducts,

                        [packageId]: {
                            package:
                                res.package,

                            products:
                                res.products || [],
                        },
                    },
                }));
            } finally {
                set({ loading: false });
            }
        },
    }));