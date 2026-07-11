import { useEffect, useState } from "react";
import { BUDGET_OPTIONS } from "../../constants/aiWizard";

interface Props {

    value: number | null;

    customBudget: string;

    onChange: (
        budget: number,
        customBudget: string
    ) => void;

}

export default function AiBudgetSelector({
    value,
    customBudget,
    onChange,
}: Props) {

    const [custom, setCustom] =
        useState(customBudget);

    useEffect(() => {

        setCustom(customBudget);

    }, [customBudget]);

    const selectBudget = (
        budget: number
    ) => {

        setCustom("");

        onChange(
            budget,
            ""
        );

    };

    const updateCustomBudget = (
        budget: string
    ) => {

        setCustom(budget);

        const numeric =
            Number(budget);

        if (
            Number.isFinite(numeric) &&
            numeric > 0
        ) {

            onChange(
                numeric,
                budget
            );

        }

    };

    return (

        <div className="space-y-5">

            <div>

                <h3 className="text-lg font-semibold">

                    Select Budget

                </h3>

                <p className="text-sm text-gray-500 mt-1">

                    Choose one of the popular budgets
                    or enter your own amount.

                </p>

            </div>

            <div
                className="
                    grid
                    grid-cols-2
                    md:grid-cols-4
                    gap-3
                "
            >

                {BUDGET_OPTIONS.map(
                    (budget) => {

                        const selected =
                            value === budget;

                        return (

                            <button
                                key={budget}
                                type="button"
                                onClick={() =>
                                    selectBudget(
                                        budget
                                    )
                                }
                                className={`
                                    rounded-xl
                                    border-2
                                    py-4
                                    text-lg
                                    font-semibold
                                    transition-all

                                    ${selected
                                        ? "border-[var(--color-primary)] bg-[var(--color-primary)] text-white shadow-md"
                                        : "border-gray-200 hover:border-[var(--color-primary)]"}
                                `}
                            >
                                ₹{budget}
                            </button>

                        );

                    }
                )}

            </div>

            <div className="space-y-2">

                <label
                    className="
                        text-sm
                        font-medium
                    "
                >
                    Custom Budget
                </label>

                <input
                    type="number"
                    min={3000}
                    step={100}
                    value={custom}
                    placeholder="Enter your budget"
                    onChange={(e) =>
                        updateCustomBudget(
                            e.target.value
                        )
                    }
                    className="
                        w-full
                        rounded-xl
                        border
                        px-4
                        py-3
                        focus:ring-2
                        focus:ring-[var(--color-primary)]
                    "
                />

                {Number(custom) > 0 &&
                    Number(custom) < 3000 && (

                        <p
                            className="
                                text-sm
                                text-red-500
                            "
                        >
                            Minimum budget is ₹3000
                        </p>

                    )}

            </div>

        </div>

    );

}