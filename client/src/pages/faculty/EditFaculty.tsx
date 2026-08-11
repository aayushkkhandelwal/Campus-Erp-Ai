import { useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { GraduationCap, ArrowLeft, Save, ChevronDown, Lock } from 'lucide-react';
import { facultyService } from '../../services/faculty.service';
import { departmentService } from '../../services/department.service';

const facultySchema = z.object({
  firstName: z.string().min(2, 'First name is required'),
  lastName: z.string().min(2, 'Last name is required'),
  email: z.string().email('Valid email is required'),
  employeeId: z.string().min(3, 'Employee ID is required'),
  phone: z.string().min(5, 'Phone number is required'),
  designation: z.string().min(2, 'Designation is required'),
  qualification: z.string().min(2, 'Qualification is required'),
  specialization: z.string().min(2, 'Specialization is required'),
  departmentId: z.string().min(1, 'Department selection is required'),
  joiningDate: z.string().min(1, 'Joining date is required'),
  status: z.enum(['ACTIVE', 'INACTIVE', 'ON_LEAVE']),
});

type FacultyFormData = z.infer<typeof facultySchema>;

export const EditFaculty = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: faculty, isLoading } = useQuery({
    queryKey: ['faculty-detail', id],
    queryFn: () => facultyService.getById(id || 'fac-1'),
    enabled: !!id,
  });

  const { data: deptData } = useQuery({
    queryKey: ['departments-list'],
    queryFn: () => departmentService.getAll(),
  });

  const departments = deptData?.data || [];

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FacultyFormData>({
    resolver: zodResolver(facultySchema),
  });

  useEffect(() => {
    if (faculty) {
      reset({
        firstName: faculty.firstName,
        lastName: faculty.lastName,
        email: faculty.email,
        employeeId: faculty.employeeId,
        phone: faculty.phone,
        designation: faculty.designation,
        qualification: faculty.qualification,
        specialization: faculty.specialization,
        departmentId: faculty.departmentId || 'dept-1',
        joiningDate: faculty.joiningDate ? faculty.joiningDate.split('T')[0] : '2018-08-15',
        status: faculty.status || 'ACTIVE',
      });
    }
  }, [faculty, reset]);

  const mutation = useMutation({
    mutationFn: (data: FacultyFormData) => facultyService.update(id || '', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['faculty-list'] });
      navigate('/faculty');
    },
  });

  const onSubmit = (data: FacultyFormData) => {
    mutation.mutate(data);
  };

  if (isLoading) {
    return <div className="p-8 text-center text-stone-500 font-bold">Loading faculty details...</div>;
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto font-['Plus_Jakarta_Sans']">
      <div className="flex items-center gap-3">
        <Link
          to="/faculty"
          className="p-2.5 rounded-2xl border border-amber-200 bg-white dark:border-stone-800 dark:bg-stone-900 text-stone-600 dark:text-stone-300 hover:bg-amber-50 dark:hover:bg-stone-800 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-black text-stone-900 dark:text-white flex items-center gap-2 font-['Outfit']">
            <GraduationCap className="h-6 w-6 text-orange-600 dark:text-orange-400" />
            Edit Faculty Profile
          </h1>
          <p className="text-xs text-stone-500 dark:text-stone-400">
            Updating roster record for {faculty?.firstName} {faculty?.lastName} ({faculty?.employeeId})
          </p>
        </div>
      </div>

      <div className="rounded-3xl border border-amber-200/80 bg-white p-6 md:p-8 shadow-sm dark:border-stone-800 dark:bg-stone-900">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* First Name */}
            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-stone-700 dark:text-stone-300 mb-1.5">First Name *</label>
              <input {...register('firstName')} className="w-full rounded-2xl border border-amber-200 bg-amber-50/40 px-4 py-2.5 text-sm text-stone-900 focus:border-amber-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-amber-500/20 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100" />
              {errors.firstName && <p className="mt-1 text-[11px] font-bold text-rose-500">{errors.firstName.message}</p>}
            </div>

            {/* Last Name */}
            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-stone-700 dark:text-stone-300 mb-1.5">Last Name *</label>
              <input {...register('lastName')} className="w-full rounded-2xl border border-amber-200 bg-amber-50/40 px-4 py-2.5 text-sm text-stone-900 focus:border-amber-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-amber-500/20 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100" />
            </div>

            {/* Email Address */}
            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-stone-700 dark:text-stone-300 mb-1.5">Email Address *</label>
              <input {...register('email')} type="email" className="w-full rounded-2xl border border-amber-200 bg-amber-50/40 px-4 py-2.5 text-sm text-stone-900 focus:border-amber-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-amber-500/20 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100" />
            </div>

            {/* Employee ID (Locked System Field) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-extrabold uppercase tracking-wider text-stone-700 dark:text-stone-300">
                  Employee ID / Faculty ID *
                </label>
                <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/80 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-900">
                  <Lock className="h-3 w-3 text-amber-600" />
                  Locked System Field
                </span>
              </div>
              <input
                {...register('employeeId')}
                type="text"
                readOnly
                disabled
                className="w-full rounded-2xl border border-amber-200 bg-amber-50/40 px-4 py-2.5 text-sm font-mono font-bold text-stone-900 cursor-not-allowed dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100 opacity-90"
              />
            </div>

            {/* Department */}
            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-stone-700 dark:text-stone-300 mb-1.5">Department *</label>
              <div className="relative">
                <select {...register('departmentId')} className="w-full appearance-none rounded-2xl border border-amber-200 bg-amber-50/40 px-4 py-2.5 pr-10 text-sm text-stone-900 focus:border-amber-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-amber-500/20 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100 cursor-pointer">
                  {departments.map((d: any) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400 pointer-events-none" />
              </div>
            </div>

            {/* Status */}
            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-stone-700 dark:text-stone-300 mb-1.5">Status *</label>
              <div className="relative">
                <select {...register('status')} className="w-full appearance-none rounded-2xl border border-amber-200 bg-amber-50/40 px-4 py-2.5 pr-10 text-sm text-stone-900 focus:border-amber-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-amber-500/20 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100 cursor-pointer">
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="INACTIVE">INACTIVE</option>
                  <option value="ON_LEAVE">ON_LEAVE</option>
                </select>
                <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400 pointer-events-none" />
              </div>
            </div>

            {/* Designation */}
            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-stone-700 dark:text-stone-300 mb-1.5">Designation *</label>
              <input {...register('designation')} className="w-full rounded-2xl border border-amber-200 bg-amber-50/40 px-4 py-2.5 text-sm text-stone-900 focus:border-amber-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-amber-500/20 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100" />
            </div>

            {/* Specialization */}
            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-stone-700 dark:text-stone-300 mb-1.5">Specialization *</label>
              <input {...register('specialization')} className="w-full rounded-2xl border border-amber-200 bg-amber-50/40 px-4 py-2.5 text-sm text-stone-900 focus:border-amber-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-amber-500/20 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100" />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-amber-100 dark:border-stone-800">
            <Link to="/faculty" className="px-5 py-2.5 rounded-2xl border border-stone-200 dark:border-stone-700 text-xs font-bold text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors">
              Cancel
            </Link>
            <button type="submit" className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-orange-500 via-amber-500 to-rose-500 px-6 py-2.5 text-xs font-black text-white shadow-lg shadow-orange-500/25 font-['Outfit']">
              <Save className="h-4 w-4" /> Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditFaculty;
