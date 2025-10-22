"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.encryptPrivateKey = encryptPrivateKey;
exports.decryptPrivateKey = decryptPrivateKey;
var dotenv_1 = require("dotenv");
dotenv_1.default.config();
console.log("PRIVATE_KEY_SECRET from env:", process.env.PRIVATE_KEY_SECRET);
var crypto_1 = require("crypto");
var accounts_1 = require("viem/accounts");
var ALGORITHM = "aes-256-cbc";
var IV_LENGTH = 16;
var ENCODING = "base64";
var ENCRYPTION_KEY = process.env.PRIVATE_KEY_SECRET;
console.log(ENCRYPTION_KEY);
if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length !== 32) {
    throw new Error("PRIVATE_KEY_SECRET must be set and 32 characters long");
}
var KEY = Buffer.from(ENCRYPTION_KEY, "utf-8");
// Encrypt
function encryptPrivateKey(plainText) {
    var iv = (0, crypto_1.randomBytes)(IV_LENGTH);
    var cipher = (0, crypto_1.createCipheriv)(ALGORITHM, KEY, iv);
    var encrypted = Buffer.concat([
        cipher.update(plainText, "utf8"),
        cipher.final(),
    ]);
    return Buffer.concat([iv, encrypted]).toString(ENCODING);
}
// Decrypt
function decryptPrivateKey(encryptedText) {
    var encryptedBuffer = Buffer.from(encryptedText, ENCODING);
    var iv = encryptedBuffer.subarray(0, IV_LENGTH);
    var encrypted = encryptedBuffer.subarray(IV_LENGTH);
    var decipher = (0, crypto_1.createDecipheriv)(ALGORITHM, KEY, iv);
    var decrypted = Buffer.concat([
        decipher.update(encrypted),
        decipher.final(),
    ]);
    return decrypted.toString("utf8");
}
var botPrivateKey = (0, accounts_1.generatePrivateKey)();
// Derive the wallet/account from the private key
var botAccount = (0, accounts_1.privateKeyToAccount)(botPrivateKey);
// Extract the bot's address
var botAddress = botAccount.address;
console.log("Bot Private Key:", botPrivateKey);
console.log("Bot Address:", botAddress);
console.log('encrypted', encryptPrivateKey(botPrivateKey));
// console.log(decryptPrivateKey('RBsgBJ7Hqtjjj9jZRjuldc+Xn7EqyTswTv3ueM/TNrmcbLVH4WzGuUQXae7zx9Qmp7zKc7f+krvKq782zEbmUCmzDSC8S8HmLuBTF5Fr0T+5tFFsQfo7jkm/7dfMZlX6'))
