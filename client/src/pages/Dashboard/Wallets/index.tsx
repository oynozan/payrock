import toast from "react-hot-toast";
import { useEffect, useState } from "react";

import { F } from "../../../lib/helpers";
import { useUserStore, useWalletsStore, useWalletStore } from "../../../lib/states";

import "./wallets.scss";
import { Networks } from "../../../lib/networks";

export default function Wallets() {
    const user = useUserStore(s => s.user);
    const wallet = useWalletStore(s => s.wallet);
    const handler = useWalletStore(s => s.handler);
    const wallets = useWalletsStore(s => s.wallets);
    const setWallets = useWalletsStore(s => s.setWallets);

    useEffect(() => {
        if (wallets.length || !user || !wallet || !handler) return;

        // Get wallets
        (async () => {
            const wallets = await F({
                endpoint: `/payment/wallets?network=${handler.network}&wallet=${wallet}`,
                method: "GET",
            });

            if (wallets?.wallets) setWallets(wallets.wallets);
            else toast.error(wallets.message);
        })();
    }, [user]);

    async function createWallet() {
        if (!handler) return;

        // Get fee
        let fee: number = 0;
        try {
            const response = await F({
                endpoint: `/payment/basic-fee?network=${handler.network}&wallet=${wallet}`,
                method: "GET",
            });
            fee = response.fee;
        } catch (e) {
            console.error(e);
            toast.error("An error occured while getting fee amount");
            return;
        }

        if (!fee) return;

        // Send fee cost to main wallet of current network
        let tx;
        try {
            tx = await handler.sendTransaction(
                Networks[handler.network].wallet,
                (fee * 3).toString(),
                `Creating a ${handler.network} wallet for ${wallet}`
            );
        } catch (e) {
            console.log(e);
            if (e.toString().includes("insufficient funds")) {
                toast.error("Insufficent funds");
            } else {
                toast.error("An error occured while sending transaction request");
            }
            return;
        }

        if (!tx) {
            toast.error("Transaction has failed");
            return;
        }

        toast("Validating the transaction...", {
            duration: 999999
        });

        // Create wallet
        try {
            const response = await F({
                endpoint: "/payment/create-wallet",
                method: "POST",
                body: {
                    tx,
                    wallet,
                    network: handler.network,
                },
            });

            setWallets([
                response.wallet,
                ...wallets,
            ]);

            toast.dismiss();
            toast.success("New wallet is successfully created");
        } catch (e) {
            console.error(e);
            toast.dismiss();
            toast.error(e?.message || "Transaction cannot be validated");
        }
    }

    return (
        <div id="wallets">
            <div className="top">
                <p>
                    You have <b>{wallets.length}</b> wallets
                </p>
                <button className="dark" onClick={createWallet}>
                    Create Wallet
                </button>
            </div>
            {!wallets.length ? (
                <p className="error">
                    You don&apos;t have any wallets. In order to receive payments, you must create one.
                </p>
            ) : (
                <div className="list">
                    <h5>Wallets</h5>
                    {wallets.map((wallet, i) => {
                        return (
                            <div key={i} className="wallet">
                                <p>{wallet.address}</p>
                                <div className="details">
                                    <span><b>{wallet.network}</b> - {new Date(wallet.date).toLocaleString()}</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
