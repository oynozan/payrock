import { useEffect, useState } from 'react';
import { Link, useLocation } from "react-router-dom";

import { GoGear } from "react-icons/go";
import { SlLogout } from "react-icons/sl";
import { FaServer } from "react-icons/fa6";
import { BsGraphUp, BsWalletFill } from "react-icons/bs";

import { F } from "../../lib/helpers";

import "./sidebar.scss";

export default function Sidebar() {
    const location = useLocation();

    const [active, setActive] = useState("/");

    async function logout() {
        await F({
            endpoint: "/auth/logout",
            method: "GET",
        });

        window.location.href = "/";
    }

    useEffect(() => {
        if (location.pathname === "/dashboard/") setActive("/");
        else setActive(location.pathname.split("/").at(-1)!);
    }, [location.pathname])

    return (
        <div className="sidebar">
            <img src="/logo.svg" alt="Payrock Logo" />

            <div className="links">
                <Link to="/dashboard/" className={active === "/" ? "active" : undefined}>
                    <BsGraphUp /> Earnings
                </Link>
                <Link to="/dashboard/wallets" className={active === "wallets" ? "active" : undefined}>
                    <BsWalletFill /> Wallets
                </Link>
                <Link to="/dashboard/api" className={active === "api" ? "active" : undefined}>
                    <FaServer /> API
                </Link>
                <Link to="/dashboard/settings" className={active === "settings" ? "active" : undefined}>
                    <GoGear /> Settings
                </Link>
            </div>

            <div className="actions">
                <button className="blank" onClick={logout}>
                    <SlLogout /> Log out
                </button>
            </div>
        </div>
    );
}
