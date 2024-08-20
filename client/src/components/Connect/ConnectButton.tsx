import toast from 'react-hot-toast';
import { Link } from "react-router-dom";

import { F } from "../../lib/helpers";
import { useUserStore, useWalletStore } from "../../lib/states";

export default function ConnectButton() {
    const user = useUserStore(s => s.user);
    const wallet = useWalletStore(s => s.wallet);
    const handler = useWalletStore(s => s.handler);
    const loading = useWalletStore(s => s.loading);
    const setWallet = useWalletStore(s => s.setWallet);

    async function connect(): Promise<any> {
        if (wallet) return;
        if (!handler) return toast.error("Please install MetaMask extension.");

        const wallet_ = await handler.connect();
        if (!wallet_) return toast.error("An error has been occured while connecting your wallet");

        // Get signature
        let signature, message = `Welcome to Payrock, ${wallet_} - The Cross-Chain Payment Gateway`;
        try {
            signature = await handler.signMessage(message);
            if (!signature) return toast.error("You have to sign the message in order to sign in");
        } catch (e) {
            return toast.error("You have to sign the message in order to sign in");
        }

        console.log(signature);

        // Validate signature
        const validated = await F({
            endpoint: "/auth/validate-signature",
            method: "POST",
            body: {
                wallet: wallet_,
                signature,
                message
            }
        });

        if (validated) setWallet(wallet_);
        else toast.error("Your signature cannot be validated, please try again");
    }

    if (loading) return <></>;

    if (!handler) (
        <a className="dark" href="https://metamask.io/" target='_blank'>
            Install MetaMask
        </a>
    )

    return (
        <>
            {(user && wallet) ? (
                <Link className="dark" to="/dashboard">
                    Dashboard
                </Link>
            ) : (
                <button className="dark" onClick={connect}>
                    Connect Wallet
                </button>
            )}
        </>
    );
}
