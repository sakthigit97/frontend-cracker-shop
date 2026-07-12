import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import PackageCard from "../components/package/PackageCard";
import EmptyState from "../components/ui/EmptyState";
import { usePackageStore } from "../store/package.store";

export default function ComboPackages() {
    const navigate = useNavigate();

    const {
        packages,
        loading,
        fetchPackages,
    } = usePackageStore();

    useEffect(() => {
        fetchPackages();
    }, []);

    const EXCLUDED_PACKAGE_IDS = new Set([
        "best-selling",
        "new-arrivals",
    ]);
    const visiblePackages = packages.filter(
        (p) =>
            p.productCount > 0 &&
            !EXCLUDED_PACKAGE_IDS.has(p.id)
    );


    return (
        <div className="max-w-7xl mx-auto px-4 py-6">

            <div className="flex items-center gap-3 mb-6">
                <button
                    onClick={() => navigate(-1)}
                    className="
                        flex items-center justify-center
                        w-9 h-9
                        rounded-full
                        bg-[var(--color-primary)]
                        text-white
                        shadow-sm
                        hover:scale-105
                        active:scale-95
                        transition-all
                    "
                >
                    ←
                </button>

                <div>
                    <h1
                        className="
                            text-xl
                            md:text-2xl
                            font-semibold
                            text-[var(--color-primary)]
                        "
                    >
                        Combo Packages
                    </h1>

                    <p className="text-sm text-gray-500">
                        Explore specially curated cracker collections
                    </p>
                </div>
            </div>

            {loading && (
                <div className="space-y-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div
                            key={i}
                            className="
                                bg-white
                                rounded-xl
                                border
                                h-28
                                animate-pulse
                            "
                        />
                    ))}
                </div>
            )}

            {!loading &&
                visiblePackages.length === 0 && (
                    <EmptyState
                        title="No Packages Available"
                        description="New package collections will appear here."
                    />
                )}

            {!loading && (
                <div className="space-y-4">
                    {visiblePackages.map((pkg) => (
                        <PackageCard
                            key={pkg.id}
                            packageItem={pkg}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}