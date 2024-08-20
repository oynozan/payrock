import { type Request, type Response, Router } from "express";

import { UserRequest } from ".";
import { Zr } from "../funcs/zr";
import walletsDB from "../db/Wallets";
import paymentsDB from "../db/Payment";
import settingsDB from "../db/Settings";
import { Networks } from "../data/Networks";
import { verifyUser } from "../funcs/middleware";
import axios from "axios";

const router = Router();

// Setup zrSign instances
const zr: any = {};

for (let networkName of Object.keys(Networks)) {
    zr[networkName] = new Zr(networkName as keyof typeof Networks);
}

const validateNetwork = (network: any) =>
    Object.keys(Networks).includes(network);

router.get("/wallets", verifyUser, async (req: UserRequest, res: Response) => {
    try {
        let network = req.query?.network;
        if (!validateNetwork(network)) return res.send({ wallets: [] });
        network = network as keyof typeof Networks;

        const wallets = await walletsDB
            .find({ owner: req.user!.wallet }, { _id: 0 })
            .lean();

        return res.send({ wallets: wallets.reverse() });
    } catch (e) {
        console.error(e);
        return res.send({ wallets: [] });
    }
});

router.get(
    "/basic-fee",
    verifyUser,
    async (req: UserRequest, res: Response) => {
        try {
            let network = req.query.network;
            if (!validateNetwork(network))
                return res.status(400).send({ message: "Invalid network" });
            network = network as keyof typeof Networks;

            const fee = await zr[network].getBasicFee();
            console.log(`${network} Fee: ${fee}`);

            return res.send({ fee });
        } catch (e) {
            console.error(e);
            return res.status(500).send({
                message: "An error occured",
            });
        }
    }
);

router.post(
    "/create-wallet",
    verifyUser,
    async (req: UserRequest, res: Response) => {
        try {
            let { tx, wallet, network } = req.body;
            if (!tx || !wallet)
                return res.status(400).send({ message: "Invalid transaction" });

            if (!validateNetwork(network))
                return res.status(400).send({ message: "Invalid network" });
            network = network as keyof typeof Networks;

            let initialFee = zr[network].latestBasicFee * 3;

            // Validate transaction
            const validated = await zr[network].validateTx(
                tx,
                process.env.WALLET_ADDRESS!.toLowerCase(),
                initialFee
            );

            if (!validated)
                return res
                    .status(400)
                    .send({ message: "Transaction cannot be validated" });

            // Request new wallet
            const contractFee = (initialFee * 9) / 10;
            const contractHash = await zr[network].newWallet(
                contractFee.toString()
            );
            if (!contractHash) throw "Cannot create a wallet";

            // Get how many wallets have been created
            const index = await walletsDB.countDocuments({ network });
            console.log("Index:", index);

            // Get new wallet's address
            const newWallet = await zr[network].getLastWallet(index);

            // Save new wallet to DB
            const dbObj = {
                index,
                owner: wallet,
                address: newWallet,
                network,
                date: Date.now(),
            };

            const newWalletRecord = new walletsDB(dbObj);
            await newWalletRecord.save();

            return res.send({ wallet: dbObj });
        } catch (e) {
            console.error(e);
            return res.status(500).send({
                message: "An error occured",
            });
        }
    }
);

router.get("/payment-details", async (req: Request, res: Response) => {
    try {
        let { id } = req.query;
        id = id as string;

        const payment: any = await paymentsDB
            .findOne(
                { _id: id },
                { _id: 0 }
            )
            .lean();

        if (!payment)
            return res.status(400).send({
                message: "Invalid payment ID",
            });

        if (payment.status === "paid") {
            const settings = await settingsDB.findOne({ wallet: payment.owner }).lean();
            const URL_ = new URL(settings?.redirectURL || "");
            URL_.searchParams.append('id', id);

            payment["redirect"] = URL_.toString();
        }

        delete payment["owner"];

        return res.send({ ...payment });
    } catch (e) {
        console.error(e);
        return res.status(500).send({
            message: "An error occured",
        });
    }
});

router.post("/set-network", async (req: Request, res: Response) => {
    try {
        let { id, network } = req.body;

        if (!validateNetwork(network))
            return res.status(400).send({ message: "Invalid network" });
        network = network as keyof typeof Networks;

        const oldPayment = await paymentsDB.findOne({ _id: id }).lean();

        if (!oldPayment)
            return res.status(400).send({ message: "Invalid payment ID" });

        const updateObj: { network: typeof network; fee?: number } = {
            network,
        };

        // Calculate fee
        if (!oldPayment?.fee) {
            const fee = await zr[network].getBasicFee();

            if (fee) updateObj["fee"] = fee;
            else
                return res
                    .status(400)
                    .send({ message: "Cannot calculate fee" });
        }

        const payment = await paymentsDB
            .findOneAndUpdate({ _id: id }, updateObj, {
                projection: {
                    _id: 0,
                    owner: 0,
                },
                new: true,
            })
            .lean();

        return res.send({ ...payment });
    } catch (e) {
        console.error(e);
        return res.status(500).send({
            message: "An error occured",
        });
    }
});

