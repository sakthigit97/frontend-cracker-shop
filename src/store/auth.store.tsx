import { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";
import { jwtDecode } from "jwt-decode";

import { useCartSync } from "../hooks/useCartSync";
import { mergeCartApi, getCartApi } from "../services/cart.api";
import { cartStore } from "./cart.store";
import { useCartStorageSync } from "../hooks/useCartStorageSync";
import { useOrdersStore } from "./orders.store";
export type UserRole = "USER" | "ADMIN";
import { useConfigStore } from "../store/config.store";

interface AuthUser {
  userId: string;
  role: UserRole;
  token: string;
}

interface DecodedToken {
  exp: number;
}

interface AuthContextType {
  user: AuthUser | null;
  login: (data: AuthUser) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);
export function AuthProvider({ children }: { children: ReactNode }) {
  const loadConfig = useConfigStore((s) => s.loadConfig);
  const clearConfig = useConfigStore((s) => s.clearConfig);
  const [user, setUser] = useState<AuthUser | null>(() => {
    const stored = localStorage.getItem("auth");
    if (!stored) return null;

    try {
      const parsed: AuthUser = JSON.parse(stored);
      const decoded: DecodedToken = jwtDecode(parsed.token);
      if (decoded.exp * 1000 <= Date.now()) {
        localStorage.removeItem("auth");
        return null;
      }

      return parsed;
    } catch {
      localStorage.removeItem("auth");
      return null;
    }
  });

  useCartSync(!!user);
  useCartStorageSync();

  const logout = () => {
    localStorage.removeItem("auth");
    setUser(null);
    cartStore.getState().resetToGuest();
    cartStore.getState().unlock();
    useOrdersStore.getState().clear();
    clearConfig();
  };

  useEffect(() => {
    if (!user) return;

    let idleTimer: ReturnType<typeof setTimeout>;
    const resetIdleTimer = () => {
      clearTimeout(idleTimer);

      idleTimer = setTimeout(() => {
        console.log("Logging out due to inactivity...");
        logout();
      }, 20 * 60 * 1000);
    };

    const events = ["mousemove", "keydown", "click", "scroll"];
    events.forEach((event) => {
      window.addEventListener(event, resetIdleTimer);
    });

    resetIdleTimer();

    return () => {
      clearTimeout(idleTimer);
      events.forEach((event) => {
        window.removeEventListener(event, resetIdleTimer);
      });
    };
  }, [user]);

  useEffect(() => {
     loadConfig();
    if (!user) return;

    const interval = setInterval(() => {
      try {
        const decoded: DecodedToken = jwtDecode(user.token);

        if (decoded.exp * 1000 <= Date.now()) {
          console.log("Token expired, logging out...");
          logout();
        }
      } catch {
        logout();
      }
    }, 60 * 1000);

    return () => clearInterval(interval);
  }, [user]);

  const login = async (data: AuthUser) => {
    localStorage.setItem("auth", JSON.stringify(data));
    setUser(data);

    const { items, clear } = cartStore.getState();
    if (Object.keys(items).length > 0) {
      await mergeCartApi({ guestItems: items });
    }
    clear();
    localStorage.removeItem("guest_cart");

    const cartRes = await getCartApi();
    const normalized: Record<string, number> = {};
    for (const row of cartRes.items) {
      normalized[row.itemId] = row.quantity;
    }

    cartStore.getState().hydrate(normalized);
    await loadConfig();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);

  if (!ctx) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return ctx;
}