import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { GraduationCap, Plus, Search, Mail, Phone, BookOpen, Edit2, Trash2, RefreshCw, AlertTriangle } from 'lucide-react';
import { facultyService } from '../../services/faculty.service';
import { RoleGuard } from '../../components/common/RoleGuard';

export const FacultyList = () => {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string; employeeId: string } | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['faculty-list'],
    queryFn: () => facultyService.getAll({ page: 1, limit: 50 }),
  });

  const rawFacultyMembers = data?.data || [];

  // Sort by Employee ID ascending
  const facultyMembers = [...rawFacultyMembers].sort((a, b) =>
    (a.employeeId || '').localeCompare(b.employeeId || '', undefined, { numeric: true, sensitivity: 'base' })
  );

  const filteredFaculty = facultyMembers.filter(
    (f) =>
      !searchQuery ||
      f.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.lastName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.employeeId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.specialization?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Status Mutation
  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: any }) =>
      facultyService.update(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['faculty-list'] });
    },
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => facultyService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['faculty-list'] });
      queryClient.invalidateQueries({ queryKey: ['faculty-count'] });
      setDeleteTarget(null);
    },
  });

  const handleSyncDatabase = async () => {
    setIsSyncing(true);
    const start = Date.now();
    localStorage.removeItem('college_erp_faculty');
    await queryClient.invalidateQueries({ queryKey: ['faculty-list'] });
    await queryClient.refetchQueries({ queryKey: ['faculty-list'] });
    const elapsed = Date.now() - start;
    const remaining = Math.max(0, 2000 - elapsed);
    setTimeout(() => {
      setIsSyncing(false);
    }, remaining);
  };

  return (
    <div className="space-y-6 font-['Plus_Jakarta_Sans']">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-stone-900 dark:text-white flex items-center gap-2.5 font-['Outfit']">
            <GraduationCap className="h-7 w-7 text-orange-600 dark:text-orange-400" />
            Faculty Directory
          </h1>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
            Professors, lecturers, and academic research staff directory
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleSyncDatabase}
            disabled={isSyncing}
            className="inline-flex items-center gap-2 rounded-2xl border border-amber-200 bg-white px-4 py-2.5 text-xs font-bold text-stone-700 hover:bg-amber-50 dark:border-stone-800 dark:bg-stone-900 dark:text-stone-200 dark:hover:bg-stone-800 transition-colors cursor-pointer disabled:opacity-75"
            title="Sync Database & Purge Browser Cache"
          >
            <RefreshCw className={`h-4 w-4 text-amber-600 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? 'Syncing...' : 'Sync Database'}
          </button>

          {/* ADMIN ONLY ADD BUTTON */}
          <RoleGuard allowedRoles={['ADMIN']}>
            <Link
              to="/faculty/add"
              className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-orange-500 via-amber-500 to-rose-500 px-5 py-2.5 text-xs font-black text-white shadow-lg shadow-orange-500/20 hover:from-orange-600 hover:to-rose-600 transition-all font-['Outfit']"
            >
              <Plus className="h-4 w-4" />
              Add Faculty Member
            </Link>
          </RoleGuard>
        </div>
      </div>

      <div className="rounded-3xl border border-amber-200/80 bg-white p-6 shadow-sm dark:border-stone-800 dark:bg-stone-900 transition-colors duration-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search faculty by name, ID or specialization..."
              className="w-full rounded-2xl border border-amber-200 bg-amber-50/40 pl-10 pr-4 py-2 text-xs text-stone-900 focus:outline-none focus:ring-4 focus:ring-orange-500/20 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100"
            />
          </div>
          <span className="text-xs font-extrabold text-orange-700 dark:text-orange-400">
            Total: {filteredFaculty.length} Faculty Members
          </span>
        </div>

        {isLoading ? (
          <div className="py-12 text-center text-stone-500 font-medium">Loading faculty records...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-amber-100 dark:border-stone-800 text-stone-400 uppercase tracking-wider font-extrabold">
                  <th className="py-3 px-4">Employee ID</th>
                  <th className="py-3 px-4">Name & Designation</th>
                  <th className="py-3 px-4">Specialization</th>
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-amber-100 dark:divide-stone-800 text-stone-700 dark:text-stone-300">
                {filteredFaculty.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-stone-400 font-medium">
                      No faculty records found.
                    </td>
                  </tr>
                ) : (
                  filteredFaculty.map((fac) => (
                    <tr key={fac.id} className="hover:bg-amber-50/50 dark:hover:bg-stone-800/50 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-orange-600 dark:text-orange-400">
                        {fac.employeeId}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-extrabold text-stone-900 dark:text-white">
                          {fac.firstName} {fac.lastName}
                        </div>
                        <div className="text-[11px] font-semibold text-stone-500 dark:text-stone-400">
                          {fac.designation}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-orange-50 text-orange-800 dark:bg-stone-800 dark:text-orange-300 font-bold">
                          <BookOpen className="h-3 w-3 text-orange-500" />
                          {fac.specialization}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 space-y-0.5">
                        <div className="flex items-center gap-1.5 text-stone-600 dark:text-stone-400 font-semibold">
                          <Mail className="h-3 w-3" />
                          <span>{fac.email}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-stone-400 text-[11px]">
                          <Phone className="h-3 w-3" />
                          <span>{fac.phone}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <RoleGuard allowedRoles={['ADMIN']} fallback={
                          <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                            fac.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400' : 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400'
                          }`}>
                            {fac.status}
                          </span>
                        }>
                          <select
                            value={fac.status || 'ACTIVE'}
                            onChange={(e) => statusMutation.mutate({ id: fac.id, status: e.target.value })}
                            className={`rounded-xl px-2.5 py-1 text-[11px] font-black uppercase tracking-wide border cursor-pointer focus:outline-none focus:ring-2 focus:ring-orange-500/20 ${
                              fac.status === 'ACTIVE'
                                ? 'border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300'
                                : fac.status === 'ON_LEAVE'
                                ? 'border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950/70 dark:text-amber-300'
                                : 'border-rose-300 bg-rose-50 text-rose-800 dark:border-rose-800 dark:bg-rose-950/70 dark:text-rose-300'
                            }`}
                          >
                            <option value="ACTIVE">ACTIVE</option>
                            <option value="INACTIVE">INACTIVE</option>
                            <option value="ON_LEAVE">ON_LEAVE</option>
                          </select>
                        </RoleGuard>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <RoleGuard allowedRoles={['ADMIN']}>
                          <div className="flex items-center justify-end gap-1.5">
                            <Link
                              to={`/faculty/edit/${fac.id}`}
                              className="p-1.5 rounded-xl text-stone-500 hover:bg-amber-100 hover:text-stone-900 dark:text-stone-400 dark:hover:bg-stone-800 dark:hover:text-white transition-colors"
                              title="Edit Faculty Member"
                            >
                              <Edit2 className="h-4 w-4" />
                            </Link>
                            <button
                              onClick={() => setDeleteTarget({ id: fac.id, name: `${fac.firstName} ${fac.lastName}`, employeeId: fac.employeeId })}
                              className="p-1.5 rounded-xl text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-950/50 transition-colors"
                              title="Delete Faculty Member"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </RoleGuard>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl dark:bg-stone-900 border border-amber-200 dark:border-stone-800 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-2.5 rounded-2xl bg-rose-100 dark:bg-rose-950/70">
                <AlertTriangle className="h-6 w-6 text-rose-600" />
              </div>
              <div>
                <h3 className="text-lg font-black text-stone-900 dark:text-white font-['Outfit']">Confirm Delete Faculty</h3>
                <p className="text-xs text-stone-500 dark:text-stone-400">This action will remove the record from PostgreSQL.</p>
              </div>
            </div>

            <p className="text-xs text-stone-700 dark:text-stone-300">
              Are you sure you want to permanently delete faculty member <strong className="text-stone-900 dark:text-white">{deleteTarget.name}</strong> (<span className="font-mono">{deleteTarget.employeeId}</span>)?
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteMutation.mutate(deleteTarget.id)}
                disabled={deleteMutation.isPending}
                className="px-4 py-2 rounded-xl bg-rose-600 text-xs font-black text-white hover:bg-rose-700 shadow-md shadow-rose-600/20"
              >
                {deleteMutation.isPending ? 'Deleting...' : 'Delete Faculty'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FacultyList;
