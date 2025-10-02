import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import prisma from "../config/db";
import bcrypt from "bcryptjs";

export const login = async (req: Request, res: Response) => {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET || "changeme", {
        expiresIn: "1h",
    });

    res.json({ token });
};
