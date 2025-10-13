import { Router } from "express";
import {
    deleteUserByIdController,
    getUserByIdController,
    listUsersController
} from "../controllers/userController.js";
import authMiddleware, {requireRole} from "../middleware/authMiddleware.js";

const userRouter = Router();

userRouter.delete("/:id", deleteUserByIdController);
userRouter.get("/:id",getUserByIdController );
userRouter.get("/", authMiddleware,requireRole(["admin"]),listUsersController)

export default userRouter;
