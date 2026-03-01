import { useEffect, useMemo, useState } from "react";
import Button from "../../components/ui/Button";
import { useAlert } from "../../store/alert.store";
import { useNavigate } from "react-router-dom";
import { createDiscount } from "../../services/adminDiscounts.api";
import { useAdminTargetsStore } from "../../store/adminTargets.store";
import { useAdminDiscountsStore } from "../../store/adminDiscounts.store";
import ProductSkeleton from "../../components/product/ProductSkeleton";

export default function AdminDiscountsPage() {
    const { showAlert } = useAlert();
    const navigate = useNavigate();

    const loadAllTargets = useAdminTargetsStore((s) => s.loadAllTargets);
    const categories = useAdminTargetsStore((s) => s.categories);
    const brands = useAdminTargetsStore((s) => s.brands);
    const products = useAdminTargetsStore((s) => s.products);
    const discounts = useAdminDiscountsStore((s) => s.discounts);
    const fetchDiscounts = useAdminDiscountsStore((s) => s.fetchDiscounts);
    const refreshDiscounts = useAdminDiscountsStore((s) => s.refreshDiscounts);
    const discountLoading = useAdminDiscountsStore((s) => s.loading);

    const [fetching, setFetching] = useState(true);
    const [loading, setLoading] = useState(false);

    const [form, setForm] = useState<any>({
        discountMode: "PERCENT",
        discountType: "CATEGORY",
        discountValue: "",
        priority: 1,
        targetId: "",
        isActive: true,
    });

    const [search, setSearch] = useState("");

    useEffect(() => {
        const load = async () => {
            try {
                await loadAllTargets();
                await fetchDiscounts();
            } catch {
                showAlert({
                    type: "error",
                    message: "Failed to load discounts",
                });
            } finally {
                setFetching(false);
            }
        };

        load();
    }, []);

    const targetOptions = useMemo(() => {
        if (form.discountType === "CATEGORY") return categories;
        if (form.discountType === "BRAND") return brands;
        if (form.discountType === "PRODUCT") return products;
        return [];
    }, [form.discountType, categories, brands, products]);

    const filteredTargets = useMemo(() => {
        return targetOptions.filter((t: any) =>
            t.name?.toLowerCase().includes(search.toLowerCase())
        );
    }, [targetOptions, search]);

    const resolveTargetName = (d: any) => {
        const list =
            d.discountType === "CATEGORY"
                ? categories
                : d.discountType === "BRAND"
                    ? brands
                    : products;

        const found = list.find(
            (x: any) =>
                x.categoryId === d.targetId ||
                x.brandId === d.targetId ||
                x.productId === d.targetId
        );

        return found?.name || d.targetId;
    };

    const handleCreate = async () => {
        if (!form.targetId) {
            showAlert({ type: "error", message: "Target is required" });
            return;
        }

        if (!form.discountValue || Number(form.discountValue) <= 0) {
            showAlert({
                type: "error",
                message: "Discount value must be greater than 0",
            });
            return;
        }

        try {
            setLoading(true);

            await createDiscount({
                ...form,
                discountValue: Number(form.discountValue),
            });

            showAlert({
                type: "success",
                message: "Discount created successfully",
            });

            await refreshDiscounts();

            setForm({
                discountMode: "PERCENT",
                discountType: "CATEGORY",
                discountValue: "",
                priority: 1,
                targetId: "",
                isActive: true,
            });

            setSearch("");
        } catch {
            showAlert({
                type: "error",
                message: "Failed to create discount",
            });
        } finally {
            setLoading(false);
        }
    };

    if (fetching || discountLoading) {
        return (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                    <ProductSkeleton key={i} />
                ))}
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
            <div>
                <h1 className="text-2xl font-bold">Discount Management</h1>
                <p className="text-sm text-gray-500">
                    Create product/category/brand level discounts with priority.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 bg-white border rounded-2xl shadow-sm p-5 space-y-4">
                    <h2 className="font-semibold text-lg">Add Discount</h2>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <p className="text-xs font-medium mb-1">Mode</p>
                            <select
                                className="border rounded-lg px-3 py-2 w-full text-sm"
                                value={form.discountMode}
                                onChange={(e) =>
                                    setForm((p: any) => ({
                                        ...p,
                                        discountMode: e.target.value,
                                    }))
                                }
                            >
                                <option value="PERCENT">Percent (%)</option>
                                <option value="FLAT">Flat (₹)</option>
                            </select>
                        </div>

                        <div>
                            <p className="text-xs font-medium mb-1">Type</p>
                            <select
                                className="border rounded-lg px-3 py-2 w-full text-sm"
                                value={form.discountType}
                                onChange={(e) => {
                                    setForm((p: any) => ({
                                        ...p,
                                        discountType: e.target.value,
                                        targetId: "",
                                    }));
                                    setSearch("");
                                }}
                            >
                                <option value="CATEGORY">Category</option>
                                <option value="BRAND">Brand</option>
                                <option value="PRODUCT">Product</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <p className="text-xs font-medium mb-1">
                            Target ({form.discountType})
                        </p>

                        <input
                            className="border rounded-lg px-3 py-2 w-full text-sm mb-2"
                            placeholder="Search target..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />

                        <select
                            className="border rounded-lg px-3 py-2 w-full text-sm"
                            value={form.targetId}
                            onChange={(e) =>
                                setForm((p: any) => ({
                                    ...p,
                                    targetId: e.target.value,
                                }))
                            }
                        >
                            <option value="">Select Target</option>

                            {filteredTargets.map((t: any) => {
                                const id =
                                    t.categoryId || t.brandId || t.productId;

                                return (
                                    <option key={id} value={id}>
                                        {t.name}
                                    </option>
                                );
                            })}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <p className="text-xs font-medium mb-1">Value</p>
                            <input
                                type="number"
                                className="border rounded-lg px-3 py-2 w-full text-sm"
                                value={form.discountValue}
                                onChange={(e) =>
                                    setForm((p: any) => ({
                                        ...p,
                                        discountValue: e.target.value,
                                    }))
                                }
                            />
                        </div>

                        <div>
                            <p className="text-xs font-medium mb-1">
                                Priority
                            </p>
                            <select
                                className="border rounded-lg px-3 py-2 w-full text-sm"
                                value={form.priority}
                                onChange={(e) =>
                                    setForm((p: any) => ({
                                        ...p,
                                        priority: Number(e.target.value),
                                    }))
                                }
                            >
                                <option value={1}>1 (High)</option>
                                <option value={2}>2</option>
                                <option value={3}>3 (Low)</option>
                            </select>
                        </div>
                    </div>

                    <label className="flex items-center gap-2 text-sm">
                        <input
                            type="checkbox"
                            checked={form.isActive}
                            onChange={(e) =>
                                setForm((p: any) => ({
                                    ...p,
                                    isActive: e.target.checked,
                                }))
                            }
                        />
                        Active
                    </label>

                    <Button onClick={handleCreate} disabled={loading}>
                        {loading ? "Saving…" : "Create Discount"}
                    </Button>
                </div>

                <div className="lg:col-span-2 bg-white border rounded-2xl shadow-sm p-5 flex flex-col">
                    <h2 className="font-semibold text-lg mb-4">
                        Existing Discounts
                    </h2>

                    <div className="border rounded-xl overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-100 text-gray-600 text-xs uppercase sticky top-0">
                                    <tr>
                                        <th className="px-4 py-3 text-left">Type</th>
                                        <th className="px-4 py-3 text-left">Target</th>
                                        <th className="px-4 py-3 text-left">Mode</th>
                                        <th className="px-4 py-3 text-left">Priority</th>
                                        <th className="px-4 py-3 text-right">Action</th>
                                    </tr>
                                </thead>

                                <tbody className="divide-y">
                                    {discounts.length === 0 && (
                                        <tr>
                                            <td
                                                colSpan={5}
                                                className="text-center py-6 text-gray-400"
                                            >
                                                No discounts created yet.
                                            </td>
                                        </tr>
                                    )}

                                    {discounts.map((d) => (
                                        <tr
                                            key={d.discountId}
                                            className="hover:bg-gray-50 transition"
                                        >
                                            <td className="px-4 py-3 font-medium">
                                                {d.discountType}
                                            </td>

                                            <td className="px-4 py-3 text-gray-600 max-w-[200px] truncate">
                                                {resolveTargetName(d)}
                                            </td>

                                            <td className="px-4 py-3">
                                                {d.discountMode}{" "}
                                                <span className="font-semibold">
                                                    {d.discountValue}
                                                </span>
                                            </td>

                                            <td className="px-4 py-3">
                                                {d.priority}
                                            </td>

                                            <td className="px-4 py-3 text-right">
                                                <Button
                                                    variant="outline"
                                                    onClick={() =>
                                                        navigate(
                                                            `/admin/discounts/${d.discountId}/edit`
                                                        )
                                                    }
                                                >
                                                    Edit
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="max-h-[420px] overflow-y-auto"></div>
                    </div>
                </div>

            </div>
        </div>
    );
}