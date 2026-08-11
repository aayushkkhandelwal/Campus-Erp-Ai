import type { Response } from 'express';
import { AuthRequest } from '../../middlewares/auth.middleware';
import prisma from '../../prisma/client';
import {
  createDepartment,
  deleteDepartment,
  getDepartmentById,
  getDepartments,
  updateDepartment,
} from './department.service';

export const listDepartments = async (_req: AuthRequest, res: Response) => {
  try {
    const departments = await getDepartments();
    res.json({ success: true, data: departments });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to fetch departments' });
  }
};

export const checkDepartmentName = async (req: AuthRequest, res: Response) => {
  try {
    const name = String(req.query.name || '').trim();
    if (!name) {
      return res.json({ success: true, data: { exists: false } });
    }
    const dept = await prisma.department.findFirst({
      where: { name: { equals: name, mode: 'insensitive' } },
    });
    res.json({
      success: true,
      data: {
        exists: !!dept,
        department: dept ? { id: dept.id, name: dept.name, code: dept.code } : null,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const showDepartment = async (req: AuthRequest, res: Response) => {
  try {
    const id = String(req.params.id);
    const department = await getDepartmentById(id);
    if (!department) {
      return res.status(404).json({ success: false, message: 'Department not found' });
    }
    res.json({ success: true, data: department });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to fetch department' });
  }
};

export const addDepartment = async (req: AuthRequest, res: Response) => {
  try {
    const department = await createDepartment(req.body);
    res.status(201).json({ success: true, data: department });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message || 'Failed to create department' });
  }
};

export const editDepartment = async (req: AuthRequest, res: Response) => {
  try {
    const id = String(req.params.id);
    const department = await updateDepartment(id, req.body);
    res.json({ success: true, data: department });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message || 'Failed to update department' });
  }
};

export const removeDepartment = async (req: AuthRequest, res: Response) => {
  try {
    const id = String(req.params.id);
    await deleteDepartment(id);
    res.json({ success: true, message: 'Department deleted' });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message || 'Failed to delete department' });
  }
};
