import api from './api';

export interface Room {
  id: string;
  name: string;
  type: 'CLASSROOM' | 'LAB';
  capacity?: number;
  _count?: {
    timetableSlots: number;
  };
  createdAt?: string;
  updatedAt?: string;
}

const getStoredRooms = (): Room[] => {
  const saved = localStorage.getItem('college_erp_rooms');
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      // ignore
    }
  }
  return [];
};

const saveRooms = (rooms: Room[]) => {
  localStorage.setItem('college_erp_rooms', JSON.stringify(rooms));
};

export const roomService = {
  async getAll(): Promise<Room[]> {
    try {
      const response = await api.get('/timetable/rooms');
      const data = response.data?.data || [];
      saveRooms(data);
      return data;
    } catch (err) {
      return getStoredRooms();
    }
  },

  async create(data: Omit<Room, 'id'>): Promise<Room> {
    const response = await api.post('/timetable/rooms', data);
    return response.data?.data;
  },

  async update(id: string, data: Partial<Room>): Promise<Room> {
    const response = await api.put(`/timetable/rooms/${id}`, data);
    return response.data?.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/timetable/rooms/${id}`);
  }
};
