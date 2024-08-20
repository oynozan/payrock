"use client";

import { useEffect, useRef, useState } from "react";

import { HiMiniMagnifyingGlass } from "react-icons/hi2";

import { useOutsideClick } from "../../hooks/useOutsideClick";

import "./selection.scss";

function Item({
    item,
    set,
    click,
}: {
    item: string;
    set: React.Dispatch<React.SetStateAction<boolean>>;
    click: (e: any) => void;
}) {
    return (
        <div
            className="item"
            onClick={(e: any) => {
                click(e);
                set(false);
            }}
        >
            {item}
        </div>
    );
}

export default function Selection({
    items,
    click,
    visible,
    setVisible,
    customCSS = {},
    active,
    position = "right",
}: {
    items: Array<string>;
    click: (e: any, index?: number) => void;
    visible: boolean;
    setVisible: React.Dispatch<React.SetStateAction<boolean>>;
    customCSS?: any;
    active?: string;
    position?: "left" | "right";
}) {
    const wrapperRef = useRef(null);

    const [filter, setFilter] = useState("");
    const [empty, setEmpty] = useState(true);

    useOutsideClick(wrapperRef, () => setVisible(false));

    useEffect(() => {
        let is = true;
        for (let data of items) {
            if (data?.toLocaleLowerCase()?.includes(filter?.toLocaleLowerCase())) {
                is = false;
                break;
            }
        }
        setEmpty(is);
    }, [filter, items]);

    if (!visible) return <></>;
    return (
        <div className={"selection " + position} ref={wrapperRef} style={customCSS?.["main"]}>
            <div className="top">
                <div className="icon">
                    <HiMiniMagnifyingGlass />
                </div>
                <input autoFocus onChange={e => setFilter(e.target.value)} />
            </div>
            <div className="body" style={customCSS?.["body"]}>
                {filter &&
                    items.map((item, i) => {
                        let itemLower = item?.toLocaleLowerCase(),
                            filterLower = filter?.toLocaleLowerCase();

                        if (itemLower.startsWith(filterLower))
                            return (
                                <Item
                                    key={i}
                                    item={item}
                                    set={setVisible}
                                    click={e => {
                                        setFilter("");
                                        click(e, i);
                                    }}
                                />
                            );

                        return <></>;
                    })}

                {items.map((item, i) => {
                    let itemLower = item?.toLocaleLowerCase(),
                        filterLower = filter?.toLocaleLowerCase();

                    if (!filter || (itemLower.includes(filterLower) && !itemLower.startsWith(filterLower)))
                        return (
                            <Item
                                key={i}
                                item={item}
                                set={setVisible}
                                click={e => {
                                    click(e, i);
                                }}
                            />
                        );
                    return <></>;
                })}
                {empty && <span id="empty">No data found</span>}
            </div>
        </div>
    );
}
