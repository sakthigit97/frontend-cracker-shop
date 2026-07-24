import { useNavigate } from "react-router-dom";
import AiAssistantCard from "../components/ai/AiAssistantCard";

export default function AiAssistant() {
    const navigate = useNavigate();

    return (
        <div className="space-y-4">

            {/* Header */}
            <div className="flex items-center gap-4 mb-3">
                <button
                    onClick={() => navigate(-1)}
                    className="
                        flex
                        items-center
                        justify-center
                        w-8
                        h-8
                        ml-3
                        md:ml-4
                        rounded-full
                        bg-[var(--color-primary)]
                        text-white
                        shadow-sm
                        hover:scale-105
                        active:scale-95
                        transition-all
                    "
                >
                    ←
                </button>

                <div>
                    <h1
                        className="
                            text-lg
                            md:text-xl
                            font-semibold
                            text-[var(--color-primary)]
                        "
                    >
                        AI Cracker Assistant
                    </h1>

                    <p className="text-xs text-gray-500">
                        Build your perfect cracker package with AI.
                    </p>
                </div>
            </div>

            {/* Disclaimer */}
            <div className="mx-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
                <p className="text-sm text-amber-800 leading-6">
                    <span className="font-semibold">Disclaimer:</span>{" "}
                    AI recommendations are generated based on the information
                    you provide. Suggestions are intended as guidance and may
                    vary depending on your preferences and product availability.
                    Please review the recommended products before placing your
                    order.
                </p>
            </div>

            <div className="px-3">
                <AiAssistantCard />
            </div>

        </div>
    );
}