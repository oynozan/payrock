import toast from "react-hot-toast";
import { useEffect, useState } from "react";

import { BsChevronDown } from "react-icons/bs";

import { F } from "../../../lib/helpers";
import { Networks } from "../../../lib/networks";
import Selection from "../../../components/Selection";
import { useSettingsStore, useUserStore, useWalletStore } from "../../../lib/states";

import "./settings.scss";
import Switch from "../../../components/Switch";

export default function Settings() {
    const user = useUserStore(s => s.user);
    const wallet = useWalletStore(s => s.wallet);
    const handler = useWalletStore(s => s.handler);
    const settings = useSettingsStore(s => s.settings);
    const setSettings = useSettingsStore(s => s.setSettings);

    const [networkSelection, setNetworkSelection] = useState(false);

    useEffect(() => {
        if (settings || !user || !wallet) return;

        // Get settings
        (async () => {
            const settings = await F({
                endpoint: "/auth/settings?wallet=" + wallet,
                method: "GET",
            });

            if (settings?.settings) setSettings(settings.settings);
            else toast.error(settings.message);
        })();
    }, [user]);

    async function handleChange(type: string, value?: any) {
        if (!handler) return;

        // Wallet update
        if (type === "network") {
            try {
                await handler.detectNetwork(value);
            } catch(e) {
                console.error(e);
                return;
            }
        }

        // Server update
        let endpoint = "update-";

        switch (type) {
            case "redirectURL":
                endpoint += "redirect";
                break;
            case "addFeeAsExtraPayment":
                endpoint = "change-extra-fee";
                break;
            default:
                endpoint += type;
        }

        const bodyObj: any = { wallet };
        bodyObj[type] = value ?? (settings as any)?.[type];

        F({
            endpoint: "/settings/" + endpoint,
            method: "POST",
            body: bodyObj,
        })
            .then(() => {
                toast.success("Successfully updated");
                setSettings({ ...settings, ...bodyObj });
            })
            .catch(err => {
                toast.error(err.message);
            })
    }

    if (!settings) return null;

    return (
        <div id="settings">
            <div>
                <h5>Domain</h5>
                <p>You can send your API requests only from this domain.</p>

                <div className="actions">
                    <input
                        placeholder="localhost"
                        defaultValue={settings?.domain ?? undefined}
                        onChange={e => setSettings({ ...settings, domain: e.target.value })}
                    />
                    <button className="dark" disabled={!settings?.domain} onClick={() => handleChange("domain")}>
                        Save
                    </button>
                </div>
            </div>

            <div>
                <h5>Redirect URL</h5>
                <p>Users will be redirected to this address after a successful payment.</p>

                <div className="actions">
                    <input
                        placeholder="https://example.com/success"
                        defaultValue={settings?.redirectURL ?? undefined}
                        onChange={e => setSettings({ ...settings, redirectURL: e.target.value })}
                    />
                    <button
                        className="dark"
                        disabled={!settings?.redirectURL}
                        onClick={() => handleChange("redirectURL")}
                    >
                        Save
                    </button>
                </div>
            </div>

            <div>
                <h5>Target Network</h5>
                <p>In which network you want to receive your assets?</p>

                <div className="selection-container">
                    <button
                        onClick={() => {
                            setNetworkSelection(true);
                        }}
                    >
                        {settings?.network ? <b>{settings.network}</b> : <span>Select an Network</span>}
                        <BsChevronDown className="down-arrow" size={14} />
                    </button>
                    <div>
                        <Selection
                            visible={networkSelection}
                            setVisible={setNetworkSelection}
                            items={Object.keys(Networks)}
                            click={e => {
                                handleChange("network", e.target.innerText);
                            }}
                            active={settings?.network || ""}
                            position="left"
                        />
                    </div>
                </div>
            </div>

            {/*
                // TODO: That's a cool feature, make it active in next update
                <div>
                    <h5>Extra Fees for Users</h5>
                    <p>
                        Do you want to make users pay for network fees? This will charge the users with additional payments
                        while reducing your payment cuts.
                    </p>

                    <Switch
                        set={(s: boolean) => handleChange("addFeeAsExtraPayment", s)}
                        status={settings.addFeeAsExtraPayment}
                    />
                </div>
            */}
        </div>
    );
}
