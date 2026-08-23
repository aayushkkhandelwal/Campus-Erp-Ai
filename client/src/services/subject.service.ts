import api from './api';

export interface Subject {
  id: string;
  name: string;
  code: string;
  semester: string;
  credits: number;
  weeklyHours: number;
  type: 'CLASSROOM' | 'LAB';
  departmentId: string;
  department?: {
    id: string;
    name: string;
    code: string;
  };
  _count?: {
    timetableSlots: number;
  };
  createdAt?: string;
  updatedAt?: string;
}

const getStoredSubjects = (): Subject[] => {
  const saved = localStorage.getItem('college_erp_subjects');
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      // ignore
    }
  }
  return [];
};

const saveSubjects = (subjects: Subject[]) => {
  localStorage.setItem('college_erp_subjects', JSON.stringify(subjects));
};

export const subjectService = {
  async getAll(): Promise<Subject[]> {
    try {
      const response = await api.get('/timetable/subjects');
      const data = response.data?.data || [];
      saveSubjects(data);
      return data;
    } catch (err) {
      return getStoredSubjects();
    }
  },

  async create(data: Omit<Subject, 'id'>): Promise<Subject> {
    const response = await api.post('/timetable/subjects', data);
    return response.data?.data;
  },

  async update(id: string, data: Partial<Subject>): Promise<Subject> {
    const response = await api.put(`/timetable/subjects/${id}`, data);
    return response.data?.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/timetable/subjects/${id}`);
  }
};
