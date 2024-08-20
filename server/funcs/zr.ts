import RLP from 'rlp';
import { type Contract, ethers, getAddress, JsonRpcProvider, toBeHex } from "ethers";

import zrABI from "../data/zrABI.json";
import { Networks } from "../data/Networks";

let counter = 0;

export class Zr {
    protected contract: Contract;
    protected signer: ethers.Wallet;

    public network: keyof typeof Networks;
    public provider: JsonRpcProvider;
    public walletTypeId: ethers.BytesLike;
    public latestBasicFee: bigint | number = 0;

    constructor(network: keyof typeof Networks) {
        this.network = network;
        this.provider = new JsonRpcProvider(Networks[network].rpc);

        this.signer = new ethers.Wallet(
            process.env.PRIVATE_KEY!,
            this.provider
        );

        this.contract = new ethers.Contract(
            Networks[network].contract,
            zrABI,
            this.signer
        );

        // EVM-type Wallet ID
        this.walletTypeId = ethers.getBytes(Networks[network].chain32);
    }

    /**
     * Gets basic fee for zrKeyReq
     */
    async getBasicFee() {
        const estimatedFee = await this.contract.estimateFee(1, 0);
        this.latestBasicFee = Number(estimatedFee[2]);
        return Number(estimatedFee[2]);
    }

    /**
     * Creates a new wallet. Calls zrKeyReq() method from Sign.sol
     */
    async newWallet(fee: string) {
        try {
            const txRequest = await this.contract.zrKeyReq(
                {
                    walletTypeId: this.walletTypeId,
                    options: 1,
                },
                {
                    value: fee,
                }
            );

            const tx = await this.provider.getTransaction(txRequest.hash);

            console.log("TRANSACTION: ");
            console.log("-------------------------------------");
            console.log(tx);
            console.log("-------------------------------------");
            
            if (!tx) return null;
            await tx.wait();

            return txRequest.hash;
        } catch (e) {
            console.error(e);
            return null;
        }
    }

    /**
     * Returns last created wallet
     */
    async getLastWallet(index: number) {
        const lastWallet = await this.contract.getZrKey(
            this.walletTypeId,
            process.env.WALLET_ADDRESS,
            index
        );

        console.log(lastWallet);
        return lastWallet;
    }

    /**
     * Sends a transaction from zr wallet
     */
    async sendTransaction(
        to: string,
        amount: bigint,
        fee: bigint,
        index: number,
        gasPrice: number,
        destNetwork: keyof typeof Networks,
    ) {
        const txRequest = await this.contract.zrSignTx(
            {
                walletTypeId: this.walletTypeId,
                walletIndex: index,
                dstChainId: Networks[destNetwork].chain32,
                payload: await this.rlpEncodeTx(
                    to,
                    amount - fee,
                    21000,
                    gasPrice,
                    BigInt(counter),
                    "0x"
                ),
                broadcast: false,
            },
            {
                value: BigInt(1e15)
            }
        );

        console.log(txRequest);
        const tx = await this.provider.getTransaction(txRequest.hash);

        console.log("TRANSACTION: ");
        console.log("-------------------------------------");
        console.log(tx);
        console.log("-------------------------------------");
        
        if (!tx) return null;
        await tx.wait();

        counter++;
        return txRequest.hash;
    }

    /**
     * Validate a transaction
     */
    async validateTx(
        hash: string,
        expectedTo: string,
        expectedValue: string,
        expectedMessage?: string
    ) {
        if (!hash || !expectedTo || !expectedValue) return false;

        const tx = await this.provider.getTransaction(hash);

        console.log("TRANSACTION: ");
        console.log("-------------------------------------");
        console.log(tx);
        console.log("-------------------------------------");

        if (!tx) return false;

        const receipt = await tx.wait();

        if (
            receipt?.status === 0 ||
            tx?.to?.toLowerCase() !== expectedTo ||
            tx.value.toString() !== expectedValue.toString() ||
            (expectedMessage &&
                tx.data !== ethers.hexlify(ethers.toUtf8Bytes(expectedMessage)))
        ) {
            return false;
        }

        return true;
    }

    // rlpEncodeData
    async rlpEncodeTx(
        to: string,
        value: bigint,
        gasLimit: number,
        gasPrice: number,
        nonce: bigint,
        data: string
    ) {
        const transaction = [
            toBeHex(nonce).replace(/^0x0+/, '0x'), // Remove leading zeros
            toBeHex(gasPrice).replace(/^0x0+/, '0x'), // Remove leading zeros
            toBeHex(gasLimit).replace(/^0x0+/, '0x'), // Remove leading zeros
            getAddress(to),
            toBeHex(value).replace(/^0x0+/, '0x'), // Remove leading zeros
            data,
            '0x', // v
            '0x', // r
            '0x'  // s
        ];
        const rlpPayload = RLP.encode(transaction);
        // const rlpPayload = ethers.encodeRlp(transaction);
        return rlpPayload;
    }
}
