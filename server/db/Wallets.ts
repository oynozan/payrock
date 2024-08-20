import { model, Schema } from "mongoose";

import { Networks } from "../data/Networks";

export interface IWallet {
    index: number;
    owner: string;
    address: string;
    network: keyof typeof Networks;
    date: Date;
}

const walletsSchema = new Schema<IWallet>({
    index: {
        type: Number,
        required: true,
    },
    owner: {
        type: String,
        required: true,
    },
    address: {
        type: String,
        required: true,
    },
    network: {
        type: String,
        enum: Object.keys(Networks),
        required: true
    },
    date: {
        type: Date,
        required: true
    },
});

const WalletsModel = model("wallets", walletsSchema);
export default WalletsModel;
