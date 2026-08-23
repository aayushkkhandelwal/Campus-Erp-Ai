import type { Response } from 'express';
import { AuthRequest, getTenantCollegeId } from '../../middlewares/auth.middleware';
import { 
  getTimetable, 
  publishTimetable, 
  validateTimetable, 
  listPeriods, 
  updatePeriod,
  listSubjects,
  createSubject,
  updateSubject,
  deleteSubject,
  listRooms,
  createRoom,
  updateRoom,
  deleteRoom,
  listSections,
  createSection,
  updateSection,
  deleteSection,
  listFacultySubjects,
  assignFacultySubject,
  unassignFacultySubject,
  listTimetables,
  createTimetable,
  deleteTimetable
} from './timetable.service';

export const publish = async (req: AuthRequest, res: Response) => {
  try {
    const { semester, slots } = req.body;
    if (!semester || !Array.isArray(slots)) {
      return res.status(400).json({ success: false, message: 'Semester and slots are required' });
    }

    let collegeId: string;
    try {
      collegeId = getTenantCollegeId(req);
    } catch (err: any) {
      return res.status(403).json({ success: false, message: err.message || 'Access Denied.' });
    }

    // 1. Audit proposed timetable for conflicts before writing to the database
    const conflicts = await validateTimetable(collegeId, semester, slots);
    if (conflicts.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Timetable publish rejected: conflict constraints violated.',
        conflicts
      });
    }

    const published = await publishTimetable(collegeId, semester, slots);
    res.status(200).json({ success: true, data: published, message: 'Timetable published successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to publish timetable' });
  }
};

export const list = async (req: AuthRequest, res: Response) => {
  try {
    const semester = req.query.semester as string | undefined;

    let collegeId: string;
    try {
      collegeId = getTenantCollegeId(req);
    } catch (err: any) {
      return res.status(403).json({ success: false, message: err.message || 'Access Denied.' });
    }

    const data = await getTimetable(collegeId, semester);
    res.status(200).json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to fetch timetable' });
  }
};

export const validate = async (req: AuthRequest, res: Response) => {
  try {
    const { semester, slots } = req.body;
    if (!semester || !Array.isArray(slots)) {
      return res.status(400).json({ success: false, message: 'Semester and slots are required' });
    }

    let collegeId: string;
    try {
      collegeId = getTenantCollegeId(req);
    } catch (err: any) {
      return res.status(403).json({ success: false, message: err.message || 'Access Denied.' });
    }

    const conflicts = await validateTimetable(collegeId, semester, slots);
    res.status(200).json({
      success: true,
      isValid: conflicts.length === 0,
      conflicts
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to validate timetable' });
  }
};

export const getPeriods = async (req: AuthRequest, res: Response) => {
  try {
    let collegeId: string;
    try {
      collegeId = getTenantCollegeId(req);
    } catch (err: any) {
      return res.status(403).json({ success: false, message: err.message || 'Access Denied.' });
    }

    const data = await listPeriods(collegeId);
    res.status(200).json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to fetch periods' });
  }
};

export const putPeriod = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { startTime, endTime } = req.body;
    if (!startTime || !endTime) {
      return res.status(400).json({ success: false, message: 'startTime and endTime are required' });
    }

    let collegeId: string;
    try {
      collegeId = getTenantCollegeId(req);
    } catch (err: any) {
      return res.status(403).json({ success: false, message: err.message || 'Access Denied.' });
    }

    const data = await updatePeriod(collegeId, id as string, startTime as string, endTime as string);
    res.status(200).json({ success: true, data, message: 'Period updated successfully' });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message || 'Failed to update period' });
  }
};

// ==========================================
//   PARENT TIMETABLES CONTROLLER ACTIONS
// ==========================================

export const getTimetables = async (req: AuthRequest, res: Response) => {
  try {
    let collegeId: string;
    try {
      collegeId = getTenantCollegeId(req);
    } catch (err: any) {
      return res.status(403).json({ success: false, message: err.message || 'Access Denied.' });
    }

    const data = await listTimetables(collegeId);
    res.status(200).json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to fetch timetables' });
  }
};

