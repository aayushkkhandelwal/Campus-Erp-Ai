import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Columns, Plus, Edit2, Trash2, RefreshCw, AlertCircle, Search, Building2 } from 'lucide-react';
import { sectionService } from '../../../services/section.service';
import type { Section } from '../../../services/section.service';
import { departmentService } from '../../../services/department.service';
import { RoleGuard } from '../../../components/common/RoleGuard';

export const SectionManagement = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form states
  const [formName, setFormName] = useState('');
  const [formSem, setFormSem] = useState('1');
  const [formDeptId, setFormDeptId] = useState('');

  // Fetch sections
  const { data: sections = [], isLoading: loadingSections, refetch: refetchSections } = useQuery({
    queryKey: ['sections-list'],
    queryFn: () => sectionService.getAll(),
  });

  // Fetch departments
  const { data: departmentsResponse } = useQuery({
    queryKey: ['departments-list'],
    queryFn: () => departmentService.getAll(),
  });
  const departments = departmentsResponse?.data || [];

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: Omit<Section, 'id'>) => sectionService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sections-list'] });
      setIsAdding(false);
      resetForm();
      setErrorMsg(null);
    },
    onError: (err: any) => {
      setErrorMsg(err.response?.data?.message || err.message || 'Failed to create section');
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Section> }) => sectionService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sections-list'] });
      setEditingId(null);
      setErrorMsg(null);
    },
    onError: (err: any) => {
      setErrorMsg(err.response?.data?.message || err.message || 'Failed to update section');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => sectionService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sections-list'] });
      setErrorMsg(null);
    },
    onError: (err: any) => {
      setErrorMsg(err.response?.data?.message || err.message || 'Failed to delete section');
    }
  });

  const resetForm = () => {
    setFormName('');
    setFormSem('1');
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

  const startEditing = (sec: Section) => {
    setEditingId(sec.id);
    setIsAdding(false);
    setFormName(sec.name);
    setFormSem(sec.semester);
    setFormDeptId(sec.departmentId);
    setErrorMsg(null);
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formDeptId) {
      setErrorMsg('Name and Department ID are required.');
      return;
    }
    createMutation.mutate({
      name: formName,
      semester: formSem,
      departmentId: formDeptId
    });
  };

  const handleUpdate = (id: string) => {
    if (!formName || !formDeptId) {
      setErrorMsg('Name and Department ID cannot be empty.');
      return;
    }
    updateMutation.mutate({
      id,
      data: {
        name: formName,
        semester: formSem,
        departmentId: formDeptId
      }
    });
  };

  const filteredSections = sections.filter(sec => 
    sec.name.toLowerCase().includes(search.toLowerCase()) ||
    sec.department?.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 font-['Plus_Jakarta_Sans']">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-stone-900 dark:text-white flex items-center gap-2.5 font-['Outfit']">
            <Columns className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />
            Section Management
          </h1>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
            Group students into specific sections per branch and semester level to optimize scheduling grids
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => refetchSections()}
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
              Add Section
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
      <div className="flex p-4 bg-stone-50 dark:bg-stone-900/50 rounded-2xl border border-stone-200/80 dark:border-stone-800">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
          <input
            type="text"
            placeholder="Search sections by name or department..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 text-stone-800 dark:text-stone-100"
          />
        </div>
      </div>

      {/* NEW SECTION FORM PANEL */}
      {isAdding && (
        <form onSubmit={handleCreate} className="p-6 bg-white dark:bg-stone-900 rounded-3xl border border-emerald-200 dark:border-stone-800 space-y-4">
          <h3 className="text-sm font-bold text-stone-900 dark:text-white font-['Outfit'] flex items-center gap-2">
            <Plus className="h-4 w-4 text-emerald-600" /> New Section Configuration
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-[10px] font-extrabold uppercase tracking-wider text-stone-500 mb-1">Section Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Section A, Section B"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs bg-stone-50 dark:bg-stone-900/60 border border-stone-200 dark:border-stone-800 rounded-xl text-stone-800 dark:text-stone-100"
              />
            </div>

            <div>
              <label className="block text-[10px] font-extrabold uppercase tracking-wider text-stone-500 mb-1">Academic Department *</label>
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
              <label className="block text-[10px] font-extrabold uppercase tracking-wider text-stone-500 mb-1">Semester Level *</label>
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
              Create Section
            </button>
          </div>
        </form>
      )}

      {/* SECTIONS LIST */}
      {loadingSections ? (
        <div className="py-12 text-center text-stone-500 font-medium">Loading sections database...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredSections.length === 0 ? (
            <div className="col-span-full py-12 text-center text-stone-400 dark:text-stone-500 text-xs font-semibold">
              No sections configured in the database.
            </div>
          ) : (
            filteredSections.map(sec => {
              const isEditing = editingId === sec.id;
              if (isEditing) {
                return (
                  <div key={sec.id} className="rounded-3xl border border-emerald-300 bg-emerald-50/10 p-5 space-y-4 dark:border-stone-800 dark:bg-stone-900">
                    <h4 className="text-xs font-extrabold text-stone-500 uppercase tracking-wider">Edit Section Details</h4>
                    <div className="space-y-3">
                      <div>
                        <label className="text-[9px] font-bold text-stone-400 block uppercase">Name</label>
                        <input
                          type="text"
                          value={formName}
                          onChange={(e) => setFormName(e.target.value)}
                          className="w-full px-3 py-1.5 text-xs bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-850 rounded-lg text-stone-800 dark:text-stone-100"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] font-bold text-stone-400 block uppercase">Department</label>
                        <select
                          value={formDeptId}
                          onChange={(e) => setFormDeptId(e.target.value)}
                          className="w-full px-3 py-1.5 text-xs bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-850 rounded-lg text-stone-750 dark:text-stone-200"
                        >
                          {departments.map(d => (
                            <option key={d.id} value={d.id}>{d.name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-[9px] font-bold text-stone-400 block uppercase">Semester</label>
                        <select
                          value={formSem}
                          onChange={(e) => setFormSem(e.target.value)}
                          className="w-full px-3 py-1.5 text-xs bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-850 rounded-lg text-stone-750 dark:text-stone-200"
                        >
                          {['1','2','3','4','5','6','7','8'].map(s => <option key={s} value={s}>Semester {s}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={() => setEditingId(null)}
                        className="px-3 py-1 text-xs border border-stone-200 text-stone-500 rounded-lg hover:bg-stone-50 dark:border-stone-800"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleUpdate(sec.id)}
                        className="px-3 py-1 text-xs bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                );
              }

              return (
                <div key={sec.id} className="rounded-3xl border border-stone-200/80 bg-white p-5 shadow-sm dark:border-stone-800 dark:bg-stone-900 flex flex-col justify-between hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-black text-stone-900 dark:text-white font-['Outfit']">
                        {sec.name}
                      </h3>
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <Building2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                        <span className="text-[11px] font-bold text-stone-600 dark:text-stone-300">
                          {sec.department?.name || 'N/A'}
                        </span>
                      </div>
                    </div>

                    <RoleGuard allowedRoles={['ADMIN']}>
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => startEditing(sec)}
                          className="p-1.5 rounded-lg border border-stone-150 hover:bg-stone-50 text-stone-600 dark:border-stone-850 dark:text-stone-300 dark:hover:bg-stone-800 transition-colors cursor-pointer"
                        >
                          <Edit2 className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Are you sure you want to delete Section ${sec.name}?`)) {
                              deleteMutation.mutate(sec.id);
                            }
                          }}
                          className="p-1.5 rounded-lg border border-stone-150 hover:bg-stone-50 text-red-600 dark:border-stone-850 dark:text-red-400 dark:hover:bg-stone-800 transition-colors cursor-pointer"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </RoleGuard>
                  </div>

                  <div className="flex items-center justify-between border-t border-stone-100 dark:border-stone-800 pt-3 text-xs text-stone-550 dark:text-stone-400">
                    <span className="font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-lg text-[10px]">
                      Semester {sec.semester}
                    </span>

                    <div className="text-[10px] font-mono font-extrabold text-stone-405 dark:text-stone-500">
                      {sec._count?.timetableSlots || 0} slots assigned
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};
