export interface AiOption {
    id: string;
    title: string;
    icon: string;
    description?: string;
}

export const AUDIENCE_OPTIONS: AiOption[] = [
    {
        id: "family",
        title: "Family",
        icon: "👨‍👩‍👧‍👦",
        description: "Suitable for all family members",
    },
    {
        id: "kids",
        title: "Kids",
        icon: "🧒",
        description: "Safe & colourful crackers",
    },
    {
        id: "friends",
        title: "Friends",
        icon: "👥",
        description: "Fun celebration packs",
    },
    {
        id: "wedding",
        title: "Wedding",
        icon: "💍",
        description: "Grand celebration",
    },
    {
        id: "party",
        title: "Party / Function",
        icon: "🎉",
        description: "Events & functions",
    },
    {
        id: "office",
        title: "Office",
        icon: "🏢",
        description: "Corporate celebrations",
    }, {
        id: "no-preference",
        title: "Let AI Decide",
        description: "Choose the best audience mix automatically.",
        icon: "✨",
    },
];

export const CRACKER_TYPE_OPTIONS: AiOption[] = [
    {
        id: "colour",
        title: "Colour Show",
        icon: "🌈",
        description: "Beautiful colour effects",
    },
    {
        id: "sky",
        title: "Sky Shots",
        icon: "🎇",
        description: "Aerial fireworks",
    },
    {
        id: "sound",
        title: "Sound Crackers",
        icon: "💥",
        description: "Loud & exciting",
    },
    {
        id: "ground",
        title: "Ground Crackers",
        icon: "🌀",
        description: "Ground spinning effects",
    },
    {
        id: "sparkler",
        title: "Sparklers",
        icon: "✨",
        description: "Hand-held sparkles",
    },
    {
        id: "mixed",
        title: "Mixed Package",
        icon: "🎁",
        description: "Best combination",
    },
    {
        id: "no-preference",
        title: "Let AI Decide",
        description: "Recommend the best cracker mix.",
        icon: "✨",
    },
];

export const NOISE_OPTIONS: AiOption[] = [
    {
        id: "low",
        title: "Low Noise",
        icon: "🔇",
    },
    {
        id: "medium",
        title: "Medium Noise",
        icon: "🔉",
    },
    {
        id: "high",
        title: "High Noise",
        icon: "🔊",
    },
    {
        id: "no-preference",
        title: "Let AI Decide",
        description: "Choose the best sound level.",
        icon: "✨",
    },
];

export const TIME_OPTIONS: AiOption[] = [
    {
        id: "day",
        title: "Day",
        icon: "🌞",
    },
    {
        id: "night",
        title: "Night",
        icon: "🌙",
    },
    {
        id: "both",
        title: "Day & Night",
        icon: "🌞🌙",
    },
    {
        id: "no-preference",
        title: "Let AI Decide",
        description: "Recommend the best usage.",
        icon: "✨",
    },
];

export const BUDGET_OPTIONS = [
    3000,
    5000,
    10000,
    15000,
    20000,
    25000,
    30000,
];

export const WIZARD_STEPS = [
    {
        id: 1,
        title: "Who is this package for?",
        field: "audience",
    },
    {
        id: 2,
        title: "What type of crackers do you prefer?",
        field: "crackerType",
    },
    {
        id: 3,
        title: "Preferred Noise Level",
        field: "noiseLevel",
    },
    {
        id: 4,
        title: "When will you use them?",
        field: "timePreference",
    },
    {
        id: 5,
        title: "Select Your Budget",
        field: "budget",
    },
];