import { Router } from 'express';
import {
  addFaculty,
  checkFacultyEmail,
  editFaculty,
  listFaculties,
  previewNextEmployeeId,
  removeFaculty,
  showFaculty,
} from './faculty.controller';
import { requireRole } from '../../middlewares/auth.middleware';

const router = Router();

router.get('/', requireRole('ADMIN', 'FACULTY'), listFaculties);
router.get('/check-email', requireRole('ADMIN', 'FACULTY'), checkFacultyEmail);
router.get('/next-id', requireRole('ADMIN', 'FACULTY'), previewNextEmployeeId);
router.get('/:id', requireRole('ADMIN', 'FACULTY'), showFaculty);

// Admin-only mutations
router.post('/', requireRole('ADMIN'), addFaculty);
router.put('/:id', requireRole('ADMIN'), editFaculty);
router.delete('/:id', requireRole('ADMIN'), removeFaculty);

export default router;
