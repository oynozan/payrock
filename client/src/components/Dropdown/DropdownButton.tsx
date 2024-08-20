"use client";

import { type ReactElement, useState } from "react";

import Dropdown from "./index";

import "./dropdown.scss";

export default function DropdownButton({
    click = () => {},
    custom,
    items,
    children,
}: {
    click: () => void;
    type: string;
    custom: object;
    items: Array<ReactElement>;
    children: React.ReactNode;
}) {
    const [state, setState] = useState<Boolean>(false);

    return (
        <div className="dropdown-wrapper">
            <button
                className="dark"
                style={custom}
                onClick={() => {
                    click();
                    setState(!state);
                }}
            >
                {children}
            </button>

            {state && <Dropdown items={items} set={setState} />}
        </div>
    );
}
