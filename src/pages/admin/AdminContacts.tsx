import { useEffect, useState } from "react";
import {
    getContactsApi,
    updateContactStatusApi,
    type ContactItem,
} from "../../services/contact.api";
import Button from "../../components/ui/Button";
import { useAlert } from "../../store/alert.store";
import EmptyState from "../../components/ui/EmptyState";
import { useNavigate } from "react-router-dom";
import { formatDateTime } from "../../utils/date";

export default function AdminContacts() {
    const [contacts, setContacts] = useState<ContactItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [updatingId, setUpdatingId] = useState("");

    const navigate = useNavigate();
    const { showAlert } = useAlert();

    const loadContacts = async () => {
        try {
            setLoading(true);

            const res = await getContactsApi();

            setContacts(res.items || []);
        } catch {
            showAlert({
                type: "error",
                message: "Failed to load contacts",
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadContacts();
    }, []);

    const handleMarkContacted = async (
        contactId: string
    ) => {
        try {
            setUpdatingId(contactId);

            await updateContactStatusApi(contactId);

            setContacts((prev) =>
                prev.map((c) =>
                    c.contactId === contactId
                        ? {
                            ...c,
                            status: "CONTACTED",
                        }
                        : c
                )
            );

            showAlert({
                type: "success",
                message: "Updated successfully",
            });
        } catch {
            showAlert({
                type: "error",
                message: "Failed to update",
            });
        } finally {
            setUpdatingId("");
        }
    };
    if (loading) {
        return (
            <div className="space-y-6">

                <div className="flex items-center gap-3">

                    <div
                        className="
                        w-10
                        h-10
                        rounded-full
                        bg-gray-200
                        animate-pulse
                    "
                    />

                    <div className="space-y-2">

                        <div
                            className="
                            h-6
                            w-48
                            rounded
                            bg-gray-200
                            animate-pulse
                        "
                        />

                        <div
                            className="
                            h-4
                            w-24
                            rounded
                            bg-gray-100
                            animate-pulse
                        "
                        />

                    </div>

                </div>

                <div className="bg-white border rounded-xl p-4 space-y-4">

                    {Array.from({ length: 6 }).map((_, index) => (

                        <div
                            key={index}
                            className="
                            rounded-xl
                            border
                            p-4
                            space-y-3
                            animate-pulse
                        "
                        >

                            <div className="flex justify-between">

                                <div className="space-y-2">

                                    <div className="h-5 w-36 bg-gray-200 rounded" />

                                    <div className="h-4 w-24 bg-gray-100 rounded" />

                                </div>

                                <div className="h-6 w-24 bg-gray-200 rounded-full" />

                            </div>

                            <div className="space-y-2">

                                <div className="h-4 w-full bg-gray-100 rounded" />

                                <div className="h-4 w-4/5 bg-gray-100 rounded" />

                                <div className="h-4 w-3/5 bg-gray-100 rounded" />

                            </div>

                            <div className="h-10 w-40 bg-gray-200 rounded-lg" />

                        </div>

                    ))}

                </div>

            </div>
        );
    }
    return (
        <div className="space-y-6">

            <div className="flex items-center gap-3">

                <button
                    onClick={() => navigate(-1)}
                    className="
                        flex items-center justify-center
                        w-10 h-10
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

                <div>

                    <h1 className="text-2xl font-semibold text-[var(--color-primary)]">
                        Contact Requests
                    </h1>

                    <p className="text-sm text-gray-500">
                        {contacts.length} Request
                        {contacts.length !== 1 ? "s" : ""}
                    </p>

                </div>

            </div>

            <div className="bg-white rounded-xl border shadow-sm overflow-hidden">

                {contacts.length === 0 ? (

                    <div className="p-8">

                        <EmptyState
                            title="No contact requests"
                            description="No customer enquiries available"
                        />

                    </div>

                ) : (

                    <>

                        {/* ============================
    DESKTOP TABLE
============================= */}

                        <div className="hidden md:block overflow-x-auto">

                            <table className="w-full text-sm">

                                <thead className="bg-gray-50 sticky top-0 z-10">

                                    <tr className="border-b">

                                        <th className="px-4 py-3 text-left font-semibold">
                                            Name
                                        </th>

                                        <th className="px-4 py-3 text-left font-semibold">
                                            Mobile
                                        </th>

                                        <th className="px-4 py-3 text-left font-semibold">
                                            Email
                                        </th>

                                        <th className="px-4 py-3 text-left font-semibold">
                                            Message
                                        </th>

                                        <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">
                                            Submitted
                                        </th>

                                        <th className="px-4 py-3 text-left font-semibold">
                                            Status
                                        </th>

                                        <th className="px-4 py-3 text-center font-semibold">
                                            Action
                                        </th>

                                    </tr>

                                </thead>

                                <tbody>

                                    {contacts.map((row) => (

                                        <tr
                                            key={row.contactId}
                                            className="border-b hover:bg-gray-50 transition-colors"
                                        >

                                            <td className="px-4 py-4 font-medium whitespace-nowrap">
                                                {row.name}
                                            </td>

                                            <td className="px-4 py-4 whitespace-nowrap">
                                                {row.phone}
                                            </td>

                                            <td className="px-4 py-4 break-all max-w-[220px]">
                                                {row.email || "-"}
                                            </td>

                                            <td className="px-4 py-4 max-w-[320px]">

                                                <div className="whitespace-pre-wrap break-words text-gray-700">

                                                    {row.message || "-"}

                                                </div>

                                            </td>

                                            <td className="px-4 py-4 whitespace-nowrap">
                                                {formatDateTime(row.createdAt)}
                                            </td>

                                            <td className="px-4 py-4">

                                                <span
                                                    className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold
                                ${row.status === "CONTACTED"
                                                            ? "bg-green-100 text-green-700"
                                                            : "bg-yellow-100 text-yellow-700"
                                                        }`}
                                                >
                                                    {row.status === "CONTACTED"
                                                        ? "Contacted"
                                                        : "Pending"}
                                                </span>

                                            </td>

                                            <td className="px-4 py-4 text-center">

                                                {row.status === "CONTACTED" ? (

                                                    <span className="font-medium text-green-600">

                                                        ✓ Completed

                                                    </span>

                                                ) : (

                                                    <Button
                                                        disabled={
                                                            updatingId === row.contactId
                                                        }
                                                        onClick={() =>
                                                            handleMarkContacted(
                                                                row.contactId
                                                            )
                                                        }
                                                    >
                                                        {updatingId === row.contactId
                                                            ? "Updating..."
                                                            : "Mark Contacted"}
                                                    </Button>

                                                )}

                                            </td>

                                        </tr>

                                    ))}

                                </tbody>

                            </table>

                        </div>

                        {/* ============================
    MOBILE VIEW
============================= */}

                        <div className="md:hidden p-4 space-y-4">

                            {contacts.map((row) => (

                                <div
                                    key={row.contactId}
                                    className="border rounded-xl p-4 shadow-sm space-y-4"
                                >

                                    <div className="flex items-start justify-between gap-3">

                                        <div className="min-w-0">

                                            <h3 className="font-semibold text-base truncate">
                                                {row.name}
                                            </h3>

                                            <p className="text-xs text-gray-500 mt-1">
                                                {formatDateTime(row.createdAt)}
                                            </p>

                                        </div>

                                        <span
                                            className={`shrink-0 inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold
                        ${row.status === "CONTACTED"
                                                    ? "bg-green-100 text-green-700"
                                                    : "bg-yellow-100 text-yellow-700"
                                                }`}
                                        >
                                            {row.status === "CONTACTED"
                                                ? "Contacted"
                                                : "Pending"}
                                        </span>

                                    </div>

                                    <div className="space-y-2 text-sm">

                                        <div>

                                            <span className="font-medium text-gray-600">
                                                Mobile:
                                            </span>

                                            <div className="mt-1">
                                                {row.phone}
                                            </div>

                                        </div>

                                        <div>

                                            <span className="font-medium text-gray-600">
                                                Email:
                                            </span>

                                            <div className="mt-1 break-all">
                                                {row.email || "-"}
                                            </div>

                                        </div>

                                    </div>

                                    <div>

                                        <p className="font-medium text-gray-600 mb-2">
                                            Message
                                        </p>

                                        <div
                                            className="
                        rounded-lg
                        bg-gray-50
                        border
                        p-3
                        whitespace-pre-wrap
                        break-words
                        text-sm
                        text-gray-700
                    "
                                        >
                                            {row.message || "-"}
                                        </div>

                                    </div>

                                    {row.status === "CONTACTED" ? (

                                        <div
                                            className="
                        w-full
                        rounded-lg
                        bg-green-50
                        border
                        border-green-200
                        py-3
                        text-center
                        font-semibold
                        text-green-700
                    "
                                        >
                                            ✓ Completed
                                        </div>

                                    ) : (

                                        <Button
                                            className="w-full"
                                            disabled={
                                                updatingId === row.contactId
                                            }
                                            onClick={() =>
                                                handleMarkContacted(
                                                    row.contactId
                                                )
                                            }
                                        >
                                            {updatingId === row.contactId
                                                ? "Updating..."
                                                : "Mark Contacted"}
                                        </Button>

                                    )}

                                </div>

                            ))}

                        </div>

                    </>

                )}

            </div>

        </div>

    );

}