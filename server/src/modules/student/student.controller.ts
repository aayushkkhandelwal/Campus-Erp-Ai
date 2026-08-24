import type { Response } from 'express';
import { AuthRequest } from '../../middlewares/auth.middleware';
import prisma from '../../prisma/client';
import {
  createStudent,
  deleteStudent,
  generateNextStudentId,
  getStudentById,
  getStudents,
  updateStudent,
} from './student.service';

export const getMe = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.email) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const student = await prisma.student.findUnique({
      where: { email: req.user.email },
      include: {
        department: {
          select: { id: true, name: true, code: true }
        }
      }
    });

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student profile record not found' });
    }

    res.json({
      success: true,
      data: {
        id: student.id,
        firstName: student.firstName,
        lastName: student.lastName,
        studentId: student.studentId,
        semester: student.semester,
        section: student.section || 'Section A',
        fatherName: student.fatherName || null,
        fatherPhone: student.fatherPhone || null,
        department: student.department
          ? { id: student.department.id, name: student.department.name, code: student.department.code }
          : null,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to fetch student profile' });
  }
};

export const listStudents = async (_req: AuthRequest, res: Response) => {
  try {
    const students = await getStudents();
    res.json({ success: true, data: students });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to fetch students' });
  }
};

export const checkStudentEmail = async (req: AuthRequest, res: Response) => {
  try {
    const email = String(req.query.email || '').trim().toLowerCase();
    if (!email) {
      return res.json({ success: true, data: { exists: false } });
    }
    const student = await prisma.student.findUnique({ where: { email } });
    res.json({
      success: true,
      data: {
        exists: !!student,
        student: student ? { id: student.id, studentId: student.studentId, name: `${student.firstName} ${student.lastName}` } : null,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const previewNextId = async (req: AuthRequest, res: Response) => {
  try {
    const departmentId = (req.query.departmentId || req.query.deptId || '') as string;
    const nextId = await generateNextStudentId(departmentId);
    res.json({ success: true, data: { studentId: nextId } });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to generate next student ID' });
  }
};

export const showStudent = async (req: AuthRequest, res: Response) => {
  try {
    const id = String(req.params.id);
    const student = await getStudentById(id);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }
    res.json({ success: true, data: student });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to fetch student' });
  }
};

export const addStudent = async (req: AuthRequest, res: Response) => {
  try {
    const student = await createStudent(req.body);
    res.status(201).json({ success: true, data: student });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message || 'Failed to create student' });
  }
};

export const editStudent = async (req: AuthRequest, res: Response) => {
  try {
    const id = String(req.params.id);
    const student = await updateStudent(id, req.body);
    res.json({ success: true, data: student });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message || 'Failed to update student' });
  }
};

export const removeStudent = async (req: AuthRequest, res: Response) => {
  try {
    const id = String(req.params.id);
    await deleteStudent(id);
    res.json({ success: true, message: 'Student deleted' });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message || 'Failed to delete student' });
  }
};
