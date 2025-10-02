import { network } from "hardhat";

async function main() {
    const { viem } = await network.connect();
    const [_, user, bot] = await viem.getWalletClients();
    const portfolio = await viem.getContractAt("SmartPortfolio", "0xYourDeployedAddress");

    await portfolio.write.executeRebalance([user.account.address], { account: bot.account });

    console.log(`Rebalance executed for user ${user.account.address}`);
}

main();
