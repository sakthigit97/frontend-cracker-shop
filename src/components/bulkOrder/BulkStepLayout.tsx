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
    const handlePrevious = () => {
        if (previousDisabled || !onPrevious) {
            return;
        }

        onPrevious();
    };

    const handleNext = () => {
        if (nextDisabled || !onNext) {
            return;
        }

        onNext();
    };

    return (
        <div>
            {/* Step heading */}
            <div className="border-b border-gray-200 px-4 py-2.5 lg:px-5 lg:py-3">
                <h2 className="text-lg font-bold leading-tight text-gray-900 lg:text-xl">
                    {title}
                </h2>

                {description && (
                    <p className="mt-0.5 text-xs leading-4 text-gray-500 sm:text-sm">
                        {description}
                    </p>
                )}
            </div>

            {/* Step actions */}
            {(showPrevious || showNext) && (
                <div className="flex items-center justify-between px-4 py-3 lg:px-5">
                    {showPrevious ? (
                        <button
                            type="button"
                            disabled={previousDisabled}
                            onClick={handlePrevious}
                            className={[
                                "rounded-lg border px-4 py-1.5 text-sm font-medium transition",
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
                            onClick={handleNext}
                            className={[
                                "rounded-lg px-5 py-1.5 text-sm font-semibold transition",
                                nextDisabled
                                    ? "cursor-not-allowed bg-gray-300 text-gray-500"
                                    : "bg-primary text-white hover:opacity-90",
                            ].join(" ")}
                        >
                            {nextLabel}
                        </button>
                    )}
                </div>
            )}

            {/* Step content */}
            <div className="px-4 pb-4 lg:px-5 lg:pb-5">
                {children}
            </div>
        </div>
    );
}

export default memo(BulkStepLayout);