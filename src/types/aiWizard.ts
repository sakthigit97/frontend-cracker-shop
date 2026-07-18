export interface AiWizardState {
    audience: string[];
    crackerType: string[];
    noiseLevel: string[];
    timePreference: string[];
    budget: number | null;
    customBudget: string;
    additionalRequirements: string;
}

export interface AiWizardStep {
    id: number;
    title: string;
    field: keyof AiWizardState;
}

export interface AiOption {
    id: string;
    title: string;
    icon: string;
    description?: string;
}

export interface AiPreferenceItem {
    key: keyof AiWizardState;
    label: string;
    value: string | number;
    editable: boolean;
}

export interface AiWizardProps {
    onGenerate: (
        state: AiWizardState
    ) => Promise<void>;
    loading: boolean;
}

export const INITIAL_AI_WIZARD_STATE: AiWizardState = {

    audience: [],

    crackerType: [],

    noiseLevel: [],

    timePreference: [],

    budget: null,

    customBudget: "",

    additionalRequirements: "",
};

export type MultiSelectField =
    | "audience"
    | "crackerType"
    | "noiseLevel"
    | "timePreference";