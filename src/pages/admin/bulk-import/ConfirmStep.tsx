import Button from "../../../components/ui/Button";
import { useNavigate } from "react-router-dom";
import { useAlert } from "../../../store/alert.store";
import { useBulkImportStore } from "../../../store/useBulkImportStore";
import { confirmBulkImport } from "../../../services/adminProducts.api";

export default function ConfirmStep() {
    const navigate = useNavigate();
    const { showAlert } = useAlert();

    const {
        importId,
        validationResult,
        status,
        setStatus,
        reset,
    } = useBulkImportStore();

    // 🛡️ Safety guard – never render empty screen
    if (!validationResult) {
        return (
            <div className="bg-white border rounded-xl p-4 text-sm text-gray-500">
                Preparing import…
            </div>
        );
    }

    const confirm = async () => {
        if (!importId || status === "CONFIRMING") return;

        try {
            setStatus("CONFIRMING");

            await confirmBulkImport(importId);

            showAlert({
                type: "success",
                message: "Products imported successfully",
            });

            setStatus("COMPLETED");
        } catch (err: any) {
            showAlert({
                type: "error",
                message: err?.message || "Import failed",
            });
            setStatus("ERROR");
        }
    };

    /* ===================== IMPORTING ===================== */
    if (status === "CONFIRMING") {
        return (
            <div className="bg-white border rounded-xl p-4 space-y-3">
                <p className="font-medium text-sm">
                    Importing products…
                </p>

                <div className="flex items-center gap-3">
                    <div className="h-4 w-4 rounded-full border-2 border-gray-300 border-t-transparent animate-spin" />
                    <p className="text-sm text-gray-500">
                        Please wait, this may take a few seconds
                    </p>
                </div>
            </div>
        );
    }

    /* ===================== SUCCESS ===================== */
    if (status === "COMPLETED") {
        return (
            <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                    <p className="text-sm font-medium text-green-700">
                        Imported <b>{validationResult.validRows}</b> products successfully
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                    <Button variant="outline" onClick={reset}>
                        Import Another File
                    </Button>

                    <Button onClick={() => navigate("/admin/products")}>
                        Go to Products
                    </Button>
                </div>
            </div>
        );
    }

    /* ===================== CONFIRM / ERROR ===================== */
    return (
        <div className="space-y-4">
            <div className="bg-white border rounded-xl p-4 text-sm text-gray-600">
                This will create{" "}
                <b>{validationResult.validRows}</b> new products.
                <p className="mt-1 text-xs text-gray-500">
                    This action cannot be undone.
                </p>
            </div>

            {status === "ERROR" && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                    <p className="text-sm font-medium text-red-700">
                        Import failed. No products were created.
                    </p>
                    <p className="text-xs text-red-600 mt-1">
                        You can retry the import safely.
                    </p>
                </div>
            )}

            <div className="flex flex-col sm:flex-row justify-between gap-3">
                <Button onClick={confirm}>
                    Confirm Import
                </Button>

                <Button
                    variant="outline"
                    onClick={() => setStatus("READY")}
                >
                    Back
                </Button>
            </div>
        </div>
    );
}