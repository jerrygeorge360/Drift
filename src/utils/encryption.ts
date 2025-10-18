import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

const ALGORITHM = "aes-256-cbc";
const IV_LENGTH = 16;
const ENCODING = "base64";

// Load the encryption key (32-byte string required for AES-256)
const ENCRYPTION_KEY = process.env.PRIVATE_KEY_SECRET;

if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length !== 32) {
    throw new Error("PRIVATE_KEY_SECRET must be set and 32 characters long");
}

// Convert the key to a Buffer
const KEY = Buffer.from(ENCRYPTION_KEY, "utf-8");

/**
 * Encrypt a private key string using AES-256-CBC.
 * Returns a base64 string that includes the IV and encrypted data.
 */
export function encryptPrivateKey(plainText: string): string {
    const iv = randomBytes(IV_LENGTH);
    const cipher = createCipheriv(ALGORITHM, KEY, iv);

    const encrypted = Buffer.concat([
        cipher.update(plainText, "utf8"),
        cipher.final(),
    ]);

    // Prepend IV to encrypted data
    const encryptedWithIv = Buffer.concat([iv, encrypted]);
    return encryptedWithIv.toString(ENCODING);
}

/**
 * Decrypt an encrypted private key string.
 * Assumes the IV is prepended to the encrypted data (base64 format).
 */
export function decryptPrivateKey(encryptedText: string): `0x${string}` {
    const encryptedBuffer = Buffer.from(encryptedText, ENCODING);

    const iv = encryptedBuffer.subarray(0, IV_LENGTH);
    const encrypted = encryptedBuffer.subarray(IV_LENGTH);

    const decipher = createDecipheriv(ALGORITHM, KEY, iv);

    const decrypted = Buffer.concat([
        decipher.update(encrypted),
        decipher.final(),
    ]);

    return decrypted.toString("utf8")  as `0x${string}`;
}