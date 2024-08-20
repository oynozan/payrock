/**
 * Global state management
 */

import { create } from "zustand";
import type { IWallet } from './wallet';
import type { Networks } from './networks';

export type TNetwork = (keyof typeof Networks);

interface IWalletStore {
    loading: boolean;
    wallet: string | null;
    handler: IWallet | null;
    setWallet: (w: string) => void;
    setHandler: (h: IWallet) => void;
    setLoading: (l: boolean) => void;
}

export const useWalletStore = create<IWalletStore>(set => ({
    loading: true,
    wallet: null,
    handler: null,
    setWallet: wallet => set(() => ({ wallet })),
    setHandler: handler => set(() => ({ handler })),
    setLoading: loading => set(() => ({ loading })),
}));

interface IZrWallet {
    owner: string;
    address: string;
    network: TNetwork;
    date: Date;
}

interface IWalletsStore {
    wallets: Array<IZrWallet>;
    setWallets: (wallets: Array<IZrWallet>) => void;
}

export const useWalletsStore = create<IWalletsStore>(set => ({
    wallets: [],
    setWallets: wallets => set(() => ({ wallets })),
}));

interface IUser {
    wallet: string;
    accessToken: string;
}

interface IUserStore {
    user: IUser | null;
    setUser: (user: IUser | null) => void;
}

export const useUserStore = create<IUserStore>(set => ({
    user: null,
    setUser: user => set(() => ({ user })),
}));

interface ISettings {
    wallet: string;
    domain?: string;
    network?: string;
    redirectURL?: string;
    addFeeAsExtraPayment: boolean;
}

interface ISettingsStore {
    settings: ISettings | null;
    setSettings: (settings: ISettings | null) => void;
}

export const useSettingsStore = create<ISettingsStore>(set => ({
    settings: null,
    setSettings: settings => set(() => ({ settings }))
}));