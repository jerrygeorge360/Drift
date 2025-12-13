import { Request, Response } from "express";
import { redeemDelegationService } from "../modules/bot/bot.delegation.js";

export const redeemDelegationController = async (req: Request, res: Response): Promise<Response> => {
    try {
        const txResult = await redeemDelegationService(
            "955c54ab-2d6e-4b6a-9fdb-3cb70fb27d95",
            {
                botAddress: "0x1235aC2B678202802b5071a7AadF7efe0E172d0E",
                tokenIn: "0xCC0DF0CD04526faB0B3d396456257D059f439548",   // TestDAI
                tokenOut: "0x760AfE86e5de5fa0Ee542fc7B7B713e1c5425701", //WMON
                amountIn: BigInt("10000000000000000000"),               // 10 TestDAI
                amountOutMin: BigInt("0"),              // 0
                swapPath: [
                    "0xCC0DF0CD04526faB0B3d396456257D059f439548",// TestDAI
                    "0x760AfE86e5de5fa0Ee542fc7B7B713e1c5425701", //WMON
                ],
                reason: "testing redeem delegation",
            }
        );

        return res.status(200).json({
            success: true,
            message: "Redeem delegation executed successfully",
            data: txResult,
        });
    } catch (error: any) {
        console.error("❌ Redeem Delegation Error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to execute redeem delegation",
            error: error?.message || String(error),
        });
    }
};
// TODO : make a offchain blockchain pair checker
// TODO : make an offchain blockchain swap path checker
// TODO: make custom tokens,deploy the tokens,and make it liquid(done)
