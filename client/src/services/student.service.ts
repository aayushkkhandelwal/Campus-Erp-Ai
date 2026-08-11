import api from './api';
import type { Student, PaginatedResponse } from '../types';

const DEFAULT_STUDENTS: Student[] = [
  {
    id: 'std-1',
    firstName: 'Emma',
    lastName: 'Watson',
    email: 'student@college.edu',
    studentId: '2026CS001',
    dateOfBirth: '2003-04-15',
    gender: 'FEMALE',
    address: '104 Campus Drive, Hall 4',
    phone: '+1 555-0192',
    enrollmentDate: '2022-09-01',
    status: 'ACTIVE',
    departmentId: 'dept-1',
    department: { id: 'dept-1', name: 'Computer Science & Engineering', code: 'CSE', createdAt: '', updatedAt: '' },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'std-2',
    firstName: 'Aayush',
    lastName: 'Khandelwal',
    email: 'aayushkkhandelwal1511@gmail.com',
    studentId: '2026CS002',
    dateOfBirth: '2003-11-15',
    gender: 'MALE',
    address: 'Campus Quarter B',
    phone: '+1 555-0193',
    enrollmentDate: '2022-09-01',
    status: 'ACTIVE',
    departmentId: 'dept-1',
    department: { id: 'dept-1', name: 'Computer Science & Engineering', code: 'CSE', createdAt: '', updatedAt: '' },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'std-3',
    firstName: 'Aayush',
    lastName: 'Khandelwal',
    email: 'aayushkkhandelwal@gmail.com',
    studentId: '2026CS003',
    dateOfBirth: '2003-11-15',
    gender: 'MALE',
    address: 'Campus Quarter B',
    phone: '+1 555-0194',
    enrollmentDate: '2022-09-01',
    status: 'ACTIVE',
    departmentId: 'dept-1',
    department: { id: 'dept-1', name: 'Computer Science & Engineering', code: 'CSE', createdAt: '', updatedAt: '' },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'std-4',
    firstName: 'Charvi',
    lastName: 'Mathur',
    email: 'charvimathur469@gmail.com',
    studentId: '2026EE001',
    dateOfBirth: '2004-06-10',
    gender: 'FEMALE',
    address: 'Girls Hostel Hall 2',
    phone: '+1 555-0198',
    enrollmentDate: '2023-09-01',
    status: 'ACTIVE',
    departmentId: 'dept-2',
    department: { id: 'dept-2', name: 'Electrical Engineering', code: 'EE', createdAt: '', updatedAt: '' },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const getStoredStudents = (): Student[] => {
  const saved = localStorage.getItem('college_erp_students');
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      // ignore
    }
  }
  localStorage.setItem('college_erp_students', JSON.stringify(DEFAULT_STUDENTS));
  return DEFAULT_STUDENTS;
};

const saveStudents = (students: Student[]) => {
  localStorage.setItem('college_erp_students', JSON.stringify(students));
};

export const studentService = {
  async getAll(params?: { page?: number; limit?: number; search?: string; departmentId?: string }): Promise<PaginatedResponse<Student>> {
    let students: Student[] = [];

    try {
      const response = await api.get('/students');
      if (response.data?.data && Array.isArray(response.data.data)) {
        const backendData: Student[] = response.data.data;
        students = backendData;
        saveStudents(backendData);
      }
    } catch {
      students = getStoredStudents();
    }

    if (!students || students.length === 0) {
      students = getStoredStudents();
    }

    if (params?.search) {
      const q = params.search.toLowerCase();
      students = students.filter(
        (s) =>
          s.firstName?.toLowerCase().includes(q) ||
          s.lastName?.toLowerCase().includes(q) ||
          s.studentId?.toLowerCase().includes(q) ||
          s.email?.toLowerCase().includes(q)
      );
    }

    // Always sort by studentId cleanly (2026CS001, 2026CS002, 2026CS003...)
    students.sort((a, b) => (a.studentId || '').localeCompare(b.studentId || ''));

    return {
      data: students,
      total: students.length,
      page: params?.page || 1,
      limit: params?.limit || 10,
      totalPages: Math.ceil(students.length / (params?.limit || 10)),
    };
  },

  async getById(id: string): Promise<Student> {
    try {
      const response = await api.get(`/students/${id}`);
      if (response.data?.data) return response.data.data;
    } catch {
      // fallback
    }
    const list = getStoredStudents();
    return list.find((s) => s.id === id) || list[0];
  },

  async create(data: Omit<Student, 'id' | 'createdAt' | 'updatedAt' | 'department'>) {
    let createdStudent: Student | null = null;

    try {
      const response = await api.post('/students', data);
      if (response.data?.data) {
        createdStudent = response.data.data;
      }
    } catch (err) {
      console.error('API create student error:', err);
    }

    // Refresh full student list from backend database
    try {
      const refresh = await api.get('/students');
      if (refresh.data?.data && Array.isArray(refresh.data.data)) {
        saveStudents(refresh.data.data);
      }
    } catch {
      if (createdStudent) {
        const currentList = getStoredStudents();
        const updatedList = [createdStudent, ...currentList.filter((s) => s.id !== createdStudent!.id)];
        saveStudents(updatedList);
      }
    }

    return { success: true, data: createdStudent || data };
  },

  async update(id: string, data: Partial<Student>) {
    let updatedStudent: Student | null = null;

    try {
      const response = await api.put(`/students/${id}`, data);
      if (response.data?.data) {
        updatedStudent = response.data.data;
      }
    } catch {
      // fallback
    }

    try {
      const refresh = await api.get('/students');
      if (refresh.data?.data && Array.isArray(refresh.data.data)) {
        saveStudents(refresh.data.data);
      }
    } catch {
      const list = getStoredStudents();
      const index = list.findIndex((s) => s.id === id);
      if (index !== -1) {
        list[index] = updatedStudent || { ...list[index], ...data, updatedAt: new Date().toISOString() };
        saveStudents(list);
      }
    }

    return { success: true, data: updatedStudent || data };
  },

  async delete(id: string) {
    try {
      await api.delete(`/students/${id}`);
    } catch (err) {
      console.error('API delete student error:', err);
    }

    // Always remove deleted student from local cache
    const currentCache = getStoredStudents();
    const updatedCache = currentCache.filter((s) => s.id !== id && s.studentId !== id);
    saveStudents(updatedCache);

    try {
      const refresh = await api.get('/students');
      if (refresh.data?.data && Array.isArray(refresh.data.data)) {
        saveStudents(refresh.data.data);
      }
    } catch {}

    return { success: true, message: `Student ${id} deleted` };
  },
};
