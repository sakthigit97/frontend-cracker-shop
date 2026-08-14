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
        <div className="w-full">
            <div className="flex w-full items-center justify-between">
                {BULK_ORDER_STEP_LIST.map(
                    (step, index) => {
                        const completed =
                            currentStep > step.id;

                        const active =
                            currentStep === step.id;

                        const last =
                            index ===
                            BULK_ORDER_STEP_LIST.length - 1;

                        return (
                            <div
                                key={step.id}
                                className="flex flex-1 items-center"
                            >
                                {/* Step */}
                                <div className="flex min-w-0 flex-col items-center">
                                    <div
                                        className={[
                                            "flex h-9 w-9 items-center justify-center rounded-full border-2 text-xs font-semibold transition-all duration-300 sm:h-10 sm:w-10 sm:text-sm",

                                            completed &&
                                            "border-green-600 bg-green-600 text-white",

                                            active &&
                                            "border-primary bg-primary text-white shadow-md",

                                            !completed &&
                                            !active &&
                                            "border-gray-300 bg-white text-gray-500",
                                        ]
                                            .filter(Boolean)
                                            .join(" ")}
                                    >
                                        {completed ? (
                                            <Check
                                                size={16}
                                                strokeWidth={3}
                                            />
                                        ) : (
                                            index + 1
                                        )}
                                    </div>

                                    <span
                                        className={[
                                            "mt-1.5 text-center text-xs font-medium leading-4 sm:text-sm",

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

                                {/* Connector */}
                                {!last && (
                                    <div
                                        className={[
                                            "mx-1.5 h-0.5 flex-1 rounded-full transition-all duration-300 sm:mx-3",

                                            currentStep >
                                                step.id
                                                ? "bg-green-600"
                                                : "bg-gray-200",
                                        ].join(" ")}
                                    />
                                )}
                            </div>
                        );
                    }
                )}
            </div>
        </div>
    );
}

export default memo(BulkStepper);