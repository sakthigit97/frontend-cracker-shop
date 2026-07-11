import AiWizard from "./AiWizard";
import AiPackageResult from "./AiPackageResult";

import { useAiRecommendation } from "../../store/aiRecommendation.store";

export default function AiAssistantCard() {
    const {
        loading,
        response,
        askAi,
    } = useAiRecommendation();

    const generatePackage = async (form: any) => {
        await askAi({
            budget: Number(form.budget),

            audiences:
                form.audience &&
                    form.audience !== "no-preference"
                    ? [form.audience]
                    : [],

            crackerTypes:
                form.crackerType &&
                    form.crackerType !== "no-preference"
                    ? [form.crackerType]
                    : [],

            noiseLevels:
                form.noiseLevel &&
                    form.noiseLevel !== "no-preference"
                    ? [form.noiseLevel]
                    : [],

            timePreferences:
                form.timePreference &&
                    form.timePreference !== "no-preference"
                    ? [form.timePreference]
                    : [],

            features: [],
        });
    };

    return (
        <div
            className="
                max-w-5xl
                mx-auto
                space-y-8
            "
        >
            {/* Wizard */}
            <AiWizard
                loading={loading}
                onGenerate={generatePackage}
            />

            {/* Validation Error */}
            {response?.status === "INVALID_BUDGET" && (
                <div
                    className="
                        rounded-2xl
                        border
                        border-red-200
                        bg-red-50
                        p-5
                        shadow-sm
                    "
                >
                    <div className="flex items-start gap-3">
                        <div
                            className="
                                flex
                                h-10
                                w-10
                                items-center
                                justify-center
                                rounded-full
                                bg-red-100
                                text-xl
                            "
                        >
                            ⚠️
                        </div>

                        <div>
                            <h3
                                className="
                                    text-lg
                                    font-semibold
                                    text-red-700
                                "
                            >
                                Invalid Budget
                            </h3>

                            <p
                                className="
                                    mt-1
                                    text-red-600
                                    leading-6
                                "
                            >
                                {response.message}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {response?.status === "SUCCESS" && (
                <div
                    className="
                        rounded-3xl
                        overflow-hidden
                    "
                >
                    <AiPackageResult />
                </div>
            )}
        </div>
    );
}