import { network } from "hardhat";

async function main() {
    const { viem } = await network.connect();
    const [user, bot] = await viem.getWalletClients();
    const portfolio = await viem.getContractAt("SmartPortfolio", "0xYourDeployedAddress");

    await portfolio.write.setDelegation([bot.account.address], { account: user.account });

    console.log(`Delegation set: ${user.account.address} → ${bot.account.address}`);
}

main();
