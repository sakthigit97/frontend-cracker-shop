import {
    createContext,
    useContext,
    useState,
} from "react";

import { apiFetch } from "../services/api";

import type {
    AiRecommendationRequest,
    AiRecommendationResponse,
} from "../types/aiRecommendation.types";

interface AiRecommendationState {

    loading: boolean;

    response:
    AiRecommendationResponse | null;

    cache:
    Record<
        string,
        AiRecommendationResponse
    >;

    askAi: (
        request: AiRecommendationRequest
    ) => Promise<void>;

    clear: () => void;

}

const AiRecommendationContext =
    createContext<
        AiRecommendationState | null
    >(null);

export function AiRecommendationProvider({
    children,
}: {
    children: React.ReactNode;
}) {

    const [loading, setLoading] =
        useState(false);

    const [response, setResponse] =
        useState<
            AiRecommendationResponse | null
        >(null);

    const [cache, setCache] =
        useState<
            Record<
                string,
                AiRecommendationResponse
            >
        >({});

    const askAi = async (
        request: AiRecommendationRequest
    ) => {

        const cacheKey = JSON.stringify(request);

        if (
            cache[cacheKey]
        ) {

            setResponse(
                cache[cacheKey]
            );

            return;

        }

        try {

            setLoading(true);

            const res =
                await apiFetch(
                    "/ai-recommendation",
                    {
                        method: "POST",
                        body: JSON.stringify(
                            request
                        ),
                    }
                );

            const data =
                res.data;

            setResponse(data);

            if (
                data.status ===
                "SUCCESS"
            ) {

                setCache(
                    prev => ({

                        ...prev,

                        [cacheKey]:
                            data,

                    })
                );

            }

        }
        catch (err) {

            console.error(
                "AI Recommendation Error",
                err
            );

        }
        finally {

            setLoading(false);

        }

    };

    const clear = () => {

        setResponse(null);

    };

    return (

        <AiRecommendationContext.Provider
            value={{

                loading,

                response,

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