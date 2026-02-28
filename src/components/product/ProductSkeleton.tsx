export default function ProductSkeleton() {
    return (
        <div
            className="
        bg-[var(--color-surface)]
        rounded-xl
        border
        border-gray-200
        shadow-sm md:shadow-md
        flex
        flex-col
        overflow-hidden
        animate-pulse
      "
        >
            {/* Image Skeleton */}
            <div className="relative bg-gray-200 h-40 sm:h-44 md:h-48" />

            {/* Content Skeleton */}
            <div className="p-3 flex flex-col flex-1">
                {/* Title */}
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-1" />

                {/* Brand */}
                <div className="h-3 bg-gray-200 rounded w-1/2 mb-2" />

                {/* Price */}
                <div className="h-5 bg-gray-300 rounded w-1/3" />

                {/* Push CTA to bottom */}
                <div className="flex-1" />

                {/* Button */}
                <div className="h-9 bg-gray-300 rounded-lg mt-2" />
            </div>
        </div>
    );
}