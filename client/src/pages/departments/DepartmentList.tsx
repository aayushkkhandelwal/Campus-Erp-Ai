import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Building2, Plus, Users, GraduationCap, Edit2, Trash2, RefreshCw, AlertTriangle } from 'lucide-react';
import { departmentService } from '../../services/department.service';
import { RoleGuard } from '../../components/common/RoleGuard';

export const DepartmentList = () => {
  const queryClient = useQueryClient();
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string; code: string } | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['departments-list'],
    queryFn: () => departmentService.getAll(),
  });

  const rawDepartments = data?.data || [];

  // Sort by Department Code ascending
  const departments = [...rawDepartments].sort((a, b) =>
    (a.code || '').localeCompare(b.code || '')
  );

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => departmentService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments-list'] });
      queryClient.invalidateQueries({ queryKey: ['departments-count'] });
      setDeleteTarget(null);
    },
  });

  const handleSyncDatabase = async () => {
    setIsSyncing(true);
    localStorage.removeItem('college_erp_departments');
    await queryClient.invalidateQueries({ queryKey: ['departments-list'] });
    await queryClient.refetchQueries({ queryKey: ['departments-list'] });
    setTimeout(() => {
      setIsSyncing(false);
    }, 1000);
  };

  return (
    <div className="space-y-6 font-['Plus_Jakarta_Sans']">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-stone-900 dark:text-white flex items-center gap-2.5 font-['Outfit']">
            <Building2 className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />
            Academic Departments
          </h1>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
            University faculties, heads of departments, and student/faculty counts
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleSyncDatabase}
            disabled={isSyncing}
            className="inline-flex items-center gap-2 rounded-2xl border border-amber-200 bg-white px-4 py-2.5 text-xs font-bold text-stone-700 hover:bg-amber-50 dark:border-stone-800 dark:bg-stone-900 dark:text-stone-200 dark:hover:bg-stone-800 transition-colors cursor-pointer disabled:opacity-75"
            title="Sync Database & Purge Browser Cache"
          >
            <RefreshCw className={`h-4 w-4 text-emerald-600 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? 'Syncing...' : 'Sync Database'}
          </button>

          {/* ADMIN ONLY ADD BUTTON */}
          <RoleGuard allowedRoles={['ADMIN']}>
            <Link
              to="/departments/add"
              className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-amber-500 px-5 py-2.5 text-xs font-black text-white shadow-lg shadow-emerald-500/20 hover:from-emerald-700 hover:to-teal-700 transition-all font-['Outfit']"
            >
              <Plus className="h-4 w-4" />
              Add Department
            </Link>
          </RoleGuard>
        </div>
      </div>

      {isLoading ? (
        <div className="py-12 text-center text-stone-500 font-medium">Loading department details...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {departments.map((dept) => (
            <div
              key={dept.id}
              className="rounded-3xl border border-amber-200/80 bg-white p-6 shadow-sm dark:border-stone-800 dark:bg-stone-900 flex flex-col justify-between transition-all hover:shadow-md duration-200"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 text-xs font-extrabold font-mono border border-emerald-200/60 dark:border-emerald-900">
                    {dept.code}
                  </span>

                  <RoleGuard allowedRoles={['ADMIN']}>
                    <div className="flex items-center gap-1">
                      <Link
                        to={`/departments/edit/${dept.id}`}
                        className="p-1.5 rounded-xl text-stone-500 hover:bg-amber-100 hover:text-stone-900 dark:text-stone-400 dark:hover:bg-stone-800 dark:hover:text-white transition-colors"
                        title="Edit Department"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Link>
                      <button
                        onClick={() => setDeleteTarget({ id: dept.id, name: dept.name, code: dept.code })}
                        className="p-1.5 rounded-xl text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-950/50 transition-colors cursor-pointer"
                        title="Delete Department"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </RoleGuard>
                </div>

                <h3 className="text-base font-black text-stone-900 dark:text-white font-['Outfit']">
                  {dept.name}
                </h3>
                <p className="mt-2 text-xs font-medium text-stone-500 dark:text-stone-400 line-clamp-2">
                  {dept.description || 'Department offering undergraduate and graduate programs.'}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-amber-100 dark:border-stone-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-stone-400 font-bold">Head of Dept:</span>
                  <span className="font-extrabold text-stone-800 dark:text-stone-200">{dept.headOfDepartment || 'TBD'}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1 text-stone-400 font-bold">
                    <GraduationCap className="h-3.5 w-3.5" /> Faculty Members:
                  </span>
                  <span className="font-black text-stone-800 dark:text-stone-200">{dept.facultyCount || 0}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1 text-stone-400 font-bold">
                    <Users className="h-3.5 w-3.5" /> Enrolled Students:
                  </span>
                  <span className="font-black text-amber-600 dark:text-amber-400">{dept.studentCount || 0}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl dark:bg-stone-900 border border-amber-200 dark:border-stone-800 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-2.5 rounded-2xl bg-rose-100 dark:bg-rose-950/70">
                <AlertTriangle className="h-6 w-6 text-rose-600" />
              </div>
              <div>
                <h3 className="text-lg font-black text-stone-900 dark:text-white font-['Outfit']">Confirm Delete Department</h3>
                <p className="text-xs text-stone-500 dark:text-stone-400">This action will remove the record from PostgreSQL.</p>
              </div>
            </div>

            <p className="text-xs text-stone-700 dark:text-stone-300">
              Are you sure you want to permanently delete <strong className="text-stone-900 dark:text-white">{deleteTarget.name}</strong> (<span className="font-mono">{deleteTarget.code}</span>)?
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteMutation.mutate(deleteTarget.id)}
                disabled={deleteMutation.isPending}
                className="px-4 py-2 rounded-xl bg-rose-600 text-xs font-black text-white hover:bg-rose-700 shadow-md shadow-rose-600/20 cursor-pointer"
              >
                {deleteMutation.isPending ? 'Deleting...' : 'Delete Department'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DepartmentList;
