import { Router } from 'express';
import {
  addStudent,
  checkStudentEmail,
  editStudent,
  getMe,
  listStudents,
  previewNextId,
  removeStudent,
  showStudent,
} from './student.controller';
import { requireRole } from '../../middlewares/auth.middleware';
import { enforceStudentOwnership } from '../../middlewares/objectAccess.middleware';

const router = Router();

// Current logged-in student's profile (accessible to any authenticated student)
router.get('/me', getMe);

// Admins & Faculty can list all students
router.get('/', requireRole('ADMIN', 'FACULTY'), listStudents);

// Verify email availability
router.get('/check-email', requireRole('ADMIN', 'FACULTY'), checkStudentEmail);

// Preview next auto-generated student ID
router.get('/next-id', requireRole('ADMIN', 'FACULTY'), previewNextId);

// Students can view their own record; Admins & Faculty can view any
router.get('/:id', enforceStudentOwnership, showStudent);

// Admin-only mutation routes
router.post('/', requireRole('ADMIN'), addStudent);
router.put('/:id', requireRole('ADMIN'), editStudent);
router.delete('/:id', requireRole('ADMIN'), removeStudent);

export default router;
