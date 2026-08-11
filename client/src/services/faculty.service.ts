import api from './api';
import type { Faculty, PaginatedResponse } from '../types';

const DEFAULT_FACULTY: Faculty[] = [
  {
    id: 'fac-1',
    firstName: 'Robert',
    lastName: 'Langdon',
    email: 'robert.langdon@college.edu',
    employeeId: 'FAC-2018-04',
    phone: '+1 555-0921',
    designation: 'Professor & HOD',
    qualification: 'Ph.D. in Computer Science (MIT)',
    specialization: 'Distributed Systems & AI',
    departmentId: 'dept-1',
    joiningDate: '2018-08-15',
    status: 'ACTIVE',
    department: { id: 'dept-1', name: 'Computer Science & Engineering', code: 'CSE', createdAt: '', updatedAt: '' },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'fac-2',
    firstName: 'Sarah',
    lastName: 'Jenkins',
    email: 'sarah.j@college.edu',
    employeeId: 'FAC-2019-12',
    phone: '+1 555-0943',
    designation: 'Associate Professor',
    qualification: 'Ph.D. in Electrical Eng (Stanford)',
    specialization: 'Micro-electronics & VLSI',
    departmentId: 'dept-2',
    joiningDate: '2019-01-10',
    status: 'ACTIVE',
    department: { id: 'dept-2', name: 'Electrical Engineering', code: 'EE', createdAt: '', updatedAt: '' },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const getStoredFaculty = (): Faculty[] => {
  const saved = localStorage.getItem('college_erp_faculty');
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      // ignore
    }
  }
  localStorage.setItem('college_erp_faculty', JSON.stringify(DEFAULT_FACULTY));
  return DEFAULT_FACULTY;
};

const saveFaculty = (faculties: Faculty[]) => {
  localStorage.setItem('college_erp_faculty', JSON.stringify(faculties));
};

export const facultyService = {
  async getAll(params?: { page?: number; limit?: number; search?: string; departmentId?: string }): Promise<PaginatedResponse<Faculty>> {
    let faculties: Faculty[] = [];

    try {
      const response = await api.get('/faculties');
      if (response.data?.data && Array.isArray(response.data.data)) {
        const backendData: Faculty[] = response.data.data;
        faculties = backendData;
        saveFaculty(backendData);
      }
    } catch {
      faculties = getStoredFaculty();
    }

    if (!faculties || faculties.length === 0) {
      faculties = getStoredFaculty();
    }

    if (params?.search) {
      const q = params.search.toLowerCase();
      faculties = faculties.filter(
        (f) =>
          f.firstName?.toLowerCase().includes(q) ||
          f.lastName?.toLowerCase().includes(q) ||
          f.employeeId?.toLowerCase().includes(q) ||
          f.email?.toLowerCase().includes(q)
      );
    }

    return {
      data: faculties,
      total: faculties.length,
      page: params?.page || 1,
      limit: params?.limit || 10,
      totalPages: Math.ceil(faculties.length / (params?.limit || 10)),
    };
  },

  async getById(id: string): Promise<Faculty> {
    try {
      const response = await api.get(`/faculties/${id}`);
      if (response.data?.data) return response.data.data;
    } catch {
      // fallback
    }
    const list = getStoredFaculty();
    return list.find((f) => f.id === id) || list[0];
  },

  async create(data: Omit<Faculty, 'id' | 'createdAt' | 'updatedAt' | 'department'>) {
    let createdFaculty: Faculty | null = null;

    try {
      const response = await api.post('/faculties', data);
      if (response.data?.data) {
        createdFaculty = response.data.data;
      }
    } catch (err) {
      console.error('API create faculty error:', err);
    }

    try {
      const refresh = await api.get('/faculties');
      if (refresh.data?.data && Array.isArray(refresh.data.data)) {
        saveFaculty(refresh.data.data);
      }
    } catch {
      if (createdFaculty) {
        const currentList = getStoredFaculty();
        const updatedList = [createdFaculty, ...currentList.filter((f) => f.id !== createdFaculty!.id)];
        saveFaculty(updatedList);
      }
    }

    return { success: true, data: createdFaculty || data };
  },

  async update(id: string, data: Partial<Faculty>) {
    let updatedFaculty: Faculty | null = null;

    try {
      const response = await api.put(`/faculties/${id}`, data);
      if (response.data?.data) {
        updatedFaculty = response.data.data;
      }
    } catch {
      // fallback
    }

    try {
      const refresh = await api.get('/faculties');
      if (refresh.data?.data && Array.isArray(refresh.data.data)) {
        saveFaculty(refresh.data.data);
      }
    } catch {
      const list = getStoredFaculty();
      const index = list.findIndex((f) => f.id === id);
      if (index !== -1) {
        list[index] = updatedFaculty || { ...list[index], ...data, updatedAt: new Date().toISOString() };
        saveFaculty(list);
      }
    }

    return { success: true, data: updatedFaculty || data };
  },

  async delete(id: string) {
    try {
      await api.delete(`/faculties/${id}`);
    } catch {
      // fallback
    }

    try {
      const refresh = await api.get('/faculties');
      if (refresh.data?.data && Array.isArray(refresh.data.data)) {
        saveFaculty(refresh.data.data);
      }
    } catch {
      const list = getStoredFaculty();
      const filtered = list.filter((f) => f.id !== id);
      saveFaculty(filtered);
    }

    return { success: true, message: `Faculty ${id} deleted` };
  },
};
