import toast from "react-hot-toast";
import { useEffect, useState } from "react";

import { F } from "../../lib/helpers";
import { Wallet } from "../../lib/wallet";
import { useSettingsStore, useUserStore, useWalletStore } from "../../lib/states";

const RETRY_LIMIT = 5;

export default function Connect() {
    const wallet = useWalletStore(s => s.wallet);
    const setUser = useUserStore(s => s.setUser);
    const handler = useWalletStore(s => s.handler);
    const setWallet = useWalletStore(s => s.setWallet);
    const setHandler = useWalletStore(s => s.setHandler);
    const setLoading = useWalletStore(s => s.setLoading);
    const setSettings = useSettingsStore(s => s.setSettings);

    const [readyToConnect, setReadyToConnect] = useState(false);
    const [retryUserLogin, setRetryUserLogin] = useState(false);

    useEffect(() => {
        try {
            const walletHandler = new Wallet();
            setHandler(walletHandler);
            setLoading(true);
        } catch (e) {
            console.error(e);
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (!handler) return;

        const finalize = () => {
            clearInterval(interval);
        };

        let counter = 0;
        const interval = setInterval(async () => {
            counter++;

            if (counter >= RETRY_LIMIT) {
                clearInterval(interval);
                setLoading(false);
                return;
            }

            try {
                const accounts = await handler.accounts();
                if (accounts) setReadyToConnect(true);
                else setLoading(false);
            } catch (e) {
                console.error(e);
                setLoading(false);
            }

            finalize();
        }, 500);
    }, [handler]);

    useEffect(() => {
        if (!readyToConnect) return;

        (async () => {
            let wallet_ = await handler!.connect();
            if (!wallet_) return;

            setWallet(wallet_);
        })();
    }, [readyToConnect]);

    useEffect(() => {
        if (wallet && handler) {
            const handleUser = async (): Promise<any> => {
                try {
                    setLoading(true);

                    const user = await F({
                        endpoint: "/auth/?wallet=" + wallet,
                        method: "GET",
                    });
                    const settings = await F({
                        endpoint: "/auth/settings?wallet=" + wallet,
                        method: "GET",
                    });

                    // User is logged in
                    if (user?.user) setUser(user.user);
                    else return;

                    setSettings(settings.settings);
                    await handler.detectNetwork(settings.settings.network);
                } catch (e) {
                    // Even tho there's a connected wallet, user is not signed in
                    setUser(null);

                    // Ask for signing
                    let signature,
                        message = `Welcome to Payrock, ${wallet} - The Cross-Chain Payment Gateway`;
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
                            wallet,
                            signature,
                            message,
                        },
                    });

                    if (validated?.status !== false) setRetryUserLogin(s => !s);
                    else toast.error(validated.message);
                }
            };

            (async () => {
                await handleUser();
                setLoading(false);
            })();
        }
    }, [wallet, retryUserLogin]);

    return null;
}
