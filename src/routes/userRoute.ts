import { Router } from "express";
import { getUsers, createUser } from "../controllers/userController.js";
import authMiddleware from "../middleware/authMiddleware.js";
const router = Router();

router.get("/",authMiddleware, getUsers);
router.post("/", createUser);

export default router;
