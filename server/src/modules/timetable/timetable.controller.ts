import type { Response } from 'express';
import { AuthRequest } from '../../middlewares/auth.middleware';
import { getTimetable, publishTimetable, validateTimetable } from './timetable.service';

export const publish = async (req: AuthRequest, res: Response) => {
  try {
    const { semester, slots } = req.body;
    if (!semester || !Array.isArray(slots)) {
      return res.status(400).json({ success: false, message: 'Semester and slots are required' });
    }

    // 1. Audit proposed timetable for conflicts before writing to the database
    const conflicts = await validateTimetable(semester, slots);
    if (conflicts.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Timetable publish rejected: conflict constraints violated.',
        conflicts
      });
    }

    const published = await publishTimetable(semester, slots);
    res.status(200).json({ success: true, data: published, message: 'Timetable published successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to publish timetable' });
  }
};

export const list = async (req: AuthRequest, res: Response) => {
  try {
    const semester = req.query.semester as string | undefined;
    const data = await getTimetable(semester);
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

    const conflicts = await validateTimetable(semester, slots);
    res.status(200).json({
      success: true,
      isValid: conflicts.length === 0,
      conflicts
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to validate timetable' });
  }
};
