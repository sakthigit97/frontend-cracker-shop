import { create } from "zustand";
import { apiFetch } from "../services/api";

type ProfileData = {
    name: string;
    mobile: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
    walletCredit?: number;
    referralCode?: string;
};

interface ProfileState {
    profile: ProfileData | null;
    loading: boolean;
    loadProfile: () => Promise<void>;
    refreshProfile: () => Promise<void>;
    clearProfile: () => void;
}

const CACHE_KEY = "profile";
const CACHE_TIME_KEY = "profile_time";
const CACHE_TTL = 5 * 60 * 1000;

const safeParse = (value: string | null): ProfileData | null => {
    try {
        return value ? JSON.parse(value) : null;
    } catch {
        return null;
    }
};

export const useProfileStore = create<ProfileState>((set, get) => ({
    profile: safeParse(localStorage.getItem(CACHE_KEY)),
    loading: false,
    loadProfile: async () => {
        const cached = get().profile;
        const cachedTime = localStorage.getItem(CACHE_TIME_KEY);

        const isCacheValid =
            cached &&
            cachedTime &&
            Date.now() - Number(cachedTime) < CACHE_TTL;
        if (isCacheValid) {
            get().refreshProfile();
            return;
        }

        if (get().loading) return;
        set({ loading: true });

        try {
            const res = await apiFetch("/user/profile");

            set({ profile: res.data });

            localStorage.setItem(CACHE_KEY, JSON.stringify(res.data));
            localStorage.setItem(CACHE_TIME_KEY, Date.now().toString());
        } catch (err) {
            console.error("Profile load failed", err);
        } finally {
            set({ loading: false });
        }
    },

    refreshProfile: async () => {
        if (get().loading) return;
        set({ loading: true });
        try {
            const res = await apiFetch("/user/profile");
            set({ profile: res.data });
            localStorage.setItem(CACHE_KEY, JSON.stringify(res.data));
            localStorage.setItem(CACHE_TIME_KEY, Date.now().toString());
        } catch (err) {
            console.error("Profile refresh failed", err);
        } finally {
            set({ loading: false });
        }
    },
    clearProfile: () => {
        set({ profile: null });
        localStorage.removeItem(CACHE_KEY);
        localStorage.removeItem(CACHE_TIME_KEY);
    },
}));

if (typeof window !== "undefined") {
    window.addEventListener("storage", (e) => {
        if (e.key === CACHE_KEY) {
            try {
                const updated = e.newValue ? JSON.parse(e.newValue) : null;
                useProfileStore.setState({ profile: updated });
            } catch {
                useProfileStore.setState({ profile: null });
            }
        }
    });
}