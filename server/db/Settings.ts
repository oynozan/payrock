import { model, Schema } from "mongoose";

import { Networks } from "../data/Networks";

export interface ISettings {
    wallet: string;
    domain?: string;
    network: string;
    redirectURL?: string;
    addFeeAsExtraPayment: boolean;
}

const settingsSchema = new Schema<ISettings>({
    wallet: {
        type: String,
        required: true,
    },
    domain: {
        type: String,
    },
    network: {
        type: String,
        enum: Object.keys(Networks),
        default: "Ethereum Sepolia",
    },
    redirectURL: {
        type: String,
    },
    addFeeAsExtraPayment: {
        type: Boolean,
        default: false,
    },
});

const SettingsModel = model("settings", settingsSchema);
export default SettingsModel;
