import { useNavigate } from "react-router-dom";
import AiAssistantCard from "../components/ai/AiAssistantCard";

export default function AiAssistant() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div
                    className="
                        bg-white
                        rounded-3xl
                        border
                        shadow-sm
                        p-6
                        mb-8
                    "
                >
                    <button
                        onClick={() => navigate(-1)}
                        className="
                            w-11
                            h-11
                            flex
                            items-center
                            justify-center
                            rounded-full
                            bg-[var(--color-primary)]
                            text-white
                            shadow-md
                            hover:scale-105
                            transition
                        "
                    >
                        ←
                    </button>

                    <div className="mt-5">

                        <h1
                            className="
                                mt-4
                                text-3xl
                                md:text-4xl
                                font-bold
                                text-gray-900
                            "
                        >
                            AI Cracker Assistant
                        </h1>

                        <p
                            className="
                                mt-3
                                text-gray-600
                                max-w-3xl
                                leading-7
                            "
                        >
                            Answer a few simple questions and our AI will
                            prepare the best cracker package based on your
                            audience, preferences and budget.
                        </p>
                    </div>
                </div>

                <AiAssistantCard />
            </div>
        </div>
    );
}