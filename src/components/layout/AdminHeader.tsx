import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";

import {
    FaBars,
    FaTimes,
    FaTachometerAlt,
    FaBoxOpen,
    FaTags,
    FaLayerGroup,
    FaPercentage,
    FaShoppingBag,
    FaChartBar,
    FaUsers,
    FaEnvelope,
    FaCog,
    FaSignOutAlt,
    FaFolderOpen,
    FaServer,
} from "react-icons/fa";

import HeaderDropdown from "./HeaderDropdown";
import type { HeaderDropdownItem } from "./HeaderDropdown";
import MobileAccordion from "./MobileAccordion";
import type { MobileAccordionItem } from "./MobileAccordion";

import { useAuth } from "../../store/auth.store";

export default function AdminHeader() {
    const navigate = useNavigate();

    const [mobileOpen, setMobileOpen] = useState(false);

    const { logout } = useAuth();

    const handleLogout = () => {
        logout();
        setMobileOpen(false);
        navigate("/");
    };

    const closeMobile = () => setMobileOpen(false);

    const catalogMenu: HeaderDropdownItem[] = [
        {
            label: "Products",
            to: "/admin/products",
            icon: <FaBoxOpen />,
        },
        {
            label: "Categories",
            to: "/admin/categories",
            icon: <FaLayerGroup />,
        },
        {
            label: "Brands",
            to: "/admin/brands",
            icon: <FaTags />,
        },
        {
            label: "Discounts",
            to: "/admin/discounts",
            icon: <FaPercentage />,
        },
    ];

    const salesMenu: HeaderDropdownItem[] = [
        {
            label: "Orders",
            to: "/admin/orders",
            icon: <FaShoppingBag />,
        },
        {
            label: "Revenue Report",
            to: "/admin/reports/revenue",
            icon: <FaChartBar />,
        },
        {
            label: "Product Report",
            to: "/admin/reports/products",
            icon: <FaChartBar />,
        },
    ];

    const systemMenu: HeaderDropdownItem[] = [
        {
            label: "Users",
            to: "/admin/users",
            icon: <FaUsers />,
        },
        {
            label: "Queries",
            to: "/admin/queries",
            icon: <FaEnvelope />,
        },
        {
            label: "Configurations",
            to: "/admin/configs",
            icon: <FaCog />,
        },
        {
            label: "Logout",
            icon: <FaSignOutAlt />,
            onClick: handleLogout,
            danger: true,
        },
    ];

    const mobileCatalog: MobileAccordionItem[] = [
        {
            label: "Products",
            to: "/admin/products",
            icon: <FaBoxOpen />,
        },
        {
            label: "Categories",
            to: "/admin/categories",
            icon: <FaLayerGroup />,
        },
        {
            label: "Brands",
            to: "/admin/brands",
            icon: <FaTags />,
        },
        {
            label: "Discounts",
            to: "/admin/discounts",
            icon: <FaPercentage />,
        },
    ];

    const mobileSales: MobileAccordionItem[] = [
        {
            label: "Orders",
            to: "/admin/orders",
            icon: <FaShoppingBag />,
        },
        {
            label: "Revenue Report",
            to: "/admin/reports/revenue",
            icon: <FaChartBar />,
        },
        {
            label: "Product Report",
            to: "/admin/reports/products",
            icon: <FaChartBar />,
        },
    ];

    const mobileSystem: MobileAccordionItem[] = [
        {
            label: "Users",
            to: "/admin/users",
            icon: <FaUsers />,
        },
        {
            label: "Queries",
            to: "/admin/queries",
            icon: <FaEnvelope />,
        },
        {
            label: "Configurations",
            to: "/admin/configs",
            icon: <FaCog />,
        },
        {
            label: "Logout",
            icon: <FaSignOutAlt />,
            danger: true,
            onClick: handleLogout,
        },
    ];

    return (

        <header className="bg-[var(--color-primary)] text-white">
            <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">                {/* ================= Logo ================= */}

                <Link
                    to="/admin"
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
                            Admin Panel
                        </div>

                        <div className="text-xs text-white/60">
                            Management Console
                        </div>
                    </div>
                </Link>


                <nav className="hidden lg:flex items-center gap-2">

                    <Link
                        to="/admin"
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
                        Dashboard
                    </Link>

                    <HeaderDropdown
                        title="Catalog"
                        icon={<FaFolderOpen size={14} />}
                        items={catalogMenu}
                    />

                    <HeaderDropdown
                        title="Sales"
                        icon={<FaShoppingBag size={14} />}
                        items={salesMenu}
                    />

                    <HeaderDropdown
                        title="System"
                        icon={<FaCog size={14} />}
                        items={systemMenu}
                    />

                </nav>

                {/* ================= Right Actions ================= */}

                <div className="flex items-center gap-3">

                    {/* Admin Badge */}

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
                            <FaTachometerAlt />
                        </div>

                        <div className="leading-tight">
                            <div className="text-[11px] text-white/60">
                                Administration
                            </div>

                            <div className="text-sm font-semibold">
                                Control Panel
                            </div>
                        </div>
                    </div>

                    {/* Desktop Logout */}

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

                    {/* Mobile Menu */}

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
                    >
                        {mobileOpen ? (
                            <FaTimes className="text-xl" />
                        ) : (
                            <FaBars className="text-xl" />
                        )}
                    </button>

                </div>
            </div>
            {/* ================= Mobile Navigation ================= */}

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

                        {/* Dashboard */}

                        <Link
                            to="/admin"
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
                            <FaTachometerAlt />

                            Dashboard
                        </Link>

                        {/* Catalog */}

                        <MobileAccordion
                            title="Catalog"
                            icon={<FaFolderOpen />}
                            items={mobileCatalog}
                            onNavigate={closeMobile}
                        />

                        {/* Sales */}

                        <MobileAccordion
                            title="Sales"
                            icon={<FaShoppingBag />}
                            items={mobileSales}
                            onNavigate={closeMobile}
                        />

                        {/* System */}

                        <MobileAccordion
                            title="System"
                            icon={<FaCog />}
                            items={mobileSystem}
                            onNavigate={closeMobile}
                        />

                        {/* Quick Logout */}

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