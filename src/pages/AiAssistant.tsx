import { useNavigate } from "react-router-dom";
import AiAssistantCard from "../components/ai/AiAssistantCard";

export default function AiAssistant() {
    const navigate = useNavigate();

    return (
        <div className="max-w-6xl mx-auto py-6">

            <div className="px-4 mb-6">

                <button
                    onClick={() => navigate(-1)}
                    className="
                        flex items-center justify-center
                        w-9 h-9
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

                <h1 className="text-2xl font-bold">
                    AI Cracker Assistant
                </h1>

                <p className="text-gray-500 mt-1">
                    Describe your requirements and we'll build the perfect cracker package.
                </p>

            </div>

            <AiAssistantCard />

        </div>
    );
}