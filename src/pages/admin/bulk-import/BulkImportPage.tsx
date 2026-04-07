import { useBulkImportStore } from "../../../store/useBulkImportStore";
import UploadStep from "./UploadStep";
import ValidationStep from "./ValidationStep";
import ConfirmStep from "./ConfirmStep";
import { useNavigate } from "react-router-dom";

export default function AdminBulkImport() {
    const { status } = useBulkImportStore();
    const navigate = useNavigate();

    return (
        <div className="max-w-4xl space-y-6">
            <div className="flex items-center gap-3 mb-4">
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

                <h1 className="text-xl md:text-2xl font-semibold text-[var(--color-primary)]">
                    Bulk Product Import
                </h1>
            </div>

            <div className="bg-white rounded-xl border p-5">
                {(status === "IDLE" || status === "UPLOADING") && <UploadStep />}
                {(status === "VALIDATING" || status === "READY" || status === "ERROR") && <ValidationStep />}
                {(status === "CONFIRM" || status === "COMPLETED") && <ConfirmStep />}
            </div>
        </div>
    );
}