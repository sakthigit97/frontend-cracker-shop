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

            <div className="border-b border-gray-200 px-8 py-6">

                <h2 className="text-2xl font-bold text-gray-900">
                    {title}
                </h2>

                {description && (
                    <p className="mt-2 text-gray-600">
                        {description}
                    </p>
                )}

            </div>

            <div className="p-8">
                {children}
            </div>

            {(showPrevious || showNext) && (

                <div className="flex flex-col-reverse gap-3 border-t border-gray-200 bg-gray-50 px-8 py-5 sm:flex-row sm:justify-between">

                    {showPrevious ? (

                        <button
                            type="button"
                            disabled={previousDisabled}
                            onClick={onPrevious}
                            className={[
                                "rounded-xl border px-6 py-3 font-medium transition",

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
                            className={[
                                "rounded-xl px-8 py-3 font-semibold transition",

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

        </div>
    );
}

export default memo(BulkStepLayout);