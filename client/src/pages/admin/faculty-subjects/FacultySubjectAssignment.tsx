import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Award, Plus, RefreshCw, AlertCircle, Search, UserCheck, GraduationCap, X } from 'lucide-react';
import { facultySubjectService } from '../../../services/faculty-subject.service';
import { subjectService } from '../../../services/subject.service';
import { facultyService } from '../../../services/faculty.service';
import { RoleGuard } from '../../../components/common/RoleGuard';

export const FacultySubjectAssignment = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Selector state for assignments
  const [selectedFacultyId, setSelectedFacultyId] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);

  // Fetch qualifications
  const { data: assignments = [], isLoading: loadingQualifications, refetch: refetchQualifications } = useQuery({
    queryKey: ['faculty-subjects-list'],
    queryFn: () => facultySubjectService.getAll(),
  });

  // Fetch subjects
  const { data: subjects = [] } = useQuery({
    queryKey: ['subjects-list'],
    queryFn: () => subjectService.getAll(),
  });

  // Fetch faculty members (re-use standard fetch)
  const { data: facultyResponse } = useQuery({
    queryKey: ['faculties-list'],
    queryFn: () => facultyService.getAll(),
  });
  const faculties = facultyResponse?.data || [];

  // Mutations
  const assignMutation = useMutation({
    mutationFn: ({ facultyId, subjectId }: { facultyId: string; subjectId: string }) => 
      facultySubjectService.assign(facultyId, subjectId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['faculty-subjects-list'] });
      setIsAssigning(false);
      setSelectedSubjectId('');
      setSelectedFacultyId('');
      setErrorMsg(null);
    },
    onError: (err: any) => {
      setErrorMsg(err.response?.data?.message || err.message || 'Failed to link qualification');
    }
  });

  const unassignMutation = useMutation({
    mutationFn: (id: string) => facultySubjectService.unassign(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['faculty-subjects-list'] });
      setErrorMsg(null);
    },
    onError: (err: any) => {
      setErrorMsg(err.response?.data?.message || err.message || 'Failed to remove qualification');
    }
  });

  const handleAssign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFacultyId || !selectedSubjectId) {
      setErrorMsg('Please select both a faculty member and a subject.');
      return;
    }
    assignMutation.mutate({
      facultyId: selectedFacultyId,
      subjectId: selectedSubjectId
    });
  };

  // Group assignments by faculty member for tabular display
  const facultyGroupMap: Record<string, {
    facultyId: string;
    facultyName: string;
    employeeId: string;
    departmentName: string;
    qualifications: Array<{ id: string; subjectName: string; subjectCode: string; type: string }>
  }> = {};

  // First populate all faculty records
  faculties.forEach(f => {
    facultyGroupMap[f.id] = {
      facultyId: f.id,
      facultyName: `${f.firstName} ${f.lastName}`.trim(),
      employeeId: f.employeeId,
      departmentName: f.department?.name || 'N/A',
      qualifications: []
    };
  });

  // Then map the active qualification links
  assignments.forEach(asg => {
    if (facultyGroupMap[asg.facultyId]) {
      facultyGroupMap[asg.facultyId].qualifications.push({
        id: asg.id,
        subjectName: asg.subject.name,
        subjectCode: asg.subject.code,
        type: asg.subject.type
      });
    }
  });

  const groupedFacultyData = Object.values(facultyGroupMap).filter(f => 
    f.facultyName.toLowerCase().includes(search.toLowerCase()) || 
    f.employeeId.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 font-['Plus_Jakarta_Sans']">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-stone-900 dark:text-white flex items-center gap-2.5 font-['Outfit']">
            <Award className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />
            Faculty-Subject Qualifications
          </h1>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
            Map which faculty members are qualified to teach which subjects to enable constraint-safe scheduling
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => refetchQualifications()}
            className="inline-flex items-center gap-2 rounded-2xl border border-stone-200 bg-white px-4 py-2.5 text-xs font-bold text-stone-700 hover:bg-stone-50 dark:border-stone-800 dark:bg-stone-900 dark:text-stone-200 dark:hover:bg-stone-800 transition-colors cursor-pointer"
          >
            <RefreshCw className="h-4 w-4 text-emerald-600" />
            Refresh
          </button>

          <RoleGuard allowedRoles={['ADMIN']}>
            <button
              onClick={() => {
                setIsAssigning(true);
                setErrorMsg(null);
              }}
              className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-amber-500 px-5 py-2.5 text-xs font-black text-white shadow-lg shadow-emerald-500/20 hover:from-emerald-700 hover:to-teal-700 transition-all font-['Outfit'] cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              Assign Qualification
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
            placeholder="Search faculty by name or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 text-stone-800 dark:text-stone-100"
          />
        </div>
      </div>

      {/* ASSIGNMENT DIALOG PANEL */}
      {isAssigning && (
        <form onSubmit={handleAssign} className="p-6 bg-white dark:bg-stone-900 rounded-3xl border border-emerald-200 dark:border-stone-800 space-y-4">
          <h3 className="text-sm font-bold text-stone-900 dark:text-white font-['Outfit'] flex items-center gap-2">
            <Plus className="h-4 w-4 text-emerald-600" /> Map Faculty Qualification
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-extrabold uppercase tracking-wider text-stone-500 mb-1">Faculty Member *</label>
              <select
                required
                value={selectedFacultyId}
                onChange={(e) => setSelectedFacultyId(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs bg-stone-50 dark:bg-stone-900/60 border border-stone-200 dark:border-stone-800 rounded-xl text-stone-700 dark:text-stone-200"
              >
                <option value="">Select Faculty Member</option>
                {faculties.map(f => (
                  <option key={f.id} value={f.id}>{f.firstName} {f.lastName} ({f.employeeId} - {f.department?.code || 'N/A'})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-extrabold uppercase tracking-wider text-stone-500 mb-1">Qualified Subject *</label>
              <select
                required
                value={selectedSubjectId}
                onChange={(e) => setSelectedSubjectId(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs bg-stone-50 dark:bg-stone-900/60 border border-stone-200 dark:border-stone-800 rounded-xl text-stone-700 dark:text-stone-200"
              >
                <option value="">Select Subject</option>
                {subjects.map(s => (
                  <option key={s.id} value={s.id}>{s.name} ({s.code} - Sem {s.semester})</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsAssigning(false)}
              className="px-4 py-2 rounded-xl border border-stone-200 text-xs font-bold text-stone-600 dark:border-stone-800 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-emerald-600 text-xs font-bold text-white hover:bg-emerald-700 transition-colors cursor-pointer"
            >
              Save Qualification
            </button>
          </div>
        </form>
      )}

      {/* DETAILED FACULTY GRID */}
      {loadingQualifications ? (
        <div className="py-12 text-center text-stone-500 font-medium">Loading qualifications matrix...</div>
      ) : (
        <div className="grid grid-cols-1 gap-5">
          {groupedFacultyData.length === 0 ? (
            <div className="py-12 text-center text-stone-400 dark:text-stone-500 text-xs font-semibold">
              No faculty member profiles loaded.
            </div>
          ) : (
            groupedFacultyData.map(fac => (
              <div key={fac.facultyId} className="rounded-3xl border border-stone-200/80 bg-white p-6 shadow-sm dark:border-stone-800 dark:bg-stone-900 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:shadow-md transition-shadow">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <UserCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                    <h3 className="text-base font-black text-stone-900 dark:text-white font-['Outfit']">{fac.facultyName}</h3>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-stone-500 dark:text-stone-400">
                    <span>Employee ID: <strong className="text-stone-700 dark:text-stone-300 font-mono">{fac.employeeId}</strong></span>
                    <span>Department: <strong className="text-stone-700 dark:text-stone-300">{fac.departmentName}</strong></span>
                  </div>
                </div>

                <div className="flex-1 flex flex-wrap gap-2 md:justify-start">
                  {fac.qualifications.length === 0 ? (
                    <span className="text-xs text-stone-400 italic font-semibold">No assigned qualifications</span>
                  ) : (
                    fac.qualifications.map(q => (
                      <span key={q.id} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-2xl bg-stone-50 border border-stone-200/60 dark:bg-stone-950/40 dark:border-stone-850 text-xs text-stone-700 dark:text-stone-300">
                        <GraduationCap className="h-3.5 w-3.5 text-emerald-600" />
                        <span className="font-bold">{q.subjectCode}</span>: {q.subjectName}
                        <span className="text-[9px] uppercase font-extrabold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400">
                          {q.type}
                        </span>

                        <RoleGuard allowedRoles={['ADMIN']}>
                          <button
                            onClick={() => {
                              if (confirm(`Unassign subject ${q.subjectName} from ${fac.facultyName}?`)) {
                                unassignMutation.mutate(q.id);
                              }
                            }}
                            className="ml-1.5 p-0.5 text-stone-400 hover:text-red-600 transition-colors cursor-pointer"
                            title="Remove Qualification"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </RoleGuard>
                      </span>
                    ))
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
