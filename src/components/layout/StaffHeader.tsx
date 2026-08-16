import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";

import {
    FaBars,
    FaTimes,
    FaShoppingBag,
    FaSignOutAlt,
    FaServer,
} from "react-icons/fa";

import { useAuth } from "../../store/auth.store";

export default function StaffHeader() {
    const navigate = useNavigate();
    const [mobileOpen, setMobileOpen] = useState(false);
    const { logout } = useAuth();

    const handleLogout = () => {
        logout();
        setMobileOpen(false);
        navigate("/");
    };

    const closeMobile = () => setMobileOpen(false);

    return (
        <header className="bg-[var(--color-primary)] text-white">
            <div className="w-full px-8 py-3 flex items-center">

                {/* ================= BRAND ================= */}
                <Link
                    to="/staff/orders"
                    className="flex items-center gap-3 flex-shrink-0"
                >
                    <div
                        className="
              flex
              h-11
              w-11
              items-center
              justify-center
              rounded-xl
              bg-white/10
              backdrop-blur
            "
                    >
                        <FaServer className="text-lg" />
                    </div>

                    <div className="hidden sm:block">
                        <div className="text-lg font-bold leading-none">
                            Staff Panel
                        </div>

                        <div className="text-xs text-white/60">
                            Order Management
                        </div>
                    </div>
                </Link>

                {/* ================= DESKTOP NAV ================= */}
                <nav className="hidden lg:flex flex-1 items-center gap-2 ml-10">
                    <Link
                        to="/staff/orders"
                        className="
                            rounded-xl
                            px-4
                            py-2
                            text-sm
                            font-medium
                            transition-all
                            duration-200
                            hover:bg-white/10
                            "
                    >
                        <span className="flex items-center gap-2">
                            <FaShoppingBag size={14} />
                            Orders
                        </span>
                    </Link>

                    <Link
                        to="/staff/bulk-orders"
                        className="
                            rounded-xl
                            px-4
                            py-2
                            text-sm
                            font-medium
                            transition-all
                            duration-200
                            hover:bg-white/10
                            "
                    >
                        <span className="flex items-center gap-2">
                            <FaShoppingBag size={14} />
                            Bulk Orders
                        </span>
                    </Link>
                </nav>

                <div className="ml-auto flex items-center gap-3 flex-shrink-0">

                    <div
                        className="
                            hidden
                            md:flex
                            items-center
                            gap-2
                            rounded-full
                            border
                            border-white/10
                            bg-white/10
                            px-4
                            py-2
                            backdrop-blur
                            "
                    >
                        <div
                            className="
                                flex
                                h-8
                                w-8
                                items-center
                                justify-center
                                rounded-full
                                bg-white/20
                            "
                        >
                            <FaShoppingBag />
                        </div>

                        <div className="leading-tight">
                            <div className="text-[11px] text-white/60">
                                Staff
                            </div>

                            <div className="text-sm font-semibold">
                                Order Management
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={handleLogout}
                        className="
                            hidden
                            lg:inline-flex
                            items-center
                            gap-2
                            rounded-xl
                            border
                            border-white/10
                            bg-white/10
                            px-5
                            py-2.5
                            text-sm
                            font-semibold
                            transition-all
                            duration-200
                            hover:bg-red-500
                            hover:text-white
                            "
                    >
                        <FaSignOutAlt />
                        Logout
                    </button>

                    <button
                        onClick={() => setMobileOpen(!mobileOpen)}
                        className="
                            rounded-xl
                            p-2
                            transition-all
                            duration-200
                            hover:bg-white/10
                            lg:hidden
                            "
                        aria-label="Toggle menu"
                    >
                        {mobileOpen ? (
                            <FaTimes className="text-xl" />
                        ) : (
                            <FaBars className="text-xl" />
                        )}
                    </button>
                </div>
            </div>

            {mobileOpen && (
                <div
                    className="
                        lg:hidden
                        border-t
                        border-white/10
                        bg-[var(--color-primary)]/95
                        backdrop-blur-xl
                    "
                >
                    <div className="space-y-4 p-4">

                        <Link
                            to="/staff/orders"
                            onClick={closeMobile}
                            className="
                                flex
                                items-center
                                gap-3
                                rounded-2xl
                                bg-white/5
                                px-4
                                py-3
                                text-sm
                                font-medium
                                transition-all
                                duration-200
                                hover:bg-white/10
                            "
                        >
                            <FaShoppingBag />
                            Orders
                        </Link>

                        <Link
                            to="/staff/bulk-orders"
                            onClick={closeMobile}
                            className="
                                flex
                                items-center
                                gap-3
                                rounded-2xl
                                bg-white/5
                                px-4
                                py-3
                                text-sm
                                font-medium
                                transition-all
                                duration-200
                                hover:bg-white/10
                            "
                        >
                            <FaShoppingBag />
                            Bulk Orders
                        </Link>


                        <button
                            onClick={handleLogout}
                            className="
                                flex
                                w-full
                                items-center
                                justify-center
                                gap-2
                                rounded-2xl
                                bg-red-500
                                px-4
                                py-3
                                font-semibold
                                text-white
                                transition-all
                                duration-200
                                hover:bg-red-600
                            "
                        >
                            <FaSignOutAlt />
                            Logout
                        </button>
                    </div>
                </div>
            )}
        </header>
    );
}