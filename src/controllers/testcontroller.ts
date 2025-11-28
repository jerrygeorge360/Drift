import { Request, Response } from "express";
import { redeemDelegationService } from "../modules/bot/bot.delegation.js";

export const redeemDelegationController = async (req: Request, res: Response): Promise<Response> => {
    try {
        const txResult = await redeemDelegationService(
            "f24a292e-d164-4416-b5cb-849693403d8b",
            {
                botAddress: "0x1235aC2B678202802b5071a7AadF7efe0E172d0E",
                tokenIn: "0xf817257fed379853cDe0fa4F97AB987181B1E5Ea",   // USDC
                tokenOut: "0x88b8E2161DEDC77EF4ab7585569D2415a1C1055D", // USDT
                amountIn: BigInt("1000000000000000000"),               // 1 USDT
                amountOutMin: BigInt("980000000000000000"),              // 0.98 USDC
                swapPath: [
                    "0xf817257fed379853cDe0fa4F97AB987181B1E5Ea",
                    "0x88b8E2161DEDC77httEF4ab7585569D2415a1C1055D",
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
// TODO : make a offchain blockchain pair checker
// TODO : make an offchain blockchain swap path checker
// TODO: make custom tokens,deploy the tokens,and make it liquid
