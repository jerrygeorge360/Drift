import {Request,Response,NextFunction} from "express";
import {deleteUserById, getAllUsers, getUserById} from "../utils/dbhelpers.js";




// DELETE /users/:id
export const deleteUserByIdController = async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.params.id;
    if (!userId) return res.status(400).json({ message: "User ID is required" });

    await deleteUserById(userId);
    res.status(200).json({ message: "User deleted successfully" });
};


// GET /users/:id
export const getUserByIdController = async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.params.id;
    const user = await getUserById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
};


// GET /users
export const listUsersController = async (_req: Request, res: Response, next: NextFunction) => {
    const users = await getAllUsers();
    res.json(users);
};

