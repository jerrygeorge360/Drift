import { Request, Response } from "express";
import { redeemDelegationService } from "../modules/bot/bot.delegation.js";

export const redeemDelegationController = async (req: Request, res: Response): Promise<Response> => {
    try {
        const txResult = await redeemDelegationService(
            "f24a292e-d164-4416-b5cb-849693403d8b",
            {
                botAddress: "0x1235aC2B678202802b5071a7AadF7efe0E172d0E",
                tokenIn: "0x2222222222222222222222222222222222222222",   // USDC
                tokenOut: "0x3333333333333333333333333333333333333333", // USDT
                amountOut: BigInt("1000000000000000000"),               // 1 USDT
                amountInMin: BigInt("980000000000000000"),              // 0.98 USDC
                swapPath: [
                    "0x3333333333333333333333333333333333333333",
                    "0x2222222222222222222222222222222222222222",
                ],
                reason: "hello",
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
