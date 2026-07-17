import { Link, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { calculateOrderPricingBreakdown } from "../../utils/orderPricing";
import { calculateOrderAmounts } from "../../utils/pricing";
import logo from '../../assets/icon-new.png'

import {
  FaShoppingCart,
  FaBoxOpen,
  // FaRobot,
  FaCalculator,
  FaPhoneAlt,
  FaUserCircle,
  FaClipboardList,
  FaShieldAlt,
  FaSignOutAlt,
  FaHome,
  FaBars,
  FaTimes,
} from "react-icons/fa";

import HeaderDropdown from "./HeaderDropdown";
import type { HeaderDropdownItem } from "./HeaderDropdown";
import MobileAccordion from "./MobileAccordion";
import type { MobileAccordionItem } from "./MobileAccordion";

import { useAuth } from "../../store/auth.store";
import { cartStore } from "../../store/cart.store";
import { useHomeProducts } from "../../store/homeProduct.store";
import { useConfigStore } from "../../store/config.store";

function formatCartAmount(amount: number) {
  if (amount >= 1000) {
    return `₹${(amount / 1000).toFixed(1)}K`;
  }

  return `₹${amount}`;
}

export default function Header() {
  const navigate = useNavigate();
  const { config } = useConfigStore();

  const [mobileOpen, setMobileOpen] = useState(false);
  const { isAuthenticated, logout, user } = useAuth();
  const items = cartStore((s) => s.items);
  const packagingPercent = Number(config?.packagingPercent || 0);
  const gstPercent = Number(config?.gstPercent || 0);

  const {
    products,
    fetchInitial,
    hasFetched,
  } = useHomeProducts();

  useEffect(() => {
    if (!hasFetched) {
      fetchInitial();
    }
  }, [fetchInitial, hasFetched]);

  const handleLogout = () => {
    logout();
    setMobileOpen(false);
    navigate("/");
  };

  const closeMobile = () => setMobileOpen(false);
  const cartCount = useMemo(() => {
    return Object.values(items).reduce((sum, qty) => {
      const quantity = typeof qty === "number"
        ? qty
        : Number((qty as any)?.qty ?? 0);

      return sum + quantity;
    }, 0);
  }, [items]);

  const cartPricing = useMemo(() => {
    if (!products.length) return null;

    const cartProducts = Object.entries(items)
      .map(([id, qty]) => {
        if (!id || id === "undefined") return null;

        const product = products.find((p) => p.id === id);
        if (!product) return null;

        const quantity =
          typeof qty === "number"
            ? qty
            : (qty as any)?.qty ?? 0;

        return {
          ...product,
          quantity,
        };
      })
      .filter(
        (p): p is NonNullable<typeof p> => p !== null
      );

    const pricingBreakdown =
      calculateOrderPricingBreakdown(cartProducts);

    return calculateOrderAmounts({
      totalAmount: pricingBreakdown.subtotal,
      chargeableAmount:
        pricingBreakdown.eligibleChargeAmount,
      packagingPercent: packagingPercent,
      gstPercent: gstPercent,
    });
  }, [items, products]);


  const productMenu: HeaderDropdownItem[] = [
    {
      label: "All Products",
      to: "/products",
      icon: <FaBoxOpen />,
    },
    {
      label: "Combo Packages",
      to: "/combo-packages",
      icon: <FaBoxOpen />,
    },
    {
      label: "Quick Estimate",
      to: "/quick-estimate",
      icon: <FaCalculator />,
    },
    // {
    //   label: "AI Assistant",
    //   to: "/ai-assistant",
    //   icon: <FaRobot />,
    // },
  ];

  const supportMenu: HeaderDropdownItem[] = [
    {
      label: "Contact Us",
      to: "/contact",
      icon: <FaPhoneAlt />,
    },
    {
      label: "Privacy Policy",
      to: "/privacy-policy",
      icon: <FaShieldAlt />,
    },
  ];

  const accountMenu: HeaderDropdownItem[] = [
    {
      label: "Orders",
      to: "/orders",
      icon: <FaClipboardList />,
    },
    {
      label: "Profile",
      to: "/profile",
      icon: <FaUserCircle />,
    },
    {
      label: "Logout",
      icon: <FaSignOutAlt />,
      onClick: handleLogout,
      danger: true,
    },
  ];

  const mobileProducts: MobileAccordionItem[] = [
    {
      label: "All Products",
      to: "/products",
      icon: <FaBoxOpen />,
    },
    {
      label: "Combo Packages",
      to: "/combo-packages",
      icon: <FaBoxOpen />,
    },
    {
      label: "Quick Estimate",
      to: "/quick-estimate",
      icon: <FaCalculator />,
    },
    // {
    //   label: "AI Assistant",
    //   to: "/ai-assistant",
    //   icon: <FaRobot />,
    // },
  ];

  const mobileSupport: MobileAccordionItem[] = [
    {
      label: "Contact Us",
      to: "/contact",
      icon: <FaPhoneAlt />,
    },
    {
      label: "Privacy Policy",
      to: "/privacy-policy",
      icon: <FaShieldAlt />,
    },
  ];

  const mobileAccount: MobileAccordionItem[] = [
    {
      label: "Orders",
      to: "/orders",
      icon: <FaClipboardList />,
    },
    {
      label: "Profile",
      to: "/profile",
      icon: <FaUserCircle />,
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
      <div className="max-w-7xl mx-auto h-16 px-4 flex items-center justify-between">

        <Link
          to="/"
          className="flex items-center gap-2 shrink-0"
        >
          <img
            src={logo}
            alt="Sivakasi Pyro Park"
            className="h-8 w-8"
          />

          <div className="leading-tight">
            <div className="text-sm sm:text-base font-bold">
              Sivakasi
            </div>

            <div className="text-[10px] sm:text-xs text-white/70">
              Pyro Park
            </div>
          </div>
        </Link>

        <nav className="hidden lg:flex items-center gap-2">

          <Link
            to="/"
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
            Home
          </Link>

          <HeaderDropdown
            title="Products"
            items={productMenu}
          />

          <HeaderDropdown
            title="Support"
            items={supportMenu}
          />

          {isAuthenticated && (
            <HeaderDropdown
              title="My Account"
              items={accountMenu}
            />
          )}
        </nav>

        {/* ================= Right Section ================= */}

        <div className="flex items-center gap-3">

          {/* Welcome Chip */}

          {isAuthenticated && (
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
                <FaUserCircle />
              </div>

              <div className="leading-tight">
                <div className="text-[11px] text-white/60">
                  Welcome
                </div>

                <div
                  className="
                    max-w-[130px]
                    truncate
                    text-sm
                    font-semibold
                  "
                >
                  {user?.name ?? "User"}
                </div>
              </div>
            </div>
          )}
          <Link
            to="/cart"
            className="
    group
    relative
    flex
    items-center
    gap-2
    rounded-full
    bg-white/10
    hover:bg-white/20
    px-3
    py-1.5
    transition-all
  "
          >
            <div className="relative">

              <FaShoppingCart className="text-xl" />

              {cartCount > 0 && (
                <span
                  className="
                    absolute
                    -right-2
                    -top-2
                    flex
                    h-5
                    min-w-[20px]
                    items-center
                    justify-center
                    rounded-full
                    bg-red-500
                    px-1
                    text-[11px]
                    font-bold
                    text-white
                  "
                >
                  {cartCount}
                </span>
              )}

            </div>

            <div className="hidden md:block leading-tight">
              <div className="text-sm font-semibold">
                {cartPricing === null
                  ? "..."
                  : `₹${cartPricing.grandTotal.toLocaleString()}`}
              </div>
            </div>

            <div className="block md:hidden text-xs font-semibold">
              {cartPricing === null
                ? "..."
                : formatCartAmount(cartPricing.grandTotal)}
            </div>
            <div
              className="
              absolute
              top-full
              right-0
              mt-2
              w-64
              rounded-xl
              border
              border-gray-200
              bg-white
              p-3
              shadow-xl
              text-gray-700
              text-sm
              opacity-0
              invisible
              transition-all
              duration-200
              group-hover:opacity-100
              group-hover:visible
              z-50
            "
            >
              <p className="font-semibold text-gray-900">
                Estimated Total
              </p>

              <p className="mt-1 text-xs text-gray-500">
                Includes applicable GST and Packaging Charges.
              </p>
            </div>
          </Link>


          {!isAuthenticated ? (
            <Link
              to="/login"
              className="
                hidden
                lg:inline-flex
                items-center
                rounded-xl
                bg-[var(--color-accent)]
                px-5
                py-2.5
                text-sm
                font-semibold
                text-[var(--color-primary)]
                transition-all
                duration-200
                hover:scale-[1.03]
              "
            >
              Login
            </Link>
          ) : (
            <button
              onClick={handleLogout}
              className="
                hidden
                lg:inline-flex
                items-center
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
              Logout
            </button>
          )}

          {/* Mobile Menu Button */}

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

            {/* Home */}

            <Link
              to="/"
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
              <FaHome />

              Home
            </Link>

            {/* Products */}

            <MobileAccordion
              title="Products"
              items={mobileProducts}
              onNavigate={closeMobile}
            />

            {/* Support */}

            <MobileAccordion
              title="Support"
              items={mobileSupport}
              onNavigate={closeMobile}
            />

            {/* Account */}

            {isAuthenticated && (
              <MobileAccordion
                title="My Account"
                items={mobileAccount}
                onNavigate={closeMobile}
              />
            )}

            {/* Login */}

            {!isAuthenticated && (
              <Link
                to="/login"
                onClick={closeMobile}
                className="
                  flex
                  items-center
                  justify-center
                  rounded-2xl
                  bg-[var(--color-accent)]
                  px-4
                  py-3
                  font-semibold
                  text-[var(--color-primary)]
                  transition-all
                  duration-200
                "
              >
                Login
              </Link>
            )}

            {/* Cart Summary */}

            <Link
              to="/cart"
              onClick={closeMobile}
              className="
                flex
                items-center
                justify-between
                rounded-2xl
                border
                border-white/10
                bg-white/5
                px-4
                py-4
                transition-all
                duration-200
                hover:bg-white/10
              "
            >
              <div className="flex items-center gap-3">

                <div className="relative">

                  <FaShoppingCart className="text-lg" />

                  {cartCount > 0 && (
                    <span
                      className="
                        absolute
                        -right-2
                        -top-2
                        flex
                        h-5
                        min-w-[20px]
                        items-center
                        justify-center
                        rounded-full
                        bg-red-500
                        px-1
                        text-[11px]
                        font-bold
                        text-white
                      "
                    >
                      {cartCount}
                    </span>
                  )}

                </div>

                <div>

                  <div className="text-xs text-white/60">
                    Shopping Cart
                  </div>

                  <div className="font-semibold">
                    {cartCount} Item{cartCount !== 1 ? "s" : ""}
                  </div>

                </div>

              </div>

              <div className="text-right">

                <div className="text-xs text-white/60">
                  Total (Incl. GST & Packaging)
                </div>

                <div className="text-xs font-semibold md:hidden">
                  {cartPricing
                    ? formatCartAmount(cartPricing.grandTotal)
                    : "..."}
                </div>
              </div>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}