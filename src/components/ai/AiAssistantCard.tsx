import { useState } from "react";
import { useAiRecommendation } from "../../store/aiRecommendation.store";
import AiPackageResult from "./AiPackageResult";

export default function AiAssistantCard() {

    const {
        messages,
        loading,
        response,
        askAi,
        pendingQuery,
    } = useAiRecommendation();

    const [query, setQuery] = useState("");
    const submitQuery = async () => {

        if (!query.trim()) {
            return;
        }
        await askAi(query);
        setQuery("");
    };

    const submitBudget = async (
        budget: number
    ) => {

        if (!pendingQuery) {
            return;
        }

        await askAi(
            `${pendingQuery} under ${budget}`
        );
    };

    return (
        <div className="mx-4 rounded-2xl border bg-white p-4 shadow-sm space-y-4">

            <div>
                <h2 className="text-lg font-semibold">
                    AI Cracker Assistant
                </h2>

                <p className="text-sm text-gray-500">
                    Tell us what kind of crackers you need.
                </p>
            </div>

            <div className="space-y-3 max-h-80 overflow-y-auto">

                {messages.map(
                    (message, index) => (

                        <div
                            key={index}
                            className={
                                message.role === "user"
                                    ? "flex justify-end"
                                    : "flex justify-start"
                            }
                        >

                            <div
                                className={
                                    message.role === "user"
                                        ? "bg-[var(--color-primary)] text-white px-4 py-2 rounded-xl max-w-[80%]"
                                        : "bg-gray-100 px-4 py-2 rounded-xl max-w-[80%]"
                                }
                            >
                                {message.text}
                            </div>

                        </div>
                    )
                )}

            </div>

            <div className="flex flex-col sm:flex-row gap-2">
                <input
                    type="text"
                    value={query}
                    onChange={(e) =>
                        setQuery(
                            e.target.value
                        )
                    }
                    placeholder="Need eco friendly crackers for kids..."
                    className="flex-1 px-4 py-3 rounded-xl border focus:ring-2 focus:ring-[var(--color-primary)]"
                />

                <button
                    onClick={submitQuery}
                    disabled={loading}
                    className=" 
w-full
sm:w-auto
px-5
py-3
rounded-xl
bg-[var(--color-primary)]
text-white
disabled:opacity-60
whitespace-nowrap"
                >
                    {loading
                        ? "..."
                        : "Ask AI"}
                </button>

            </div>

            {response?.status ===
                "NEEDS_BUDGET" && (
                    <div className="space-y-2">

                        <p className="text-sm font-medium">
                            Select Budget
                        </p>

                        <div className="flex flex-wrap gap-2">

                            {(
                                response.quickBudgets ||
                                []
                            ).map(
                                (
                                    budget
                                ) => (

                                    <button
                                        key={
                                            budget
                                        }
                                        onClick={() =>
                                            submitBudget(
                                                budget
                                            )
                                        }
                                        className="px-4 py-2 rounded-full border hover:bg-[var(--color-primary)] hover:text-white"
                                    >
                                        ₹{budget}
                                    </button>
                                )
                            )}

                        </div>

                    </div>
                )}

            {response?.status ===
                "INVALID_BUDGET" && (
                    <div className="rounded-xl bg-red-50 text-red-600 p-3 text-sm">
                        {response.message}
                    </div>
                )}


            {response?.status ===
                "NO_MATCH_FOUND" && (
                    <div className="rounded-xl bg-yellow-50 text-yellow-700 p-3 text-sm">
                        {response.message}
                    </div>
                )}

            {response?.status ===
                "SUCCESS" && (
                    <AiPackageResult />
                )}

        </div>
    );
}