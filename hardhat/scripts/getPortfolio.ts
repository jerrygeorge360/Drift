import { network } from "hardhat";

async function main() {
    const { viem } = await network.connect();
    const [user] = await viem.getWalletClients();
    const portfolio = await viem.getContractAt("SmartPortfolio", "0xYourDeployedAddress");

    const allocations = await portfolio.read.getAllocations([user.account.address]);
    console.log("Allocations:", allocations);

    const delegation = await portfolio.read.getDelegation([user.account.address]);
    console.log("Delegated bot:", delegation);
}

main();
