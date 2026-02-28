import { useEffect, useMemo, useState } from "react";
import Button from "../../components/ui/Button";
import ConfirmDialog from "../../components/ui/ConfirmDialog";

import { useAdminUsersStore } from "../../store/adminUsers.store";
import { useAlert } from "../../store/alert.store";

import { useDebounce } from "../../utils/useDebounce";
import { deleteUser } from "../../services/adminUsers.api";

export default function AdminUsers() {
    const { fetchPage, loading, clearCache } = useAdminUsersStore();
    const { showAlert } = useAlert();

    const [page, setPage] = useState(1);
    const [data, setData] = useState<any>(null);

    const [search, setSearch] = useState("");

    const [deletingMobile, setDeletingMobile] = useState<string | null>(null);

    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [selectedMobile, setSelectedMobile] = useState<string | null>(null);

    const debouncedSearch = useDebounce(search, 1000);

    const effectiveFilters = useMemo(
        () => ({
            search: debouncedSearch,
        }),
        [debouncedSearch]
    );

    useEffect(() => {
        setPage(1);
    }, [effectiveFilters]);

    useEffect(() => {
        loadUsers();
    }, [page, effectiveFilters]);

    const loadUsers = async () => {
        try {
            const res = await fetchPage(effectiveFilters, page);
            setData(res);
        } catch (err: any) {
            showAlert({
                type: "error",
                message: err?.message || "Failed to load users",
            });
        }
    };

    const handleDeleteClick = (mobile: string) => {
        setSelectedMobile(mobile);
        setShowDeleteConfirm(true);
    };

    const confirmDelete = async () => {
        if (!selectedMobile) return;

        try {
            setDeletingMobile(selectedMobile);

            await deleteUser(selectedMobile);

            showAlert({
                type: "success",
                message: "User deleted successfully",
            });

            clearCache();
            loadUsers();
        } catch (err: any) {
            showAlert({
                type: "error",
                message: err?.message || "Failed to delete user",
            });
        } finally {
            setDeletingMobile(null);
            setShowDeleteConfirm(false);
            setSelectedMobile(null);
        }
    };

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex justify-between items-center">
                <h1 className="text-xl font-semibold">Users</h1>
            </div>

            {/* Search */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                    placeholder="Search by name or mobile..."
                    className="border rounded-md p-2"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            {/* Table */}
            <div className="bg-white border rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm min-w-[700px]">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="p-3 text-left">User Name</th>
                                <th className="p-3 text-left">Mobile No</th>
                                <th className="p-3 text-left">Address</th>
                                <th className="p-3 text-left">Role</th>
                                <th className="p-3 text-left">Action</th>
                            </tr>
                        </thead>

                        <tbody>
                            {/* Loading Skeleton */}
                            {loading &&
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr
                                        key={i}
                                        className="border-t animate-pulse"
                                    >
                                        <td className="p-3">
                                            <div className="h-4 w-40 bg-gray-200 rounded" />
                                        </td>

                                        <td className="p-3">
                                            <div className="h-4 w-24 bg-gray-200 rounded" />
                                        </td>

                                        <td className="p-3">
                                            <div className="h-8 w-24 bg-gray-200 rounded-lg" />
                                        </td>
                                    </tr>
                                ))}

                            {/* Data */}
                            {!loading && data?.items?.length ? (
                                data.items.map((u: any) => (
                                    <tr key={u.mobile} className="border-t">
                                        <td className="p-3">{u.name}</td>
                                        <td className="p-3">{u.mobile}</td>
                                        <td className="p-3">{u.address}</td>
                                        <td className="p-3">{u.role}</td>

                                        <td className="p-3">
                                            <Button
                                                variant="outline"
                                                className="border-red-500 text-red-600"
                                                disabled={
                                                    deletingMobile === u.mobile
                                                }
                                                onClick={() =>
                                                    handleDeleteClick(u.mobile)
                                                }
                                            >
                                                {deletingMobile === u.mobile
                                                    ? "Deleting…"
                                                    : "Delete"}
                                            </Button>
                                        </td>
                                    </tr>
                                ))
                            ) : null}

                            {/* Empty */}
                            {!loading &&
                                (!data?.items ||
                                    data.items.length === 0) && (
                                    <tr>
                                        <td
                                            colSpan={3}
                                            className="p-6 text-center text-gray-500"
                                        >
                                            No users found
                                        </td>
                                    </tr>
                                )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Confirm Dialog */}
            <ConfirmDialog
                open={showDeleteConfirm}
                title="Delete User?"
                message={
                    <>
                        Are you sure you want to delete this user?
                        <br />
                        <span className="text-red-500 font-medium">
                            This action cannot be undone.
                        </span>
                    </>
                }
                confirmText="Yes, Delete"
                cancelText="Cancel"
                loading={!!deletingMobile}
                onCancel={() => setShowDeleteConfirm(false)}
                onConfirm={confirmDelete}
            />
        </div>
    );
}