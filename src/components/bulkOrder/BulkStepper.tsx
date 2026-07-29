import { memo } from "react";
import { Check } from "lucide-react";
import { BULK_ORDER_STEP_LIST } from "../../constants/bulkOrderSteps";
import type { BulkOrderStep } from "../../types/bulkOrder";

interface BulkStepperProps {
    currentStep: BulkOrderStep;
}

function BulkStepper({
    currentStep,
}: BulkStepperProps) {
    return (
        <div className="w-full overflow-x-auto">
            <div className="flex min-w-[640px] items-center justify-between">
                {BULK_ORDER_STEP_LIST.map((step, index) => {

                    const completed = currentStep > step.id;
                    const active = currentStep === step.id;
                    const last =
                        index === BULK_ORDER_STEP_LIST.length - 1;

                    return (

                        <div
                            key={step.id}
                            className="flex flex-1 items-center"
                        >

                            <div className="flex min-w-[90px] flex-col items-center">

                                <div
                                    className={[
                                        "flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-full border-2 text-xs sm:text-sm font-semibold transition-all duration-300",

                                        completed &&
                                        "border-green-600 bg-green-600 text-white",

                                        active &&
                                        "border-primary bg-primary text-white shadow-lg",

                                        !completed &&
                                        !active &&
                                        "border-gray-300 bg-white text-gray-500",
                                    ]
                                        .filter(Boolean)
                                        .join(" ")}
                                >
                                    {completed ? (
                                        <Check
                                            size={18}
                                            strokeWidth={3}
                                        />
                                    ) : (
                                        index + 1
                                    )}
                                </div>

                                <span
                                    className={[
                                        "mt-3 text-center text-sm font-medium",

                                        active &&
                                        "text-primary",

                                        completed &&
                                        "text-green-600",

                                        !completed &&
                                        !active &&
                                        "text-gray-500",
                                    ]
                                        .filter(Boolean)
                                        .join(" ")}
                                >
                                    {step.title}
                                </span>

                            </div>

                            {!last && (

                                <div
                                    className={[
                                        "mx-2 sm:mx-4 h-1 flex-1 rounded-full transition-all duration-300",

                                        currentStep > step.id
                                            ? "bg-green-600"
                                            : "bg-gray-200",
                                    ].join(" ")}
                                />

                            )}

                        </div>

                    );
                })}

            </div>

        </div>
    );
}

export default memo(BulkStepper);