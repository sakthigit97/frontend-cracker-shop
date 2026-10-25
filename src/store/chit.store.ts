import { create } from "zustand";
import {
    listAdminChits,
    listAvailableChits,
    listChitMembers,
    listMyChits,
} from "../services/chit.api";
import type { ChitMember, ChitScheme, MyChit } from "../types/chit";

const CACHE_TTL = 60 * 1000;

interface CachedValue<T> {
    value: T;
    fetchedAt: number;
}

interface ChitStore {
    availableChits: ChitScheme[];
    myChits: MyChit[];
    adminChits: ChitScheme[];
    membersByChitId: Record<string, { scheme: ChitScheme; members: ChitMember[] }>;
    customerFetchedAt: number | null;
    adminFetchedAt: number | null;
    membersFetchedAt: Record<string, number>;
    loading: {
        customer: boolean;
        admin: boolean;
        members: Record<string, boolean>;
    };
    fetchCustomerData: (force?: boolean) => Promise<void>;
    fetchAdminChits: (force?: boolean) => Promise<ChitScheme[]>;
    fetchChitMembers: (
        chitId: string,
        force?: boolean
    ) => Promise<{ scheme: ChitScheme; members: ChitMember[] }>;
    clear: () => void;
}

export const useChitStore = create<ChitStore>((set, get) => {
    let generation = 0;
    const requests = new Map<string, Promise<unknown>>();

    const isFresh = (fetchedAt: number | null) =>
        fetchedAt !== null && Date.now() - fetchedAt < CACHE_TTL;

    const runRequest = <T,>(
        key: string,
        force: boolean,
        cached: CachedValue<T> | null,
        load: () => Promise<T>,
        onLoading: (loading: boolean) => void,
        onSuccess: (value: T, fetchedAt: number) => void
    ): Promise<T> => {
        if (!force && cached && isFresh(cached.fetchedAt)) {
            return Promise.resolve(cached.value);
        }

        const inFlight = requests.get(key) as Promise<T> | undefined;
        if (inFlight) return inFlight;

        const requestGeneration = generation;
        if (!cached) onLoading(true);

        const request = load()
            .then((value) => {
                if (requestGeneration === generation) {
                    onSuccess(value, Date.now());
                }
                return value;
            })
            .finally(() => {
                if (requestGeneration === generation) {
                    onLoading(false);
                    requests.delete(key);
                }
            });

        requests.set(key, request);
        return request;
    };

    return {
        availableChits: [],
        myChits: [],
        adminChits: [],
        membersByChitId: {},
        customerFetchedAt: null,
        adminFetchedAt: null,
        membersFetchedAt: {},
        loading: {
            customer: false,
            admin: false,
            members: {},
        },
        fetchCustomerData: async (force = false) => {
            const state = get();
            const cached =
                state.customerFetchedAt === null
                    ? null
                    : {
                        value: {
                            availableChits: state.availableChits,
                            myChits: state.myChits,
                        },
                        fetchedAt: state.customerFetchedAt,
                    };

            await runRequest(
                "customer",
                force,
                cached,
                async () => {
                    const [availableChits, myChits] = await Promise.all([
                        listAvailableChits(),
                        listMyChits(),
                    ]);
                    return { availableChits, myChits };
                },
                (customer) =>
                    set((current) => ({
                        loading: { ...current.loading, customer },
                    })),
                (value, fetchedAt) =>
                    set({
                        availableChits: value.availableChits,
                        myChits: value.myChits,
                        customerFetchedAt: fetchedAt,
                    })
            );
        },
        fetchAdminChits: (force = false) => {
            const state = get();
            const cached: CachedValue<ChitScheme[]> | null =
                state.adminFetchedAt === null
                    ? null
                    : {
                        value: state.adminChits,
                        fetchedAt: state.adminFetchedAt,
                    };

            return runRequest(
                "admin",
                force,
                cached,
                listAdminChits,
                (admin) =>
                    set((current) => ({
                        loading: { ...current.loading, admin },
                    })),
                (adminChits, adminFetchedAt) =>
                    set({ adminChits, adminFetchedAt })
            );
        },
        fetchChitMembers: (chitId, force = false) => {
            const state = get();
            const cachedValue = state.membersByChitId[chitId];
            const fetchedAt = state.membersFetchedAt[chitId] ?? null;
            const cached: CachedValue<{
                scheme: ChitScheme;
                members: ChitMember[];
            }> | null =
                cachedValue && fetchedAt !== null
                    ? { value: cachedValue, fetchedAt }
                    : null;

            return runRequest(
                `members:${chitId}`,
                force,
                cached,
                () => listChitMembers(chitId),
                (membersLoading) =>
                    set((current) => ({
                        loading: {
                            ...current.loading,
                            members: {
                                ...current.loading.members,
                                [chitId]: membersLoading,
                            },
                        },
                    })),
                (value, membersFetchedAt) =>
                    set((current) => ({
                        membersByChitId: {
                            ...current.membersByChitId,
                            [chitId]: value,
                        },
                        membersFetchedAt: {
                            ...current.membersFetchedAt,
                            [chitId]: membersFetchedAt,
                        },
                    }))
            );
        },
        clear: () => {
            generation += 1;
            requests.clear();
            set({
                availableChits: [],
                myChits: [],
                adminChits: [],
                membersByChitId: {},
                customerFetchedAt: null,
                adminFetchedAt: null,
                membersFetchedAt: {},
                loading: {
                    customer: false,
                    admin: false,
                    members: {},
                },
            });
        },
    };
});
