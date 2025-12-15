import { Request, Response } from "express";
import {
    createOrUpdateContractConfig,
    getContractConfigByAddress,
    getAllContractConfigs,
    updateContractPauseStatus,
    deleteContractConfig,
    getContractConfigByName,
    deleteContractConfigByName,
} from "../utils/dbhelpers.js";

//  Create new contract config
export async function createConfig(req: Request, res: Response) {
    try {
        const { contractAddress,name, network, owner } = req.body;

        if (!contractAddress || !name || !owner) {
            return res.status(400).json({ message: "Missing required fields" });
        }

        const config = await createOrUpdateContractConfig({ name,contractAddress, network, owner });
        res.status(201).json(config);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
}

//  Get a single config
export async function getConfigByAddress(req: Request, res: Response) {
    try {
        const { address } = req.params;
        const config = await getContractConfigByAddress(address);

        if (!config) {
            return res.status(404).json({ message: "Contract not found" });
        }

        res.status(200).json(config);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
}

export async function getConfigByName(req: Request, res: Response) {
    try {
        const { name } = req.params;
        const config = await getContractConfigByName(name);

        if (!config) {
            return res.status(404).json({ message: "Contract not found" });
        }

        res.status(200).json(config);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
}

//  Get all configs (optional ?network=)
export async function getAllConfigs(req: Request, res: Response) {
    try {
        const { network } = req.query;
        const configs = await getAllContractConfigs(network as string);
        res.status(200).json(configs);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
}

//  Toggle pause state
export async function togglePause(req: Request, res: Response) {
    try {
        const { name } = req.params;
        const { paused } = req.body;

        if (typeof paused !== "boolean") {
            return res.status(400).json({ message: "paused must be a boolean" });
        }

        const updated = await updateContractPauseStatus(name, paused);
        res.status(200).json(updated);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
}


// Delete contract config
export async function deleteConfig(req: Request, res: Response) {
    try {
        const { address } = req.params;
        await deleteContractConfig(address);
        res.status(200).json({ message: "Contract config deleted successfully" });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
}

export async function deleteConfigByName(req: Request, res: Response) {
    try {
        const { name } = req.params;
        await deleteContractConfigByName(name);
        res.status(200).json({ message: "Contract config deleted successfully" });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
}



// DONE : go through this and implement it