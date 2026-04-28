import type { Request, Response } from "express";
import { createPost, getAllPosts } from "./service.js";

export async function getPosts(_req: Request, res: Response) {
    try {
        const posts = await getAllPosts();
        return res.status(200).json(posts);
    } catch {
        return res.status(500).json({ error: "Failed to load forum posts" });
    }
}

export async function postPost(req: Request, res: Response) {
    try {
        const username = res.locals.user.username;
        const content = req.body.content?.toString() ?? "";

        if (!content.trim()) {
            return res.status(400).json({ error: "Post content is required" });
        }

        const createdPost = await createPost(username, content);

        if (!createdPost) {
            return res.status(400).json({ error: "Unable to create post" });
        }

        return res.status(201).json(createdPost);
    } catch (error) {
        if (error instanceof Error && error.message.includes("300")) {
            return res.status(400).json({ error: error.message });
        }

        return res.status(500).json({ error: "Failed to create forum post" });
    }
}
