import api from './api';
import type { TimetableSlot } from './ai.service';

export interface PublishedTimetableData {
  semester: string;
  slots: TimetableSlot[];
  publishedAt: string;
}

const STORAGE_KEY = 'college_erp_published_timetable';

const getStoredTimetable = (): PublishedTimetableData | null => {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      // ignore
    }
  }
  return null;
};

const saveStoredTimetable = (data: PublishedTimetableData) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

export const timetableService = {
  async publish(semester: string, slots: TimetableSlot[]) {
    // 1. Send publish request to backend. Let errors propagate to catch block in component
    const response = await api.post('/timetable/publish', { semester, slots });

    const publishedData: PublishedTimetableData = {
      semester,
      slots,
      publishedAt: new Date().toISOString(),
    };

    saveStoredTimetable(publishedData);
    return { success: true, data: response.data };
  },

  async validate(semester: string, slots: TimetableSlot[]) {
    const response = await api.post('/timetable/validate', { semester, slots });
    return response.data;
  },

  async getPublished(semester?: string): Promise<TimetableSlot[]> {
    let slots: TimetableSlot[] = [];

    try {
      const response = await api.get('/timetable', { params: { semester } });
      if (response.data?.data && Array.isArray(response.data.data) && response.data.data.length > 0) {
        slots = response.data.data;
        if (semester) {
          saveStoredTimetable({
            semester,
            slots,
            publishedAt: new Date().toISOString(),
          });
        }
        return slots;
      }
    } catch {
      // fallback
    }

    const localData = getStoredTimetable();
    if (localData) {
      if (!semester || localData.semester === semester) {
        return localData.slots;
      }
    }

    return [];
  },

  getStored(): PublishedTimetableData | null {
    return getStoredTimetable();
  },
};
