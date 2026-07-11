import type { AiWizardState } from "../../types/aiWizard";

interface Props {

    values: AiWizardState;

    onEdit: (
        step: number
    ) => void;

}

export default function AiPreferenceSummary({
    values,
    onEdit,
}: Props) {

    const rows = [

        {
            step: 1,
            label: "Who is this for?",
            value: values.audience,
        },

        {
            step: 2,
            label: "Cracker Type",
            value: values.crackerType,
        },

        {
            step: 3,
            label: "Noise Level",
            value: values.noiseLevel,
        },

        {
            step: 4,
            label: "Usage",
            value: values.timePreference,
        },

        {
            step: 5,
            label: "Budget",
            value:
                values.budget
                    ? `₹${values.budget}`
                    : "",
        },

        {
            step: 6,
            label: "Additional Requirements",
            value:
                values.additionalRequirements ||
                "-",
        },

    ];

    return (

        <div
            className="
                rounded-2xl
                border
                bg-white
                shadow-sm
                overflow-hidden
            "
        >

            <div
                className="
                    px-5
                    py-4
                    border-b
                    bg-gray-50
                "
            >

                <h2
                    className="
                        text-lg
                        font-semibold
                    "
                >
                    Your Preferences
                </h2>

                <p
                    className="
                        text-sm
                        text-gray-500
                        mt-1
                    "
                >
                    Review your selections before generating the package.
                </p>

            </div>

            <div>

                {rows.map((row) => (

                    <div
                        key={row.step}
                        className="
                            flex
                            items-center
                            justify-between
                            px-5
                            py-4
                            border-b
                            last:border-b-0
                        "
                    >

                        <div>

                            <p
                                className="
                                    text-xs
                                    uppercase
                                    tracking-wide
                                    text-gray-400
                                "
                            >
                                {row.label}
                            </p>

                            <p
                                className="
                                    mt-1
                                    font-medium
                                    text-gray-800
                                "
                            >
                                {row.value || "-"}
                            </p>

                        </div>

                        <button
                            type="button"
                            onClick={() =>
                                onEdit(
                                    row.step
                                )
                            }
                            className="
                                px-3
                                py-1.5
                                rounded-lg
                                border
                                text-sm
                                font-medium
                                hover:bg-[var(--color-primary)]
                                hover:text-white
                                transition
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