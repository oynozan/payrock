import { model, Schema } from "mongoose";
import { Networks } from '../data/Networks';

export interface IPayment {
    to: string;
    tx: string;
    owner: string;
    amount: number; // in USD
    network: string;
    availableNetworks: Array<keyof typeof Networks>;
    fee: number;
    creationDate: Date;
    deadlineDate: Date;
    status: "pending" | "paid" | "partly-paid" | "timeout"
}

const paymentSchema = new Schema<IPayment>({
    to: {
        type: String,
        required: true,
    },
    tx: {
        type: String,
    },
    owner: {
        type: String,
        required: true,
    },
    amount: {
        type: Number,
        required: true,
    },
    network: {
        type: String,
    },
    availableNetworks: {
        type: [String],
        required: true,
        enum: Object.keys(Networks),
    },
    fee: {
        type: Number,
    },
    creationDate: {
        type: Date,
        require: true
    },
    deadlineDate: {
        type: Date,
        require: true
    },
    status: {
        type: String,
        enum: ["pending", "paid", "partly-paid", "timeout"],
        default: "pending",
    }
});

const PaymentModel = model("payments", paymentSchema);
export default PaymentModel;
