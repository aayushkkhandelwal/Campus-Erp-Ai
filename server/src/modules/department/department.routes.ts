import { Router } from 'express';
import {
  addDepartment,
  checkDepartmentName,
  editDepartment,
  listDepartments,
  removeDepartment,
  showDepartment,
} from './department.controller';
import { requireRole } from '../../middlewares/auth.middleware';

const router = Router();

router.get('/', listDepartments);
router.get('/check-name', checkDepartmentName);
router.get('/:id', showDepartment);

// Admin-only mutation routes
router.post('/', requireRole('ADMIN'), addDepartment);
router.put('/:id', requireRole('ADMIN'), editDepartment);
router.delete('/:id', requireRole('ADMIN'), removeDepartment);

export default router;
