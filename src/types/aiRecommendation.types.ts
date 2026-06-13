export interface AiMessage {
    role: "user" | "assistant";
    text: string;
}

export interface AiRecommendationResponse {
    status: string;
    message?: string;
    quickBudgets?: number[];
    extractedIntent?: {
        budget: number | null;
        tags: string[];
        missingFields: string[];
    };
    recommendedPackage?: {
        total: number;
        itemCount: number;
        items: any[];
    };
    additionalProducts?: any[];
}