export const postTimetable = async (req: AuthRequest, res: Response) => {
  try {
    const { name, academicSessionId, semester, branch, status } = req.body;
    if (!name || !academicSessionId || !semester || !branch) {
      return res.status(400).json({ success: false, message: 'Name, Academic Session ID, Semester, and Branch are required' });
    }

    let collegeId: string;
    try {
      collegeId = getTenantCollegeId(req);
    } catch (err: any) {
      return res.status(403).json({ success: false, message: err.message || 'Access Denied.' });
    }

    const data = await createTimetable(collegeId, { name, academicSessionId, semester, branch, status });
    res.status(201).json({ success: true, data, message: 'Timetable created successfully' });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message || 'Failed to create timetable' });
  }
};

export const removeTimetable = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    let collegeId: string;
    try {
      collegeId = getTenantCollegeId(req);
    } catch (err: any) {
      return res.status(403).json({ success: false, message: err.message || 'Access Denied.' });
    }

    await deleteTimetable(collegeId, id as string);
    res.status(200).json({ success: true, message: 'Timetable deleted successfully' });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message || 'Failed to delete timetable' });
  }
};

// ==========================================
//   SUBJECTS CONTROLLER ACTIONS
// ==========================================

export const getSubjects = async (req: AuthRequest, res: Response) => {
  try {
    let collegeId: string;
    try {
      collegeId = getTenantCollegeId(req);
    } catch (err: any) {
      return res.status(403).json({ success: false, message: err.message || 'Access Denied.' });
    }

    const data = await listSubjects(collegeId);
    res.status(200).json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to fetch subjects' });
  }
};

export const postSubject = async (req: AuthRequest, res: Response) => {
  try {
    const { name, code, semester, credits, weeklyHours, type, departmentId } = req.body;
    if (!name || !code || !semester || !departmentId) {
      return res.status(400).json({ success: false, message: 'Name, Code, Semester, and Department ID are required' });
    }

    let collegeId: string;
    try {
      collegeId = getTenantCollegeId(req);
    } catch (err: any) {
      return res.status(403).json({ success: false, message: err.message || 'Access Denied.' });
    }

    const data = await createSubject(collegeId, { name, code, semester, credits, weeklyHours, type, departmentId });
    res.status(201).json({ success: true, data, message: 'Subject created successfully' });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message || 'Failed to create subject' });
  }
};

export const putSubject = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    let collegeId: string;
    try {
      collegeId = getTenantCollegeId(req);
    } catch (err: any) {
      return res.status(403).json({ success: false, message: err.message || 'Access Denied.' });
    }

    const data = await updateSubject(collegeId, id as string, req.body);
    res.status(200).json({ success: true, data, message: 'Subject updated successfully' });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message || 'Failed to update subject' });
  }
};

export const removeSubject = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    let collegeId: string;
    try {
      collegeId = getTenantCollegeId(req);
    } catch (err: any) {
      return res.status(403).json({ success: false, message: err.message || 'Access Denied.' });
    }

    await deleteSubject(collegeId, id as string);
    res.status(200).json({ success: true, message: 'Subject deleted successfully' });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message || 'Failed to delete subject' });
  }
};

// ==========================================
//   ROOMS CONTROLLER ACTIONS
// ==========================================

export const getRooms = async (req: AuthRequest, res: Response) => {
  try {
    let collegeId: string;
    try {
      collegeId = getTenantCollegeId(req);
    } catch (err: any) {
      return res.status(403).json({ success: false, message: err.message || 'Access Denied.' });
    }

    const data = await listRooms(collegeId);
    res.status(200).json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to fetch rooms' });
  }
};

export const postRoom = async (req: AuthRequest, res: Response) => {
  try {
    const { name, type, capacity } = req.body;
    if (!name || !type) {
      return res.status(400).json({ success: false, message: 'Name and Type are required' });
    }

    let collegeId: string;
    try {
      collegeId = getTenantCollegeId(req);
    } catch (err: any) {
      return res.status(403).json({ success: false, message: err.message || 'Access Denied.' });
    }

    const data = await createRoom(collegeId, { name, type, capacity });
    res.status(201).json({ success: true, data, message: 'Room created successfully' });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message || 'Failed to create room' });
  }
};

