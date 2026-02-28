import { useBulkImportStore } from "../../../store/useBulkImportStore";
import UploadStep from "./UploadStep";
import ValidationStep from "./ValidationStep";
import ConfirmStep from "./ConfirmStep";

export default function AdminBulkImport() {
    const { status } = useBulkImportStore();

    return (
        <div className="max-w-4xl space-y-6">
            <h1 className="text-xl font-semibold">Bulk Product Import</h1>

            <div className="bg-white rounded-xl border p-5">
                {(status === "IDLE" || status === "UPLOADING") && <UploadStep />}
                {(status === "VALIDATING" || status === "READY" || status === "ERROR") && <ValidationStep />}
                {(status === "CONFIRM" || status === "COMPLETED") && <ConfirmStep />}
            </div>
        </div>
    );
}