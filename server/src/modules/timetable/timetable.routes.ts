import { Router } from 'express';
import { 
  list, 
  publish, 
  validate, 
  getPeriods, 
  putPeriod,
  getSubjects,
  postSubject,
  putSubject,
  removeSubject,
  getRooms,
  postRoom,
  putRoom,
  removeRoom,
  getSections,
  postSection,
  putSection,
  removeSection,
  getFacultySubjects,
  postFacultySubject,
  removeFacultySubject,
  getTimetables,
  postTimetable,
  removeTimetable
} from './timetable.controller';
import { requireRole } from '../../middlewares/auth.middleware';

const router = Router();

// Timetable queries and publishing
router.get('/', list);
router.post('/publish', requireRole('ADMIN'), publish);
router.post('/validate', requireRole('ADMIN'), validate);

// Parent timetables CRUD
router.get('/parent', getTimetables);
router.post('/parent', requireRole('ADMIN'), postTimetable);
router.delete('/parent/:id', requireRole('ADMIN'), removeTimetable);

// Periods management
router.get('/periods', getPeriods);
router.put('/periods/:id', requireRole('ADMIN'), putPeriod);

// Subjects CRUD
router.get('/subjects', getSubjects);
router.post('/subjects', requireRole('ADMIN'), postSubject);
router.put('/subjects/:id', requireRole('ADMIN'), putSubject);
router.delete('/subjects/:id', requireRole('ADMIN'), removeSubject);

// Rooms CRUD
router.get('/rooms', getRooms);
router.post('/rooms', requireRole('ADMIN'), postRoom);
router.put('/rooms/:id', requireRole('ADMIN'), putRoom);
router.delete('/rooms/:id', requireRole('ADMIN'), removeRoom);

// Sections CRUD
router.get('/sections', getSections);
router.post('/sections', requireRole('ADMIN'), postSection);
router.put('/sections/:id', requireRole('ADMIN'), putSection);
router.delete('/sections/:id', requireRole('ADMIN'), removeSection);

// Faculty Subject assignments CRUD
router.get('/faculty-subjects', getFacultySubjects);
router.post('/faculty-subjects', requireRole('ADMIN'), postFacultySubject);
router.delete('/faculty-subjects/:id', requireRole('ADMIN'), removeFacultySubject);

export default router;
