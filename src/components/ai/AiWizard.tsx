import { useMemo, useState } from "react";
import AiStepCard from "./AiStepCard";
import AiBudgetSelector from "./AiBudgetSelector";

import {
    AUDIENCE_OPTIONS,
    CRACKER_TYPE_OPTIONS,
    NOISE_OPTIONS,
    TIME_OPTIONS,
    WIZARD_STEPS,
} from "../../constants/aiWizard";

import {
    INITIAL_AI_WIZARD_STATE,
    type AiWizardProps,
} from "../../types/aiWizard";

export default function AiWizard({
    onGenerate,
    loading,
}: AiWizardProps) {

    const [step, setStep] =
        useState(1);

    const [form, setForm] =
        useState(
            INITIAL_AI_WIZARD_STATE
        );

    const progress =
        useMemo(
            () =>
                (step /
                    WIZARD_STEPS.length) *
                100,
            [step]
        );

    const updateField = (
        field: keyof typeof form,
        value: any
    ) => {

        setForm(prev => ({
            ...prev,
            [field]: value,
        }));

    };

    const validateCurrentStep = () => {

        switch (step) {

            case 1:
                return !!form.audience;

            case 2:
                return !!form.crackerType;

            case 3:
                return !!form.noiseLevel;

            case 4:
                return !!form.timePreference;

            case 5:
                return (
                    !!form.budget &&
                    form.budget >= 3000
                );

            default:
                return true;

        }

    };

    const next = () => {

        if (
            !validateCurrentStep()
        ) {
            return;
        }

        setStep(prev =>
            Math.min(
                prev + 1,
                WIZARD_STEPS.length
            )
        );

    };

    const previous = () => {

        setStep(prev =>
            Math.max(
                prev - 1,
                1
            )
        );

    };

    const generate = async () => {

        await onGenerate(form);

    };

    return (

        <div
            className="
        w-full
        max-w-5xl
        mx-auto
        rounded-3xl
        bg-white
        border
        shadow-xl
        overflow-hidden
    "
        >
            <div
                className="
        bg-gradient-to-r
        from-white
        to-gray-50
        border-b
        border-gray-200
        p-5
        sm:p-6
        lg:p-8
    "
            >
                <div
                    className="
            flex
            flex-col
            md:flex-row
            md:items-center
            md:justify-between
            gap-5
        "
                >

                    <div>

                        <h2
                            className="
                                text-xl
                                font-semibold
                            "
                        >
                            Build Your Package
                        </h2>

                        <p
                            className="
                                text-sm
                                text-gray-500
                                mt-1
                            "
                        >
                            Answer a few questions
                            and we'll prepare
                            the perfect cracker package.
                        </p>

                    </div>

                    <div
                        className="
                            text-sm
                            font-medium
                            text-gray-500
                        "
                    >
                        Step {step} of {WIZARD_STEPS.length}
                    </div>

                </div>

                <div
                    className="
                        mt-5
                        h-2
                        rounded-full
                        bg-gray-200
                        overflow-hidden
                    "
                >

                    <div
                        className="
                            h-full
                            bg-[var(--color-primary)]
                            transition-all
                            duration-300
                        "
                        style={{
                            width:
                                `${progress}%`,
                        }}
                    />

                </div>

            </div>

            <div className="p-6">


                {step === 1 && (

                    <div
                        className="
                            space-y-5
                        "
                    >

                        <div>

                            <h3
                                className="
                                    text-xl
                                    font-semibold
                                "
                            >
                                Who is this package for?
                            </h3>

                            <p
                                className="
                                    text-gray-500
                                    mt-1
                                "
                            >
                                Select the audience.

                            </p>

                        </div>

                        <div
                            className="
                                grid
                                grid-cols-1
                                md:grid-cols-2
                                lg:grid-cols-3
                                gap-4
                            "
                        >

                            {AUDIENCE_OPTIONS.map(
                                option => (

                                    <AiStepCard
                                        key={
                                            option.id
                                        }
                                        option={
                                            option
                                        }
                                        selected={
                                            form.audience ===
                                            option.id
                                        }
                                        onClick={() =>
                                            updateField(
                                                "audience",
                                                option.id
                                            )
                                        }
                                    />

                                )
                            )}

                        </div>

                    </div>

                )}

                {step === 2 && (

                    <div
                        className="
                            space-y-5
                        "
                    >

                        <div>

                            <h3
                                className="
                                    text-xl
                                    font-semibold
                                "
                            >
                                Preferred Cracker Type
                            </h3>

                            <p
                                className="
                                    text-gray-500
                                    mt-1
                                "
                            >
                                Select the type
                                of crackers you
                                prefer.

                            </p>

                        </div>

                        <div
                            className="
                                grid
                                grid-cols-1
                                md:grid-cols-2
                                lg:grid-cols-3
                                gap-4
                            "
                        >

                            {CRACKER_TYPE_OPTIONS.map(
                                option => (

                                    <AiStepCard
                                        key={
                                            option.id
                                        }
                                        option={
                                            option
                                        }
                                        selected={
                                            form.crackerType ===
                                            option.id
                                        }
                                        onClick={() =>
                                            updateField(
                                                "crackerType",
                                                option.id
                                            )
                                        }
                                    />

                                )
                            )}

                        </div>

                    </div>

                )}

                {step === 3 && (

                    <div
                        className="
                            space-y-5
                        "
                    >

                        <div>

                            <h3
                                className="
                                    text-xl
                                    font-semibold
                                "
                            >
                                Preferred Noise Level
                            </h3>

                            <p
                                className="
                                    text-gray-500
                                    mt-1
                                "
                            >
                                Choose the
                                preferred sound
                                level.

                            </p>

                        </div>

                        <div
                            className="
                                grid
                                grid-cols-1
                                md:grid-cols-3
                                gap-4
                            "
                        >

                            {NOISE_OPTIONS.map(
                                option => (

                                    <AiStepCard
                                        key={
                                            option.id
                                        }
                                        option={
                                            option
                                        }
                                        selected={
                                            form.noiseLevel ===
                                            option.id
                                        }
                                        onClick={() =>
                                            updateField(
                                                "noiseLevel",
                                                option.id
                                            )
                                        }
                                    />

                                )
                            )}

                        </div>

                    </div>

                )}

                {step === 4 && (

                    <div className="space-y-5">

                        <div>

                            <h3
                                className="
                                    text-xl
                                    font-semibold
                                "
                            >
                                When will you use them?
                            </h3>

                            <p
                                className="
                                    text-gray-500
                                    mt-1
                                "
                            >
                                Select your preferred
                                usage time.
                            </p>

                        </div>

                        <div
                            className="
                                grid
                                grid-cols-1
                                md:grid-cols-3
                                gap-4
                            "
                        >

                            {TIME_OPTIONS.map(
                                option => (

                                    <AiStepCard
                                        key={option.id}
                                        option={option}
                                        selected={
                                            form.timePreference ===
                                            option.id
                                        }
                                        onClick={() =>
                                            updateField(
                                                "timePreference",
                                                option.id
                                            )
                                        }
                                    />

                                )
                            )}

                        </div>

                    </div>

                )}


                {step === 5 && (

                    <AiBudgetSelector
                        value={form.budget}
                        customBudget={
                            form.customBudget
                        }
                        onChange={(
                            budget,
                            customBudget
                        ) => {

                            updateField(
                                "budget",
                                budget
                            );

                            updateField(
                                "customBudget",
                                customBudget
                            );

                        }}
                    />

                )}


            </div>

            <div
                className="
                    border-t
                    p-5
                    flex
                    justify-between
                    items-center
                "
            >

                <button
                    type="button"
                    disabled={step === 1}
                    onClick={previous}
                    className="
                        px-5
                        py-3
                        rounded-xl
                        border
                        disabled:opacity-40
                    "
                >
                    Previous
                </button>

                {step !==
                    WIZARD_STEPS.length ? (

                    <button
                        type="button"
                        onClick={next}
                        disabled={
                            !validateCurrentStep()
                        }
                        className="
                            px-6
                            py-3
                            rounded-xl
                            bg-[var(--color-primary)]
                            text-white
                            disabled:opacity-50
                        "
                    >
                        Next
                    </button>

                ) : (

                    <button
                        type="button"
                        disabled={
                            loading ||
                            !form.budget
                        }
                        onClick={generate}
                        className="
                            px-8
                            py-3
                            rounded-xl
                            bg-[var(--color-primary)]
                            text-white
                            disabled:opacity-50
                        "
                    >

                        {loading
                            ? "Generating Package..."
                            : "Generate Package"}

                    </button>

                )}

            </div>

        </div>

    );

}