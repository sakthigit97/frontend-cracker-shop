import {
    useEffect,
    useMemo,
    useState,
    type ChangeEvent,
} from "react";
import { useNavigate } from "react-router-dom";
import defaultImage from "../../assets/default-image.png";
import {
    FaArrowLeft,
    FaChevronLeft,
    FaChevronRight,
    FaSearch,
    FaTimes,
    FaUpload,
} from "react-icons/fa";

import { useHomeProducts } from "../../store/homeProduct.store";
import { useAlert } from "../../store/alert.store";
import { apiFetch } from "../../services/api";
import { uploadFilesToS3 } from "../../utils/uploadToS3";

const PRODUCTS_PER_PAGE = 20;

type FlashSaleStatus =
    | "SCHEDULED"
    | "ACTIVE"
    | "EXPIRED"
    | "CANCELLED";

interface FlashSale {
    flashSaleId: string;
    productId: string;
    header: string;
    imageUrl: string;
    originalPrice: number;
    salePrice: number;
    startAt: string;
    endAt: string;
    status: FlashSaleStatus;
    createdAt: string;
    updatedAt: string;
}

interface SelectedImage {
    file: File;
    previewUrl: string;
}

export default function AdminFlashSale() {
    const navigate = useNavigate();
    const { showAlert } = useAlert();

    /*
     * IMPORTANT:
     * Products come from the existing home product store.
     * No /admin/products API call.
     */
    const {
        products,
        loading: productsLoading,
        fetchAll,
    } = useHomeProducts();

    /* ----------------------------- */
    /* Product selection */
    /* ----------------------------- */

    const [search, setSearch] = useState("");
    const [currentPage, setCurrentPage] = useState(1);

    const [selectedProductId, setSelectedProductId] =
        useState<string | null>(null);

    /* ----------------------------- */
    /* Flash sale form */
    /* ----------------------------- */

    const [header, setHeader] = useState("");
    const [salePrice, setSalePrice] = useState("");
    const [startAt, setStartAt] = useState("");
    const [endAt, setEndAt] = useState("");

    const [selectedImage, setSelectedImage] =
        useState<SelectedImage | null>(null);

    const [submitting, setSubmitting] = useState(false);

    /* ----------------------------- */
    /* Existing flash sales */
    /* ----------------------------- */

    const [flashSales, setFlashSales] = useState<FlashSale[]>([]);
    const [loadingFlashSales, setLoadingFlashSales] = useState(false);

    const [cancellingId, setCancellingId] =
        useState<string | null>(null);

    /* ----------------------------- */
    /* Load products */
    /* ----------------------------- */

    useEffect(() => {
        fetchAll();
    }, []);

    /* ----------------------------- */
    /* Load flash sales */
    /* ----------------------------- */

    useEffect(() => {
        loadFlashSales();
    }, []);

    const filteredProducts = useMemo(() => {
        const query = search.trim().toLowerCase();

        const filtered = !query
            ? [...products]
            : products.filter((product: any) => {
                const productName =
                    String(product?.name ?? "").toLowerCase();

                const searchText =
                    String(product?.searchText ?? "").toLowerCase();

                return (
                    productName.includes(query) ||
                    searchText.includes(query)
                );
            });

        return filtered.sort(
            (a: any, b: any) =>
                (a.sequenceNumber ?? Number.MAX_SAFE_INTEGER) -
                (b.sequenceNumber ?? Number.MAX_SAFE_INTEGER)
        );
    }, [products, search]);

    const totalPages = Math.max(
        1,
        Math.ceil(
            filteredProducts.length / PRODUCTS_PER_PAGE
        )
    );

    const paginatedProducts = useMemo(() => {
        const start =
            (currentPage - 1) * PRODUCTS_PER_PAGE;

        return filteredProducts.slice(
            start,
            start + PRODUCTS_PER_PAGE
        );
    }, [filteredProducts, currentPage]);

    /* Reset page when search changes */
    useEffect(() => {
        setCurrentPage(1);
    }, [search]);

    /* Keep page valid */
    useEffect(() => {
        if (currentPage > totalPages) {
            setCurrentPage(totalPages);
        }
    }, [currentPage, totalPages]);

    /* ----------------------------- */
    /* Selected product */
    /* ----------------------------- */

    const selectedProduct = useMemo(() => {
        if (!selectedProductId) {
            return null;
        }

        return (
            products.find(
                (product: any) =>
                    product.id === selectedProductId
            ) ?? null
        );
    }, [products, selectedProductId]);

    async function loadFlashSales() {
        try {
            setLoadingFlashSales(true);

            const response = await apiFetch(
                "/admin/flash-sales",
                { method: "GET" },
                import.meta.env.VITE_API_BASE_URL_V1
            );

            const items =
                response?.data?.data ??
                response?.data?.items ??
                response?.data ??
                response?.items ??
                [];

            setFlashSales(Array.isArray(items) ? items : []);
        } catch (error: any) {
            console.error(
                "Unable to load flash sales:",
                error
            );

            showAlert({
                type: "error",
                message:
                    error?.message ||
                    "Unable to load flash sales.",
            });
        } finally {
            setLoadingFlashSales(false);
        }
    }

    /* ----------------------------- */
    /* Select product */
    /* ----------------------------- */

    const handleSelectProduct = (product: any) => {
        setSelectedProductId(product.id);

        /*
         * Original product price is read-only.
         * Sale price is entered separately.
         */
        setSalePrice("");

        /*
         * Scroll to form.
         */
        setTimeout(() => {
            document
                .getElementById("flash-sale-form")
                ?.scrollIntoView({
                    behavior: "smooth",
                    block: "start",
                });
        }, 50);
    };

    /* ----------------------------- */
    /* Remove selected product */
    /* ----------------------------- */

    const clearSelectedProduct = () => {
        setSelectedProductId(null);
        setHeader("");
        setSalePrice("");
        setStartAt("");
        setEndAt("");

        if (selectedImage?.previewUrl) {
            URL.revokeObjectURL(
                selectedImage.previewUrl
            );
        }

        setSelectedImage(null);
    };

    /* ----------------------------- */
    /* Image selection */
    /* ----------------------------- */

    const handleImageChange = (
        event: ChangeEvent<HTMLInputElement>
    ) => {
        const file = event.target.files?.[0];

        /*
         * Reset input so selecting same image again
         * triggers change event.
         */
        event.target.value = "";

        if (!file) {
            return;
        }

        const allowedTypes = [
            "image/jpeg",
            "image/png",
            "image/webp",
        ];

        if (!allowedTypes.includes(file.type)) {
            showAlert({
                type: "error",
                message:
                    "Please select a JPG, PNG or WEBP image.",
            });
            return;
        }

        if (file.size > 3 * 1024 * 1024) {
            showAlert({
                type: "error",
                message:
                    "Image size must not exceed 3 MB.",
            });
            return;
        }

        if (selectedImage?.previewUrl) {
            URL.revokeObjectURL(
                selectedImage.previewUrl
            );
        }

        const previewUrl =
            URL.createObjectURL(file);

        setSelectedImage({
            file,
            previewUrl,
        });
    };

    /* ----------------------------- */
    /* Remove image */
    /* ----------------------------- */

    const removeImage = () => {
        if (selectedImage?.previewUrl) {
            URL.revokeObjectURL(
                selectedImage.previewUrl
            );
        }

        setSelectedImage(null);
    };

    /* ----------------------------- */
    /* Validation */
    /* ----------------------------- */

    const validateForm = () => {
        if (!selectedProduct) {
            showAlert({
                type: "error",
                message: "Please select a product.",
            });
            return false;
        }

        if (!header.trim()) {
            showAlert({
                type: "error",
                message:
                    "Please enter the flash sale header.",
            });
            return false;
        }

        const numericSalePrice =
            Number(salePrice);

        if (
            !salePrice ||
            !Number.isFinite(numericSalePrice) ||
            numericSalePrice <= 0
        ) {
            showAlert({
                type: "error",
                message:
                    "Please enter a valid flash sale price.",
            });
            return false;
        }

        const originalPrice =
            Number(selectedProduct.price);

        if (numericSalePrice >= originalPrice) {
            showAlert({
                type: "error",
                message:
                    "Flash sale price must be lower than the original price.",
            });
            return false;
        }

        if (!startAt) {
            showAlert({
                type: "error",
                message:
                    "Please select the start date and time.",
            });
            return false;
        }

        if (!endAt) {
            showAlert({
                type: "error",
                message:
                    "Please select the end date and time.",
            });
            return false;
        }

        const startDate =
            new Date(startAt);

        const endDate =
            new Date(endAt);

        if (
            Number.isNaN(startDate.getTime()) ||
            Number.isNaN(endDate.getTime())
        ) {
            showAlert({
                type: "error",
                message:
                    "Please enter valid start and end dates.",
            });
            return false;
        }

        if (startDate >= endDate) {
            showAlert({
                type: "error",
                message:
                    "End date and time must be after the start date and time.",
            });
            return false;
        }

        if (!selectedImage) {
            showAlert({
                type: "error",
                message:
                    "Please upload a flash sale image.",
            });
            return false;
        }

        return true;
    };

    /* ----------------------------- */
    /* Create Flash Sale */
    /* ----------------------------- */

    const handleCreateFlashSale = async () => {
        if (submitting) {
            return;
        }

        if (!validateForm()) {
            return;
        }

        try {
            setSubmitting(true);

            const uploadReferenceId =
                crypto.randomUUID();

            const presignResponse =
                await apiFetch(
                    "/admin/flash-sales/presign",
                    {
                        method: "POST",
                        body: JSON.stringify({
                            flashSaleId:
                                uploadReferenceId,
                            fileName:
                                selectedImage!.file
                                    .name,
                            contentType:
                                selectedImage!.file
                                    .type,
                        }),
                    },
                    import.meta.env
                        .VITE_API_BASE_URL_V1
                );

            const uploadUrl =
                presignResponse?.data
                    ?.uploadUrl ??
                presignResponse?.uploadUrl;

            const fileUrl =
                presignResponse?.data
                    ?.fileUrl ??
                presignResponse?.fileUrl;

            if (!uploadUrl || !fileUrl) {
                throw new Error(
                    "Flash sale image upload URL was not returned."
                );
            }

            await uploadFilesToS3(
                [
                    {
                        uploadUrl,
                    },
                ],
                [selectedImage!.file]
            );

            await apiFetch(
                "/admin/flash-sales",
                {
                    method: "POST",
                    body: JSON.stringify({
                        productId:
                            selectedProduct!.id,
                        header: header.trim(),
                        imageUrl: fileUrl,
                        salePrice:
                            Number(salePrice),
                        startAt:
                            new Date(
                                startAt
                            ).toISOString(),
                        endAt:
                            new Date(
                                endAt
                            ).toISOString(),
                    }),
                },
                import.meta.env
                    .VITE_API_BASE_URL_V1
            );

            showAlert({
                type: "success",
                message:
                    "Flash sale created successfully.",
            });

            clearSelectedProduct();

            await loadFlashSales();
        } catch (error: any) {
            console.error(
                "Create flash sale failed:",
                error
            );

            showAlert({
                type: "error",
                message:
                    error?.message ||
                    "Unable to create flash sale.",
            });
        } finally {
            setSubmitting(false);
        }
    };

    /* ----------------------------- */
    /* Cancel Flash Sale */
    /* ----------------------------- */

    const handleCancelFlashSale = async (
        flashSaleId: string
    ) => {
        if (cancellingId) {
            return;
        }

        const confirmed =
            window.confirm(
                "Are you sure you want to cancel this flash sale?"
            );

        if (!confirmed) {
            return;
        }

        try {
            setCancellingId(flashSaleId);

            await apiFetch(
                `/admin/flash-sales/${flashSaleId}`,
                {
                    method: "DELETE",
                },
                import.meta.env
                    .VITE_API_BASE_URL_V1
            );

            showAlert({
                type: "success",
                message:
                    "Flash sale cancelled successfully.",
            });

            await loadFlashSales();
        } catch (error: any) {
            console.error(
                "Cancel flash sale failed:",
                error
            );

            showAlert({
                type: "error",
                message:
                    error?.message ||
                    "Unable to cancel flash sale.",
            });
        } finally {
            setCancellingId(null);
        }
    };

    /* ----------------------------- */
    /* Helpers */
    /* ----------------------------- */

    const formatCurrency = (
        value: number
    ) => {
        return `₹${Number(
            value || 0
        ).toLocaleString("en-IN")}`;
    };

    const formatDateTime = (
        value: string
    ) => {
        if (!value) {
            return "-";
        }

        const date = new Date(value);

        if (Number.isNaN(date.getTime())) {
            return "-";
        }

        return date.toLocaleString(
            "en-IN",
            {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
                hour12: true,
            }
        );
    };

    const getStatusClass = (
        status: FlashSaleStatus
    ) => {
        switch (status) {
            case "ACTIVE":
                return "bg-green-100 text-green-700";

            case "SCHEDULED":
                return "bg-blue-100 text-blue-700";

            case "EXPIRED":
                return "bg-gray-100 text-gray-600";

            case "CANCELLED":
                return "bg-red-100 text-red-700";

            default:
                return "bg-gray-100 text-gray-600";
        }
    };

    /* ----------------------------- */
    /* Render */
    /* ----------------------------- */

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="mx-auto max-w-7xl px-3 py-4 md:px-5 md:py-6">

                {/* Header */}
                <div className="mb-5 flex items-center gap-3">
                    <button
                        type="button"
                        onClick={() =>
                            navigate(-1)
                        }
                        className="
                            flex
                            h-9
                            w-9
                            shrink-0
                            items-center
                            justify-center
                            rounded-full
                            bg-[var(--color-primary)]
                            text-white
                            shadow-sm
                            transition
                            hover:scale-105
                            active:scale-95
                        "
                    >
                        <FaArrowLeft size={14} />
                    </button>

                    <div>
                        <h1
                            className="
                                text-xl
                                font-semibold
                                text-[var(--color-primary)]
                                md:text-2xl
                            "
                        >
                            Flash Sale
                        </h1>

                        <p className="text-xs text-gray-500 md:text-sm">
                            Select a product and create a
                            limited-time flash sale.
                        </p>
                    </div>
                </div>

                {/* ============================== */}
                {/* PRODUCT SELECTION */}
                {/* ============================== */}

                <section className="rounded-xl border border-gray-200 bg-white shadow-sm">

                    <div className="border-b border-gray-200 px-4 py-4">
                        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">

                            <div>
                                <h2 className="text-base font-semibold text-gray-900">
                                    Select Product
                                </h2>

                                <p className="text-xs text-gray-500">
                                    Search and select a
                                    product for the flash sale.
                                </p>
                            </div>

                            <div className="relative w-full md:w-80">
                                <FaSearch
                                    className="
                                        absolute
                                        left-3
                                        top-1/2
                                        -translate-y-1/2
                                        text-gray-400
                                    "
                                    size={14}
                                />

                                <input
                                    value={search}
                                    onChange={(e) =>
                                        setSearch(
                                            e.target.value
                                        )
                                    }
                                    placeholder="Search crackers..."
                                    className="
                                        w-full
                                        rounded-lg
                                        border
                                        border-gray-300
                                        py-2
                                        pl-9
                                        pr-3
                                        text-sm
                                        outline-none
                                        transition
                                        focus:border-[var(--color-primary)]
                                        focus:ring-2
                                        focus:ring-[var(--color-primary)]/10
                                    "
                                />
                            </div>
                        </div>
                    </div>

                    {/* Product table */}
                    <div className="overflow-x-auto">
                        <div className="min-w-[700px]">

                            {/* Header */}
                            <div
                                className="
                                    grid
                                    grid-cols-[70px_minmax(280px,1fr)_150px_130px]
                                    items-center
                                    gap-3
                                    bg-slate-900
                                    px-4
                                    py-3
                                    text-xs
                                    font-semibold
                                    uppercase
                                    tracking-wide
                                    text-white
                                "
                            >
                                <div>Image</div>
                                <div>Product</div>
                                <div>Original Price</div>
                                <div className="text-center">
                                    Action
                                </div>
                            </div>

                            {/* Loading */}
                            {productsLoading &&
                                products.length === 0 ? (
                                <div className="space-y-2 p-4">
                                    {Array.from({
                                        length: 8,
                                    }).map((_, index) => (
                                        <div
                                            key={index}
                                            className="
                                                h-16
                                                animate-pulse
                                                rounded-lg
                                                bg-gray-100
                                            "
                                        />
                                    ))}
                                </div>
                            ) : paginatedProducts.length ===
                                0 ? (
                                <div className="px-4 py-16 text-center">
                                    <div className="mb-3 text-4xl">
                                        🔍
                                    </div>

                                    <h3 className="font-semibold text-gray-800">
                                        No products found
                                    </h3>

                                    <p className="mt-1 text-sm text-gray-500">
                                        Try another product
                                        name.
                                    </p>
                                </div>
                            ) : (
                                <div>
                                    {paginatedProducts.map(
                                        (
                                            product: any
                                        ) => {
                                            const isSelected =
                                                selectedProductId ===
                                                product.id;
                                            const image =
                                                product?.images?.[0] ??
                                                product?.image ??
                                                defaultImage;

                                            return (
                                                <div
                                                    key={
                                                        product.id
                                                    }
                                                    className={`
                                                        grid
                                                        grid-cols-[70px_minmax(280px,1fr)_150px_130px]
                                                        items-center
                                                        gap-3
                                                        border-b
                                                        border-gray-100
                                                        px-4
                                                        py-2.5
                                                        transition
                                                        ${isSelected
                                                            ? "bg-blue-50"
                                                            : "bg-white hover:bg-gray-50"
                                                        }
                                                    `}
                                                >
                                                    {/* Image */}
                                                    <div>
                                                        {image ? (
                                                            <img
                                                                src={
                                                                    image
                                                                }
                                                                alt={
                                                                    product.name
                                                                }
                                                                className="
                                                                    h-12
                                                                    w-12
                                                                    rounded-lg
                                                                    border
                                                                    border-gray-200
                                                                    bg-white
                                                                    object-contain
                                                                "
                                                                onError={(e) => {
                                                                    e.currentTarget.src = defaultImage;
                                                                }}
                                                            />
                                                        ) : (
                                                            <div
                                                                className="
                                                                    flex
                                                                    h-12
                                                                    w-12
                                                                    items-center
                                                                    justify-center
                                                                    rounded-lg
                                                                    border
                                                                    border-gray-200
                                                                    bg-gray-50
                                                                    text-xs
                                                                    text-gray-400
                                                                "
                                                            >
                                                                No
                                                                image
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Product */}
                                                    <div className="min-w-0">
                                                        <div
                                                            className="
                                                                truncate
                                                                text-sm
                                                                font-semibold
                                                                text-blue-600
                                                            "
                                                        >
                                                            {
                                                                product.name
                                                            }
                                                        </div>

                                                        {product.discountText && (
                                                            <div className="mt-0.5 text-xs text-green-600">
                                                                {
                                                                    product.discountText
                                                                }
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Price */}
                                                    <div className="text-sm font-semibold text-gray-900">
                                                        {formatCurrency(
                                                            Number(
                                                                product.price
                                                            )
                                                        )}
                                                    </div>

                                                    {/* Action */}
                                                    <div className="text-center">
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                handleSelectProduct(
                                                                    product
                                                                )
                                                            }
                                                            className={`
                                                                rounded-lg
                                                                px-4
                                                                py-1.5
                                                                text-xs
                                                                font-semibold
                                                                transition
                                                                ${isSelected
                                                                    ? "bg-green-600 text-white"
                                                                    : "bg-[var(--color-primary)] text-white hover:opacity-90"
                                                                }
                                                            `}
                                                        >
                                                            {isSelected
                                                                ? "Selected"
                                                                : "Select"}
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        }
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Pagination */}
                    {filteredProducts.length >
                        0 && (
                            <div
                                className="
                                flex
                                flex-col
                                gap-3
                                border-t
                                border-gray-200
                                px-4
                                py-3
                                sm:flex-row
                                sm:items-center
                                sm:justify-between
                            "
                            >
                                <div className="text-xs text-gray-500">
                                    Showing{" "}
                                    <span className="font-semibold text-gray-700">
                                        {Math.min(
                                            (currentPage -
                                                1) *
                                            PRODUCTS_PER_PAGE +
                                            1,
                                            filteredProducts.length
                                        )}
                                    </span>
                                    {" - "}
                                    <span className="font-semibold text-gray-700">
                                        {Math.min(
                                            currentPage *
                                            PRODUCTS_PER_PAGE,
                                            filteredProducts.length
                                        )}
                                    </span>
                                    {" of "}
                                    <span className="font-semibold text-gray-700">
                                        {
                                            filteredProducts.length
                                        }
                                    </span>{" "}
                                    products
                                </div>

                                <div className="flex items-center justify-center gap-2">
                                    <button
                                        type="button"
                                        disabled={
                                            currentPage ===
                                            1
                                        }
                                        onClick={() =>
                                            setCurrentPage(
                                                (page) =>
                                                    Math.max(
                                                        1,
                                                        page -
                                                        1
                                                    )
                                            )
                                        }
                                        className="
                                        flex
                                        h-8
                                        w-8
                                        items-center
                                        justify-center
                                        rounded-lg
                                        border
                                        border-gray-300
                                        bg-white
                                        text-gray-600
                                        transition
                                        hover:bg-gray-50
                                        disabled:cursor-not-allowed
                                        disabled:opacity-40
                                    "
                                    >
                                        <FaChevronLeft
                                            size={11}
                                        />
                                    </button>

                                    <div className="min-w-[70px] text-center text-xs font-medium text-gray-700">
                                        Page{" "}
                                        {currentPage}{" "}
                                        of{" "}
                                        {totalPages}
                                    </div>

                                    <button
                                        type="button"
                                        disabled={
                                            currentPage >=
                                            totalPages
                                        }
                                        onClick={() =>
                                            setCurrentPage(
                                                (page) =>
                                                    Math.min(
                                                        totalPages,
                                                        page +
                                                        1
                                                    )
                                            )
                                        }
                                        className="
                                        flex
                                        h-8
                                        w-8
                                        items-center
                                        justify-center
                                        rounded-lg
                                        border
                                        border-gray-300
                                        bg-white
                                        text-gray-600
                                        transition
                                        hover:bg-gray-50
                                        disabled:cursor-not-allowed
                                        disabled:opacity-40
                                    "
                                    >
                                        <FaChevronRight
                                            size={11}
                                        />
                                    </button>
                                </div>
                            </div>
                        )}
                </section>

                {/* ============================== */}
                {/* SELECTED PRODUCT + FORM */}
                {/* ============================== */}

                {selectedProduct && (
                    <section
                        id="flash-sale-form"
                        className="
                            mt-5
                            rounded-xl
                            border
                            border-gray-200
                            bg-white
                            shadow-sm
                        "
                    >
                        {/* Selected product */}
                        <div className="border-b border-gray-200 px-4 py-4">
                            <div className="mb-3 flex items-center justify-between">
                                <div>
                                    <h2 className="text-base font-semibold text-gray-900">
                                        Create Flash Sale
                                    </h2>

                                    <p className="text-xs text-gray-500">
                                        Configure the sale
                                        details below.
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    onClick={
                                        clearSelectedProduct
                                    }
                                    className="
                                        flex
                                        h-8
                                        w-8
                                        items-center
                                        justify-center
                                        rounded-full
                                        bg-gray-100
                                        text-gray-500
                                        transition
                                        hover:bg-red-50
                                        hover:text-red-600
                                    "
                                    title="Change product"
                                >
                                    <FaTimes
                                        size={13}
                                    />
                                </button>
                            </div>

                            <div
                                className="
                                    flex
                                    items-center
                                    gap-3
                                    rounded-xl
                                    border
                                    border-green-200
                                    bg-green-50
                                    p-3
                                "
                            >
                                <img
                                    src={
                                        selectedProduct
                                            ?.images?.[0] ??
                                        selectedProduct?.image ??
                                        ""
                                    }
                                    alt={
                                        selectedProduct.name
                                    }
                                    className="
                                        h-16
                                        w-16
                                        rounded-lg
                                        border
                                        border-gray-200
                                        bg-white
                                        object-contain
                                    "
                                />

                                <div className="min-w-0 flex-1">
                                    <div className="truncate text-sm font-semibold text-gray-900">
                                        {
                                            selectedProduct.name
                                        }
                                    </div>

                                    <div className="mt-1 text-xs text-gray-500">
                                        Original Price
                                    </div>

                                    <div className="text-lg font-bold text-gray-900">
                                        {formatCurrency(
                                            Number(
                                                selectedProduct.price
                                            )
                                        )}
                                    </div>
                                </div>

                                <div className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                                    Selected
                                </div>
                            </div>
                        </div>

                        {/* Form */}
                        <div className="p-4">

                            {/* Header */}
                            <div className="mb-4">
                                <label className="mb-1.5 block text-sm font-medium text-gray-800">
                                    Flash Sale Header
                                </label>

                                <input
                                    value={header}
                                    onChange={(e) =>
                                        setHeader(
                                            e.target.value
                                        )
                                    }
                                    placeholder="Example: Adhiradi Damaka"
                                    maxLength={100}
                                    className="
                                        w-full
                                        rounded-lg
                                        border
                                        border-gray-300
                                        px-3
                                        py-2.5
                                        text-sm
                                        outline-none
                                        transition
                                        focus:border-[var(--color-primary)]
                                        focus:ring-2
                                        focus:ring-[var(--color-primary)]/10
                                    "
                                />
                            </div>

                            {/* Price */}
                            <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2">

                                <div>
                                    <label className="mb-1.5 block text-sm font-medium text-gray-800">
                                        Original Price
                                    </label>

                                    <div
                                        className="
                                            rounded-lg
                                            border
                                            border-gray-200
                                            bg-gray-100
                                            px-3
                                            py-2.5
                                            text-sm
                                            font-semibold
                                            text-gray-500
                                        "
                                    >
                                        {formatCurrency(
                                            Number(
                                                selectedProduct.price
                                            )
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <label className="mb-1.5 block text-sm font-medium text-gray-800">
                                        Flash Sale Price
                                    </label>

                                    <input
                                        type="number"
                                        min="1"
                                        step="0.01"
                                        value={
                                            salePrice
                                        }
                                        onChange={(e) =>
                                            setSalePrice(
                                                e.target
                                                    .value
                                            )
                                        }
                                        placeholder="Enter sale price"
                                        className="
                                            w-full
                                            rounded-lg
                                            border
                                            border-gray-300
                                            px-3
                                            py-2.5
                                            text-sm
                                            outline-none
                                            transition
                                            focus:border-[var(--color-primary)]
                                            focus:ring-2
                                            focus:ring-[var(--color-primary)]/10
                                        "
                                    />
                                </div>
                            </div>

                            {/* Dates */}
                            <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2">

                                <div>
                                    <label className="mb-1.5 block text-sm font-medium text-gray-800">
                                        Start Date & Time
                                    </label>

                                    <input
                                        type="datetime-local"
                                        value={
                                            startAt
                                        }
                                        onChange={(e) =>
                                            setStartAt(
                                                e.target
                                                    .value
                                            )
                                        }
                                        className="
                                            w-full
                                            rounded-lg
                                            border
                                            border-gray-300
                                            px-3
                                            py-2.5
                                            text-sm
                                            outline-none
                                            transition
                                            focus:border-[var(--color-primary)]
                                            focus:ring-2
                                            focus:ring-[var(--color-primary)]/10
                                        "
                                    />
                                </div>

                                <div>
                                    <label className="mb-1.5 block text-sm font-medium text-gray-800">
                                        End Date & Time
                                    </label>

                                    <input
                                        type="datetime-local"
                                        value={
                                            endAt
                                        }
                                        onChange={(e) =>
                                            setEndAt(
                                                e.target
                                                    .value
                                            )
                                        }
                                        className="
                                            w-full
                                            rounded-lg
                                            border
                                            border-gray-300
                                            px-3
                                            py-2.5
                                            text-sm
                                            outline-none
                                            transition
                                            focus:border-[var(--color-primary)]
                                            focus:ring-2
                                            focus:ring-[var(--color-primary)]/10
                                        "
                                    />
                                </div>
                            </div>

                            {/* Image */}
                            <div className="mb-5">
                                <label className="mb-1.5 block text-sm font-medium text-gray-800">
                                    Flash Sale Image
                                </label>

                                {!selectedImage ? (
                                    <label
                                        className="
                                            flex
                                            min-h-[190px]
                                            cursor-pointer
                                            flex-col
                                            items-center
                                            justify-center
                                            rounded-xl
                                            border-2
                                            border-dashed
                                            border-gray-300
                                            bg-gray-50
                                            transition
                                            hover:border-[var(--color-primary)]
                                            hover:bg-gray-100
                                        "
                                    >
                                        <FaUpload
                                            size={24}
                                            className="mb-3 text-gray-400"
                                        />

                                        <span className="text-sm font-medium text-gray-700">
                                            Upload Image
                                        </span>

                                        <span className="mt-1 text-xs text-gray-400">
                                            JPG, PNG, WEBP •
                                            Max 3 MB
                                        </span>

                                        <input
                                            type="file"
                                            accept="image/jpeg,image/png,image/webp"
                                            onChange={
                                                handleImageChange
                                            }
                                            className="hidden"
                                        />
                                    </label>
                                ) : (
                                    <div
                                        className="
                                            relative
                                            overflow-hidden
                                            rounded-xl
                                            border
                                            border-gray-200
                                            bg-gray-50
                                        "
                                    >
                                        <img
                                            src={
                                                selectedImage.previewUrl
                                            }
                                            alt="Flash sale preview"
                                            className="
                                                h-64
                                                w-full
                                                object-contain
                                                bg-white
                                            "
                                        />

                                        <button
                                            type="button"
                                            onClick={
                                                removeImage
                                            }
                                            className="
                                                absolute
                                                right-3
                                                top-3
                                                flex
                                                h-8
                                                w-8
                                                items-center
                                                justify-center
                                                rounded-full
                                                bg-black/70
                                                text-white
                                                transition
                                                hover:bg-red-600
                                            "
                                        >
                                            <FaTimes
                                                size={13}
                                            />
                                        </button>

                                        <div className="border-t border-gray-200 bg-white px-3 py-2 text-xs text-gray-500">
                                            {
                                                selectedImage
                                                    .file
                                                    .name
                                            }
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Submit */}
                            <div className="flex justify-end">
                                <button
                                    type="button"
                                    disabled={
                                        submitting
                                    }
                                    onClick={
                                        handleCreateFlashSale
                                    }
                                    className="
                                        min-w-[180px]
                                        rounded-lg
                                        bg-[var(--color-primary)]
                                        px-5
                                        py-2.5
                                        text-sm
                                        font-semibold
                                        text-white
                                        shadow-sm
                                        transition
                                        hover:opacity-90
                                        disabled:cursor-not-allowed
                                        disabled:opacity-50
                                    "
                                >
                                    {submitting
                                        ? "Creating..."
                                        : "Create Flash Sale"}
                                </button>
                            </div>
                        </div>
                    </section>
                )}

                {/* ============================== */}
                {/* EXISTING FLASH SALES */}
                {/* ============================== */}

                <section className="mt-5 rounded-xl border border-gray-200 bg-white shadow-sm">

                    <div className="border-b border-gray-200 px-4 py-4">
                        <h2 className="text-base font-semibold text-gray-900">
                            Flash Sales
                        </h2>

                        <p className="text-xs text-gray-500">
                            Manage scheduled and active
                            flash sales.
                        </p>
                    </div>

                    {loadingFlashSales ? (
                        <div className="space-y-2 p-4">
                            {Array.from({
                                length: 4,
                            }).map((_, index) => (
                                <div
                                    key={index}
                                    className="
                                        h-16
                                        animate-pulse
                                        rounded-lg
                                        bg-gray-100
                                    "
                                />
                            ))}
                        </div>
                    ) : flashSales.length === 0 ? (
                        <div className="px-4 py-12 text-center text-sm text-gray-500">
                            No flash sales found.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[900px] text-left text-sm">
                                <thead>
                                    <tr className="bg-slate-900 text-xs uppercase tracking-wide text-white">
                                        <th className="px-4 py-3">
                                            Product
                                        </th>

                                        <th className="px-4 py-3">
                                            Header
                                        </th>

                                        <th className="px-4 py-3">
                                            Price
                                        </th>

                                        <th className="px-4 py-3">
                                            Start
                                        </th>

                                        <th className="px-4 py-3">
                                            End
                                        </th>

                                        <th className="px-4 py-3">
                                            Status
                                        </th>

                                        <th className="px-4 py-3 text-center">
                                            Action
                                        </th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {flashSales.map(
                                        (
                                            sale
                                        ) => {
                                            const product =
                                                products.find(
                                                    (
                                                        product: any
                                                    ) =>
                                                        product.id ===
                                                        sale.productId
                                                );

                                            return (
                                                <tr
                                                    key={
                                                        sale.flashSaleId
                                                    }
                                                    className="border-b border-gray-100 hover:bg-gray-50"
                                                >
                                                    <td className="px-4 py-3">
                                                        <div className="flex items-center gap-3">
                                                            <img
                                                                src={
                                                                    sale.imageUrl
                                                                }
                                                                alt={
                                                                    product?.name ||
                                                                    "Product"
                                                                }
                                                                className="
                                                                    h-11
                                                                    w-11
                                                                    rounded-lg
                                                                    border
                                                                    border-gray-200
                                                                    bg-white
                                                                    object-contain
                                                                "
                                                            />

                                                            <div className="min-w-0">
                                                                <div className="max-w-[220px] truncate font-semibold text-gray-800">
                                                                    {product?.name ??
                                                                        sale.productId}
                                                                </div>

                                                                <div className="text-xs text-gray-400">
                                                                    {
                                                                        sale.productId
                                                                    }
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>

                                                    <td className="px-4 py-3">
                                                        <div className="max-w-[180px] truncate font-medium text-gray-800">
                                                            {
                                                                sale.header
                                                            }
                                                        </div>
                                                    </td>

                                                    <td className="px-4 py-3">
                                                        <div className="font-semibold text-gray-900">
                                                            {formatCurrency(
                                                                sale.salePrice
                                                            )}
                                                        </div>

                                                        <div className="text-xs text-gray-400 line-through">
                                                            {formatCurrency(
                                                                sale.originalPrice
                                                            )}
                                                        </div>
                                                    </td>

                                                    <td className="px-4 py-3 text-xs text-gray-600">
                                                        {formatDateTime(
                                                            sale.startAt
                                                        )}
                                                    </td>

                                                    <td className="px-4 py-3 text-xs text-gray-600">
                                                        {formatDateTime(
                                                            sale.endAt
                                                        )}
                                                    </td>

                                                    <td className="px-4 py-3">
                                                        <span
                                                            className={`
                                                                inline-flex
                                                                rounded-full
                                                                px-2.5
                                                                py-1
                                                                text-xs
                                                                font-semibold
                                                                ${getStatusClass(
                                                                sale.status
                                                            )}
                                                            `}
                                                        >
                                                            {
                                                                sale.status
                                                            }
                                                        </span>
                                                    </td>

                                                    <td className="px-4 py-3 text-center">
                                                        {sale.status !==
                                                            "CANCELLED" &&
                                                            sale.status !==
                                                            "EXPIRED" && (
                                                                <button
                                                                    type="button"
                                                                    disabled={
                                                                        cancellingId ===
                                                                        sale.flashSaleId
                                                                    }
                                                                    onClick={() =>
                                                                        handleCancelFlashSale(
                                                                            sale.flashSaleId
                                                                        )
                                                                    }
                                                                    className="
                                                                        rounded-lg
                                                                        border
                                                                        border-red-200
                                                                        bg-red-50
                                                                        px-3
                                                                        py-1.5
                                                                        text-xs
                                                                        font-semibold
                                                                        text-red-600
                                                                        transition
                                                                        hover:bg-red-100
                                                                        disabled:opacity-50
                                                                    "
                                                                >
                                                                    {cancellingId ===
                                                                        sale.flashSaleId
                                                                        ? "Cancelling..."
                                                                        : "Cancel"}
                                                                </button>
                                                            )}
                                                    </td>
                                                </tr>
                                            );
                                        }
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
}