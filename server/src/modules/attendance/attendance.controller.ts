import type { Response } from 'express';
import { AuthRequest } from '../../middlewares/auth.middleware';
import { getAttendance, getStudentSummary, saveAttendanceBatch } from './attendance.service';

export const saveBatch = async (req: AuthRequest, res: Response) => {
  try {
    const { subject, date, records, markedBy } = req.body;
    if (!subject || !date || !Array.isArray(records)) {
      return res.status(400).json({ success: false, message: 'Subject, date, and records array are required' });
    }

    const saved = await saveAttendanceBatch(subject, date, records, markedBy);
    res.status(200).json({ success: true, data: saved, message: 'Attendance saved successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to save attendance' });
  }
};

export const listBySubjectAndDate = async (req: AuthRequest, res: Response) => {
  try {
    const subject = req.query.subject as string | undefined;
    const date = req.query.date as string | undefined;
    const data = await getAttendance(subject, date);
    res.status(200).json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to fetch attendance' });
  }
};

export const studentSummary = async (req: AuthRequest, res: Response) => {
  try {
    const rollNo = String(req.params.rollNo);
    const data = await getStudentSummary(rollNo);
    res.status(200).json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to fetch student attendance summary' });
  }
};
