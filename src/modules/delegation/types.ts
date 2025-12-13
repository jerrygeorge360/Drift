export interface RedeemResult {
    userOpHash: `0x${string}`;
    transactionHash: `0x${string}`;
    blockNumber: string;
    status: "success" | "reverted";
    gasUsed?: string;
}