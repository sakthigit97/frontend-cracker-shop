import { useState } from "react";
import Button from "../../../components/ui/Button";
import { useAlert } from "../../../store/alert.store";
import { useBulkImportStore } from "../../../store/useBulkImportStore";
import { getBulkImportUploadUrl } from "../../../services/adminProducts.api";
import { uploadFilesToS3 } from "../../../utils/uploadToS3";

const MAX_FILE_SIZE = 2 * 1024 * 1024;
export default function UploadStep() {
    const { status } = useBulkImportStore();
    const [file, setFile] = useState<File | null>(null);
    const { setImportId, setStatus } = useBulkImportStore();
    const { showAlert } = useAlert();

    const handleUpload = async () => {
        if (!file) return;

        try {
            setStatus("UPLOADING");
            const res = await getBulkImportUploadUrl(file.name);
            await uploadFilesToS3([{ uploadUrl: res.uploadUrl }], [file]);

            setImportId(res.importId);
            setStatus("VALIDATING");
        } catch (err: any) {
            showAlert({
                type: "error",
                message: err?.message || "Failed to upload file",
            });
            setStatus("ERROR");
        }
    };

    return (
        <div className="space-y-4">

            {status === "ERROR" && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                    <p className="text-sm font-medium text-red-700">
                        Upload failed. Please try again with a valid Excel file.
                    </p>
                </div>
            )}

            {/* ---------- INFO ---------- */}
            <div className="bg-white border rounded-xl p-4 text-sm text-gray-600">
                Upload an Excel (<b>.xlsx</b>) file to import products in bulk.
                <ul className="list-disc ml-5 mt-2 space-y-1">
                    <li>Maximum file size: 2MB</li>
                    <li>Only valid rows will be imported</li>
                </ul>
            </div>

            {/* ---------- FILE SELECT ---------- */}
            <div className="bg-white border rounded-xl p-4 space-y-3">
                <label className="block text-sm font-medium">
                    Select Excel file
                </label>

                <input
                    type="file"
                    accept=".xlsx"
                    className="
                        block w-full text-sm
                        file:mr-4 file:py-2 file:px-4
                        file:rounded-md
                        file:border-0
                        file:bg-gray-100
                        file:text-gray-700
                        hover:file:bg-gray-200
                    "
                    onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (!f) return;

                        if (!f.name.endsWith(".xlsx")) {
                            showAlert({
                                type: "error",
                                message: "Only .xlsx files are allowed",
                            });
                            return;
                        }

                        if (f.size > MAX_FILE_SIZE) {
                            showAlert({
                                type: "error",
                                message: "File size must be less than 2MB",
                            });
                            return;
                        }

                        setFile(f);
                    }}
                />

                {file && (
                    <p className="text-xs text-gray-500">
                        Selected file: <b>{file.name}</b>
                    </p>
                )}
            </div>

            {/* ---------- ACTION ---------- */}
            <div className="flex flex-col sm:flex-row justify-between gap-3">
                <Button
                    onClick={handleUpload}
                    disabled={!file}
                >
                    Upload & Validate
                </Button>
                <Button
                    variant="outline"
                    onClick={() => window.history.back()}
                >
                    Back
                </Button>
            </div>
        </div>
    );
}