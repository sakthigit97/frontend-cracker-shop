import {
    createContext,
    useContext,
    useState,
} from "react";

import { apiFetch } from "../services/api";
import type {
    AiMessage,
    AiRecommendationResponse,
} from "../types/aiRecommendation.types";

interface AiRecommendationState {
    messages: AiMessage[];
    loading: boolean;
    response:
    AiRecommendationResponse | null;
    pendingQuery: string | null;
    cache:
    Record<
        string,
        AiRecommendationResponse
    >;
    askAi: (
        query: string
    ) => Promise<void>;
    clear: () => void;
}

const AiRecommendationContext = createContext<
    AiRecommendationState | null
>(null);

export function AiRecommendationProvider({
    children,
}: {
    children: React.ReactNode;
}) {

    const [messages, setMessages] = useState<AiMessage[]>([]);
    const [loading, setLoading] = useState(false);
    const [response, setResponse] = useState<
        AiRecommendationResponse | null
    >(null);

    const [pendingQuery, setPendingQuery] = useState<string | null>(null);
    const [cache, setCache] =
        useState<
            Record<
                string,
                AiRecommendationResponse
            >
        >({});

    const askAi = async (
        query: string
    ) => {

        const normalized = query.trim().toLowerCase();
        setResponse(null);
        setPendingQuery(null);
        if (!normalized) {
            return;
        }

        setMessages(prev => {

            const lastMessage =
                prev[prev.length - 1];

            if (
                lastMessage?.role === "user" &&
                lastMessage?.text === query
            ) {
                return prev;
            }

            return [
                ...prev,
                {
                    role: "user",
                    text: query,
                },
            ];
        });

        if (cache[normalized]) {

            const cached = cache[normalized];
            setResponse(cached);

            setMessages(prev => [
                ...prev,
                {
                    role: "assistant",
                    text:
                        cached.message ||
                        cached.status,
                },
            ]);

            return;
        }

        try {

            setLoading(true);

            const res =
                await apiFetch(
                    "/ai-recommendation",
                    {
                        method: "POST",
                        body: JSON.stringify({
                            query,
                        }),
                    }
                );

            const data =
                res.data;

            setResponse(data);

            if (
                data.status ===
                "NEEDS_BUDGET"
            ) {
                setPendingQuery(query);
            }

            if (
                data.status === "NEEDS_BUDGET" ||
                data.status === "INVALID_BUDGET" ||
                data.status === "NO_MATCH_FOUND"
            ) {
                setMessages(prev => [
                    ...prev,
                    {
                        role: "assistant",
                        text: data.message || "",
                    },
                ]);
            }

            if (
                data.status === "SUCCESS"
            ) {

                setMessages(prev => [
                    ...prev,
                    {
                        role: "assistant",
                        text: "I found a recommended package for you.",
                    },
                ]);
            }

            if (
                data.status === "SUCCESS" ||
                data.status ===
                "NO_MATCH_FOUND"
            ) {

                setCache(prev => ({
                    ...prev,
                    [normalized]:
                        data,
                }));
            }

        } catch (err) {

            console.error(
                "AI Error",
                err
            );

        } finally {

            setLoading(false);
        }
    };

    const clear = () => {
        setMessages([]);
        setResponse(null);
        setPendingQuery(null);
    };

    return (
        <AiRecommendationContext.Provider
            value={{
                messages,
                loading,
                response,
                pendingQuery,
                cache,
                askAi,
                clear,
            }}
        >
            {children}
        </AiRecommendationContext.Provider>
    );
}

export function useAiRecommendation() {

    const ctx =
        useContext(
            AiRecommendationContext
        );

    if (!ctx) {

        throw new Error(
            "useAiRecommendation must be used inside AiRecommendationProvider"
        );
    }

    return ctx;
}