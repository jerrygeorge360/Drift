import { getSpotPriceFromRouter } from "../src/utils/blockchainhelpers.js";
import db from "../src/config/db.js";

async function testOnChainPrices() {
    try {
        console.log("=== Testing On-Chain Router Prices ===\n");

        // Get USDC as base token
        const baseToken = await db.token.findUnique({ where: { symbol: 'USDC' } });
        if (!baseToken) {
            console.error("❌ USDC token not found in database");
            return;
        }

        console.log(`Base Token: ${baseToken.symbol} (${baseToken.address})\n`);
        console.log("Fetching spot prices from Uniswap Router...\n");

        // Get all tokens from database
        const tokens = await db.token.findMany({
            orderBy: {
                symbol: 'asc'
            }
        });

        console.log(`Found ${tokens.length} tokens in database\n`);

        // You'll need a portfolio address for the router call - using a dummy address
        // Replace this with an actual address or make it configurable
        const dummyPortfolioAddress = "0xA0A81e4F7Cf9B09A15ad132C67d1B5c975487df1";

        // Get spot prices for all tokens
        for (const token of tokens) {
            if (token.symbol === baseToken.symbol) {
                console.log(`✅ ${token.symbol}: $1.00 (base token)`);
                continue;
            }

            try {
                const spotPrice = await getSpotPriceFromRouter(
                    dummyPortfolioAddress as `0x${string}`,
                    token.address as `0x${string}`,
                    token.decimals,
                    baseToken.address as `0x${string}`,
                    baseToken.decimals
                );

                if (spotPrice > 0) {
                    console.log(`✅ ${token.symbol}: $${spotPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 6 })}`);
                } else {
                    console.log(`⚠️  ${token.symbol}: No liquidity pool found or price is 0`);
                }
            } catch (error: any) {
                console.log(`❌ ${token.symbol}: Error - ${error.message}`);
            }
        }

    } catch (error) {
        console.error("Error testing on-chain prices:", error);
    } finally {
        await db.$disconnect();
    }
}

testOnChainPrices();
