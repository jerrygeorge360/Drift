import { Request, Response } from "express";
import { redeemDelegationService } from "../modules/bot/bot.delegation.js";
import { RedeemResult } from "../modules/delegation/types.js";
import {
    getPortfolioBySmartAccountId,
    findTokenByAddress,
    createRebalanceLog
} from "../utils/dbhelpers.js";



export const redeemDelegationController = async (req: Request, res: Response): Promise<Response> => {
    try {
        const smartAccountId = "955c54ab-2d6e-4b6a-9fdb-3cb70fb27d95";
        const data = {
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
        };

        const txResult: RedeemResult = await redeemDelegationService(smartAccountId, data);
        console.log(txResult);

        // Save transaction result to database
        try {
            const portfolio = await getPortfolioBySmartAccountId(smartAccountId);
            if (portfolio) {
                // Get token IDs from addresses
                const tokenIn = await findTokenByAddress(data.tokenIn);
                const tokenOut = await findTokenByAddress(data.tokenOut);

                if (tokenIn && tokenOut) {
                    await createRebalanceLog({
                        portfolioId: portfolio.id,
                        tokenInId: tokenIn.id,
                        tokenOutId: tokenOut.id,
                        amountIn: Number(data.amountIn) / Math.pow(10, tokenIn.decimals), // Convert from wei
                        amountOut: Number(data.amountOutMin) / Math.pow(10, tokenOut.decimals), // Convert from wei
                        reason: data.reason,
                        executor: data.botAddress,
                        userOpHash: txResult.userOpHash,
                        transactionHash: txResult.transactionHash,
                        blockNumber: txResult.blockNumber,
                        status: txResult.status,
                        gasUsed: txResult.gasUsed,
                    });
                    console.log("✅ Rebalance log saved to database");
                } else {
                    console.warn("⚠️ Could not find tokens in database, skipping log save");
                }
            } else {
                console.warn("⚠️ Portfolio not found, skipping log save");
            }
        } catch (dbError) {
            console.error("⚠️ Failed to save rebalance log to database:", dbError);
            // Don't fail the entire request if DB save fails
        }

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




