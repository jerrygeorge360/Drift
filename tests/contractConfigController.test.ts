import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { Request, Response } from "express";
import {
    createConfig,
    getConfigByAddress,
    getAllConfigs,
    togglePause,
    deleteConfig,
} from "../src/controllers/contractConfigController.js";
import {
    createOrUpdateContractConfig,
    getContractConfigByAddress,
    getAllContractConfigs,
    updateContractPauseStatus,
    deleteContractConfig,
} from "../src/utils/dbhelpers.js";

// Mock dependencies
jest.mock("../src/utils/dbhelpers.js");

describe("Contract Config Controller", () => {
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

    describe("createConfig", () => {
        const mockConfigData = {
            contractAddress: "0x1234567890abcdef",
            network: "ethereum",
            owner: "0xowner123",
        };

        const mockCreatedConfig = {
            id: "config-123",
            ...mockConfigData,
            paused: false,
            createdAt: new Date(),
        };

        it("should successfully create contract config with all required fields", async () => {
            mockRequest.body = mockConfigData;
            (createOrUpdateContractConfig as jest.Mock).mockResolvedValue(mockCreatedConfig);

            await createConfig(mockRequest as Request, mockResponse as Response);

            expect(createOrUpdateContractConfig).toHaveBeenCalledWith(mockConfigData);
            expect(statusMock).toHaveBeenCalledWith(201);
            expect(jsonMock).toHaveBeenCalledWith(mockCreatedConfig);
        });

        it("should return 400 when contractAddress is missing", async () => {
            mockRequest.body = {
                network: "ethereum",
                owner: "0xowner123",
            };

            await createConfig(mockRequest as Request, mockResponse as Response);

            expect(createOrUpdateContractConfig).not.toHaveBeenCalled();
            expect(statusMock).toHaveBeenCalledWith(400);
            expect(jsonMock).toHaveBeenCalledWith({
                message: "Missing required fields",
            });
        });

        it("should return 400 when network is missing", async () => {
            mockRequest.body = {
                contractAddress: "0x1234567890abcdef",
                owner: "0xowner123",
            };

            await createConfig(mockRequest as Request, mockResponse as Response);

            expect(createOrUpdateContractConfig).not.toHaveBeenCalled();
            expect(statusMock).toHaveBeenCalledWith(400);
            expect(jsonMock).toHaveBeenCalledWith({
                message: "Missing required fields",
            });
        });

        it("should return 400 when owner is missing", async () => {
            mockRequest.body = {
                contractAddress: "0x1234567890abcdef",
                network: "ethereum",
            };

            await createConfig(mockRequest as Request, mockResponse as Response);

            expect(createOrUpdateContractConfig).not.toHaveBeenCalled();
            expect(statusMock).toHaveBeenCalledWith(400);
            expect(jsonMock).toHaveBeenCalledWith({
                message: "Missing required fields",
            });
        });

        it("should return 400 when all required fields are missing", async () => {
            mockRequest.body = {};

            await createConfig(mockRequest as Request, mockResponse as Response);

            expect(createOrUpdateContractConfig).not.toHaveBeenCalled();
            expect(statusMock).toHaveBeenCalledWith(400);
            expect(jsonMock).toHaveBeenCalledWith({
                message: "Missing required fields",
            });
        });

        it("should return 500 when database operation fails", async () => {
            mockRequest.body = mockConfigData;
            (createOrUpdateContractConfig as jest.Mock).mockRejectedValue(
                new Error("Database error")
            );

            await createConfig(mockRequest as Request, mockResponse as Response);

            expect(statusMock).toHaveBeenCalledWith(500);
            expect(jsonMock).toHaveBeenCalledWith({ message: "Database error" });
        });
    });

    describe("getConfigByAddress", () => {
        const mockConfig = {
            id: "config-123",
            contractAddress: "0x1234567890abcdef",
            network: "ethereum",
            owner: "0xowner123",
            paused: false,
        };

        it("should successfully get config by address", async () => {
            mockRequest.params = { address: "0x1234567890abcdef" };
            (getContractConfigByAddress as jest.Mock).mockResolvedValue(mockConfig);

            await getConfigByAddress(mockRequest as Request, mockResponse as Response);

            expect(getContractConfigByAddress).toHaveBeenCalledWith("0x1234567890abcdef");
            expect(statusMock).toHaveBeenCalledWith(200);
            expect(jsonMock).toHaveBeenCalledWith(mockConfig);
        });

        it("should return 404 when config is not found", async () => {
            mockRequest.params = { address: "0xnonexistent" };
            (getContractConfigByAddress as jest.Mock).mockResolvedValue(null);

            await getConfigByAddress(mockRequest as Request, mockResponse as Response);

            expect(statusMock).toHaveBeenCalledWith(404);
            expect(jsonMock).toHaveBeenCalledWith({ message: "Contract not found" });
        });

        it("should return 500 when database operation fails", async () => {
            mockRequest.params = { address: "0x1234567890abcdef" };
            (getContractConfigByAddress as jest.Mock).mockRejectedValue(
                new Error("Database error")
            );

            await getConfigByAddress(mockRequest as Request, mockResponse as Response);

            expect(statusMock).toHaveBeenCalledWith(500);
            expect(jsonMock).toHaveBeenCalledWith({ message: "Database error" });
        });
    });

    describe("getAllConfigs", () => {
        const mockConfigs = [
            {
                id: "config-1",
                contractAddress: "0xabc",
                network: "ethereum",
                owner: "0xowner1",
                paused: false,
            },
            {
                id: "config-2",
                contractAddress: "0xdef",
                network: "ethereum",
                owner: "0xowner2",
                paused: true,
            },
        ];

        it("should get all configs without network filter", async () => {
            mockRequest.query = {};
            (getAllContractConfigs as jest.Mock).mockResolvedValue(mockConfigs);

            await getAllConfigs(mockRequest as Request, mockResponse as Response);

            expect(getAllContractConfigs).toHaveBeenCalledWith(undefined);
            expect(statusMock).toHaveBeenCalledWith(200);
            expect(jsonMock).toHaveBeenCalledWith(mockConfigs);
        });

        it("should get all configs with network filter", async () => {
            mockRequest.query = { network: "ethereum" };
            const ethereumConfigs = mockConfigs.filter((c) => c.network === "ethereum");
            (getAllContractConfigs as jest.Mock).mockResolvedValue(ethereumConfigs);

            await getAllConfigs(mockRequest as Request, mockResponse as Response);

            expect(getAllContractConfigs).toHaveBeenCalledWith("ethereum");
            expect(statusMock).toHaveBeenCalledWith(200);
            expect(jsonMock).toHaveBeenCalledWith(ethereumConfigs);
        });

        it("should get configs for different network", async () => {
            mockRequest.query = { network: "polygon" };
            const polygonConfigs = [
                {
                    id: "config-3",
                    contractAddress: "0xghi",
                    network: "polygon",
                    owner: "0xowner3",
                    paused: false,
                },
            ];
            (getAllContractConfigs as jest.Mock).mockResolvedValue(polygonConfigs);

            await getAllConfigs(mockRequest as Request, mockResponse as Response);

            expect(getAllContractConfigs).toHaveBeenCalledWith("polygon");
            expect(jsonMock).toHaveBeenCalledWith(polygonConfigs);
        });

        it("should return empty array when no configs exist", async () => {
            mockRequest.query = {};
            (getAllContractConfigs as jest.Mock).mockResolvedValue([]);

            await getAllConfigs(mockRequest as Request, mockResponse as Response);

            expect(statusMock).toHaveBeenCalledWith(200);
            expect(jsonMock).toHaveBeenCalledWith([]);
        });

        it("should return 500 when database operation fails", async () => {
            mockRequest.query = {};
            (getAllContractConfigs as jest.Mock).mockRejectedValue(
                new Error("Database error")
            );

            await getAllConfigs(mockRequest as Request, mockResponse as Response);

            expect(statusMock).toHaveBeenCalledWith(500);
            expect(jsonMock).toHaveBeenCalledWith({ message: "Database error" });
        });
    });

    describe("togglePause", () => {
        const mockUpdatedConfig = {
            id: "config-123",
            contractAddress: "0x1234567890abcdef",
            network: "ethereum",
            owner: "0xowner123",
            paused: true,
        };

        it("should successfully pause contract (paused=true)", async () => {
            mockRequest.params = { address: "0x1234567890abcdef" };
            mockRequest.body = { paused: true };
            (updateContractPauseStatus as jest.Mock).mockResolvedValue(mockUpdatedConfig);

            await togglePause(mockRequest as Request, mockResponse as Response);

            expect(updateContractPauseStatus).toHaveBeenCalledWith(
                "0x1234567890abcdef",
                true
            );
            expect(statusMock).toHaveBeenCalledWith(200);
            expect(jsonMock).toHaveBeenCalledWith(mockUpdatedConfig);
        });

        it("should successfully unpause contract (paused=false)", async () => {
            mockRequest.params = { address: "0x1234567890abcdef" };
            mockRequest.body = { paused: false };
            const unpausedConfig = { ...mockUpdatedConfig, paused: false };
            (updateContractPauseStatus as jest.Mock).mockResolvedValue(unpausedConfig);

            await togglePause(mockRequest as Request, mockResponse as Response);

            expect(updateContractPauseStatus).toHaveBeenCalledWith(
                "0x1234567890abcdef",
                false
            );
            expect(statusMock).toHaveBeenCalledWith(200);
            expect(jsonMock).toHaveBeenCalledWith(unpausedConfig);
        });

        it("should return 400 when paused is not a boolean", async () => {
            mockRequest.params = { address: "0x1234567890abcdef" };
            mockRequest.body = { paused: "true" };

            await togglePause(mockRequest as Request, mockResponse as Response);

            expect(updateContractPauseStatus).not.toHaveBeenCalled();
            expect(statusMock).toHaveBeenCalledWith(400);
            expect(jsonMock).toHaveBeenCalledWith({
                message: "paused must be a boolean",
            });
        });

        it("should return 400 when paused is a number", async () => {
            mockRequest.params = { address: "0x1234567890abcdef" };
            mockRequest.body = { paused: 1 };

            await togglePause(mockRequest as Request, mockResponse as Response);

            expect(updateContractPauseStatus).not.toHaveBeenCalled();
            expect(statusMock).toHaveBeenCalledWith(400);
            expect(jsonMock).toHaveBeenCalledWith({
                message: "paused must be a boolean",
            });
        });

        it("should return 400 when paused is null", async () => {
            mockRequest.params = { address: "0x1234567890abcdef" };
            mockRequest.body = { paused: null };

            await togglePause(mockRequest as Request, mockResponse as Response);

            expect(updateContractPauseStatus).not.toHaveBeenCalled();
            expect(statusMock).toHaveBeenCalledWith(400);
            expect(jsonMock).toHaveBeenCalledWith({
                message: "paused must be a boolean",
            });
        });

        it("should return 400 when paused is undefined", async () => {
            mockRequest.params = { address: "0x1234567890abcdef" };
            mockRequest.body = {};

            await togglePause(mockRequest as Request, mockResponse as Response);

            expect(updateContractPauseStatus).not.toHaveBeenCalled();
            expect(statusMock).toHaveBeenCalledWith(400);
            expect(jsonMock).toHaveBeenCalledWith({
                message: "paused must be a boolean",
            });
        });

        it("should return 500 when database operation fails", async () => {
            mockRequest.params = { address: "0x1234567890abcdef" };
            mockRequest.body = { paused: true };
            (updateContractPauseStatus as jest.Mock).mockRejectedValue(
                new Error("Update failed")
            );

            await togglePause(mockRequest as Request, mockResponse as Response);

            expect(statusMock).toHaveBeenCalledWith(500);
            expect(jsonMock).toHaveBeenCalledWith({ message: "Update failed" });
        });
    });

    describe("deleteConfig", () => {
        it("should successfully delete contract config", async () => {
            mockRequest.params = { address: "0x1234567890abcdef" };
            (deleteContractConfig as jest.Mock).mockResolvedValue(undefined);

            await deleteConfig(mockRequest as Request, mockResponse as Response);

            expect(deleteContractConfig).toHaveBeenCalledWith("0x1234567890abcdef");
            expect(statusMock).toHaveBeenCalledWith(200);
            expect(jsonMock).toHaveBeenCalledWith({
                message: "Contract config deleted successfully",
            });
        });

        it("should successfully delete with different address", async () => {
            mockRequest.params = { address: "0xabcdef123456" };
            (deleteContractConfig as jest.Mock).mockResolvedValue(undefined);

            await deleteConfig(mockRequest as Request, mockResponse as Response);

            expect(deleteContractConfig).toHaveBeenCalledWith("0xabcdef123456");
            expect(statusMock).toHaveBeenCalledWith(200);
        });

        it("should return 500 when delete operation fails", async () => {
            mockRequest.params = { address: "0x1234567890abcdef" };
            (deleteContractConfig as jest.Mock).mockRejectedValue(
                new Error("Delete failed")
            );

            await deleteConfig(mockRequest as Request, mockResponse as Response);

            expect(statusMock).toHaveBeenCalledWith(500);
            expect(jsonMock).toHaveBeenCalledWith({ message: "Delete failed" });
        });

        it("should handle deletion of non-existent contract", async () => {
            mockRequest.params = { address: "0xnonexistent" };
            (deleteContractConfig as jest.Mock).mockRejectedValue(
                new Error("Contract not found")
            );

            await deleteConfig(mockRequest as Request, mockResponse as Response);

            expect(statusMock).toHaveBeenCalledWith(500);
            expect(jsonMock).toHaveBeenCalledWith({ message: "Contract not found" });
        });
    });
});