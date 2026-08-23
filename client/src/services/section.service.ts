import api from './api';

export interface Section {
  id: string;
  name: string;
  semester: string;
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

const getStoredSections = (): Section[] => {
  const saved = localStorage.getItem('college_erp_sections');
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      // ignore
    }
  }
  return [];
};

const saveSections = (sections: Section[]) => {
  localStorage.setItem('college_erp_sections', JSON.stringify(sections));
};

export const sectionService = {
  async getAll(): Promise<Section[]> {
    try {
      const response = await api.get('/timetable/sections');
      const data = response.data?.data || [];
      saveSections(data);
      return data;
    } catch (err) {
      return getStoredSections();
    }
  },

  async create(data: Omit<Section, 'id'>): Promise<Section> {
    const response = await api.post('/timetable/sections', data);
    return response.data?.data;
  },

  async update(id: string, data: Partial<Section>): Promise<Section> {
    const response = await api.put(`/timetable/sections/${id}`, data);
    return response.data?.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/timetable/sections/${id}`);
  }
};
