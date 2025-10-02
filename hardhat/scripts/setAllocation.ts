import { network } from "hardhat";

async function main() {
    const { viem } = await network.connect();
    const [user] = await viem.getWalletClients();
    const portfolio = await viem.getContractAt("SmartPortfolio", "0xYourDeployedAddress");

    await portfolio.write.setAllocations(
        [
            ["0xTokenAAddress", 60n], // 60% in Token A
            ["0xTokenBAddress", 40n], // 40% in Token B
        ],
        { account: user.account }
    );

    console.log("Allocations set for:", user.account.address);
}

main();
