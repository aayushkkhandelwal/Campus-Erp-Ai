import type { Response, NextFunction } from 'express';
import type { AuthRequest } from './auth.middleware';
import prisma from '../prisma/client';

/**
 * Ensures Students can only access their own student records, attendance, or marks.
 * Admins and Faculty retain full cross-student access.
 */
export const enforceStudentOwnership = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Authentication required.' });
  }

  // Admins & Faculty can view any student resource
  if (req.user.role === 'ADMIN' || req.user.role === 'FACULTY') {
    return next();
  }

  if (req.user.role === 'STUDENT') {
    const rawParam = req.params.id || req.params.studentId || req.params.rollNo;

    if (!rawParam) {
      return next();
    }

    const targetStudentId = Array.isArray(rawParam) ? rawParam[0] : rawParam;

    // Find target student record
    const targetStudent = await prisma.student.findFirst({
      where: {
        OR: [{ id: targetStudentId }, { studentId: targetStudentId }],
      },
    });

    if (!targetStudent || targetStudent.email !== req.user.email) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only view or manage your own student profile and records.',
      });
    }
  }

  next();
};
