import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { BookOpen, Plus, Edit2, Trash2, RefreshCw, AlertCircle, Search } from 'lucide-react';
import { subjectService } from '../../../services/subject.service';
import type { Subject } from '../../../services/subject.service';
import { departmentService } from '../../../services/department.service';
import { RoleGuard } from '../../../components/common/RoleGuard';

export const SubjectManagement = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [semFilter, setSemFilter] = useState('ALL');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form states
  const [formName, setFormName] = useState('');
  const [formCode, setFormCode] = useState('');
  const [formSem, setFormSem] = useState('1');
  const [formCredits, setFormCredits] = useState(4);
  const [formHours, setFormHours] = useState(4);
  const [formType, setFormType] = useState<'CLASSROOM' | 'LAB'>('CLASSROOM');
  const [formDeptId, setFormDeptId] = useState('');

  // Fetch subjects
  const { data: subjects = [], isLoading: loadingSubjects, refetch: refetchSubjects } = useQuery({
    queryKey: ['subjects-list'],
    queryFn: () => subjectService.getAll(),
  });

  // Fetch departments
  const { data: departmentsResponse } = useQuery({
    queryKey: ['departments-list'],
    queryFn: () => departmentService.getAll(),
  });
  const departments = departmentsResponse?.data || [];

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: Omit<Subject, 'id'>) => subjectService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subjects-list'] });
      setIsAdding(false);
      resetForm();
      setErrorMsg(null);
    },
    onError: (err: any) => {
      setErrorMsg(err.response?.data?.message || err.message || 'Failed to create subject');
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Subject> }) => subjectService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subjects-list'] });
      setEditingId(null);
      setErrorMsg(null);
    },
    onError: (err: any) => {
      setErrorMsg(err.response?.data?.message || err.message || 'Failed to update subject');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => subjectService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subjects-list'] });
      setErrorMsg(null);
    },
    onError: (err: any) => {
      setErrorMsg(err.response?.data?.message || err.message || 'Failed to delete subject');
    }
  });

  const resetForm = () => {
    setFormName('');
    setFormCode('');
    setFormSem('1');
    setFormCredits(4);
    setFormHours(4);
    setFormType('CLASSROOM');
    if (departments.length > 0) {
      setFormDeptId(departments[0].id);
    }
  };

  const startAdding = () => {
    resetForm();
    setIsAdding(true);
    setEditingId(null);
    setErrorMsg(null);
  };

  const startEditing = (subj: Subject) => {
    setEditingId(subj.id);
    setIsAdding(false);
    setFormName(subj.name);
    setFormCode(subj.code);
    setFormSem(subj.semester);
    setFormCredits(subj.credits);
    setFormHours(subj.weeklyHours);
    setFormType(subj.type);
    setFormDeptId(subj.departmentId);
    setErrorMsg(null);
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formCode || !formDeptId) {
      setErrorMsg('Please fill in all required fields.');
      return;
    }
    createMutation.mutate({
      name: formName,
      code: formCode,
      semester: formSem,
      credits: Number(formCredits),
      weeklyHours: Number(formHours),
      type: formType,
      departmentId: formDeptId
    });
  };

  const handleUpdate = (id: string) => {
    if (!formName || !formCode) {
      setErrorMsg('Name and Code are required.');
      return;
    }
    updateMutation.mutate({
      id,
      data: {
        name: formName,
        code: formCode,
        semester: formSem,
        credits: Number(formCredits),
        weeklyHours: Number(formHours),
        type: formType,
        departmentId: formDeptId
      }
    });
  };

  const filteredSubjects = subjects.filter(subj => {
    const matchesSearch = subj.name.toLowerCase().includes(search.toLowerCase()) || 
                          subj.code.toLowerCase().includes(search.toLowerCase());
    const matchesSem = semFilter === 'ALL' || subj.semester === semFilter;
    return matchesSearch && matchesSem;
  });

  return (
    <div className="space-y-6 font-['Plus_Jakarta_Sans']">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-stone-900 dark:text-white flex items-center gap-2.5 font-['Outfit']">
            <BookOpen className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />
            Subject Management
          </h1>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
            Configure subjects, credits, weekly teaching hours, and classroom vs. laboratory classifications
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => refetchSubjects()}
            className="inline-flex items-center gap-2 rounded-2xl border border-stone-200 bg-white px-4 py-2.5 text-xs font-bold text-stone-700 hover:bg-stone-50 dark:border-stone-800 dark:bg-stone-900 dark:text-stone-200 dark:hover:bg-stone-800 transition-colors cursor-pointer"
          >
            <RefreshCw className="h-4 w-4 text-emerald-600" />
            Refresh
          </button>

          <RoleGuard allowedRoles={['ADMIN']}>
            <button
              onClick={startAdding}
              className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-amber-500 px-5 py-2.5 text-xs font-black text-white shadow-lg shadow-emerald-500/20 hover:from-emerald-700 hover:to-teal-700 transition-all font-['Outfit'] cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              Add Subject
            </button>
          </RoleGuard>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 dark:bg-red-950/40 dark:border-red-900/60 dark:text-red-400 text-xs flex items-center gap-2.5">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* FILTER & SEARCH */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between p-4 bg-stone-50 dark:bg-stone-900/50 rounded-2xl border border-stone-200/80 dark:border-stone-800">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
          <input
            type="text"
            placeholder="Search subjects by name or code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 text-stone-800 dark:text-stone-100"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <span className="text-xs text-stone-500 dark:text-stone-400 font-bold whitespace-nowrap">Filter Semester:</span>
          <select
            value={semFilter}
            onChange={(e) => setSemFilter(e.target.value)}
            className="px-3 py-2 text-xs bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl focus:outline-none text-stone-700 dark:text-stone-200"
          >
            <option value="ALL">All Semesters</option>
            {['1', '2', '3', '4', '5', '6', '7', '8'].map(sem => (
              <option key={sem} value={sem}>Semester {sem}</option>
            ))}
          </select>
        </div>
      </div>

      {/* NEW SUBJECT FORM PANEL */}
      {isAdding && (
        <form onSubmit={handleCreate} className="p-6 bg-white dark:bg-stone-900 rounded-3xl border border-emerald-200 dark:border-stone-800 space-y-4">
          <h3 className="text-sm font-bold text-stone-900 dark:text-white font-['Outfit'] flex items-center gap-2">
            <Plus className="h-4 w-4 text-emerald-600" /> New Subject Configuration
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-[10px] font-extrabold uppercase tracking-wider text-stone-500 mb-1">Subject Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Database Management Systems"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs bg-stone-50 dark:bg-stone-900/60 border border-stone-200 dark:border-stone-800 rounded-xl text-stone-800 dark:text-stone-100"
              />
            </div>

            <div>
              <label className="block text-[10px] font-extrabold uppercase tracking-wider text-stone-500 mb-1">Subject Code *</label>
              <input
                type="text"
                required
                placeholder="e.g. CS-301"
                value={formCode}
                onChange={(e) => setFormCode(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs bg-stone-50 dark:bg-stone-900/60 border border-stone-200 dark:border-stone-800 rounded-xl text-stone-800 dark:text-stone-100"
              />
            </div>

            <div>
              <label className="block text-[10px] font-extrabold uppercase tracking-wider text-stone-500 mb-1">Department *</label>
              <select
                value={formDeptId}
                onChange={(e) => setFormDeptId(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs bg-stone-50 dark:bg-stone-900/60 border border-stone-200 dark:border-stone-800 rounded-xl text-stone-700 dark:text-stone-200"
              >
                <option value="">Select Department</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-extrabold uppercase tracking-wider text-stone-500 mb-1">Semester *</label>
              <select
                value={formSem}
                onChange={(e) => setFormSem(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs bg-stone-50 dark:bg-stone-900/60 border border-stone-200 dark:border-stone-800 rounded-xl text-stone-700 dark:text-stone-200"
              >
                {['1', '2', '3', '4', '5', '6', '7', '8'].map(sem => (
                  <option key={sem} value={sem}>Semester {sem}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-extrabold uppercase tracking-wider text-stone-500 mb-1">Credits</label>
              <input
                type="number"
                min={1}
                max={6}
                value={formCredits}
                onChange={(e) => setFormCredits(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 text-xs bg-stone-50 dark:bg-stone-900/60 border border-stone-200 dark:border-stone-800 rounded-xl text-stone-800 dark:text-stone-100"
              />
            </div>

            <div>
              <label className="block text-[10px] font-extrabold uppercase tracking-wider text-stone-500 mb-1">Weekly Hours *</label>
              <input
                type="number"
                min={1}
                max={10}
                required
                value={formHours}
                onChange={(e) => setFormHours(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 text-xs bg-stone-50 dark:bg-stone-900/60 border border-stone-200 dark:border-stone-800 rounded-xl text-stone-800 dark:text-stone-100"
              />
            </div>

            <div>
              <label className="block text-[10px] font-extrabold uppercase tracking-wider text-stone-500 mb-1">Subject Type</label>
              <div className="flex gap-4 mt-2">
                <label className="inline-flex items-center text-xs font-bold text-stone-700 dark:text-stone-300">
                  <input
                    type="radio"
                    name="formType"
                    checked={formType === 'CLASSROOM'}
                    onChange={() => setFormType('CLASSROOM')}
                    className="mr-2 h-4 w-4 accent-emerald-600"
                  />
                  Classroom (Lecture)
                </label>
                <label className="inline-flex items-center text-xs font-bold text-stone-700 dark:text-stone-300">
                  <input
                    type="radio"
                    name="formType"
                    checked={formType === 'LAB'}
                    onChange={() => setFormType('LAB')}
                    className="mr-2 h-4 w-4 accent-emerald-600"
                  />
                  Lab (Practical)
                </label>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-4 py-2 rounded-xl border border-stone-200 text-xs font-bold text-stone-600 dark:border-stone-800 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-emerald-600 text-xs font-bold text-white hover:bg-emerald-700 transition-colors cursor-pointer"
            >
              Create Subject
            </button>
          </div>
        </form>
      )}

      {/* SUBJECTS LIST GRID */}
      {loadingSubjects ? (
        <div className="py-12 text-center text-stone-500 font-medium">Loading subjects database...</div>
      ) : (
        <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200/80 dark:border-stone-800 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-stone-50 border-b border-stone-200/60 dark:bg-stone-900 dark:border-stone-800">
                  <th className="p-4 text-[10px] font-extrabold uppercase tracking-wider text-stone-500">Code</th>
                  <th className="p-4 text-[10px] font-extrabold uppercase tracking-wider text-stone-500">Subject Name</th>
                  <th className="p-4 text-[10px] font-extrabold uppercase tracking-wider text-stone-500">Department</th>
                  <th className="p-4 text-[10px] font-extrabold uppercase tracking-wider text-stone-500">Semester</th>
                  <th className="p-4 text-[10px] font-extrabold uppercase tracking-wider text-stone-500">Credits / Hours</th>
                  <th className="p-4 text-[10px] font-extrabold uppercase tracking-wider text-stone-500">Type</th>
                  <th className="p-4 text-[10px] font-extrabold uppercase tracking-wider text-stone-500">Scheduled Slots</th>
                  <th className="p-4 text-[10px] font-extrabold uppercase tracking-wider text-stone-500 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-150 dark:divide-stone-800">
                {filteredSubjects.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-stone-400 dark:text-stone-500 text-xs font-semibold">
                      No subjects found matching your filters.
                    </td>
                  </tr>
                ) : (
                  filteredSubjects.map(subj => {
                    const isEditing = editingId === subj.id;
                    return (
                      <tr key={subj.id} className="hover:bg-stone-50/40 dark:hover:bg-stone-800/20 transition-colors">
                        {isEditing ? (
                          // EDITING INLINE ROW
                          <td colSpan={8} className="p-4 bg-emerald-50/20 dark:bg-stone-900">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                              <input
                                type="text"
                                placeholder="Code"
                                value={formCode}
                                onChange={(e) => setFormCode(e.target.value)}
                                className="px-3 py-1.5 text-xs bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-850 rounded-lg"
                              />
                              <input
                                type="text"
                                placeholder="Name"
                                value={formName}
                                onChange={(e) => setFormName(e.target.value)}
                                className="px-3 py-1.5 text-xs bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-850 rounded-lg"
                              />
                              <select
                                value={formDeptId}
                                onChange={(e) => setFormDeptId(e.target.value)}
                                className="px-3 py-1.5 text-xs bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-850 rounded-lg"
                              >
                                {departments.map(d => (
                                  <option key={d.id} value={d.id}>{d.name}</option>
                                ))}
                              </select>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-3">
                              <select
                                value={formSem}
                                onChange={(e) => setFormSem(e.target.value)}
                                className="px-3 py-1.5 text-xs bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-850 rounded-lg"
                              >
                                {['1','2','3','4','5','6','7','8'].map(s => <option key={s} value={s}>Semester {s}</option>)}
                              </select>
                              <input
                                type="number"
                                placeholder="Credits"
                                value={formCredits}
                                onChange={(e) => setFormCredits(Number(e.target.value))}
                                className="px-3 py-1.5 text-xs bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-850 rounded-lg"
                              />
                              <input
                                type="number"
                                placeholder="Weekly Hours"
                                value={formHours}
                                onChange={(e) => setFormHours(Number(e.target.value))}
                                className="px-3 py-1.5 text-xs bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-850 rounded-lg"
                              />
                              <select
                                value={formType}
                                onChange={(e) => setFormType(e.target.value as any)}
                                className="px-3 py-1.5 text-xs bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-850 rounded-lg"
                              >
                                <option value="CLASSROOM">Classroom</option>
                                <option value="LAB">Lab</option>
                              </select>
                            </div>
                            <div className="flex justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => setEditingId(null)}
                                className="px-3 py-1.5 rounded-lg border border-stone-200 text-xs font-bold text-stone-600 hover:bg-stone-50 dark:border-stone-800 dark:text-stone-300 dark:hover:bg-stone-800"
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                onClick={() => handleUpdate(subj.id)}
                                className="px-4.5 py-1.5 rounded-lg bg-emerald-600 text-xs font-bold text-white hover:bg-emerald-700"
                              >
                                Save Changes
                              </button>
                            </div>
                          </td>
                        ) : (
                          // RENDER ROW
                          <>
                            <td className="p-4 font-mono text-xs font-extrabold text-stone-700 dark:text-stone-300">{subj.code}</td>
                            <td className="p-4 text-xs font-black text-stone-900 dark:text-white font-['Outfit']">{subj.name}</td>
                            <td className="p-4 text-xs text-stone-600 dark:text-stone-300">{subj.department?.name || 'N/A'}</td>
                            <td className="p-4 text-xs font-bold text-stone-700 dark:text-stone-300">Semester {subj.semester}</td>
                            <td className="p-4 text-xs text-stone-600 dark:text-stone-400">
                              <span className="font-bold text-stone-800 dark:text-stone-200">{subj.credits}</span> Credits / <span className="font-bold text-stone-800 dark:text-stone-200">{subj.weeklyHours}</span> hrs/wk
                            </td>
                            <td className="p-4">
                              <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold ${
                                subj.type === 'LAB' 
                                  ? 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900/60' 
                                  : 'bg-emerald-50 text-emerald-750 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/60'
                              }`}>
                                {subj.type}
                              </span>
                            </td>
                            <td className="p-4 text-xs font-extrabold text-stone-500 dark:text-stone-400 font-mono">
                              {subj._count?.timetableSlots || 0} slots
                            </td>
                            <td className="p-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <RoleGuard allowedRoles={['ADMIN']}>
                                  <button
                                    onClick={() => startEditing(subj)}
                                    className="p-2 rounded-xl border border-stone-150 hover:bg-stone-50 text-stone-600 dark:border-stone-800 dark:text-stone-300 dark:hover:bg-stone-800 cursor-pointer transition-colors"
                                    title="Edit Subject"
                                  >
                                    <Edit2 className="h-3.5 w-3.5" />
                                  </button>
                                  <button
                                    onClick={() => {
                                      if (confirm(`Are you sure you want to delete ${subj.name}?`)) {
                                        deleteMutation.mutate(subj.id);
                                      }
                                    }}
                                    className="p-2 rounded-xl border border-stone-150 hover:bg-stone-50 text-red-600 dark:border-stone-800 dark:text-red-400 dark:hover:bg-stone-800 cursor-pointer transition-colors"
                                    title="Delete Subject"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </RoleGuard>
                              </div>
                            </td>
                          </>
                        )}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
