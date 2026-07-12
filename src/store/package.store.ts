import { create } from "zustand";
import {
    getPackagesApi,
    getPackageDetailsApi,
} from "../services/package.api";

const HOME_PACKAGE_IDS = {
    BEST_SELLING: "best-selling",
    NEW_ARRIVALS: "new-arrivals",
};

interface PackageItem {
    id: string;
    name: string;
    imageUrl: string;
    productCount: number;
    productId: string;
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
    bestSellingPackage?: PackageItem;
    newArrivalPackage?: PackageItem;
    fetchPackages: () => Promise<void>;
    loadingPackages: Record<string, boolean>;
    fetchPackageProducts: (
        packageId: string
    ) => Promise<void>;
}

export const usePackageStore =
    create<PackageStore>((set, get) => ({
        packages: [],
        packageProducts: {},
        loading: false,
        loadingPackages: {},
        bestSellingPackage: undefined,
        newArrivalPackage: undefined,
        async fetchPackages() {
            const { packages } = get();
            if (packages.length > 0) {
                return;
            }

            try {
                set({ loading: true });
                const res = await getPackagesApi();
                const packagesList = res || [];

                set({
                    packages: packagesList,
                    bestSellingPackage:
                        packagesList.find(
                            (p: PackageItem) =>
                                p.id ===
                                HOME_PACKAGE_IDS.BEST_SELLING
                        ),
                    newArrivalPackage:
                        packagesList.find(
                            (p: PackageItem) =>
                                p.id ===
                                HOME_PACKAGE_IDS.NEW_ARRIVALS
                        ),
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
                loadingPackages,
            } = get();

            if (packageProducts[packageId]) {
                return;
            }

            if (loadingPackages[packageId]) {
                return;
            }

            try {
                set((state) => ({
                    loadingPackages: {
                        ...state.loadingPackages,
                        [packageId]: true,
                    },
                }));

                const res =
                    await getPackageDetailsApi(
                        packageId
                    );

                set((state) => ({
                    packageProducts: {
                        ...state.packageProducts,

                        [packageId]: {
                            package: res.package,
                            products:
                                res.products || [],
                        },
                    },

                    loadingPackages: {
                        ...state.loadingPackages,
                        [packageId]: false,
                    },
                }));
            } catch (err) {
                set((state) => ({
                    loadingPackages: {
                        ...state.loadingPackages,
                        [packageId]: false,
                    },
                }));
                throw err;
            }
        }
    }));