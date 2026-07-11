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


export interface AiRecommendationRequest {

    budget: number;

    audiences: string[];

    crackerTypes: string[];

    noiseLevels: string[];

    timePreferences: string[];

    features: string[];

}
