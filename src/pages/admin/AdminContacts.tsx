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
            <div className="p-6">
                Loading...
            </div>
        );
    }
    return (
        <div className="space-y-4">

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
                    Contact Requests
                </h1>
            </div>

            <div className="bg-white border rounded-xl overflow-hidden min-h-[350px] md:min-h-[500px] flex flex-col">
                {loading ? (
                    <div className="p-6">
                        Loading...
                    </div>
                ) : (
                    <div className="overflow-x-auto flex-1">

                        <table className="w-full text-sm min-w-[900px]">

                            <thead className="bg-gray-50">

                                <tr>
                                    <th className="p-3 text-left">Name</th>
                                    <th className="p-3 text-left">Mobile</th>
                                    <th className="p-3 text-left">Email</th>
                                    <th className="p-3 text-left">Message</th>
                                    <th className="p-3 text-left">Date</th>
                                    <th className="p-3 text-left">Status</th>
                                    <th className="p-3 text-left">Action</th>
                                </tr>

                            </thead>

                            <tbody>

                                {contacts?.length ? (
                                    contacts.map((row) => (

                                        <tr
                                            key={row.contactId}
                                            className="border-t"
                                        >

                                            <td className="p-3 font-medium">
                                                {row.name}
                                            </td>

                                            <td className="p-3">
                                                {row.phone}
                                            </td>

                                            <td className="p-3">
                                                {row.email || "-"}
                                            </td>

                                            <td className="p-3 max-w-[300px]">
                                                <div className="whitespace-normal break-words">
                                                    {row.message || "-"}
                                                </div>
                                            </td>

                                            <td className="p-3">
                                                {new Date(
                                                    row.createdAt
                                                ).toLocaleString()}
                                            </td>

                                            <td className="p-3">

                                                <span
                                                    className={`
                          px-3 py-1 rounded-full
                          text-xs font-medium
                          ${row.status === "CONTACTED"
                                                            ? "bg-green-100 text-green-700"
                                                            : "bg-yellow-100 text-yellow-700"
                                                        }
                        `}
                                                >
                                                    {row.status}
                                                </span>

                                            </td>

                                            <td className="p-3">

                                                {row.status ===
                                                    "CONTACTED" ? (
                                                    <span className="text-green-600 font-medium">
                                                        Completed
                                                    </span>
                                                ) : (
                                                    <Button
                                                        disabled={
                                                            updatingId ===
                                                            row.contactId
                                                        }
                                                        onClick={() =>
                                                            handleMarkContacted(
                                                                row.contactId
                                                            )
                                                        }
                                                    >
                                                        {updatingId ===
                                                            row.contactId
                                                            ? "Updating..."
                                                            : "Mark Contacted"}
                                                    </Button>
                                                )}

                                            </td>

                                        </tr>

                                    ))
                                ) : (
                                    <tr>
                                        <td
                                            colSpan={7}
                                            className="p-6"
                                        >
                                            <EmptyState
                                                title="No contact requests"
                                                description="No customer enquiries available"
                                            />
                                        </td>
                                    </tr>
                                )}

                            </tbody>

                        </table>

                    </div>
                )}

            </div>

        </div>
    );
}