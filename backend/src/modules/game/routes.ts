import express from 'express';
import { authMiddleware } from '../auth/middleware.js';
import { getRunProgress, getStats } from './controller.js';

const router = express.Router();

router.get('/stats', authMiddleware, getStats);
router.get('/progress', authMiddleware, getRunProgress);

export default router;
