import api from './api';
import type { Subject } from './subject.service';

export interface FacultySubject {
  id: string;
  facultyId: string;
  faculty: {
    id: string;
    firstName: string;
    lastName: string;
    employeeId: string;
    department?: {
      id: string;
      name: string;
    };
  };
  subjectId: string;
  subject: Subject;
  createdAt?: string;
  updatedAt?: string;
}

export const facultySubjectService = {
  async getAll(): Promise<FacultySubject[]> {
    const response = await api.get('/timetable/faculty-subjects');
    return response.data?.data || [];
  },

  async assign(facultyId: string, subjectId: string): Promise<FacultySubject> {
    const response = await api.post('/timetable/faculty-subjects', { facultyId, subjectId });
    return response.data?.data;
  },

  async unassign(id: string): Promise<void> {
    await api.delete(`/timetable/faculty-subjects/${id}`);
  }
};
