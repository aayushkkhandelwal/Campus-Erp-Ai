import type { Response } from 'express';
import { AuthRequest, getTenantCollegeId } from '../../middlewares/auth.middleware';
import prisma from '../../prisma/client';
import {
  createFaculty,
  deleteFaculty,
  generateNextEmployeeId,
  getFacultyById,
  getFaculties,
  updateFaculty,
} from './faculty.service';

export const getMe = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.email) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const faculty = await prisma.faculty.findUnique({
      where: { email: req.user.email },
      include: {
        department: {
          select: { id: true, name: true, code: true }
        }
      }
    });

    if (!faculty) {
      return res.status(404).json({ success: false, message: 'Faculty profile not found' });
    }

    res.json({
      success: true,
      data: faculty,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to fetch faculty profile' });
  }
};

export const listFaculties = async (req: AuthRequest, res: Response) => {
  try {
    let collegeId: string | undefined;
    try {
      collegeId = getTenantCollegeId(req);
    } catch {
      // ignore
    }
    const faculties = await getFaculties(collegeId);
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
    let collegeId: string | undefined;
    try {
      collegeId = getTenantCollegeId(req);
    } catch {
      // ignore
    }
    const nextId = await generateNextEmployeeId(departmentId, collegeId);
    res.json({ success: true, data: { employeeId: nextId } });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to generate next employee ID' });
  }
};

export const showFaculty = async (req: AuthRequest, res: Response) => {
  try {
    const id = String(req.params.id);
    let collegeId: string | undefined;
    try {
      collegeId = getTenantCollegeId(req);
    } catch {
      // ignore
    }
    const faculty = await getFacultyById(id, collegeId);
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
    let collegeId: string | undefined;
    try {
      collegeId = getTenantCollegeId(req);
    } catch {
      // ignore
    }
    const faculty = await createFaculty({ ...req.body, collegeId: req.body.collegeId || collegeId });
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
