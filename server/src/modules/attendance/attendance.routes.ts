import { Router } from 'express';
import { listBySubjectAndDate, saveBatch, studentSummary } from './attendance.controller';
import { requireRole } from '../../middlewares/auth.middleware';
import { enforceStudentOwnership } from '../../middlewares/objectAccess.middleware';

const router = Router();

// Faculty & Admin can list/view subject attendance
router.get('/', requireRole('FACULTY', 'ADMIN'), listBySubjectAndDate);

// Faculty & Admin can submit batch attendance logs
router.post('/', requireRole('FACULTY', 'ADMIN'), saveBatch);

// Students can view their own summary; Faculty & Admin can view any student summary
router.get('/student/:rollNo', enforceStudentOwnership, studentSummary);

export default router;
