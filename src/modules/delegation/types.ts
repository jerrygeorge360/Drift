export interface RedeemResult {
    userOpHash: `0x${string}`;
    transactionHash: `0x${string}`;
    blockNumber: bigint;
    status: "success" | "reverted";
    gasUsed?: bigint;
}