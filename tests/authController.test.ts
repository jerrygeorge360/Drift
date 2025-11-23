import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { Request, Response } from "express";
import { SiweMessage, generateNonce } from "siwe";
import jwt from "jsonwebtoken";
import { getNonce, siweLogin } from "../src/controllers/authController.js";
import { findOrCreateUser, updateUserLastLogin } from "../src/utils/dbhelpers.js";

// Mock dependencies
jest.mock("siwe");
jest.mock("jsonwebtoken");
jest.mock("../src/utils/dbhelpers.js");

describe("Auth Controller", () => {
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;
    let jsonMock: jest.Mock;
    let statusMock: jest.Mock;

    beforeEach(() => {
        // Reset mocks before each test
        jest.clearAllMocks();

        // Setup response mocks
        jsonMock = jest.fn();
        statusMock = jest.fn().mockReturnValue({ json: jsonMock });

        mockRequest = {};
        mockResponse = {
            json: jsonMock,
            status: statusMock,
        };

        // Set up environment variable
        process.env.JWT_SECRET = "test-secret-key";
    });

    afterEach(() => {
        delete process.env.JWT_SECRET;
    });

    describe("getNonce", () => {
        it("should generate and return a nonce", () => {
            const mockNonce = "test-nonce-123";
            (generateNonce as jest.Mock).mockReturnValue(mockNonce);

            getNonce(mockRequest as Request, mockResponse as Response);

            expect(generateNonce).toHaveBeenCalledTimes(1);
            expect(jsonMock).toHaveBeenCalledWith({ nonce: mockNonce });
        });

        it("should generate a different nonce each time", () => {
            (generateNonce as jest.Mock)
                .mockReturnValueOnce("nonce-1")
                .mockReturnValueOnce("nonce-2");

            getNonce(mockRequest as Request, mockResponse as Response);
            expect(jsonMock).toHaveBeenCalledWith({ nonce: "nonce-1" });

            jsonMock.mockClear();

            getNonce(mockRequest as Request, mockResponse as Response);
            expect(jsonMock).toHaveBeenCalledWith({ nonce: "nonce-2" });
        });
    });

    describe("siweLogin", () => {
        const mockWalletAddress = "0x1234567890123456789012345678901234567890";
        const mockMessage = "Mock SIWE message";
        const mockSignature = "0xabcdef";
        const mockUser = {
            id: "user-123",
            walletAddress: mockWalletAddress,
        };
        const mockToken = "mock-jwt-token";

        beforeEach(() => {
            mockRequest = {
                body: {
                    message: mockMessage,
                    signature: mockSignature,
                },
            };
        });

        it("should successfully login with valid SIWE message and signature", async () => {
            // Mock SiweMessage verification
            const mockVerify = jest.fn().mockResolvedValue({
                data: { address: mockWalletAddress },
            });
            (SiweMessage as jest.Mock).mockImplementation(() => ({
                verify: mockVerify,
            }));

            // Mock database operations
            (findOrCreateUser as jest.Mock).mockResolvedValue(mockUser);
            (updateUserLastLogin as jest.Mock).mockResolvedValue(undefined);

            // Mock JWT signing
            (jwt.sign as jest.Mock).mockReturnValue(mockToken);

            await siweLogin(mockRequest as Request, mockResponse as Response);

            expect(SiweMessage).toHaveBeenCalledWith(mockMessage);
            expect(mockVerify).toHaveBeenCalledWith({ signature: mockSignature });
            expect(findOrCreateUser).toHaveBeenCalledWith(mockWalletAddress);
            expect(updateUserLastLogin).toHaveBeenCalledWith(mockUser.id);
            expect(jwt.sign).toHaveBeenCalledWith(
                { address: mockUser.walletAddress, userId: mockUser.id },
                "test-secret-key",
                { expiresIn: "10h" }
            );
            expect(jsonMock).toHaveBeenCalledWith({ token: mockToken });
        });

        it("should return 400 when message is missing", async () => {
            mockRequest.body = { signature: mockSignature };

            await siweLogin(mockRequest as Request, mockResponse as Response);

            expect(statusMock).toHaveBeenCalledWith(400);
            expect(jsonMock).toHaveBeenCalledWith({
                message: "Message and signature required",
            });
            expect(SiweMessage).not.toHaveBeenCalled();
        });

        it("should return 400 when signature is missing", async () => {
            mockRequest.body = { message: mockMessage };

            await siweLogin(mockRequest as Request, mockResponse as Response);

            expect(statusMock).toHaveBeenCalledWith(400);
            expect(jsonMock).toHaveBeenCalledWith({
                message: "Message and signature required",
            });
            expect(SiweMessage).not.toHaveBeenCalled();
        });

        it("should return 400 when both message and signature are missing", async () => {
            mockRequest.body = {};

            await siweLogin(mockRequest as Request, mockResponse as Response);

            expect(statusMock).toHaveBeenCalledWith(400);
            expect(jsonMock).toHaveBeenCalledWith({
                message: "Message and signature required",
            });
            expect(SiweMessage).not.toHaveBeenCalled();
        });

        it("should return 401 when SIWE verification fails", async () => {
            const mockVerify = jest.fn().mockRejectedValue(new Error("Verification failed"));
            (SiweMessage as jest.Mock).mockImplementation(() => ({
                verify: mockVerify,
            }));

            const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();

            await siweLogin(mockRequest as Request, mockResponse as Response);

            expect(statusMock).toHaveBeenCalledWith(401);
            expect(jsonMock).toHaveBeenCalledWith({
                message: "Invalid SIWE signature",
            });
            expect(consoleErrorSpy).toHaveBeenCalledWith(
                "SIWE login error:",
                expect.any(Error)
            );

            consoleErrorSpy.mockRestore();
        });

        it("should throw error when JWT_SECRET is not set", async () => {
            delete process.env.JWT_SECRET;

            const mockVerify = jest.fn().mockResolvedValue({
                data: { address: mockWalletAddress },
            });
            (SiweMessage as jest.Mock).mockImplementation(() => ({
                verify: mockVerify,
            }));

            const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();

            await siweLogin(mockRequest as Request, mockResponse as Response);

            expect(statusMock).toHaveBeenCalledWith(401);
            expect(jsonMock).toHaveBeenCalledWith({
                message: "Invalid SIWE signature",
            });
            expect(consoleErrorSpy).toHaveBeenCalledWith(
                "SIWE login error:",
                expect.any(Error)
            );

            consoleErrorSpy.mockRestore();
        });

        it("should return 401 when findOrCreateUser fails", async () => {
            const mockVerify = jest.fn().mockResolvedValue({
                data: { address: mockWalletAddress },
            });
            (SiweMessage as jest.Mock).mockImplementation(() => ({
                verify: mockVerify,
            }));

            (findOrCreateUser as jest.Mock).mockRejectedValue(
                new Error("Database error")
            );

            const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();

            await siweLogin(mockRequest as Request, mockResponse as Response);

            expect(statusMock).toHaveBeenCalledWith(401);
            expect(jsonMock).toHaveBeenCalledWith({
                message: "Invalid SIWE signature",
            });
            expect(consoleErrorSpy).toHaveBeenCalledWith(
                "SIWE login error:",
                expect.any(Error)
            );

            consoleErrorSpy.mockRestore();
        });

        it("should return 401 when updateUserLastLogin fails", async () => {
            const mockVerify = jest.fn().mockResolvedValue({
                data: { address: mockWalletAddress },
            });
            (SiweMessage as jest.Mock).mockImplementation(() => ({
                verify: mockVerify,
            }));

            (findOrCreateUser as jest.Mock).mockResolvedValue(mockUser);
            (updateUserLastLogin as jest.Mock).mockRejectedValue(
                new Error("Update failed")
            );

            const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();

            await siweLogin(mockRequest as Request, mockResponse as Response);

            expect(statusMock).toHaveBeenCalledWith(401);
            expect(jsonMock).toHaveBeenCalledWith({
                message: "Invalid SIWE signature",
            });
            expect(consoleErrorSpy).toHaveBeenCalledWith(
                "SIWE login error:",
                expect.any(Error)
            );

            consoleErrorSpy.mockRestore();
        });

        it("should call all functions in correct order on success", async () => {
            const callOrder: string[] = [];

            const mockVerify = jest.fn().mockImplementation(async () => {
                callOrder.push("verify");
                return { data: { address: mockWalletAddress } };
            });

            (SiweMessage as jest.Mock).mockImplementation(() => ({
                verify: mockVerify,
            }));

            (findOrCreateUser as jest.Mock).mockImplementation(async () => {
                callOrder.push("findOrCreateUser");
                return mockUser;
            });

            (updateUserLastLogin as jest.Mock).mockImplementation(async () => {
                callOrder.push("updateUserLastLogin");
            });

            (jwt.sign as jest.Mock).mockImplementation(() => {
                callOrder.push("jwt.sign");
                return mockToken;
            });

            await siweLogin(mockRequest as Request, mockResponse as Response);

            expect(callOrder).toEqual([
                "verify",
                "findOrCreateUser",
                "updateUserLastLogin",
                "jwt.sign",
            ]);
        });
    });
});