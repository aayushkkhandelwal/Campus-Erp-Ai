import { Router } from 'express';
import { queryAiCopilot } from './ai.controller';
import { apiLimiter } from '../../middlewares/rateLimiter.middleware';

const router = Router();

router.post('/query', apiLimiter, queryAiCopilot);

export default router;
