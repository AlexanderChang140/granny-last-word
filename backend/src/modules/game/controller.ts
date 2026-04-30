import type { Request, Response } from 'express';
import { getProgress } from './service.js';
import { getPlayerStats } from './stats.js';

export async function getStats(_req: Request, res: Response) {
    const user = res.locals.user as { id: number };
    const stats = await getPlayerStats(user.id);
    return res.status(200).json(stats);
}

export async function getRunProgress(_req: Request, res: Response) {
    const user = res.locals.user as { id: number };
    const progress = await getProgress(user.id);
    return res.status(200).json(progress);
}
