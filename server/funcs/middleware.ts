/**
 * Express Middlewares as functions
 */

import cors from "cors";
import { verifyMessage } from "ethers";
import type { NextFunction, Request, Response } from "express";

import walletsDB from "../db/Wallets";
import settingsDB from "../db/Settings";
import { PublicRequest } from '../routes';
import { Networks } from '../data/Networks';
import userDB, { type IUser } from "../db/User";

export async function verifyUser(
    req: Request & { user?: IUser },
    res: Response,
    next: NextFunction
) {
    try {
        const wallet = req?.body?.["wallet"] || req?.query?.["wallet"]; // Wallet is mandatory in almost* every request
        const signature = req.cookies?.["signature"] as string | undefined;

        if (!signature || !wallet)
            return res
                .status(403)
                .send({ message: "Please connect your wallet." });

        const signerAddress = verifyMessage(
            `Welcome to Payrock, ${wallet} - The Cross-Chain Payment Gateway`,
            signature
        );

        if (
            !signerAddress ||
            signerAddress.toLowerCase() !== wallet.toLowerCase()
        )
            return res
                .status(403)
                .send({ message: "Your signature is invalid" });

        // Get User
        const user = await userDB.findOne({ signature }).lean();

        if (!user)
            return res
                .status(403)
                .send({ message: "Please refresh the page." });

        // Set the user to request
        req["user"] = user;

        return next();
    } catch (e) {
        console.error(e);
        return res.status(500).send({ message: "An error occured." });
    }
}

export async function verifyPublicAPI(
    req: PublicRequest,
    res: Response,
    next: NextFunction
) {
    try {
        const accessToken = req.headers?.["access-token"];
        if (!accessToken)
            return res
                .status(403)
                .send({
                    status: false,
                    message: "Please send your access token in the headers.",
                });

        // Get user by access token
        const user = await userDB.findOne({ accessToken });
        if (!user)
            return res
                .status(403)
                .send({ status: false, message: "Wrong access token." });

        // Get settings
        const raw_settings = await settingsDB
            .findOne({ wallet: user.wallet }, { _id: 0 })
            .lean();

        if (!raw_settings?.domain)
            return res
                .status(403)
                .send({
                    status: false,
                    message: "Please enter your domain from dashboard.",
                });

        if (!raw_settings?.network)
            return res
                .status(403)
                .send({
                    status: false,
                    message: "Please enter your target network from dashboard.",
                });

        if (!raw_settings?.redirectURL)
            return res
                .status(403)
                .send({
                    status: false,
                    message: "Please enter your redirect URL from dashboard.",
                });

        // Get user wallets
        const wallets = await walletsDB.find({ owner: user.wallet }).lean();
        if (!wallets?.length)
            return res
                .status(403)
                .send({
                    status: false,
                    message: "You must create at least one wallet to receive payments.",
                });

        // Get available networks
        const availableNetworks: Array<keyof typeof Networks> = [];
        for (let wallet of wallets) {
            if (!availableNetworks.includes(wallet.network)) {
                availableNetworks.push(wallet.network);
            }
            if (availableNetworks.length === Object.keys(Networks).length) break;
        }

        // Set user & settings to request
        req["settings"] = { ...raw_settings, availableNetworks };
        req["user"] = user;

        return next();
    } catch (e) {
        console.error(e);
        return res.status(500).send({ message: "An error occured." });
    }
}

export const customCors = (
    req: PublicRequest,
    res: Response,
    next: NextFunction
) => {
    cors({ origin: req!.settings!.domain })(req, res, next);
}
