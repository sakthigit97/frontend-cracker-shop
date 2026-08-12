import { useEffect, useState } from "react";

import Button from "../../components/ui/Button";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import EmptyState from "../../components/ui/EmptyState";

import { useAdminUsersStore } from "../../store/adminUsers.store";
import { useAlert } from "../../store/alert.store";
import { deleteUser } from "../../services/adminUsers.api";

import { useNavigate } from "react-router-dom";

const PAGE_SIZE = 20;

export default function AdminUsers() {
    const navigate = useNavigate();

    const {
        fetchPage,
        loading,
        clearCache,
    } = useAdminUsersStore();

    const { showAlert } = useAlert();

    const [page, setPage] = useState(1);

    const [data, setData] = useState<any>(null);

    const [search, setSearch] = useState("");

    const [cursorByPage, setCursorByPage] =
        useState<Record<number, string | undefined>>({});

    const [deletingMobile, setDeletingMobile] =
        useState<string | null>(null);

    const [showDeleteConfirm, setShowDeleteConfirm] =
        useState(false);

    const [selectedMobile, setSelectedMobile] =
        useState<string | null>(null);

    const query = search.trim();

    /*
     * ---------------------------------------------------------
     * Load users
     * ---------------------------------------------------------
     */
    const loadUsers = async (
        targetPage: number,
        searchValue: string,
        cursor?: string
    ) => {
        try {
            const response = await fetchPage({
                search: searchValue || undefined,
                cursor,
                limit: PAGE_SIZE,
            });

            setData(response);

            /*
             * The cursor returned for the current page
             * is the cursor required to load the next page.
             */
            if (response?.nextCursor) {
                setCursorByPage((previous) => ({
                    ...previous,
                    [targetPage + 1]:
                        response.nextCursor,
                }));
            }
        } catch (error: any) {
            showAlert({
                type: "error",
                message:
                    error?.message ||
                    "Failed to load users",
            });
        }
    };

    /*
     * ---------------------------------------------------------
     * Initial load + page/search changes
     * ---------------------------------------------------------
     */
    useEffect(() => {
        const cursor =
            page === 1
                ? undefined
                : cursorByPage[page];

        loadUsers(
            page,
            query,
            cursor
        );
    }, [page, query]);

    /*
     * ---------------------------------------------------------
     * Search change
     *
     * Whenever search changes:
     * - Go back to page 1
     * - Clear old cursors
     * - Old page cursors cannot be reused for a new search
     * ---------------------------------------------------------
     */
    useEffect(() => {
        setPage(1);
        setCursorByPage({});
        setData(null);
    }, [query]);

    /*
     * ---------------------------------------------------------
     * Delete
     * ---------------------------------------------------------
     */
    const handleDeleteClick = (
        mobile: string
    ) => {
        setSelectedMobile(mobile);
        setShowDeleteConfirm(true);
    };

    const confirmDelete = async () => {
        if (!selectedMobile) {
            return;
        }

        try {
            setDeletingMobile(selectedMobile);

            await deleteUser(selectedMobile);

            showAlert({
                type: "success",
                message:
                    "User deleted successfully",
            });

            /*
             * Clear cached pages because deleting a user
             * can change pagination results.
             */
            clearCache();

            /*
             * Reload current page.
             *
             * If the current page becomes empty after deletion,
             * go to previous page.
             */
            const currentItems =
                data?.items ?? [];

            if (
                currentItems.length === 1 &&
                page > 1
            ) {
                setPage((previous) =>
                    previous - 1
                );
            } else {
                const cursor =
                    page === 1
                        ? undefined
                        : cursorByPage[page];

                await loadUsers(
                    page,
                    query,
                    cursor
                );
            }
        } catch (error: any) {
            showAlert({
                type: "error",
                message:
                    error?.message ||
                    "Failed to delete user",
            });
        } finally {
            setDeletingMobile(null);
            setShowDeleteConfirm(false);
            setSelectedMobile(null);
        }
    };

    /*
     * ---------------------------------------------------------
     * Current page users
     * ---------------------------------------------------------
     */
    const users = data?.items ?? [];

    /*
     * DynamoDB cursor pagination:
     *
     * If nextCursor exists -> another page exists.
     */
    const hasNextPage =
        Boolean(data?.nextCursor);

    return (
        <div className="space-y-4">

            {/* Header */}
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

                <h1 className="
                    text-xl md:text-2xl
                    font-semibold
                    text-[var(--color-primary)]
                ">
                    Users
                </h1>
            </div>

            {/* Search */}
            <div>
                <input
                    placeholder="Search by name or mobile..."
                    className="
                        w-full mb-4
                        px-5 py-3
                        rounded-full
                        border border-gray-300
                        bg-white
                        shadow-sm
                        focus:ring-2
                        focus:ring-[var(--color-primary)]
                    "
                    value={search}
                    onChange={(event) =>
                        setSearch(
                            event.target.value
                        )
                    }
                />
            </div>

            {/* Table */}
            <div className="
                bg-white
                border
                rounded-xl
                overflow-hidden
            ">

                <div className="overflow-x-auto">

                    <table className="
                        w-full
                        text-sm
                        min-w-[700px]
                    ">

                        <thead className="bg-gray-50">
                            <tr>
                                <th className="p-3 text-left">
                                    User Name
                                </th>

                                <th className="p-3 text-left">
                                    Mobile No
                                </th>

                                <th className="p-3 text-left">
                                    Address
                                </th>

                                <th className="p-3 text-left">
                                    Role
                                </th>

                                <th className="p-3 text-left">
                                    Action
                                </th>
                            </tr>
                        </thead>

                        <tbody>

                            {/* Loading */}
                            {loading &&
                                Array.from({
                                    length: 5,
                                }).map((_, index) => (
                                    <tr
                                        key={index}
                                        className="
                                            border-t
                                            animate-pulse
                                        "
                                    >
                                        <td className="p-3">
                                            <div className="
                                                h-4
                                                w-40
                                                bg-gray-200
                                                rounded
                                            " />
                                        </td>

                                        <td className="p-3">
                                            <div className="
                                                h-4
                                                w-24
                                                bg-gray-200
                                                rounded
                                            " />
                                        </td>

                                        <td className="p-3">
                                            <div className="
                                                h-8
                                                w-40
                                                bg-gray-200
                                                rounded-lg
                                            " />
                                        </td>

                                        <td className="p-3">
                                            <div className="
                                                h-4
                                                w-16
                                                bg-gray-200
                                                rounded
                                            " />
                                        </td>

                                        <td className="p-3">
                                            <div className="
                                                h-8
                                                w-20
                                                bg-gray-200
                                                rounded
                                            " />
                                        </td>
                                    </tr>
                                ))}

                            {/* Users */}
                            {!loading &&
                                users.length > 0 &&
                                users.map(
                                    (user: any) => (
                                        <tr
                                            key={
                                                user.mobile
                                            }
                                            className="
                                                border-t
                                            "
                                        >
                                            <td className="p-3">
                                                {user.name ||
                                                    "-"}
                                            </td>

                                            <td className="
                                                p-3
                                                whitespace-nowrap
                                            ">
                                                {user.mobile}
                                            </td>

                                            <td className="p-3">
                                                {user.address ||
                                                    "-"}
                                            </td>

                                            <td className="p-3">
                                                {user.role ||
                                                    "-"}
                                            </td>

                                            <td className="p-3">
                                                <Button
                                                    variant="outline"
                                                    className="
                                                        border-red-500
                                                        text-red-600
                                                    "
                                                    disabled={
                                                        deletingMobile ===
                                                        user.mobile
                                                    }
                                                    onClick={() =>
                                                        handleDeleteClick(
                                                            user.mobile
                                                        )
                                                    }
                                                >
                                                    {deletingMobile ===
                                                        user.mobile
                                                        ? "Deleting…"
                                                        : "Delete"}
                                                </Button>
                                            </td>
                                        </tr>
                                    )
                                )}

                            {/* Empty */}
                            {!loading &&
                                users.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan={5}
                                            className="
                                                p-6
                                                text-center
                                                text-gray-500
                                            "
                                        >
                                            <EmptyState
                                                title={
                                                    query
                                                        ? "No users found"
                                                        : "No users available"
                                                }
                                            />
                                        </td>
                                    </tr>
                                )}

                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="
                    flex
                    justify-center
                    items-center
                    gap-3
                    p-4
                    border-t
                ">

                    <Button
                        variant="outline"
                        disabled={
                            page === 1 ||
                            loading
                        }
                        onClick={() =>
                            setPage(
                                (previous) =>
                                    previous - 1
                            )
                        }
                    >
                        ← Previous
                    </Button>

                    <span className="
                        text-sm
                        min-w-[70px]
                        text-center
                    ">
                        Page {page}
                    </span>

                    <Button
                        variant="outline"
                        disabled={
                            !hasNextPage ||
                            loading
                        }
                        onClick={() =>
                            setPage(
                                (previous) =>
                                    previous + 1
                            )
                        }
                    >
                        Next →
                    </Button>

                </div>
            </div>

            {/* Delete confirmation */}
            <ConfirmDialog
                open={
                    showDeleteConfirm
                }
                title="Delete User?"
                message={
                    <>
                        Are you sure you want
                        to delete this user?
                        <br />

                        <span className="
                            text-red-500
                            font-medium
                        ">
                            This action cannot be
                            undone.
                        </span>
                    </>
                }
                confirmText="Yes, Delete"
                cancelText="Cancel"
                loading={
                    !!deletingMobile
                }
                onCancel={() =>
                    setShowDeleteConfirm(
                        false
                    )
                }
                onConfirm={
                    confirmDelete
                }
            />
        </div>
    );
}