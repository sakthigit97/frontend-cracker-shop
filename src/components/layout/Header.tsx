import { Link, useNavigate } from "react-router-dom";
import { useState, useMemo, useEffect } from "react";
import { useAuth } from "../../store/auth.store";
import { cartStore } from "../../store/cart.store";
import { useHomeProducts } from "../../store/homeProduct.store";
import { FaShoppingCart } from "react-icons/fa";

export default function Header() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { isAuthenticated, logout, user } = useAuth();
  const items = cartStore((s) => s.items);
  const { products, fetchInitial, hasFetched } = useHomeProducts();

  const handleLogout = () => {
    logout();
    setOpen(false);
    navigate("/");
  };

  const cartCount = useMemo(() => {
    return Object.values(items).reduce((sum, qty) => sum + qty, 0);
  }, [items]);


  const cartTotal = useMemo(() => {
    if (!products || products.length === 0) return null;

    return Object.entries(items).reduce((sum, [id, qty]: any) => {
      if (!id || id === "undefined") return sum;

      const product = products.find((p) => p.id === id);
      if (!product) return sum;

      const quantity =
        typeof qty === "number" ? qty : qty?.qty || 0;

      return sum + product.price * quantity;
    }, 0);
  }, [items, products]);

  useEffect(() => {
    if (!hasFetched) {
      fetchInitial();
    }
  }, [hasFetched]);

  return (
    <header className="bg-[var(--color-primary)] text-white">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <span className="font-bold tracking-wide hidden sm:block">
            Sivakasi Pyro Park
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          <Link to="/" className="hover:text-[var(--color-accent)]">
            Home
          </Link>
          <Link to="/products" className="hover:text-[var(--color-accent)]">
            Products
          </Link>

          <Link to="/contact" className="hover:text-[var(--color-accent)]">
            Contact us
          </Link>

          <Link to="/privacy-policy" className="hover:text-[var(--color-accent)]">
            Privacy Policy
          </Link>

          {isAuthenticated && (
            <Link to="/orders" className="hover:text-[var(--color-accent)]">
              Orders
            </Link>
          )}
        </nav>


        <div className="flex items-center gap-4">
          {isAuthenticated && (
            <div
              className="
      flex items-center gap-1
      bg-white/10
      px-2 py-1
      sm:px-3 sm:py-1.5
      rounded-full
      text-xs sm:text-sm
      backdrop-blur-sm
      max-w-[120px] sm:max-w-[180px]
    "
            >
              <span className="text-white/80">Welcome,</span>

              <span className="font-semibold text-white truncate">
                {user?.name || "User"}
              </span>
            </div>
          )}
          {cartCount > 0 ? (
            <Link to="/cart" className="flex items-center gap-2">
              <div className="relative">
                <FaShoppingCart className="text-xl" />

                {cartCount > 0 && (
                  <span
                    className="
                    absolute -top-2 -right-2
                    min-w-[18px] h-[18px] px-1
                    flex items-center justify-center
                    rounded-full text-[11px] font-bold
                    bg-white text-[var(--color-primary)]
                    ring-2 ring-[var(--color-primary)]
                  "
                  >
                    {cartCount}
                  </span>
                )}
              </div>

              {cartTotal === null ? (
                <span className="text-xs opacity-70">...</span>
              ) : (
                <>₹{cartTotal.toLocaleString()}</>
              )}

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
              <FaShoppingCart className="text-xl" />
            </span>
          )}

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

      {open && (
        <div className="md:hidden bg-[var(--color-primary)] border-t border-white/10">
          <nav className="flex flex-col p-4 space-y-3 text-sm">
            <Link onClick={() => setOpen(false)} to="/">
              Home
            </Link>
            <Link onClick={() => setOpen(false)} to="/products">
              Products
            </Link>
            <Link onClick={() => setOpen(false)} to="/contact">
              Contact us
            </Link>
            <Link onClick={() => setOpen(false)} to="/privacy-policy">
              Privacy Policy
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