import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

import { BsChevronDown } from "react-icons/bs";

import { Networks } from "../../lib/networks";
import Selection from "../../components/Selection";
import { F, secondsToMMSS } from "../../lib/helpers";

import "./pay.scss";
import toast from 'react-hot-toast';

export default function Pay() {
    const location = useLocation();

    const [coinAmount, setCoinAmount] = useState(0);
    const [counter, setCounter] = useState(-1);
    const [step, setStep] = useState(1);

    const [id, setID] = useState<string | null>(null);
    const [response, setResponse] = useState<any>(null);
    const [error, setError] = useState("");

    const [networkSelection, setNetworkSelection] = useState(false);

    // Get payment details
    useEffect(() => {
        const ID = location.pathname.split("/")[location.pathname.split("/").length - 1];

        if (!ID) {
            setError("Invalid payment ID");
            return;
        }

        setID(ID);

        (async () => {
            try {
                const response = await F({
                    endpoint: "/payment/payment-details?id=" + ID,
                    method: "GET",
                });

                setResponse(response);

                if (response?.status === "timeout") {
                    setError("Payment timed out");
                    return;
                }

                if (response?.redirect) {
                    window.location.href = response.redirect;
                }

                if (response?.network) {
                    setStep(2);
                }
            } catch (e) {
                console.error(e);
                setError("Cannot get payment details");
            }
        })();
    }, []);

    // Timer
    useEffect(() => {
        if (!response) return;

        const interval = setInterval(() => {
            const next = Math.ceil((new Date(response.deadlineDate).getTime() - Date.now()) / 1000);
            setCounter(next);

            if (next <= 0) {
                clearInterval(interval);
                setError("Payment timed out");
                return;
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [response]);

    // Calculate coin amount to be sent
    useEffect(() => {
        if (!response || response.status !== "pending") return;

        try {
            (async () => {
                const priceResponse = await F({
                    endpoint: "/payment/get-price?network=" + encodeURIComponent(response.network),
                    method: "GET",
                });

                setCoinAmount(response.amount / priceResponse.price);
            })();
        } catch(e) {
            console.error(e);
            setError("Cannot get price data");
        }
    }, [response]);

    // Check new payments
    useEffect(() => {
        if (!response || !id) return;

        const interval = setInterval(async () => {
            toast.loading("Reloading...", {
                duration: 5000
            });

            const rawResponse = await F({
                endpoint: "/payment/payment-details?id=" + id,
                method: "GET",
            });

            if (rawResponse?.status === "partly-paid")
                setResponse({ ...response, status: "partly-paid" });

            if (rawResponse?.redirect)
                window.location.href = rawResponse.redirect;
        }, 30_000);

        return () => clearInterval(interval);
    }, [response]);

    async function changeNetwork(network: string) {
        if (!response || !id) return;

        try {
            const networkResponse = await F({
                endpoint: "/payment/set-network",
                method: "POST",
                body: {
                    id,
                    network,
                },
            });

            setResponse(networkResponse);
            setStep(2);
        } catch (e) {
            console.error(e);
            setError(e?.message ?? "Cannot change the network");
        }
    }

    return (
        <div id="pay">
            <img src="/logo-blue.svg" alt="Logo" className="logo" />
            <div className="container">
                {error ? (
                    <p className="error">{error}</p>
                ) : (
                    <>
                        {!response ? (
                            <div className="loading">
                                <img src="/images/loader.svg" alt="Loading" />
                            </div>
                        ) : (
                            <>
                                {response?.status !== "timeout" && (
                                    <>
                                        <div className="top">
                                            <div className="amount">${response?.amount}</div>
                                            <div className="counter">{counter > 0 && secondsToMMSS(counter)}</div>
                                        </div>

                                        <div className="progress-bar">
                                            <div
                                                className="progress"
                                                style={{ width: `${(counter / 3600) * 100}%` }}
                                            ></div>
                                        </div>

                                        {step === 1 && (
                                            <div className="content">
                                                <p>
                                                    <b>Step 1</b> - Select your network, you can change it during
                                                    payment.
                                                </p>
                                                <div className="network-container">
                                                    <div className="selection-container">
                                                        <button
                                                            onClick={() => {
                                                                setNetworkSelection(true);
                                                            }}
                                                        >
                                                            {response?.network ? (
                                                                response.network
                                                            ) : (
                                                                <span>Select an Network</span>
                                                            )}
                                                            <BsChevronDown className="down-arrow" size={14} />
                                                        </button>
                                                        <div>
                                                            <Selection
                                                                visible={networkSelection}
                                                                setVisible={setNetworkSelection}
                                                                items={response.availableNetworks}
                                                                click={e => {
                                                                    changeNetwork(e.target.innerText);
                                                                }}
                                                                active={response?.network || ""}
                                                                position="left"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {step === 2 && (
                                            <div className="content">
                                                <div className="pay-text">
                                                    Pay <span>{coinAmount?.toFixed(4)}</span>{" "}
                                                    <b>
                                                        {
                                                            Networks[response.network as keyof typeof Networks].currency
                                                                .symbol
                                                        }
                                                    </b>{" "}
                                                    to this address:
                                                </div>

                                                <input
                                                    defaultValue={response?.to}
                                                    readOnly={true}
                                                    className="address"
                                                />

                                                <div className="status">
                                                    <p>Status</p>
                                                    {response.status === "pending" && (
                                                        <span className="pending">{response.status}</span>
                                                    )}
                                                    {response.status === "partly-paid" && (
                                                        <span className="pending">Partly Paid</span>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        <div className="steps">
                                            {new Array(3).fill(0).map((a, i) => {
                                                return (
                                                    <div
                                                        key={i}
                                                        className="step"
                                                        style={{
                                                            background: step >= i + 1 ? "var(--main)" : "var(--l-gray)",
                                                        }}
                                                    ></div>
                                                );
                                            })}
                                        </div>
                                    </>
                                )}
                            </>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
