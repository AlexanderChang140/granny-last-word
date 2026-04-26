import express from "express";
import { authMiddleware } from "../auth/middleware.js";
import { getPosts, postPost } from "./controller.js";

const router = express.Router();

router.get("/posts", authMiddleware, getPosts);
router.post("/posts", authMiddleware, postPost);

export default router;