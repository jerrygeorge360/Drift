import crypto from "crypto";

// Generate an HMAC SHA256 signature for a given payload.
export function generateHmacSignature(secret: string, payload: string): string {
    return crypto.createHmac("sha256", secret).update(payload).digest("hex");
}

// Verify the signature from the webhook request.
export function verifyHmacSignature(secret: string, payload: string, receivedSignature: string): boolean {
    const expected = generateHmacSignature(secret, payload);
    // Use timing-safe comparison to prevent timing attacks
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(receivedSignature));
}
