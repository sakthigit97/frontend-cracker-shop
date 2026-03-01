import Button from "../ui/Button";
import { useAlert } from "../../store/alert.store";

export interface ProductFormData {
    name: string;
    price: string;
    quantity: any;
    brandId: string;
    categoryId: string;
    isActive: boolean;
    images: File[];
    videoUrl: string;
    description: string;
}

interface Props {
    value: ProductFormData;
    brands: any[];
    categories: any[];
    loading?: boolean;
    existingImages?: string[];
    onRemoveImage?: (url: string) => void;
    onChange: (v: ProductFormData) => void;
    onSubmit: () => void;
    onCancel?: () => void;
}

const MAX_IMAGES = 3;
const MAX_IMAGE_SIZE = 2 * 1024 * 1024;

export default function ProductForm({
    value,
    brands,
    categories,
    loading,
    existingImages = [],
    onRemoveImage,
    onChange,
    onSubmit,
    onCancel,
}: Props) {
    const { showAlert } = useAlert();

    const update = (key: keyof ProductFormData, v: any) =>
        onChange({ ...value, [key]: v });

    return (
        <div className="space-y-8">
            <div className="bg-white border rounded-xl p-5 space-y-4">
                <h2 className="text-sm font-semibold text-gray-700">
                    Basic Product Details
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <input
                        placeholder="Product name *"
                        className="border rounded-md px-3 py-2 text-sm"
                        value={value.name}
                        onChange={(e) => update("name", e.target.value)}
                    />

                    <input
                        type="number"
                        placeholder="Price *"
                        className="border rounded-md px-3 py-2 text-sm"
                        value={value.price}
                        onChange={(e) => update("price", e.target.value)}
                    />

                    <input
                        type="number"
                        placeholder="Quantity (Stock) *"
                        className="border rounded-md px-3 py-2 text-sm"
                        value={value.quantity}
                        onChange={(e) =>
                            update("quantity", Number(e.target.value))
                        }
                    />

                    <select
                        className="border rounded-md px-3 py-2 text-sm"
                        value={value.brandId}
                        onChange={(e) => update("brandId", e.target.value)}
                    >
                        <option value="">Select Brand *</option>
                        {brands.map((b) => (
                            <option key={b.id} value={b.id}>
                                {b.name}
                            </option>
                        ))}
                    </select>

                    <select
                        className="border rounded-md px-3 py-2 text-sm"
                        value={value.categoryId}
                        onChange={(e) => update("categoryId", e.target.value)}
                    >
                        <option value="">Select Category *</option>
                        {categories.map((c) => (
                            <option key={c.id} value={c.id}>
                                {c.name}
                            </option>
                        ))}
                    </select>

                    <textarea
                        className="border rounded-md p-2 w-full min-h-[100px] sm:col-span-2"
                        placeholder="Product description *"
                        value={value.description}
                        onChange={(e) =>
                            update("description", e.target.value)
                        }
                    />
                </div>
            </div>

            <div className="bg-white border rounded-xl p-5 flex items-center justify-between">
                <div>
                    <p className="text-sm font-semibold text-gray-700">Status</p>
                    <p className="text-xs text-gray-500">
                        Control product visibility
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={() => update("isActive", !value.isActive)}
                        className={`w-11 h-6 rounded-full p-1 transition ${value.isActive ? "bg-green-500" : "bg-gray-300"
                            }`}
                    >
                        <div
                            className={`w-4 h-4 bg-white rounded-full transition ${value.isActive ? "translate-x-5" : ""
                                }`}
                        />
                    </button>
                    <span className="text-sm font-medium">
                        {value.isActive ? "Active" : "Inactive"}
                    </span>
                </div>
            </div>

            {existingImages && existingImages.length > 0 && (
                <div className="bg-white border rounded-xl p-5 space-y-3">
                    <h2 className="text-sm font-semibold text-gray-700">
                        Existing Images
                    </h2>

                    <div className="grid gap-4 grid-cols-2 sm:grid-cols-3">
                        {existingImages.map((url) => (
                            <div
                                key={url}
                                className="relative border rounded-lg overflow-hidden"
                            >
                                <img
                                    src={url}
                                    alt="Product"
                                    className="w-full h-28 object-cover"
                                    loading="lazy"
                                />

                                <button
                                    type="button"
                                    onClick={() => onRemoveImage?.(url)}
                                    className="absolute top-2 right-2 bg-red-600 text-white text-xs font-medium px-2 py-1 rounded shadow hover:bg-red-700 transition"
                                >
                                    Remove
                                </button>
                            </div>
                        ))}
                    </div>

                    <p className="text-xs text-gray-500">
                        Images will be removed after you save the product
                    </p>
                </div>
            )}

            <div className="bg-white border rounded-xl p-5 space-y-3">
                <h2 className="text-sm font-semibold text-gray-700">
                    Add New Images
                </h2>

                <input
                    type="file"
                    multiple
                    accept="image/*"
                    className="block w-full text-sm text-gray-600
                        file:mr-4 file:py-2 file:px-4
                        file:rounded-md file:border-0
                        file:bg-[var(--color-primary)]
                        file:text-white
                        hover:file:opacity-90"
                    onChange={(e) => {
                        const files = Array.from(e.target.files || []);
                        const totalImages =
                            (existingImages?.length || 0) + files.length;

                        if (totalImages > MAX_IMAGES) {
                            showAlert({
                                type: "error",
                                message: `You can upload up to ${MAX_IMAGES} images only`,
                            });
                            e.target.value = "";
                            return;
                        }

                        const oversized = files.find(
                            (f) => f.size > MAX_IMAGE_SIZE
                        );

                        if (oversized) {
                            showAlert({
                                type: "error",
                                message: `Each image must be less than ${MAX_IMAGE_SIZE / (1024 * 1024)
                                    }MB`,
                            });
                            e.target.value = "";
                            return;
                        }

                        update("images", files);
                    }}
                />

                {value.images.length > 0 && (
                    <div className="text-xs text-gray-500 space-y-1">
                        <p>{value.images.length} image(s) selected</p>
                        <ul className="list-disc list-inside">
                            {value.images.map((f, i) => (
                                <li key={i}>{f.name}</li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>

            <div className="bg-white border rounded-xl p-5 space-y-2">
                <h2 className="text-sm font-semibold text-gray-700">Video</h2>
                <input
                    placeholder="Video URL (optional)"
                    className="border rounded-md px-3 py-2 text-sm w-full"
                    value={value.videoUrl}
                    onChange={(e) => update("videoUrl", e.target.value)}
                />
            </div>

            <div className="flex justify-end gap-3 pt-2">
                {onCancel && (
                    <Button variant="secondary" onClick={onCancel}>
                        Cancel
                    </Button>
                )}
                <Button onClick={onSubmit} disabled={loading}>
                    {loading ? "Saving..." : "Save Product"}
                </Button>
            </div>
        </div>
    );
}