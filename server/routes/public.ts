/**
 * Public API
 */

import { type Response, Router } from "express";

import userDB from '../db/User';
import { PublicRequest } from '.';
import walletsDB  from '../db/Wallets';
import paymentsDB  from '../db/Payment';
import settingsDB, { type ISettings } from '../db/Settings';
import { customCors, verifyPublicAPI } from '../funcs/middleware';

const router = Router();

// TODO: If a network's all wallets are on a transaction, remove it from available networks list.
router.post("/create-payment", [verifyPublicAPI, customCors], async (req: PublicRequest, res: Response) => {
    try {
        if (!req?.user) throw "Unknown user";

        const { amount } = req.body;
        if (!amount)
            return res.status(400).send({ error: "You must send payment amount in request body" });

        // Get an available wallets for each available network
        const allWallets = await walletsDB
            .find({ owner: req.user.wallet })
            .lean();

        const walletAddresses = allWallets.map(w => w.address);
        const ongoingTransactions = await paymentsDB
            .find({ owner: req.user.wallet, status: "pending" });

        const availableWallets = [];
        const ongoingTransactionAddresses = ongoingTransactions.map(w => w.to);
        for (let address of walletAddresses) {
            if (!ongoingTransactionAddresses.includes(address))
                availableWallets.unshift(address);
        }

        console.log("Available Wallets:", availableWallets);

        if (availableWallets.length === 0)
            return res.status(400).send({ error: "Currently, you don't have any available wallets" });

        // Create payment record
        const newPayment = new paymentsDB({
            to: availableWallets[0],
            owner: req.user.wallet,
            amount,
            availableNetworks: req.settings?.availableNetworks,
            creationDate: Date.now(),
            deadlineDate: Date.now() + 1000 * 60 * 60,
            status: "pending"
        });

        await newPayment.save();

        return res.send({
            paymentLink: `${process.env.CLIENT_URL}/p/${newPayment._id.toString()}`
        });
    } catch (err) {
        console.error(err);
        return res.status(500).send({
            message: "An error occured",
        });
    }
});

router.get("/payment-status", [verifyPublicAPI, customCors], async (req: PublicRequest, res: Response) => {
    try {
        if (!req?.user) throw "Unknown user";

        let { id } = req.query;
        if (!id)
            return res.status(400).send({ error: "Please provide a payment ID" });

        id = id as string;

        const payment = await paymentsDB.findById(id);
        if (!payment)
            return res.status(400).send({ error: "Unknown payment ID" });

        return res.send(payment);
    } catch (err) {
        console.error(err);
        return res.status(500).send({
            message: "An error occured",
        });
    }
});

export default router;