import { useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { UserCheck, ArrowLeft, Save, ChevronDown } from 'lucide-react';
import { studentService } from '../../services/student.service';
import { departmentService } from '../../services/department.service';

const studentSchema = z.object({
  firstName: z.string().min(2, 'First name is required'),
  lastName: z.string().min(2, 'Last name is required'),
  email: z.string().email('Valid email address is required'),
  studentId: z.string().min(3, 'Student ID is required'),
  dateOfBirth: z.string().min(1, 'Date of birth is required'),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']),
  phone: z.string().min(5, 'Valid phone number is required'),
  address: z.string().min(5, 'Address is required'),
  departmentId: z.string().min(1, 'Department is required'),
  enrollmentDate: z.string().min(1, 'Enrollment date is required'),
  status: z.enum(['ACTIVE', 'INACTIVE', 'GRADUATED', 'SUSPENDED']),
});

type StudentFormData = z.infer<typeof studentSchema>;

export const EditStudent = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: student, isLoading: loadingStudent } = useQuery({
    queryKey: ['student-detail', id],
    queryFn: () => studentService.getById(id || 'std-1'),
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
  } = useForm<StudentFormData>({
    resolver: zodResolver(studentSchema),
  });

  useEffect(() => {
    if (student) {
      reset({
        firstName: student.firstName,
        lastName: student.lastName,
        email: student.email,
        studentId: student.studentId,
        dateOfBirth: student.dateOfBirth ? student.dateOfBirth.split('T')[0] : '2003-04-15',
        gender: student.gender || 'FEMALE',
        phone: student.phone,
        address: student.address,
        departmentId: student.departmentId || 'dept-1',
        enrollmentDate: student.enrollmentDate ? student.enrollmentDate.split('T')[0] : '2022-09-01',
        status: student.status || 'ACTIVE',
      });
    }
  }, [student, reset]);

  const mutation = useMutation({
    mutationFn: (data: StudentFormData) => studentService.update(id || '', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students-list'] });
      navigate('/students');
    },
  });

  const onSubmit = (data: StudentFormData) => {
    mutation.mutate(data);
  };

  if (loadingStudent) {
    return <div className="p-8 text-center text-stone-500">Loading student details...</div>;
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto font-['Plus_Jakarta_Sans']">
      <div className="flex items-center gap-3">
        <Link
          to="/students"
          className="p-2.5 rounded-2xl border border-amber-200 bg-white dark:border-stone-800 dark:bg-stone-900 text-stone-600 dark:text-stone-300 hover:bg-amber-50 dark:hover:bg-stone-800 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-black text-stone-900 dark:text-white flex items-center gap-2 font-['Outfit']">
            <UserCheck className="h-6 w-6 text-amber-600 dark:text-amber-400" />
            Edit Student Profile
          </h1>
          <p className="text-xs text-stone-500 dark:text-stone-400">
            Updating record for {student?.firstName} {student?.lastName} ({student?.studentId})
          </p>
        </div>
      </div>

      <div className="rounded-3xl border border-amber-200/80 bg-white p-6 md:p-8 shadow-sm dark:border-stone-800 dark:bg-stone-900">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-stone-700 dark:text-stone-300 mb-1.5">First Name *</label>
              <input {...register('firstName')} className="w-full rounded-2xl border border-amber-200 bg-amber-50/40 px-4 py-2.5 text-sm text-stone-900 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100" />
              {errors.firstName && <p className="mt-1 text-[11px] font-bold text-rose-500">{errors.firstName.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-stone-700 dark:text-stone-300 mb-1.5">Last Name *</label>
              <input {...register('lastName')} className="w-full rounded-2xl border border-amber-200 bg-amber-50/40 px-4 py-2.5 text-sm text-stone-900 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100" />
            </div>

            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-stone-700 dark:text-stone-300 mb-1.5">Email Address *</label>
              <input {...register('email')} type="email" className="w-full rounded-2xl border border-amber-200 bg-amber-50/40 px-4 py-2.5 text-sm text-stone-900 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100" />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-extrabold uppercase tracking-wider text-stone-700 dark:text-stone-300">
                  Student ID / Roll No (System Locked)
                </label>
                <span className="text-[10px] font-extrabold text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/80 px-2.5 py-0.5 rounded-full">
                  🔒 Permanent
                </span>
              </div>
              <input
                {...register('studentId')}
                type="text"
                readOnly
                disabled
                className="w-full rounded-2xl border border-amber-300 bg-amber-100/60 px-4 py-2.5 text-sm text-stone-900 font-mono font-bold cursor-not-allowed dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100"
              />
            </div>

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

            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-stone-700 dark:text-stone-300 mb-1.5">Status *</label>
              <div className="relative">
                <select {...register('status')} className="w-full appearance-none rounded-2xl border border-amber-200 bg-amber-50/40 px-4 py-2.5 pr-10 text-sm text-stone-900 focus:border-amber-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-amber-500/20 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100 cursor-pointer">
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="INACTIVE">INACTIVE</option>
                  <option value="GRADUATED">GRADUATED</option>
                  <option value="SUSPENDED">SUSPENDED</option>
                </select>
                <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400 pointer-events-none" />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-amber-100 dark:border-stone-800">
            <Link to="/students" className="px-5 py-2.5 rounded-2xl border border-stone-200 dark:border-stone-700 text-xs font-bold text-stone-600 dark:text-stone-300">
              Cancel
            </Link>
            <button type="submit" className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 px-6 py-2.5 text-xs font-black text-white shadow-lg shadow-orange-500/25 font-['Outfit']">
              <Save className="h-4 w-4" /> Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditStudent;
