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
    packageTagIds: string[],
    aiTags: string[];
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
    packageTags?: {
        id: string;
        name: string;
        imageUrl?: string;
    }[];
    aiTags?: {
        id: string;
        name: string;
    }[];
}

const MAX_IMAGES = 3;
const MAX_IMAGE_SIZE = 2 * 1024 * 1024;

export default function ProductForm({
    value,
    brands,
    categories,
    packageTags = [],
    aiTags = [],
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

    const togglePackageTag = (tagId: string) => {
        const current = value.packageTagIds || [];

        const next = current.includes(tagId)
            ? current.filter((id) => id !== tagId)
            : [...current, tagId];

        update("packageTagIds", next);
    };

    const toggleAiTag = (tag: string) => {
        const current = value.aiTags || [];

        const next = current.includes(tag)
            ? current.filter(t => t !== tag)
            : [...current, tag];

        update("aiTags", next);
    };

    console.log(existingImages)

    return (
        <div className="space-y-8">
            <div className="bg-white border rounded-xl p-5 space-y-4">
                <h2 className="text-sm font-semibold text-gray-700">
                    Basic Product Details
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Product Name *
                        </label>

                        <input
                            className="border rounded-md px-3 py-2 text-sm w-full"
                            value={value.name}
                            onChange={(e) => update("name", e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Product Price (₹) *
                        </label>

                        <input
                            type="number"
                            className="border rounded-md px-3 py-2 text-sm w-full"
                            value={value.price}
                            onChange={(e) => update("price", e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Available Stock Quantity *
                        </label>

                        <input
                            type="number"
                            className="border rounded-md px-3 py-2 text-sm w-full"
                            value={value.quantity}
                            onChange={(e) =>
                                update("quantity", Number(e.target.value))
                            }
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Brand *
                        </label>

                        <select
                            className="border rounded-md px-3 py-2 text-sm w-full"
                            value={value.brandId}
                            onChange={(e) => update("brandId", e.target.value)}
                        >
                            <option value="">Select Brand</option>

                            {brands.map((b) => (
                                <option key={b.id} value={b.id}>
                                    {b.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Category *
                        </label>

                        <select
                            className="border rounded-md px-3 py-2 text-sm w-full"
                            value={value.categoryId}
                            onChange={(e) => update("categoryId", e.target.value)}
                        >
                            <option value="">Select Category</option>

                            {categories.map((c) => (
                                <option key={c.id} value={c.id}>
                                    {c.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="sm:col-span-2">
                        <label className="block text-sm font-semibold text-gray-700 mb-3">
                            Package Tags
                        </label>

                        <p className="text-xs text-gray-500 mb-3">
                            Select the package types applicable for this product.
                        </p>
                        {packageTags.length === 0 ? (
                            <p className="text-sm text-gray-500">
                                No package tags configured
                            </p>
                        ) : (
                            <div className="space-y-2 
                                border border-gray-200
                                rounded-xl
                                p-4
                                bg-gray-50/50">
                                {packageTags.map((tag) => (
                                    <label
                                        key={tag.id}
                                        className="flex items-center gap-3 border rounded-lg px-3 py-2"
                                    >
                                        <input
                                            type="checkbox"
                                            checked={value.packageTagIds.includes(tag.id)}
                                            onChange={() => togglePackageTag(tag.id)}
                                        />
                                        <span>{tag.name}</span>
                                    </label>
                                ))}
                            </div>
                        )}
                    </div>


                    <div className="sm:col-span-2">
                        <label className="block text-sm font-semibold text-gray-700 mb-3">
                            AI Search Tags
                        </label>

                        <p className="text-xs text-gray-500 mb-3">
                            Select the AI tags applicable for this product.
                        </p>

                        {aiTags.length === 0 ? (
                            <p className="text-sm text-gray-500">
                                No AI tags configured
                            </p>
                        ) : (
                            <div
                                className="
                                    space-y-2
                                    border
                                    border-gray-200
                                    rounded-xl
                                    p-4
                                    bg-gray-50/50
                                "
                            >
                                {aiTags.map((tag) => (
                                    <label
                                        key={tag.id}
                                        className="flex items-center gap-3 border rounded-lg px-3 py-2"
                                    >
                                        <input
                                            type="checkbox"
                                            checked={value.aiTags.includes(tag.id)}
                                            onChange={() => toggleAiTag(tag.id)}
                                        />

                                        <span>{tag.name}</span>
                                    </label>
                                ))}
                            </div>
                        )}

                        <p className="text-xs text-gray-500 mt-3">
                            Used by AI Smart Search and Recommendation Engine.
                        </p>
                    </div>

                    <div className="sm:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Product Description *
                        </label>

                        <textarea
                            className="border rounded-md p-3 w-full min-h-[100px]"
                            value={value.description}
                            onChange={(e) =>
                                update("description", e.target.value)
                            }
                        />
                    </div>
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
                    Upload New Product Images
                </h2>
                <p className="text-xs text-gray-500 mb-3">
                    Maximum 3 images. Each image should be less than 2 MB.
                </p>

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
                        const totalImages = (existingImages?.length || 0) + files.length;
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

            <label className="block text-sm font-medium text-gray-700 mb-2">
                Product Video URL (Optional)
            </label>

            <input
                className="border rounded-md px-3 py-2 text-sm w-full"
                value={value.videoUrl}
                onChange={(e) => update("videoUrl", e.target.value)}
            />

            <div className="flex flex-col sm:flex-row gap-3 pt-4">

                {onCancel && (
                    <Button variant="secondary" className="
                    w-full sm:w-auto
                    px-5 py-3
                    rounded-xl
                    bg-gray-900 text-white
                    font-medium
                    hover:opacity-90
                    transition"
                        onClick={onCancel}>
                        Cancel
                    </Button>
                )}
                <Button
                    className="
                    w-full sm:w-auto
                    px-5 py-3
                    rounded-xl
                    bg-amber-500 text-black
                    font-semibold
                    hover:opacity-90
                    transition
                    "
                    onClick={onSubmit} disabled={loading}>
                    {loading ? "Saving..." : "Save Product"}
                </Button>
            </div>
        </div>
    );
}