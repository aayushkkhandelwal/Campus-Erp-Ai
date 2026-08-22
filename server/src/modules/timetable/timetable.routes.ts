import { Router } from 'express';
import { list, publish, validate } from './timetable.controller';

const router = Router();

router.get('/', list);
router.post('/publish', publish);
router.post('/validate', validate);

export default router;
