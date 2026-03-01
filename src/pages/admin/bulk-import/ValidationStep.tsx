import { useEffect } from "react";
import Button from "../../../components/ui/Button";
import { useAlert } from "../../../store/alert.store";
import { useBulkImportStore } from "../../../store/useBulkImportStore";
import { validateBulkImport } from "../../../services/adminProducts.api";

export default function ValidationStep() {
    const {
        importId,
        validationResult,
        setValidationResult,
        setStatus,
    } = useBulkImportStore();
    const { status } = useBulkImportStore();
    const { showAlert } = useAlert();

    useEffect(() => {
        if (!importId) return;

        const validate = async () => {
            try {
                setStatus("VALIDATING");
                const res = await validateBulkImport(importId);
                setValidationResult(res);

                if (res.validRows === 0) {
                    showAlert({
                        type: "error",
                        message: "No valid rows found in file",
                    });
                    setStatus("ERROR");
                } else {
                    setStatus("READY");
                }
            } catch (err: any) {
                showAlert({
                    type: "error",
                    message: err?.message || "Validation failed",
                });
                setStatus("ERROR");
            }
        };

        validate();
    }, [importId]);

    if (!validationResult) {
        return (
            <div className="bg-white border rounded-xl p-4 space-y-3">
                <p className="text-sm font-medium">
                    Validating file
                </p>

                <div className="flex items-center gap-3">
                    <div className="h-4 w-4 rounded-full border-2 border-gray-300 border-t-transparent animate-spin" />
                    <p className="text-sm text-gray-500">
                        Checking product data and references…
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">

            {status === "ERROR" && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                    <p className="text-sm font-medium text-red-700">
                        Validation failed. Please fix the errors and re-upload the file.
                    </p>
                </div>
            )}

            <div className="bg-white border rounded-xl p-4 text-sm">
                <div>
                    Total: <b>{validationResult.totalRows}</b>
                </div>
                <div className="text-green-600">
                    Valid: <b>{validationResult.validRows}</b>
                </div>
                <div className="text-red-600">
                    Invalid: <b>{validationResult.invalidRows}</b>
                </div>
            </div>

            {validationResult.errors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                    <p className="font-semibold text-red-700 mb-2">
                        Invalid rows
                    </p>

                    <div className="space-y-1 text-sm text-red-600">
                        {validationResult.errors.map((e: any, i: number) => (
                            <div key={i}>
                                Row <b>{e.row}</b> – <b>{e.field}</b>: {e.message}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {validationResult.preview.length > 0 && (
                <div className="bg-white border rounded-xl overflow-hidden">
                    <div className="px-4 py-3 border-b">
                        <h3 className="font-semibold text-sm">
                            Preview (Valid products)
                        </h3>
                    </div>

                    <div className="overflow-x-auto sm:overflow-visible">
                        <table className="w-full text-sm min-w-[520px] sm:min-w-0">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="p-3 text-left">Name</th>
                                    <th className="p-3 text-left">Price</th>
                                    <th className="p-3 text-left">Brand</th>
                                    <th className="p-3 text-left">Category</th>
                                </tr>
                            </thead>

                            <tbody>
                                {validationResult.preview.map((r: any) => (
                                    <tr key={r.row} className="border-t">
                                        <td className="p-3">{r.name}</td>
                                        <td className="p-3">₹{r.price}</td>
                                        <td className="p-3">{r.brandId}</td>
                                        <td className="p-3">{r.categoryId}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            <div className="flex flex-col sm:flex-row justify-between gap-3">
                <Button onClick={() => setStatus("CONFIRM")}>
                    Proceed to Import
                </Button>
                <Button
                    variant="outline"
                    onClick={() => setStatus("IDLE")}
                >
                    Back
                </Button>
            </div>
        </div>
    );

}