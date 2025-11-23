import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { Request, Response } from "express";
import {
    createBotController,
    getAllBotsController,
    getBotByIdController,
    updateBotController,
    deleteBotController,
    runAgentController,
} from "../src/controllers/botController.js";
import {
    createBot,
    getAllBots,
    getBotById,
    updateBot,
    deleteBot,
} from "../src/utils/dbhelpers.js";
import { runAIAgent } from "../src/modules/bot/bot.agent.js";

// Mock dependencies
jest.mock("../src/utils/dbhelpers.js");
jest.mock("../src/modules/bot/bot.agent.js");

describe("Bot Controller", () => {
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;
    let jsonMock: jest.Mock;
    let statusMock: jest.Mock;

    beforeEach(() => {
        jest.clearAllMocks();

        jsonMock = jest.fn();
        statusMock = jest.fn().mockReturnValue({ json: jsonMock });

        mockRequest = {
            body: {},
            params: {},
            query: {},
        };
        mockResponse = {
            json: jsonMock,
            status: statusMock,
        };
    });

    describe("createBotController", () => {
        const mockBotData = {
            name: "Test Bot",
            description: "Test Description",
            address: "0x123",
            privateKey: "test-private-key",
            status: "active",
        };

        const mockCreatedBot = {
            id: "bot-123",
            ...mockBotData,
            createdAt: new Date(),
        };

        it("should successfully create a bot with all fields", async () => {
            mockRequest.body = mockBotData;
            (createBot as jest.Mock).mockResolvedValue(mockCreatedBot);

            await createBotController(mockRequest as Request, mockResponse as Response);

            expect(createBot).toHaveBeenCalledWith(mockBotData);
            expect(statusMock).toHaveBeenCalledWith(201);
            expect(jsonMock).toHaveBeenCalledWith(mockCreatedBot);
        });

        it("should create a bot with only required fields", async () => {
            const minimalData = {
                name: "Minimal Bot",
                privateKey: "test-key",
            };
            mockRequest.body = minimalData;
            (createBot as jest.Mock).mockResolvedValue({ id: "bot-456", ...minimalData });

            await createBotController(mockRequest as Request, mockResponse as Response);

            expect(createBot).toHaveBeenCalledWith(minimalData);
            expect(statusMock).toHaveBeenCalledWith(201);
        });

        it("should return 400 when name is missing", async () => {
            mockRequest.body = { privateKey: "test-key" };

            await createBotController(mockRequest as Request, mockResponse as Response);

            expect(createBot).not.toHaveBeenCalled();
            expect(statusMock).toHaveBeenCalledWith(400);
            expect(jsonMock).toHaveBeenCalledWith({
                message: "Missing name or privateKey",
            });
        });

        it("should return 400 when privateKey is missing", async () => {
            mockRequest.body = { name: "Test Bot" };

            await createBotController(mockRequest as Request, mockResponse as Response);

            expect(createBot).not.toHaveBeenCalled();
            expect(statusMock).toHaveBeenCalledWith(400);
            expect(jsonMock).toHaveBeenCalledWith({
                message: "Missing name or privateKey",
            });
        });

        it("should return 400 when both name and privateKey are missing", async () => {
            mockRequest.body = { description: "No required fields" };

            await createBotController(mockRequest as Request, mockResponse as Response);

            expect(createBot).not.toHaveBeenCalled();
            expect(statusMock).toHaveBeenCalledWith(400);
            expect(jsonMock).toHaveBeenCalledWith({
                message: "Missing name or privateKey",
            });
        });

        it("should return 500 when database operation fails", async () => {
            mockRequest.body = mockBotData;
            (createBot as jest.Mock).mockRejectedValue(new Error("Database error"));

            await createBotController(mockRequest as Request, mockResponse as Response);

            expect(statusMock).toHaveBeenCalledWith(500);
            expect(jsonMock).toHaveBeenCalledWith({ message: "Database error" });
        });
    });

    describe("getAllBotsController", () => {
        it("should return all bots successfully", async () => {
            const mockBots = [
                { id: "bot-1", name: "Bot 1", status: "active" },
                { id: "bot-2", name: "Bot 2", status: "inactive" },
            ];
            (getAllBots as jest.Mock).mockResolvedValue(mockBots);

            await getAllBotsController(mockRequest as Request, mockResponse as Response);

            expect(getAllBots).toHaveBeenCalledTimes(1);
            expect(statusMock).toHaveBeenCalledWith(200);
            expect(jsonMock).toHaveBeenCalledWith(mockBots);
        });

        it("should return empty array when no bots exist", async () => {
            (getAllBots as jest.Mock).mockResolvedValue([]);

            await getAllBotsController(mockRequest as Request, mockResponse as Response);

            expect(statusMock).toHaveBeenCalledWith(200);
            expect(jsonMock).toHaveBeenCalledWith([]);
        });

        it("should return 500 when database operation fails", async () => {
            (getAllBots as jest.Mock).mockRejectedValue(new Error("Database error"));

            await getAllBotsController(mockRequest as Request, mockResponse as Response);

            expect(statusMock).toHaveBeenCalledWith(500);
            expect(jsonMock).toHaveBeenCalledWith({ message: "Database error" });
        });
    });

    describe("getBotByIdController", () => {
        const mockBot = {
            id: "bot-123",
            name: "Test Bot",
            description: "Test Description",
            address: "0x123",
            status: "active",
        };

        const mockBotWithKey = {
            ...mockBot,
            privateKey: "test-private-key",
        };

        it("should get bot by id without private key by default", async () => {
            mockRequest.params = { id: "bot-123" };
            mockRequest.query = {};
            (getBotById as jest.Mock).mockResolvedValue(mockBot);

            await getBotByIdController(mockRequest as Request, mockResponse as Response);

            expect(getBotById).toHaveBeenCalledWith("bot-123", false);
            expect(statusMock).toHaveBeenCalledWith(200);
            expect(jsonMock).toHaveBeenCalledWith(mockBot);
        });

        it("should get bot by id with private key when withPrivateKey=true", async () => {
            mockRequest.params = { id: "bot-123" };
            mockRequest.query = { withPrivateKey: "true" };
            (getBotById as jest.Mock).mockResolvedValue(mockBotWithKey);

            await getBotByIdController(mockRequest as Request, mockResponse as Response);

            expect(getBotById).toHaveBeenCalledWith("bot-123", true);
            expect(statusMock).toHaveBeenCalledWith(200);
            expect(jsonMock).toHaveBeenCalledWith(mockBotWithKey);
        });

        it("should get bot without private key when withPrivateKey=false", async () => {
            mockRequest.params = { id: "bot-123" };
            mockRequest.query = { withPrivateKey: "false" };
            (getBotById as jest.Mock).mockResolvedValue(mockBot);

            await getBotByIdController(mockRequest as Request, mockResponse as Response);

            expect(getBotById).toHaveBeenCalledWith("bot-123", false);
            expect(statusMock).toHaveBeenCalledWith(200);
        });

        it("should return 404 when bot is not found", async () => {
            mockRequest.params = { id: "non-existent" };
            (getBotById as jest.Mock).mockResolvedValue(null);

            await getBotByIdController(mockRequest as Request, mockResponse as Response);

            expect(statusMock).toHaveBeenCalledWith(404);
            expect(jsonMock).toHaveBeenCalledWith({ message: "Bot not found" });
        });

        it("should return 500 when database operation fails", async () => {
            mockRequest.params = { id: "bot-123" };
            (getBotById as jest.Mock).mockRejectedValue(new Error("Database error"));

            await getBotByIdController(mockRequest as Request, mockResponse as Response);

            expect(statusMock).toHaveBeenCalledWith(500);
            expect(jsonMock).toHaveBeenCalledWith({ message: "Database error" });
        });
    });

    describe("updateBotController", () => {
        const mockUpdatedBot = {
            id: "bot-123",
            name: "Updated Bot",
            description: "Updated Description",
            privateKey: "new-key",
            status: "inactive",
        };

        it("should successfully update bot with all fields", async () => {
            mockRequest.params = { id: "bot-123" };
            mockRequest.body = {
                name: "Updated Bot",
                description: "Updated Description",
                privateKey: "new-key",
                status: "inactive",
            };
            (updateBot as jest.Mock).mockResolvedValue(mockUpdatedBot);

            await updateBotController(mockRequest as Request, mockResponse as Response);

            expect(updateBot).toHaveBeenCalledWith("bot-123", mockRequest.body);
            expect(statusMock).toHaveBeenCalledWith(200);
            expect(jsonMock).toHaveBeenCalledWith(mockUpdatedBot);
        });

        it("should update bot with partial fields", async () => {
            mockRequest.params = { id: "bot-123" };
            mockRequest.body = { name: "New Name" };
            (updateBot as jest.Mock).mockResolvedValue({ ...mockUpdatedBot, name: "New Name" });

            await updateBotController(mockRequest as Request, mockResponse as Response);

            expect(updateBot).toHaveBeenCalledWith("bot-123", { name: "New Name" });
            expect(statusMock).toHaveBeenCalledWith(200);
        });

        it("should update bot with empty body", async () => {
            mockRequest.params = { id: "bot-123" };
            mockRequest.body = {};
            (updateBot as jest.Mock).mockResolvedValue(mockUpdatedBot);

            await updateBotController(mockRequest as Request, mockResponse as Response);

            expect(updateBot).toHaveBeenCalledWith("bot-123", {});
            expect(statusMock).toHaveBeenCalledWith(200);
        });

        it("should return 500 when database operation fails", async () => {
            mockRequest.params = { id: "bot-123" };
            mockRequest.body = { name: "Updated Bot" };
            (updateBot as jest.Mock).mockRejectedValue(new Error("Update failed"));

            await updateBotController(mockRequest as Request, mockResponse as Response);

            expect(statusMock).toHaveBeenCalledWith(500);
            expect(jsonMock).toHaveBeenCalledWith({ message: "Update failed" });
        });
    });

    describe("deleteBotController", () => {
        it("should successfully delete bot", async () => {
            mockRequest.params = { id: "bot-123" };
            (deleteBot as jest.Mock).mockResolvedValue(undefined);

            await deleteBotController(mockRequest as Request, mockResponse as Response);

            expect(deleteBot).toHaveBeenCalledWith("bot-123");
            expect(statusMock).toHaveBeenCalledWith(200);
            expect(jsonMock).toHaveBeenCalledWith({
                message: "Bot deleted successfully",
            });
        });

        it("should return 500 when delete operation fails", async () => {
            mockRequest.params = { id: "bot-123" };
            (deleteBot as jest.Mock).mockRejectedValue(new Error("Delete failed"));

            await deleteBotController(mockRequest as Request, mockResponse as Response);

            expect(statusMock).toHaveBeenCalledWith(500);
            expect(jsonMock).toHaveBeenCalledWith({ message: "Delete failed" });
        });

        it("should handle deletion of non-existent bot", async () => {
            mockRequest.params = { id: "non-existent" };
            (deleteBot as jest.Mock).mockRejectedValue(new Error("Bot not found"));

            await deleteBotController(mockRequest as Request, mockResponse as Response);

            expect(statusMock).toHaveBeenCalledWith(500);
            expect(jsonMock).toHaveBeenCalledWith({ message: "Bot not found" });
        });
    });

    describe("runAgentController", () => {
        const mockAgentResult = {
            success: true,
            data: { result: "Agent executed successfully" },
        };

        it("should successfully run AI agent", async () => {
            mockRequest.body = {
                botName: "Test Bot",
                smartAccountId: "account-123",
            };
            (runAIAgent as jest.Mock).mockResolvedValue(mockAgentResult);

            await runAgentController(mockRequest as Request, mockResponse as Response);

            expect(runAIAgent).toHaveBeenCalledWith("Test Bot", "account-123");
            expect(statusMock).toHaveBeenCalledWith(200);
            expect(jsonMock).toHaveBeenCalledWith(mockAgentResult);
        });

        it("should handle agent execution with different parameters", async () => {
            mockRequest.body = {
                botName: "Another Bot",
                smartAccountId: "account-456",
            };
            const differentResult = { success: true, data: { result: "Different result" } };
            (runAIAgent as jest.Mock).mockResolvedValue(differentResult);

            await runAgentController(mockRequest as Request, mockResponse as Response);

            expect(runAIAgent).toHaveBeenCalledWith("Another Bot", "account-456");
            expect(jsonMock).toHaveBeenCalledWith(differentResult);
        });

        it("should return 500 when agent execution fails", async () => {
            mockRequest.body = {
                botName: "Test Bot",
                smartAccountId: "account-123",
            };
            (runAIAgent as jest.Mock).mockRejectedValue(new Error("Agent execution failed"));

            await runAgentController(mockRequest as Request, mockResponse as Response);

            expect(statusMock).toHaveBeenCalledWith(500);
            expect(jsonMock).toHaveBeenCalledWith({ message: "Agent execution failed" });
        });

        it("should handle missing botName", async () => {
            mockRequest.body = { smartAccountId: "account-123" };
            (runAIAgent as jest.Mock).mockRejectedValue(new Error("botName is required"));

            await runAgentController(mockRequest as Request, mockResponse as Response);

            expect(statusMock).toHaveBeenCalledWith(500);
            expect(jsonMock).toHaveBeenCalledWith({ message: "botName is required" });
        });

        it("should handle missing smartAccountId", async () => {
            mockRequest.body = { botName: "Test Bot" };
            (runAIAgent as jest.Mock).mockRejectedValue(
                new Error("smartAccountId is required")
            );

            await runAgentController(mockRequest as Request, mockResponse as Response);

            expect(statusMock).toHaveBeenCalledWith(500);
            expect(jsonMock).toHaveBeenCalledWith({ message: "smartAccountId is required" });
        });
    });
});