export const putRoom = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    let collegeId: string;
    try {
      collegeId = getTenantCollegeId(req);
    } catch (err: any) {
      return res.status(403).json({ success: false, message: err.message || 'Access Denied.' });
    }

    const data = await updateRoom(collegeId, id as string, req.body);
    res.status(200).json({ success: true, data, message: 'Room updated successfully' });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message || 'Failed to update room' });
  }
};

export const removeRoom = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    let collegeId: string;
    try {
      collegeId = getTenantCollegeId(req);
    } catch (err: any) {
      return res.status(403).json({ success: false, message: err.message || 'Access Denied.' });
    }

    await deleteRoom(collegeId, id as string);
    res.status(200).json({ success: true, message: 'Room deleted successfully' });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message || 'Failed to delete room' });
  }
};

// ==========================================
//   SECTIONS CONTROLLER ACTIONS
// ==========================================

export const getSections = async (req: AuthRequest, res: Response) => {
  try {
    let collegeId: string;
    try {
      collegeId = getTenantCollegeId(req);
    } catch (err: any) {
      return res.status(403).json({ success: false, message: err.message || 'Access Denied.' });
    }

    const data = await listSections(collegeId);
    res.status(200).json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to fetch sections' });
  }
};

export const postSection = async (req: AuthRequest, res: Response) => {
  try {
    const { name, semester, departmentId } = req.body;
    if (!name || !semester || !departmentId) {
      return res.status(400).json({ success: false, message: 'Name, Semester, and Department ID are required' });
    }

    let collegeId: string;
    try {
      collegeId = getTenantCollegeId(req);
    } catch (err: any) {
      return res.status(403).json({ success: false, message: err.message || 'Access Denied.' });
    }

    const data = await createSection(collegeId, { name, semester, departmentId });
    res.status(201).json({ success: true, data, message: 'Section created successfully' });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message || 'Failed to create section' });
  }
};

export const putSection = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    let collegeId: string;
    try {
      collegeId = getTenantCollegeId(req);
    } catch (err: any) {
      return res.status(403).json({ success: false, message: err.message || 'Access Denied.' });
    }

    const data = await updateSection(collegeId, id as string, req.body);
    res.status(200).json({ success: true, data, message: 'Section updated successfully' });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message || 'Failed to update section' });
  }
};

export const removeSection = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    let collegeId: string;
    try {
      collegeId = getTenantCollegeId(req);
    } catch (err: any) {
      return res.status(403).json({ success: false, message: err.message || 'Access Denied.' });
    }

    await deleteSection(collegeId, id as string);
    res.status(200).json({ success: true, message: 'Section deleted successfully' });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message || 'Failed to delete section' });
  }
};

// ==========================================
//   FACULTY-SUBJECT ASSIGNMENT ACTIONS
// ==========================================

export const getFacultySubjects = async (req: AuthRequest, res: Response) => {
  try {
    let collegeId: string;
    try {
      collegeId = getTenantCollegeId(req);
    } catch (err: any) {
      return res.status(403).json({ success: false, message: err.message || 'Access Denied.' });
    }

    const data = await listFacultySubjects(collegeId);
    res.status(200).json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to fetch faculty subject assignments' });
  }
};

export const postFacultySubject = async (req: AuthRequest, res: Response) => {
  try {
    const { facultyId, subjectId } = req.body;
    if (!facultyId || !subjectId) {
      return res.status(400).json({ success: false, message: 'Faculty ID and Subject ID are required' });
    }

    let collegeId: string;
    try {
      collegeId = getTenantCollegeId(req);
    } catch (err: any) {
      return res.status(403).json({ success: false, message: err.message || 'Access Denied.' });
    }

    const data = await assignFacultySubject(collegeId, facultyId, subjectId);
    res.status(201).json({ success: true, data, message: 'Faculty qualified for subject successfully' });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message || 'Failed to assign qualification' });
  }
};

export const removeFacultySubject = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    let collegeId: string;
    try {
      collegeId = getTenantCollegeId(req);
    } catch (err: any) {
      return res.status(403).json({ success: false, message: err.message || 'Access Denied.' });
    }

    await unassignFacultySubject(collegeId, id as string);
    res.status(200).json({ success: true, message: 'Faculty subject qualification unassigned successfully' });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message || 'Failed to delete qualification' });
  }
};
