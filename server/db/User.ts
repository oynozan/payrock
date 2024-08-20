import { model, Schema } from "mongoose";

export interface IUser {
    wallet: string;
    signature: string;
    accessToken: string;
    registrationDate: Date;
}

const userSchema = new Schema<IUser>({
    wallet: {
        type: String,
        required: true,
    },
    signature: {
        type: String,
        required: true,
    },
    accessToken: {
        type: String,
        required: true,
    },
    registrationDate: {
        type: Date,
        required: true,
    },
});

const UserModel = model("users", userSchema);
export default UserModel;
