import { Link, useNavigate } from "react-router-dom";
import { useState, useMemo } from "react";
import { useAuth } from "../../store/auth.store";
import { cartStore } from "../../store/cart.store";

export default function Header() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { isAuthenticated, logout } = useAuth();
  const items = cartStore((s) => s.items);

  const handleLogout = () => {
    logout();
    setOpen(false);
    navigate("/");
  };

  const cartCount = useMemo(() => {
    return Object.values(items).reduce(
      (sum, qty) => sum + qty,
      0
    );
  }, [items]);

  return (
    <header className="bg-[var(--color-primary)] text-white">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <span className="font-bold tracking-wide hidden sm:block">
            Sivakasi Pyro Park
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          <Link to="/" className="hover:text-[var(--color-accent)]">
            Home
          </Link>
          <Link to="/products" className="hover:text-[var(--color-accent)]">
            Products
          </Link>

          {isAuthenticated && (
            <Link to="/orders" className="hover:text-[var(--color-accent)]">
              Orders
            </Link>
          )}
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-4">
          {/* Cart Icon */}
          {cartCount > 0 ? (
            <Link to="/cart" className="relative">
              <span className="text-lg">🛒</span>
              <span
                className="
                  absolute
                  -top-2
                  -right-2
                  min-w-[18px]
                  h-[18px]
                  px-1
                  flex
                  items-center
                  justify-center
                  rounded-full
                  text-[11px]
                  font-bold
                  bg-white
                  text-[var(--color-primary)]
                  ring-2
                  ring-[var(--color-primary)]
                "
              >
                {cartCount}
              </span>
            </Link>
          ) : (
            <span
              className="
                relative
                text-lg
                opacity-50
                cursor-not-allowed
              "
              title="Cart is empty"
            >
              🛒
            </span>
          )}

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

          {/* Desktop Auth */}
          {!isAuthenticated ? (
            <Link
              to="/login"
              className="hidden md:inline-block bg-[var(--color-accent)] text-[var(--color-primary)] px-3 py-1 rounded-md text-sm font-semibold"
            >
              Login
            </Link>
          ) : (
            <button
              onClick={handleLogout}
              className="hidden md:inline-flex items-center px-3 py-1 rounded-md
                        text-sm font-semibold
                        bg-white/10 hover:bg-white/20
                        transition"
            >
              Logout
            </button>
          )}
        </div>
      </div>

      {/* Mobile Menu */}
      {open && (
        <div className="md:hidden bg-[var(--color-primary)] border-t border-white/10">
          <nav className="flex flex-col p-4 space-y-3 text-sm">
            <Link onClick={() => setOpen(false)} to="/">
              Home
            </Link>
            <Link onClick={() => setOpen(false)} to="/products">
              Products
            </Link>

            {isAuthenticated && (
              <>
                <Link onClick={() => setOpen(false)} to="/orders">
                  Orders
                </Link>

                <Link to="/profile" className="hover:text-[var(--color-accent)]">
                  Profile
                </Link>
              </>
            )}

            {!isAuthenticated ? (
              <Link onClick={() => setOpen(false)} to="/login">
                Login
              </Link>
            ) : (
              <button
                onClick={handleLogout}
                className="text-left text-white/90 hover:text-white font-medium"
              >
                Logout
              </button>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}