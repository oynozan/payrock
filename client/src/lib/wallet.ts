import { ethers, formatEther } from "ethers";

import { Networks } from './networks';
import { withTimeout } from "./helpers";
import type { TNetwork } from "./states";

export interface IWallet {
    wallet?: string;
    network: TNetwork;

    connect(detectNetwork?: Boolean): Promise<string | void>;
    accounts(): Promise<Array<string> | null>;
    signMessage(message: string | Uint8Array): Promise<string>;
    sendTransaction(to: string, value: string, message?: string): Promise<string>;
    getBalance(): Promise<string>;
    detectNetwork(network: TNetwork): Promise<void>;
}

interface INetwork {
    chainId: string;
    chainName: string;
    nativeCurrency: {
        name: string;
        symbol: string;
        decimals: number;
    };
    rpcUrls?: string[];
    blockExplorerUrls?: string[];
}

export class Wallet implements IWallet {
    private signer: ethers.JsonRpcSigner | undefined;
    private provider: ethers.BrowserProvider | undefined;
    private jprovider: ethers.JsonRpcApiProvider | undefined;

    public wallet?: string;
    public network: TNetwork = "Ethereum Sepolia";

    constructor() {
        if ((window as any).ethereum) {
            this.provider = new ethers.BrowserProvider((window as any).ethereum);
        } else {
            throw new Error("MetaMask is not installed");
        }
    }

    async accounts() {
        const accountsResponse = await this.provider!.send("eth_accounts", []);
        if (accountsResponse?.length) return accountsResponse;
        return null;
    }

    async connect(detectNetwork = false) {
        if (!this.provider) {
            throw new Error("Provider not initialized");
        }

        try {
            if (detectNetwork) await this.detectNetwork(this.network);

            const accounts = await this.provider.send("eth_requestAccounts", []);
            console.log("Accounts:", accounts);

            this.wallet = accounts?.[0];
            if (!this.wallet) throw new Error("No account.");

            this.signer = await this.provider.getSigner(this.wallet);

            return this.wallet;
        } catch (error) {
            console.error("Failed to connect to MetaMask:", error);
            throw error;
        }
    }

    async signMessage(message: string | Uint8Array): Promise<string> {
        if (!this.provider) {
            throw new Error("Provider not initialized");
        }

        try {
            const signature = await this.provider.send("personal_sign", [message, this.wallet]);
            return signature;
        } catch (error) {
            console.error("Failed to sign message:", error);
            throw error;
        }
    }

    async sendTransaction(to: string, value: string, message?: string) {
        try {
            if (!this.wallet || !this.provider || !this.jprovider) throw Error("Connect your wallet");

            const nonce = await this.jprovider.getTransactionCount(this.wallet);

            const tx: any = {
                to,
                nonce,
                value,
            };

            if (message) tx["data"] = ethers.toUtf8Bytes(message);

            // Send transaction
            console.log("Transaction:", tx);
            const txResponse = await this.signer?.sendTransaction(tx);
            console.log("Transaction Response:", txResponse);

            // Wait until transaction is mined
            // const receipt = await txResponse?.wait();

            return txResponse?.hash ?? "";
        } catch (error) {
            console.error("Failed to send the transaction:", error);
            throw error;
        }
    }

    async getBalance() {
        if (!this.wallet || !this.jprovider) throw new Error("Connect your wallet");
        const balance = await withTimeout(this.jprovider.getBalance(this.wallet), 10_000);
        return formatEther(balance);
    }

    // Network management
    protected async switchNetwork(network: INetwork) {
        if (!this.provider) {
            throw new Error("Provider not initialized");
        }

        try {
            try {
                await (window as any).ethereum.request({
                    method: "wallet_switchEthereumChain",
                    params: [{ chainId: network.chainId }],
                });
            } catch (switchError: any) {
                if (switchError.code === 4902) {
                    await (window as any).ethereum.request({
                        method: "wallet_addEthereumChain",
                        params: [network],
                    });

                    await (window as any).ethereum.request({
                        method: "wallet_switchEthereumChain",
                        params: [{ chainId: network.chainId }],
                    });
                } else {
                    throw switchError;
                }
            }

            this.jprovider = new ethers.JsonRpcProvider(network!.rpcUrls![0]);
        } catch (e) {
            console.error("Failed to switch network:", e);
            throw e;
        }

        this.network = network.chainName as keyof typeof Networks;
    }

    async detectNetwork(network: TNetwork) {
        for (let definedNetwork of Object.keys(Networks)) {
            if (definedNetwork === network) {
                await this.switchNetwork({
                    chainId: Networks[definedNetwork].chain,
                    chainName: definedNetwork,
                    nativeCurrency: Networks[definedNetwork].currency,
                    blockExplorerUrls: [Networks[definedNetwork].explorer],
                    rpcUrls: [Networks[definedNetwork].rpc],
                });
                break;
            }
        }
        return;
    }
}
