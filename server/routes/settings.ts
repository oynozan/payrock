import axios from "axios";
import { type Request, type Response, Router } from "express";

import { UserRequest } from ".";
import settingsDB from "../db/Settings";
import { Networks } from '../data/Networks';
import { verifyUser } from "../funcs/middleware";

const router = Router();

router.post("/update-redirect", verifyUser, async (req: UserRequest, res: Response) => {
    try {
        const { redirectURL } = req.body;
        if (!redirectURL)
            return res
                .status(400)
                .send({
                    status: false,
                    message: "Please provide a redirect URL",
                });

        // Send a request redirect URL
        try {
            const { data } = await axios(redirectURL);
            if (!data)
                return res
                    .status(400)
                    .send({
                        status: false,
                        message: "Cannot communicate with URL",
                    });
        } catch(e: any) {
            return res
                .status(400)
                .send({
                    status: false,
                    message: "Cannot communicate with URL",
                });
        }

        // Update the database record
        const updated = await settingsDB.findOneAndUpdate(
            { wallet: req.user!.wallet },
            { redirectURL },
            { projection: { _id: 0, wallet: 0 } }
        );

        return res.send({ status: true, settings: updated });
    } catch (err) {
        console.error(err);
        return res.status(500).send({
            message: "An error occured",
        });
    }
});

router.post("/update-domain", verifyUser, async (req: UserRequest, res: Response) => {
    try {
        const { domain } = req.body;
        if (!domain)
            return res
                .status(400)
                .send({
                    status: false,
                    message: "Please provide a domain",
                });

        if (!domain.includes("."))
            return res
                .status(400)
                .send({
                    status: false,
                    message: "Invalid domain",
                });

        // Update the database record
        const updated = await settingsDB.findOneAndUpdate(
            { wallet: req.user!.wallet },
            { domain },
            { projection: { _id: 0, wallet: 0 } }
        );

        return res.send({ status: true, settings: updated });
    } catch (err) {
        console.error(err);
        return res.status(500).send({
            message: "An error occured",
        });
    }
});

router.post("/update-network", verifyUser, async (req: UserRequest, res: Response) => {
    try {
        const { network } = req.body;
        if (!network)
            return res
                .status(400)
                .send({
                    status: false,
                    message: "Please provide a network",
                });

        // Validate network
        if (!Object.keys(Networks).includes(network))
            return res
                .status(400)
                .send({
                    status: false,
                    message: "Invalid network",
                });

        // Update the database record
        const updated = await settingsDB.findOneAndUpdate(
            { wallet: req.user!.wallet },
            { network },
            { projection: { _id: 0, wallet: 0 } }
        );

        return res.send({ status: true, settings: updated });
    } catch (err) {
        console.error(err);
        return res.status(500).send({
            message: "An error occured",
        });
    }
});

router.post("/change-extra-fee", verifyUser, async (req: UserRequest, res: Response) => {
    try {
        const { addFeeAsExtraPayment } = req.body;

        if (typeof addFeeAsExtraPayment !== "boolean")
            return res
                .status(400)
                .send({
                    status: false,
                    message: "Invalid fee state",
                });

        // Update the database record
        const updated = await settingsDB.findOneAndUpdate(
            { wallet: req.user!.wallet },
            { addFeeAsExtraPayment },
            { projection: { _id: 0, wallet: 0 } }
        );

        return res.send({ status: true, settings: updated });
    } catch (err) {
        console.error(err);
        return res.status(500).send({
            message: "An error occured",
        });
    }
});

export default router;
