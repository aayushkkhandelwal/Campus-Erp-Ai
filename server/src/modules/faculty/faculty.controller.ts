import type { Response } from 'express';
import { AuthRequest } from '../../middlewares/auth.middleware';
import prisma from '../../prisma/client';
import {
  createFaculty,
  deleteFaculty,
  generateNextEmployeeId,
  getFacultyById,
  getFaculties,
  updateFaculty,
} from './faculty.service';

export const listFaculties = async (_req: AuthRequest, res: Response) => {
  try {
    const faculties = await getFaculties();
    res.json({ success: true, data: faculties });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to fetch faculties' });
  }
};

export const checkFacultyEmail = async (req: AuthRequest, res: Response) => {
  try {
    const email = String(req.query.email || '').trim().toLowerCase();
    if (!email) {
      return res.json({ success: true, data: { exists: false } });
    }
    const faculty = await prisma.faculty.findUnique({ where: { email } });
    res.json({
      success: true,
      data: {
        exists: !!faculty,
        faculty: faculty ? { id: faculty.id, employeeId: faculty.employeeId, name: `${faculty.firstName} ${faculty.lastName}` } : null,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const previewNextEmployeeId = async (req: AuthRequest, res: Response) => {
  try {
    const departmentId = (req.query.departmentId || req.query.deptId || '') as string;
    const nextId = await generateNextEmployeeId(departmentId);
    res.json({ success: true, data: { employeeId: nextId } });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to generate next employee ID' });
  }
};

export const showFaculty = async (req: AuthRequest, res: Response) => {
  try {
    const id = String(req.params.id);
    const faculty = await getFacultyById(id);
    if (!faculty) {
      return res.status(404).json({ success: false, message: 'Faculty not found' });
    }
    res.json({ success: true, data: faculty });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to fetch faculty' });
  }
};

export const addFaculty = async (req: AuthRequest, res: Response) => {
  try {
    const faculty = await createFaculty(req.body);
    res.status(201).json({ success: true, data: faculty });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message || 'Failed to create faculty' });
  }
};

export const editFaculty = async (req: AuthRequest, res: Response) => {
  try {
    const id = String(req.params.id);
    const faculty = await updateFaculty(id, req.body);
    res.json({ success: true, data: faculty });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message || 'Failed to update faculty' });
  }
};

export const removeFaculty = async (req: AuthRequest, res: Response) => {
  try {
    const id = String(req.params.id);
    await deleteFaculty(id);
    res.json({ success: true, message: 'Faculty deleted' });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message || 'Failed to delete faculty' });
  }
};
