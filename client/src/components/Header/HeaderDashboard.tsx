import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

import { useWalletStore } from "../../lib/states";
import { truncateWalletAddress } from "../../lib/helpers";

import "./header.scss";

export default function HeaderDashboard() {
    const location = useLocation();

    const wallet = useWalletStore(s => s.wallet);
    const handler = useWalletStore(s => s.handler);

    const [active, setActive] = useState("Earnings");

    useEffect(() => {
        if (location.pathname === "/dashboard/") setActive("Earnings");
        else setActive(location.pathname.split("/").at(-1)!);
    }, [location.pathname]);

    if (!wallet || !handler) return <></>;

    return (
        <header className="header-dashboard">
            <h2>{active}</h2>
            <div className="network">
                <p>{handler.network}</p>
                <span>{truncateWalletAddress(wallet)}</span>
            </div>
        </header>
    );
}
