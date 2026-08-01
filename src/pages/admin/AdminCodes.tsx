import { useEffect, useState } from "react";

import Button from "../../components/ui/Button";
import AdminCodeFormModal from "../../components/admin/AdminCodeFormModal";
import AdminCodeTable from "../../components/admin/AdminCodeTable";
import { useAdminCodeStore } from "../../store/adminCode.store";

export default function AdminCodes() {

    const {
        codes,
        loading,
        fetchCodes,
    } = useAdminCodeStore();

    const [open, setOpen] = useState(false);

    useEffect(() => {
        fetchCodes();
    }, []);

    return (

        <div className="space-y-6">

            <div
                className="
                    flex
                    flex-col
                    gap-4
                    sm:flex-row
                    sm:items-center
                    sm:justify-between
                "
            >

                <div>

                    <h1 className="text-2xl font-bold">
                        Admin Codes
                    </h1>

                    <p className="text-gray-500">
                        Generate and manage
                        Bulk Order access codes.
                    </p>

                </div>

                <Button
                    onClick={() =>
                        setOpen(true)
                    }
                    className="w-full sm:w-auto"
                >
                    + Generate Code
                </Button>

            </div>

            {loading ? (

                <div
                    className="
                        bg-white
                        rounded-xl
                        shadow-sm
                        border
                        p-6
                    "
                >

                    <div className="animate-pulse space-y-4">

                        <div className="h-8 w-48 rounded bg-gray-200"></div>

                        {[...Array(5)].map((_, index) => (

                            <div
                                key={index}
                                className="grid grid-cols-6 gap-4"
                            >

                                <div className="h-5 rounded bg-gray-200"></div>

                                <div className="h-5 rounded bg-gray-200"></div>

                                <div className="h-5 rounded bg-gray-200"></div>

                                <div className="h-5 rounded bg-gray-200"></div>

                                <div className="h-5 rounded bg-gray-200"></div>

                                <div className="h-5 rounded bg-gray-200"></div>

                            </div>

                        ))}

                    </div>

                </div>

            ) : (

                <AdminCodeTable
                    codes={codes}
                />

            )}

            <AdminCodeFormModal
                open={open}
                onClose={() =>
                    setOpen(false)
                }
            />

        </div>

    );

}
