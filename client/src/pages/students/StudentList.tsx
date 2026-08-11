import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Users, Plus, Search, Mail, Phone, GraduationCap, RefreshCw, Edit3, Trash2, AlertTriangle, CheckSquare } from 'lucide-react';
import { studentService } from '../../services/student.service';
import { RoleGuard } from '../../components/common/RoleGuard';
import { IndividualAttendanceModal, type IndividualStudentData } from '../../components/attendance/IndividualAttendanceModal';

export const StudentList = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
  const [attendanceStudent, setAttendanceStudent] = useState<IndividualStudentData | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['students-list', searchTerm],
    queryFn: () => studentService.getAll({ page: 1, limit: 50, search: searchTerm }),
  });

  const students = data?.data || [];

  // Update Status Mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      studentService.update(id, { status: status as any }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students-list'] });
      setUpdatingId(null);
    },
  });

  // Delete Student Mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => studentService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students-list'] });
      setDeleteTarget(null);
    },
  });

  const handleStatusChange = (student: any, newStatus: string) => {
    setUpdatingId(student.id);
    updateStatusMutation.mutate({ id: student.id, status: newStatus });
  };

  const handleRefresh = async () => {
    setIsSyncing(true);
    localStorage.removeItem('college_erp_students');
    await refetch();
    setTimeout(() => {
      setIsSyncing(false);
    }, 1000);
  };

  return (
    <div className="space-y-6 font-['Plus_Jakarta_Sans']">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5 font-['Outfit']">
            <Users className="h-7 w-7 text-indigo-600 dark:text-indigo-400" />
            Students Directory
          </h1>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">
            Institutional student enrollments, academic status, and valid sequential IDs
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isSyncing}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800 transition-all cursor-pointer shadow-sm disabled:opacity-75"
          >
            <RefreshCw className={`h-3.5 w-3.5 text-indigo-600 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? 'Syncing...' : 'Sync Database'}
          </button>

          {/* ADMIN ONLY ADD BUTTON */}
          <RoleGuard allowedRoles={['ADMIN']}>
            <Link
              to="/students/add"
              className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 via-violet-600 to-amber-500 px-5 py-2.5 text-xs font-black text-white shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/35 transition-all cursor-pointer font-['Outfit']"
            >
              <Plus className="h-4 w-4" />
              Add New Student
            </Link>
          </RoleGuard>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm shadow-slate-200/50 dark:border-slate-800 dark:bg-slate-900 transition-colors duration-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Filter students by name or ID..."
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 pl-10 pr-4 py-2 text-xs text-slate-900 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
          </div>
          <span className="text-xs font-extrabold text-indigo-600 dark:text-indigo-400">
            Total: {data?.total || students.length} Students
          </span>
        </div>

        {isLoading ? (
          <div className="py-12 text-center text-slate-500 font-medium">Loading student records...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 uppercase tracking-wider font-extrabold">
                  <th className="py-3 px-4">Student ID</th>
                  <th className="py-3 px-4">Name</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                {students.map((student) => (
                  <tr key={student.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-black text-indigo-600 dark:text-indigo-400 tracking-wider">
                      {student.studentId}
                    </td>
                    <td className="py-3.5 px-4 font-extrabold text-slate-900 dark:text-white">
                      {student.firstName} {student.lastName}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-indigo-300 font-bold border border-slate-200/60 dark:border-slate-700">
                        <GraduationCap className="h-3.5 w-3.5 text-indigo-500" />
                        {student.department?.name || 'Computer Science'} ({student.department?.code || 'CS'})
                      </span>
                    </td>
                    <td className="py-3.5 px-4 space-y-0.5">
                      <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 font-semibold">
                        <Mail className="h-3 w-3 text-slate-400" />
                        <span>{student.email}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                        <Phone className="h-3 w-3" />
                        <span>{student.phone}</span>
                      </div>
                    </td>

                    {/* Interactive Status Dropdown */}
                    <td className="py-3.5 px-4">
                      <div className="relative inline-block">
                        <select
                          value={student.status}
                          disabled={updatingId === student.id}
                          onChange={(e) => handleStatusChange(student, e.target.value)}
                          className={`appearance-none font-extrabold text-[10px] uppercase tracking-wider px-3 py-1 pr-6 rounded-full border cursor-pointer focus:outline-none transition-all ${
                            student.status === 'ACTIVE'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/80 dark:text-emerald-300 dark:border-emerald-800'
                              : student.status === 'INACTIVE'
                              ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/80 dark:text-amber-300 dark:border-amber-800'
                              : student.status === 'SUSPENDED'
                              ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/80 dark:text-rose-300 dark:border-rose-800'
                              : 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/80 dark:text-indigo-300 dark:border-indigo-800'
                          }`}
                        >
                          <option value="ACTIVE" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">🟢 ACTIVE</option>
                          <option value="INACTIVE" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">🟡 INACTIVE</option>
                          <option value="GRADUATED" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">🎓 GRADUATED</option>
                          <option value="SUSPENDED" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">🔴 SUSPENDED</option>
                        </select>
                      </div>
                    </td>

                    {/* Edit & Delete Action Buttons */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setAttendanceStudent({
                            rollNo: student.studentId,
                            name: `${student.firstName} ${student.lastName}`,
                            department: student.department?.name,
                            email: (student as any)?.user?.email || student.email
                          })}
                          className="p-1.5 rounded-xl border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 hover:border-amber-300 dark:border-amber-900 dark:bg-amber-950/60 dark:text-amber-300 transition-all cursor-pointer"
                          title="View Individual Attendance Record"
                        >
                          <CheckSquare className="h-3.5 w-3.5" />
                        </button>

                        <Link
                          to={`/students/edit/${student.id}`}
                          className="p-1.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-indigo-950 dark:hover:text-indigo-300 transition-all cursor-pointer"
                          title="Edit Student Profile & Status"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                        </Link>

                        <RoleGuard allowedRoles={['ADMIN']}>
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(student)}
                            className="p-1.5 rounded-xl border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 dark:border-rose-900 dark:bg-rose-950/60 dark:text-rose-300 dark:hover:bg-rose-900 transition-all cursor-pointer"
                            title="Delete Student Record"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </RoleGuard>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Individual Attendance Modal */}
      <IndividualAttendanceModal
        student={attendanceStudent}
        isOpen={Boolean(attendanceStudent)}
        onClose={() => setAttendanceStudent(null)}
      />

      {/* Delete Student Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-rose-50 text-rose-600 dark:bg-rose-950 dark:text-rose-400">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white font-['Outfit']">
                  Confirm Delete Student?
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Are you sure you want to permanently delete <strong className="text-slate-900 dark:text-slate-200">{deleteTarget.firstName} {deleteTarget.lastName}</strong> (<code className="font-mono text-indigo-600 dark:text-indigo-400 font-bold">{deleteTarget.studentId}</code>)?
                </p>
              </div>
            </div>

            <p className="text-xs text-rose-600 dark:text-rose-400 font-semibold bg-rose-50 dark:bg-rose-950/60 p-3 rounded-2xl border border-rose-100 dark:border-rose-900">
              ⚠️ Warning: This action cannot be undone. All associated attendance and grade records will be removed.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2.5 rounded-2xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleteMutation.isPending}
                onClick={() => deleteMutation.mutate(deleteTarget.id)}
                className="px-5 py-2.5 rounded-2xl bg-rose-600 text-xs font-black text-white shadow-lg shadow-rose-600/30 hover:bg-rose-500 disabled:opacity-50 transition-all cursor-pointer font-['Outfit']"
              >
                {deleteMutation.isPending ? 'Deleting...' : 'Delete Permanently'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentList;
