import { createPublicClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import * as dotenv from "dotenv";

dotenv.config();

async function main() {
    const privateKey = process.env.MONAD_TESTNET_PRIVATE_KEY as `0x${string}`;

    if (!privateKey) {
        throw new Error("MONAD_TESTNET_PRIVATE_KEY not found in .env");
    }

    const account = privateKeyToAccount(privateKey);

    const monadTestnet = {
        id: 10143,
        name: 'Monad Testnet',
        network: 'monad-testnet',
        nativeCurrency: { name: 'MON', symbol: 'MON', decimals: 18 },
        rpcUrls: {
            default: { http: ['https://testnet-rpc.monad.xyz'] },
            public: { http: ['https://testnet-rpc.monad.xyz'] },
        },
    } as const;

    const publicClient = createPublicClient({
        chain: monadTestnet,
        transport: http('https://testnet-rpc.monad.xyz'),
    });

    console.log("🔍 Checking balance for:", account.address);
    console.log("=".repeat(60));

    try {
        const balance = await publicClient.getBalance({ address: account.address });
        const balanceInMON = Number(balance) / 1e18;

        console.log("\n💰 Balance:");
        console.log("  Wei:", balance.toString());
        console.log("  MON:", balanceInMON.toFixed(6));

        console.log("\n📊 Status:");
        if (balanceInMON < 0.1) {
            console.log("  ⚠️  Very low balance - need more MON from faucet");
        } else if (balanceInMON < 1) {
            console.log("  ⚠️  Low balance - can deploy 1-2 contracts");
        } else if (balanceInMON < 5) {
            console.log("  ✅ Moderate balance - can deploy several contracts");
        } else {
            console.log("  ✅ Good balance - sufficient for testing");
        }

        console.log("\n" + "=".repeat(60));
    } catch (error: any) {
        console.error("❌ Failed to check balance:", error.message);
        throw error;
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
