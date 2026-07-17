import { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
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
  name: string;
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

  const logout = useCallback(() => {
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
      idleTimerRef.current = null;
    }

    if (tokenTimerRef.current) {
      clearTimeout(tokenTimerRef.current);
      tokenTimerRef.current = null;
    }

    localStorage.removeItem("auth");
    sessionStorage.removeItem("cartAlertShown");

    setUser(null);
    cartStore.getState().resetToGuest();
    cartStore.getState().unlock();
    useOrdersStore.getState().clear();

    clearConfig();
  }, [clearConfig]);

  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tokenTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!user) return;

    const resetIdleTimer = () => {
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current);
      }

      idleTimerRef.current = setTimeout(() => {
        console.log("Logging out due to inactivity...");
        logout();
      }, 20 * 60 * 1000);
    };

    const events = [
      "mousemove",
      "mousedown",
      "keydown",
      "scroll",
      "touchstart",
      "pointerdown"
    ];
    events.forEach((event) => {
      window.addEventListener(event, resetIdleTimer, { passive: true });
    });

    resetIdleTimer();

    return () => {
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current);
      }

      events.forEach((event) => {
        window.removeEventListener(event, resetIdleTimer);
      });
    };
  }, [user, logout]);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);


  useEffect(() => {
    if (!user) return;

    try {
      const decoded: DecodedToken = jwtDecode(user.token);

      const expiresAt = decoded.exp * 1000;
      const timeout = expiresAt - Date.now();

      if (tokenTimerRef.current) {
        clearTimeout(tokenTimerRef.current);
      }

      if (timeout <= 0) {
        logout();
        return;
      }

      tokenTimerRef.current = setTimeout(() => {
        console.log("JWT expired. Logging out...");
        logout();
      }, timeout);

    } catch {
      logout();
    }

    return () => {
      if (tokenTimerRef.current) {
        clearTimeout(tokenTimerRef.current);
      }
    };
  }, [user, logout]);

  const login = async (data: AuthUser) => {
    localStorage.setItem("auth", JSON.stringify(data));
    setUser(data);

    try {
      const { items, clear } = cartStore.getState();

      if (Object.keys(items).length > 0 && data.role !== "ADMIN") {
        await mergeCartApi({ guestItems: items });
      }

      clear();
      localStorage.removeItem("guest_cart");

      if (data.role !== "ADMIN") {
        const cartRes = await getCartApi();

        const normalized: Record<string, number> = {};

        for (const row of cartRes.items) {
          normalized[row.itemId] = row.quantity;
        }

        cartStore.getState().hydrate(normalized);
      }

    } catch (err) {
      console.error("Cart sync failed:", err);
    }

    try {
      await loadConfig();
    } catch (err) {
      console.error("Failed to load config:", err);
    }
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