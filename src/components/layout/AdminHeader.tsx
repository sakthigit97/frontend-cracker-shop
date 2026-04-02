import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../../store/auth.store";

export default function AdminHeader() {
    const [open, setOpen] = useState(false);
    const navigate = useNavigate();
    const { logout } = useAuth();
    const [reportsOpen, setReportsOpen] = useState(false);

    const handleLogout = () => {
        logout();
        setOpen(false);
        navigate("/");
    };

    return (
        <header className="bg-[var(--color-primary)] text-white">
            <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">

                {/* Logo */}
                <Link to="/admin" className="flex items-center gap-2">
                    <span className="font-bold tracking-wide hidden sm:block">
                        Admin Panel
                    </span>
                </Link>

                {/* Desktop Nav */}
                <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
                    <Link to="/admin" className="hover:text-[var(--color-accent)]">
                        Dashboard
                    </Link>

                    <Link to="/admin/products" className="hover:text-[var(--color-accent)]">
                        Products
                    </Link>

                    <Link to="/admin/categories" className="hover:text-[var(--color-accent)]">
                        Categories
                    </Link>

                    <Link to="/admin/brands" className="hover:text-[var(--color-accent)]">
                        Brands
                    </Link>

                    <Link to="/admin/orders" className="hover:text-[var(--color-accent)]">
                        Orders
                    </Link>
                    <div className="relative group">
                        <button className="hover:text-[var(--color-accent)]">
                            Reports
                        </button>

                        <div className="absolute left-0 hidden group-hover:block pt-2 z-50">
                            <div className="bg-white text-black rounded-lg shadow-lg min-w-[180px]">
                                <Link className="block px-4 py-2 hover:bg-gray-100" to="/admin/reports/revenue">
                                    Revenue Report
                                </Link>
                                <Link className="block px-4 py-2 hover:bg-gray-100" to="/admin/reports/products">
                                    Product Report
                                </Link>
                            </div>
                        </div>
                    </div>

                    <Link to="/admin/discounts" className="hover:text-[var(--color-accent)]">
                        Discounts
                    </Link>

                    <Link to="/admin/users" className="hover:text-[var(--color-accent)]">
                        Users
                    </Link>

                    <Link to="/admin/configs" className="hover:text-[var(--color-accent)]">
                        Configs
                    </Link>
                </nav>

                {/* Right actions */}
                <div className="flex items-center gap-4">
                    {/* Hamburger */}
                    <button
                        onClick={() => setOpen(!open)}
                        className="md:hidden focus:outline-none"
                    >
                        <svg
                            className="w-6 h-6"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M4 6h16M4 12h16M4 18h16"
                            />
                        </svg>
                    </button>

                    {/* Desktop Logout */}
                    <button
                        onClick={handleLogout}
                        className="hidden md:inline-flex items-center px-3 py-1 rounded-md
                       text-sm font-semibold
                       bg-white/10 hover:bg-white/20
                       transition"
                    >
                        Logout
                    </button>
                </div>
            </div>

            {open && (
                <div className="md:hidden bg-[var(--color-primary)] border-t border-white/10">
                    <nav className="flex flex-col p-4 space-y-3 text-sm">
                        <Link onClick={() => setOpen(false)} to="/admin">
                            Dashboard
                        </Link>
                        <Link onClick={() => setOpen(false)} to="/admin/products">
                            Products
                        </Link>
                        <Link onClick={() => setOpen(false)} to="/admin/categories">
                            Categories
                        </Link>
                        <Link onClick={() => setOpen(false)} to="/admin/brands">
                            Brands
                        </Link>
                        <Link onClick={() => setOpen(false)} to="/admin/orders">
                            Orders
                        </Link>
                        <Link onClick={() => setOpen(false)} to="/admin/discounts">
                            Discounts
                        </Link>
                        <Link onClick={() => setOpen(false)} to="/admin/users">
                            Users
                        </Link>
                        <Link onClick={() => setOpen(false)} to="/admin/configs">
                            Configs
                        </Link>
                        <div>
                            <button
                                onClick={() => setReportsOpen(!reportsOpen)}
                                className="flex justify-between items-center w-full"
                            >
                                <span>Reports</span>
                                <span>{reportsOpen ? "▲" : "▼"}</span>
                            </button>

                            {reportsOpen && (
                                <div className="ml-4 mt-2 flex flex-col gap-2 text-sm">
                                    <Link
                                        onClick={() => setOpen(false)}
                                        to="/admin/reports/revenue"
                                    >
                                        Revenue Report
                                    </Link>

                                    <Link
                                        onClick={() => setOpen(false)}
                                        to="/admin/reports/products"
                                    >
                                        Product Report
                                    </Link>
                                </div>
                            )}
                        </div>

                        <button
                            onClick={handleLogout}
                            className="text-left text-white/90 hover:text-white font-medium"
                        >
                            Logout
                        </button>
                    </nav>
                </div>
            )}
        </header>
    );
}