import { useAdminCodeStore } from "../../store/adminCode.store";

import type {
    AdminCode,
} from "../../types/adminCode";
import { formatDateTime } from "../../utils/date";

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

    async function handleDelete(
        code: string
    ) {

        const confirmed = window.confirm(
            "Are you sure you want to delete this Admin Code?"
        );

        if (!confirmed) {
            return;
        }

        try {

            await deleteCode(code);

        } catch (e: any) {

            alert(
                e.message ||
                "Unable to delete Admin Code."
            );

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

                        const status =
                            getStatus(code);

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
                                        code.schemeId === "2_TO_5_LAKH"
                                            ? "₹2 Lakh - ₹5 Lakh"
                                            : "Above ₹5 Lakh"
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
                                            code.status ===
                                            "USED"
                                        }
                                        onClick={() =>
                                            handleDelete(
                                                code.code
                                            )
                                        }
                                    >

                                        {deleting
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

    );

}