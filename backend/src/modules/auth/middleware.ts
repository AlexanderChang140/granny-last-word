import type { Request, Response, NextFunction } from 'express';
import { validateSession } from './service.js';

export async function authMiddleware(
    req: Request,
    res: Response,
    next: NextFunction,
) {
    try {
        const user = await validateSession(req.cookies.token);
        if (!user) {
            return res.status(401).json({ error: 'Invalid session' });
        }
        res.locals.user = user;

        next();
    } catch {
        return res
            .status(500)
            .json({ error: 'Server error during authentication' });
    }
}
