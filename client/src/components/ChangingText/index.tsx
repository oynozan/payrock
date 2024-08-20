import { useState, useEffect } from "react";

import "./changing-text.scss";

export default function ChangingText() {
    const texts = [
        "Cross-Chain",
        "P2P",
        "Web3",
    ];

    const [currentIndex, setCurrentIndex] = useState(0);
    const [animationClass, setAnimationClass] = useState("");

    useEffect(() => {
        const interval = setInterval(() => {
            setAnimationClass("slide-up");
            setTimeout(() => {
                setCurrentIndex(prevIndex => (prevIndex + 1) % texts.length);
                setAnimationClass("slide-down");
            }, 500);
        }, 5000);

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="changing-text">
            <div className={`text ${animationClass}`}>{texts[currentIndex]}</div>
        </div>
    );
}
