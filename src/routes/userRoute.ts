import { Router } from "express";
import {
    deleteUserByIdController,
    getUserByIdController,
    listUsersController
} from "../controllers/userController.js";

const userRouter = Router();

userRouter.delete("/users/:id", deleteUserByIdController);
userRouter.get("/users/:id",getUserByIdController );
userRouter.get("/users",listUsersController)

export default userRouter;
