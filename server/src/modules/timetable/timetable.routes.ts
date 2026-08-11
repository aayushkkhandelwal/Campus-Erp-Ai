import { Router } from 'express';
import { list, publish } from './timetable.controller';
import { requireRole } from '../../middlewares/auth.middleware';

const router = Router();

router.get('/', list);
router.post('/publish', requireRole('ADMIN'), publish);

export default router;
