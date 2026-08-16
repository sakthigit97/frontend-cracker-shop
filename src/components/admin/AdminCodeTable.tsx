import { useState } from "react";
import { useAdminCodeStore } from "../../store/adminCode.store";
import { useAlert } from "../../store/alert.store";
import type {
    AdminCode,
} from "../../types/adminCode";

import { formatDateTime } from "../../utils/date";
import ConfirmDialog from "../../components/ui/ConfirmDialog";

interface Props {
    codes: AdminCode[];
}

export default function AdminCodeTable({
    codes,
}: Props) {

    const {
        deleteCode,
        deleting,
    } = useAdminCodeStore();

    const { showAlert } = useAlert();

    const [showDeleteConfirm, setShowDeleteConfirm] =
        useState(false);

    const [selectedCode, setSelectedCode] =
        useState<string | null>(null);


    function handleDeleteClick(code: string) {

        setSelectedCode(code);

        setShowDeleteConfirm(true);

    }


    async function handleDeleteConfirm() {

        if (!selectedCode) {
            return;
        }

        try {

            await deleteCode(selectedCode);

            showAlert({
                type: "success",
                message: "Admin Code deleted successfully",
            });

        } catch (e: any) {

            showAlert({
                type: "error",
                message:
                    e?.message ||
                    "Unable to delete Admin Code.",
            });

        } finally {

            setShowDeleteConfirm(false);

            setSelectedCode(null);

        }

    }


    function getStatus(
        code: AdminCode
    ) {

        if (
            code.expiryDate <
            Date.now()
        ) {

            return {

                label: "Expired",

                className:
                    "bg-red-100 text-red-700",

            };

        }

        return {

            label: "Active",

            className:
                "bg-green-100 text-green-700",

        };

    }


    if (!codes.length) {

        return (

            <div
                className="
                    bg-white
                    rounded-xl
                    border
                    shadow-sm
                    py-16
                    text-center
                "
            >

                <div className="text-5xl">
                    🔑
                </div>

                <h3
                    className="
                        mt-4
                        text-lg
                        font-semibold
                    "
                >
                    No Admin Codes
                </h3>

                <p
                    className="
                        mt-2
                        text-gray-500
                    "
                >
                    Generate your first
                    Admin Code.
                </p>

            </div>

        );

    }


    return (

        <>

            <div
                className="
                    overflow-x-auto
                    rounded-xl
                    border
                    bg-white
                    shadow-sm
                "
            >

                <table
                    className="
                        min-w-full
                        text-sm
                    "
                >

                    <thead
                        className="
                            bg-gray-50
                        "
                    >

                        <tr>

                            <th className="px-4 py-3 text-left">
                                Code
                            </th>

                            <th className="px-4 py-3 text-left">
                                User Mobile
                            </th>

                            <th className="px-4 py-3 text-left">
                                Scheme
                            </th>

                            <th className="px-4 py-3 text-left">
                                Expiry
                            </th>

                            <th className="px-4 py-3 text-left">
                                Created
                            </th>

                            <th className="px-4 py-3 text-center">
                                Status
                            </th>

                            <th className="px-4 py-3 text-center">
                                Action
                            </th>

                        </tr>

                    </thead>


                    <tbody>

                        {codes.map(code => {

                            const status = getStatus(code);
                            return (

                                <tr
                                    key={code.code}
                                    className="
                                        border-t
                                    "
                                >

                                    <td
                                        className="
                                            px-4
                                            py-4
                                            font-mono
                                            font-semibold
                                            tracking-widest
                                        "
                                    >
                                        {code.code}
                                    </td>


                                    <td className="px-4 py-4">

                                        {
                                            code.userId
                                        }

                                    </td>

                                    <td className="px-4 py-4">

                                        {
                                            code.schemeId
                                        }

                                    </td>


                                    <td className="px-4 py-4">

                                        {formatDateTime(
                                            code.expiryDate
                                        )}

                                    </td>


                                    <td className="px-4 py-4">

                                        {formatDateTime(
                                            code.createdAt
                                        )}

                                    </td>


                                    <td
                                        className="
                                            px-4
                                            py-4
                                            text-center
                                        "
                                    >

                                        <span
                                            className={`
                                                rounded-full
                                                px-3
                                                py-1
                                                text-xs
                                                font-semibold
                                                ${status.className}
                                            `}
                                        >

                                            {status.label}

                                        </span>

                                    </td>

                                    <td
                                        className="
                                        px-4
                                        py-4
                                        text-center
                                    "
                                    >
                                        <button
                                            disabled={
                                                code.status === "USED" ||
                                                (deleting && selectedCode === code.code)
                                            }
                                            onClick={() =>
                                                handleDeleteClick(code.code)
                                            }
                                            className="
                                                text-red-600
                                                hover:text-red-700
                                                font-medium
                                                disabled:opacity-50
                                                disabled:cursor-not-allowed
                                            "
                                        >
                                            {deleting && selectedCode === code.code
                                                ? "Deleting..."
                                                : "Delete"}
                                        </button>
                                    </td>

                                </tr>

                            );

                        })}

                    </tbody>

                </table>

            </div>


            <ConfirmDialog
                open={showDeleteConfirm}
                title="Delete Admin Code?"
                message={
                    <>
                        Are you sure you want to delete this
                        Admin Code?
                        <br />

                        <span className="text-red-500 font-medium">
                            This action cannot be undone.
                        </span>
                    </>
                }
                confirmText="Yes, Delete"
                cancelText="Cancel"
                loading={deleting}
                onCancel={() => {
                    setShowDeleteConfirm(false);
                    setSelectedCode(null);
                }}
                onConfirm={handleDeleteConfirm}
            />

        </>

    );

}