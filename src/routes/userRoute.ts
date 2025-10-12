import { Router } from "express";
import {
    deleteUserByIdController,
    getUserByIdController,
    listUsersController
} from "../controllers/userController.js";

const userRouter = Router();

userRouter.delete("/:id", deleteUserByIdController);
userRouter.get("/:id",getUserByIdController );
userRouter.get("/",listUsersController)

export default userRouter;
