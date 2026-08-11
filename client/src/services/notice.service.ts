import api from './api';

export interface CampusNotice {
  id: string;
  title: string;
  content: string;
  author: string;
  date: string;
  tag?: string;
}

const STORAGE_KEY = 'college_erp_published_notices';

const defaultNotices: CampusNotice[] = [
  {
    id: 'n-1',
    title: "Tomorrow's DBMS Lecture Schedule",
    content: 'Class will be held in Lab 3 at 09:00 AM. Please ensure your lab manuals are signed.',
    author: 'Posted by Dr. Amit Sharma',
    date: '2026-08-11',
    tag: 'Academic',
  },
  {
    id: 'n-2',
    title: 'Mid-Semester Examination Schedule',
    content: 'Check the academic portal for seating plan and room assignments for upcoming mid-sems.',
    author: 'Posted by Academic Cell',
    date: '2026-08-10',
    tag: 'Exams',
  },
  {
    id: 'n-3',
    title: 'Annual Tech Hackathon 2026 Registration',
    content: 'Team registrations for the inter-college AI & Code hackathon are now open till Friday.',
    author: 'Posted by Tech Club',
    date: '2026-08-09',
    tag: 'Event',
  },
];

export const noticeService = {
  getStored(): CampusNotice[] {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch {
        // fallback
      }
    }
    return defaultNotices;
  },

  async publishNotice(title: string, content: string, author = 'Academic Cell', tag = 'Official'): Promise<CampusNotice> {
    const newNotice: CampusNotice = {
      id: `notice-${Date.now()}`,
      title,
      content,
      author: author.startsWith('Posted by') ? author : `Posted by ${author}`,
      date: new Date().toISOString().split('T')[0],
      tag,
    };

    const current = this.getStored();
    const updated = [newNotice, ...current];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

    try {
      await api.post('/notices', newNotice);
    } catch {
      // fallback
    }

    return newNotice;
  },

  async getAll(): Promise<CampusNotice[]> {
    try {
      const response = await api.get('/notices');
      if (response.data?.data && Array.isArray(response.data.data) && response.data.data.length > 0) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(response.data.data));
        return response.data.data;
      }
    } catch {
      // fallback
    }

    return this.getStored();
  },
};
