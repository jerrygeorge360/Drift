import dotenv from "dotenv";
dotenv.config();


console.log("PRIVATE_KEY_SECRET from env:", process.env.PRIVATE_KEY_SECRET);
import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

const ALGORITHM = "aes-256-cbc";
const IV_LENGTH = 16;
const ENCODING = "base64";

const ENCRYPTION_KEY = process.env.PRIVATE_KEY_SECRET;
console.log(ENCRYPTION_KEY)
if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length !== 32) {
    throw new Error("PRIVATE_KEY_SECRET must be set and 32 characters long");
}

const KEY = Buffer.from(ENCRYPTION_KEY, "utf-8");

// Encrypt
export function encryptPrivateKey(plainText: string): string {
    const iv = randomBytes(IV_LENGTH);
    const cipher = createCipheriv(ALGORITHM, KEY, iv);
    const encrypted = Buffer.concat([
        cipher.update(plainText, "utf8"),
        cipher.final(),
    ]);
    return Buffer.concat([iv, encrypted]).toString(ENCODING);
}

// Decrypt
export function decryptPrivateKey(encryptedText: string): `0x${string}` {
    const encryptedBuffer = Buffer.from(encryptedText, ENCODING);
    const iv = encryptedBuffer.subarray(0, IV_LENGTH);
    const encrypted = encryptedBuffer.subarray(IV_LENGTH);
    const decipher = createDecipheriv(ALGORITHM, KEY, iv);
    const decrypted = Buffer.concat([
        decipher.update(encrypted),
        decipher.final(),
    ]);
    return decrypted.toString("utf8") as `0x${string}`;
}

// @ts-ignore
console.log(encryptPrivateKey(process.env.PRIVATE_KEY_SECRET))