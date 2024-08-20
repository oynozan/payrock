import { z } from "zod";
import { verifyMessage } from "ethers";
import { getRandomValues } from "crypto";
import { type Request, type Response, Router } from "express";

import userDB from "../db/User";
import type { UserRequest } from ".";
import settingsDB from "../db/Settings";
import { verifyUser } from "../funcs/middleware";

const router = Router();

const randomString = (length = 32) =>
    Array.from(
        getRandomValues(new Uint8Array(length)),
        (n) =>
            "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"[
                n % 62
            ]
    ).join("");

// Zod Schemas
const SignatureInput = z.object({
    wallet: z.string(),
    message: z.string(),
    signature: z.string(),
});
type ISignatureInput = z.infer<typeof SignatureInput>;

router.post("/validate-signature", async (req: Request, res: Response) => {
    try {
        const signatureInput: ISignatureInput = req.body;
        if (!SignatureInput.safeParse(signatureInput).success) {
            return res.status(400).send({
                status: false,
                message: "Invalid signature",
            });
        }

        const signerAddress = verifyMessage(
            `Welcome to Payrock, ${signatureInput.wallet} - The Cross-Chain Payment Gateway`,
            signatureInput.signature
        );

        if (
            !signerAddress ||
            signerAddress.toLowerCase() !== signatureInput.wallet.toLowerCase()
        )
            return res.status(400).send({
                status: false,
                message: "Signature cannot be validated, please try again",
            });

        // Check if user exists
        let user: any = await userDB
            .find({ signature: signatureInput.signature })
            .lean();

        if (!user?.length) {
            console.log("New user:", signatureInput.wallet);

            // Register the user
            const newUser = new userDB({
                wallet: signatureInput.wallet,
                signature: signatureInput.signature,
                accessToken: randomString(32),
                registrationDate: Date.now(),
            });

            const newSettings = new settingsDB({
                wallet: signatureInput.wallet,
                addFeeAsExtraPayment: false,
            });

            await newUser.save();
            await newSettings.save();
        }

        // Set signature as cookie
        res.cookie("signature", signatureInput.signature, {
            maxAge: 24 * 60 * 60 * 1000 * 90,
            httpOnly: true,
        });

        return res.send({ status: true });
    } catch (err) {
        console.error(err);
        return res.status(500).send({
            status: false,
            message: "An error occured",
        });
    }
});

router.get("/", verifyUser, (req: UserRequest, res: Response) => {
    try {
        if (!req?.user)
            return res
                .status(403)
                .send({ message: "Please connect your wallet." });

        const user: any = { ...req.user };
        delete user._id;

        return res.send({ user });
    } catch (err) {
        console.error(err);
        return res.status(500).send({
            message: "An error occured",
        });
    }
});

router.get("/settings", verifyUser, async (req: UserRequest, res: Response) => {
    try {
        if (!req?.user)
            return res
                .status(403)
                .send({ message: "Please connect your wallet." });

        const settings = await settingsDB
            .findOne({ wallet: req.user.wallet! }, { _id: 0 })
            .lean();
        if (!settings)
            return res.status(403).send({ message: "Unknown user." });

        return res.send({ settings });
    } catch (err) {
        console.error(err);
        return res.status(500).send({
            message: "An error occured",
        });
    }
});

router.get("/logout", (req: Request, res: Response) => {
    try {
        res.clearCookie("signature");
        return res.send({});
    } catch (err) {
        console.error(err);
        return res.status(500).send({
            message: "An error occured",
        });
    }
});

export default router;
