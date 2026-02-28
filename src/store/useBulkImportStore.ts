import { create } from "zustand";

type ImportStatus =
    | "IDLE"
    | "UPLOADING"
    | "VALIDATING"
    | "READY"
    | "CONFIRM"
    | "CONFIRMING"
    | "COMPLETED"
    | "ERROR";

interface BulkImportState {
    importId: string | null;
    status: ImportStatus;
    validationResult: any | null;
    error: string | null;

    setImportId: (id: string) => void;
    setStatus: (s: ImportStatus) => void;
    setValidationResult: (r: any) => void;
    setError: (e: string | null) => void;
    reset: () => void;
}

export const useBulkImportStore = create<BulkImportState>((set) => ({
    importId: null,
    status: "IDLE",
    validationResult: null,
    error: null,

    setImportId: (id) => set({ importId: id }),
    setStatus: (status) => set({ status }),
    setValidationResult: (r) => set({ validationResult: r }),
    setError: (e) => set({ error: e }),
    reset: () =>
        set({
            importId: null,
            status: "IDLE",
            validationResult: null,
            error: null,
        }),
}));