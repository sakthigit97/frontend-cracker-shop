import { memo } from "react";
import type { ReactNode } from "react";

interface BulkStepLayoutProps {
    title: string;
    description?: string;
    children: ReactNode;
    previousLabel?: string;
    nextLabel?: string;
    showPrevious?: boolean;
    showNext?: boolean;
    previousDisabled?: boolean;
    nextDisabled?: boolean;
    onPrevious?: () => void;
    onNext?: () => void;
}

function BulkStepLayout({
    title,
    description,
    children,
    previousLabel = "Previous",
    nextLabel = "Continue",
    showPrevious = true,
    showNext = true,
    previousDisabled = false,
    nextDisabled = false,
    onPrevious,
    onNext,
}: BulkStepLayoutProps) {
    return (
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">

            <div className="border-b border-gray-200 px-5 py-4 lg:px-6 lg:py-5">
                <h2 className="text-xl lg:text-2xl font-bold text-gray-900">
                    {title}
                </h2>

                {description && (
                    <p className="mt-1 text-sm text-gray-600">
                        {description}
                    </p>
                )}

            </div>

            <div className="p-4 lg:p-5">
                {children}
            </div>

            {(showPrevious || showNext) && (

                <div className="flex flex-col-reverse gap-2 border-t border-gray-200 bg-gray-50 px-4 py-3 lg:px-5 sm:flex-row sm:justify-between">
                    {showPrevious ? (

                        <button
                            type="button"
                            disabled={previousDisabled}
                            onClick={onPrevious}
                            className={[
                                "rounded-lg border px-4 py-2 text-sm font-medium transition",
                                previousDisabled
                                    ? "cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400"
                                    : "border-gray-300 bg-white hover:bg-gray-100",
                            ].join(" ")}
                        >
                            {previousLabel}
                        </button>

                    ) : (
                        <div />
                    )}

                    {showNext && (

                        <button
                            type="button"
                            disabled={nextDisabled}
                            onClick={onNext}
                            className={["rounded-lg px-5 py-2 text-sm font-semibold transition",
                                nextDisabled ? "cursor-not-allowed bg-gray-300 text-gray-500"
                                    : "bg-primary text-white hover:opacity-90",
                            ].join(" ")}
                        >
                            {nextLabel}
                        </button>

                    )}

                </div>

            )}

        </div>
    );
}

export default memo(BulkStepLayout);