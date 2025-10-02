import { Router } from "express";
import { getUsers, createUser } from "../controllers/userController";
import authMiddleware from "../middleware/authMiddleware";
const router = Router();

router.get("/",authMiddleware, getUsers);
router.post("/", createUser);

export default router;
