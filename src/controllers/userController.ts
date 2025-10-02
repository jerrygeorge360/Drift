import { Request, Response, NextFunction } from "express";
import prisma from "../config/db";

// GET /api/users
export const getUsers = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const users = await prisma.user.findMany();
        res.json(users);
    } catch (err) {
        next(err);
    }
};

// POST /api/users
export const createUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { name, email } = req.body;
        const user = await prisma.user.create({ data: { name, email } });
        res.status(201).json(user);
    } catch (err) {
        next(err);
    }
};
