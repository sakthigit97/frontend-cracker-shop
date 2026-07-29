import {
    AUDIENCE_OPTIONS,
    CRACKER_TYPE_OPTIONS,
    NOISE_OPTIONS,
    TIME_OPTIONS,
} from "../../constants/aiWizard";

import type { AiWizardState } from "../../types/aiWizard";

interface Props {
    form: AiWizardState;
    onEdit: (step: number) => void;
}

function getLabels(ids: string[], options: any[]) {
    return ids.map(id => {
        const option = options.find(o => o.id === id);
        return option?.title ?? id;
    });
}

export default function AiSelectionSummary({
    form,
    onEdit,
}: Props) {
    const sections = [
        {
            title: "Audience",
            step: 1,
            values: getLabels(form.audience, AUDIENCE_OPTIONS),
        },
        {
            title: "Usage Time",
            step: 2,
            values: getLabels(form.timePreference, TIME_OPTIONS),
        },
        {
            title: "Noise Level",
            step: 3,
            values: getLabels(form.noiseLevel, NOISE_OPTIONS),
        },
        {
            title: "Cracker Types",
            step: 4,
            values: getLabels(form.crackerType, CRACKER_TYPE_OPTIONS),
        },
    ];

    return (
        <div className="rounded-2xl border bg-gray-50 p-5 mb-6">
            <h3 className="text-lg font-semibold mb-5">
                Review Your Preferences
            </h3>

            <div className="space-y-5">
                {sections.map(section => (
                    <div
                        key={section.title}
                        className="flex justify-between items-start gap-4"
                    >
                        <div className="flex-1">
                            <p className="text-sm font-medium text-gray-700">
                                {section.title}
                            </p>

                            <div className="flex flex-wrap gap-2 mt-2">
                                {section.values.map(value => (
                                    <span
                                        key={value}
                                        className="
                      rounded-full
                      bg-[var(--color-primary)]/10
                      text-[var(--color-primary)]
                      px-3
                      py-1
                      text-xs
                      font-medium
                    "
                                    >
                                        {value}
                                    </span>
                                ))}
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={() => onEdit(section.step)}
                            className="
                text-sm
                font-medium
                text-[var(--color-primary)]
                hover:underline
              "
                        >
                            Edit
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}