import api from './api';
import type { Department, PaginatedResponse } from '../types';

const getStoredDepartments = (): Department[] => {
  const saved = localStorage.getItem('college_erp_departments');
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      // ignore
    }
  }
  return [];
};

const saveDepartments = (depts: Department[]) => {
  localStorage.setItem('college_erp_departments', JSON.stringify(depts));
};

export const departmentService = {
  async getAll(params?: { page?: number; limit?: number; search?: string }): Promise<PaginatedResponse<Department>> {
    let depts: Department[] = [];

    try {
      const response = await api.get('/departments');
      if (response.data?.data && Array.isArray(response.data.data)) {
        const backendData: Department[] = response.data.data;
        depts = backendData;
        saveDepartments(backendData);
      }
    } catch {
      depts = getStoredDepartments();
    }

    if (params?.search) {
      const q = params.search.toLowerCase();
      depts = depts.filter(
        (d) => d.name?.toLowerCase().includes(q) || d.code?.toLowerCase().includes(q)
      );
    }

    return {
      data: depts,
      total: depts.length,
      page: params?.page || 1,
      limit: params?.limit || 10,
      totalPages: Math.ceil(depts.length / (params?.limit || 10)),
    };
  },

  async getById(id: string): Promise<Department> {
    try {
      const response = await api.get(`/departments/${id}`);
      if (response.data?.data) return response.data.data;
    } catch {
      // fallback
    }
    const list = getStoredDepartments();
    return list.find((d) => d.id === id) || list[0];
  },

  async create(data: Omit<Department, 'id' | 'createdAt' | 'updatedAt'>) {
    let createdDept: Department | null = null;

    try {
      const response = await api.post('/departments', data);
      if (response.data?.data) {
        createdDept = response.data.data;
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to create department';
      throw new Error(msg);
    }

    try {
      const refresh = await api.get('/departments');
      if (refresh.data?.data && Array.isArray(refresh.data.data)) {
        saveDepartments(refresh.data.data);
      }
    } catch {
      if (createdDept) {
        const currentList = getStoredDepartments();
        const updatedList = [createdDept, ...currentList.filter((d) => d.id !== createdDept!.id)];
        saveDepartments(updatedList);
      }
    }

    return { success: true, data: createdDept || data };
  },

  async update(id: string, data: Partial<Department>) {
    let updatedDept: Department | null = null;

    try {
      const response = await api.put(`/departments/${id}`, data);
      if (response.data?.data) {
        updatedDept = response.data.data;
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to update department';
      throw new Error(msg);
    }

    try {
      const refresh = await api.get('/departments');
      if (refresh.data?.data && Array.isArray(refresh.data.data)) {
        saveDepartments(refresh.data.data);
      }
    } catch {
      const list = getStoredDepartments();
      const index = list.findIndex((d) => d.id === id);
      if (index !== -1) {
        list[index] = updatedDept || { ...list[index], ...data, updatedAt: new Date().toISOString() };
        saveDepartments(list);
      }
    }

    return { success: true, data: updatedDept || data };
  },

  async delete(id: string) {
    try {
      await api.delete(`/departments/${id}`);
    } catch (err: any) {
      console.error('Failed to delete department from backend:', err);
    }

    try {
      const refresh = await api.get('/departments');
      if (refresh.data?.data && Array.isArray(refresh.data.data)) {
        saveDepartments(refresh.data.data);
      } else {
        const list = getStoredDepartments();
        const filtered = list.filter((d) => d.id !== id);
        saveDepartments(filtered);
      }
    } catch {
      const list = getStoredDepartments();
      const filtered = list.filter((d) => d.id !== id);
      saveDepartments(filtered);
    }

    return { success: true, message: `Department ${id} deleted` };
  },
};
