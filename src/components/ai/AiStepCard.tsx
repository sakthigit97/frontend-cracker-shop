import type { AiOption } from "../../types/aiWizard";

interface Props {
    option: AiOption;
    selected: boolean;
    onClick: () => void;
}

export default function AiStepCard({
    option,
    selected,
    onClick,
}: Props) {

    return (

        <button
            type="button"
            onClick={onClick}
            className={`
                w-full
                rounded-2xl
                border-2
                p-5
                text-left
                transition-all
                duration-200

                hover:-translate-y-1
                hover:shadow-lg

                ${selected
                    ? "border-[var(--color-primary)] bg-[var(--color-primary)]/10 shadow-md"
                    : "border-gray-200 bg-white hover:border-[var(--color-primary)]/40"}
            `}
        >

            <div className="flex items-start gap-4">

                <div
                    className={`
                        flex
                        h-14
                        w-14
                        items-center
                        justify-center
                        rounded-xl
                        text-3xl

                        ${selected
                            ? "bg-[var(--color-primary)] text-white"
                            : "bg-gray-100"}
                    `}
                >
                    {option.icon}
                </div>

                <div className="flex-1">

                    <h3
                        className={`
                            text-lg
                            font-semibold

                            ${selected
                                ? "text-[var(--color-primary)]"
                                : "text-gray-900"}
                        `}
                    >
                        {option.title}
                    </h3>

                    {option.description && (

                        <p className="mt-1 text-sm text-gray-500 leading-relaxed">

                            {option.description}

                        </p>

                    )}

                </div>

                {selected && (

                    <div
                        className="
                            flex
                            h-8
                            w-8
                            items-center
                            justify-center
                            rounded-full
                            bg-[var(--color-primary)]
                            text-white
                            text-sm
                            font-bold
                        "
                    >
                        ✓
                    </div>

                )}

            </div>

        </button>

    );

}