router.get("/get-price", async (req: Request, res: Response) => {
    try {
        let network = req.query?.network as keyof typeof Networks;
        if (!validateNetwork(network))
            return res.status(400).send({ message: "Invalid network" });

        const asset = Networks[network].asset;
        let id: string = "";

        switch (asset) {
            case "BNB":
                id = "binancecoin";
                break;
            case "ETH":
                id = "ethereum";
                break;
            case "MATIC":
                id = "matic-network";
                break;
            case "AVAX":
                id = "avalanche-2";
                break;
            default:
                return res.status(400).send({
                    message: "Invalid network",
                });
        }

        const response = await axios.get(
            "https://api.coingecko.com/api/v3/coins/" + id,
            {
                headers: {
                    accept: "application/json",
                    "x-cg-api-key": process.env.COINGECKO_API_KEY,
                },
            }
        );

        return res.send({ price: response.data.market_data.current_price.usd });
    } catch (e: any) {
        console.error(
            e?.response?.data || e?.response?.status || e?.response || e
        );
        return res.status(500).send({
            message: "An error occured",
        });
    }
});

// Checking pending payments here
// TODO: Move this loop into socket.io instance for a better communication
setInterval(
    async () => {
        // Iterate through every pending transaction
        const pendingTransactions = await paymentsDB.find({
            status: "pending",
        });

        for (let transaction of pendingTransactions) {
            // Check if transaction timed out
            if (new Date(transaction.deadlineDate).getTime() < Date.now()) {
                const ID = transaction._id.toString();
                await paymentsDB.updateOne({ _id: ID }, { status: "timeout" });
                console.log(`Transaction ${ID} is timed out.`);
                continue;
            }

            let gasPrice = 20 * 1e9;
            let canWithdraw = false;
            let rawCoinAmount = BigInt(0);

            /// Check new deposits
            // Ethereum
            if (transaction.network === "Ethereum Sepolia") {
                try {
                    // Get recent transactions of wallet
                    const response = await axios.get(
                        `${process.env.ETHERSCAN_URL}`,
                        {
                            params: {
                                module: "account",
                                action: "txlist",
                                address: transaction.to,
                                startblock: 0,
                                endblock: 99999999,
                                page: 1,
                                offset: 4,
                                sort: "desc",
                                apikey: process.env.ETHERSCAN_API_KEY,
                            },
                        }
                    );

                    if (response.data.status === "1") {
                        const recentTransactions = response.data.result;
                        const incomingTransactions = recentTransactions.filter(
                            (t: any) => t.to.toLowerCase() === transaction.to.toLowerCase()
                        );

                        for (let incomingTransaction of incomingTransactions) {
                            const hash = incomingTransaction.hash;

                            // Check existance of tx hash
                            const paymentsWithHash = await paymentsDB.find({
                                tx: hash,
                            });
                            if (paymentsWithHash.length) continue;

                            /// A new payment has been received
                            // Get payment amount
                            const safeGasRes = await axios(
                                `${process.env.ETHERSCAN_URL}?module=proxy&action=eth_gasPrice&apikey=${process.env.ETHERSCAN_API_KEY}`
                            );
                            const safeGas = Number(safeGasRes.data?.result);
                            gasPrice = safeGas;
                            console.log("Gas price: ", safeGas);

                            rawCoinAmount = BigInt(incomingTransaction.value);

                            const rawPaymentAmount =
                                BigInt(incomingTransaction.value) -
                                BigInt(safeGas);
                            const coinAmount =
                                Number(rawPaymentAmount / BigInt(1e9)) / 1e9;

                            const coinPriceRes = await axios(
                                `${
                                    process.env.BACKEND_ENDPOINT
                                }/payment/get-price?network=${encodeURIComponent(
                                    transaction.network
                                )}`
                            );
                            const coinPrice = coinPriceRes.data?.price;
                            if (!coinPrice) continue;

                            const amount = coinPrice * coinAmount; // USD
                            console.log(
                                `Received new payment from ${incomingTransaction.from} $${amount}`
                            );

                            // Party-paid
                            if (transaction.amount > amount && amount > 0) {
                                await paymentsDB.updateOne(
                                    { _id: transaction._id.toString() },
                                    {
                                        status: "partly-paid",
                                        tx: hash
                                    }
                                );
                            }
                            // Fully-paid
                            else if (transaction.amount <= amount) {
                                await paymentsDB.updateOne(
                                    { _id: transaction._id.toString() },
                                    {
                                        status: "paid",
                                        tx: hash
                                    }
                                );
                            } else continue;

                            canWithdraw = true;
                        }
                    } else continue;
                } catch (e) {
                    console.error(e);
                    continue;
                }
            }

            // BSC
            else if (transaction.network === "Binance Testnet") {
            }

            // Avalanche
            else if (transaction.network === "Avalanche Fuji") {
            }

            else continue;

            // Transfer funds to owner's wallet
            if (!canWithdraw || !rawCoinAmount) continue;

            try {
                const walletRecord = await walletsDB.findOne({ address: transaction.to });
                if (!walletRecord) return;

                const settingsRecord = await settingsDB.findOne({ wallet: transaction.owner });
                if (!settingsRecord) return;

                const lastHash = await zr[transaction.network].sendTransaction(
                    transaction.owner,
                    BigInt(rawCoinAmount),
                    BigInt(transaction.fee) * BigInt(27) / BigInt(10),
                    walletRecord.__v,
                    gasPrice,
                    settingsRecord.network,
                );

                console.log("Initial Tx:", lastHash);
            } catch(e) {
                console.error(e);
            }
        }
    },
    process.env.NODE_ENV! === "development" ? 5000 : 30_000
);

export default router;
