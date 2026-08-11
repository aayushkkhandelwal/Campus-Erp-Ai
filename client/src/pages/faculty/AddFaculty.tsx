import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { GraduationCap, ArrowLeft, Save, CheckCircle2, Lock, AlertCircle, ChevronDown } from 'lucide-react';
import { facultyService } from '../../services/faculty.service';
import { departmentService } from '../../services/department.service';
import api from '../../services/api';

const facultySchema = z.object({
  firstName: z.string().min(2, 'First name is required (minimum 2 characters)'),
  lastName: z.string().optional(),
  email: z.string().email('Valid institutional email address is required'),
  employeeId: z.string().min(3, 'Employee ID is required'),
  phone: z.string().min(5, 'Valid contact phone number is required'),
  designation: z.string().min(2, 'Academic designation is required'),
  qualification: z.string().min(2, 'Academic qualification is required'),
  specialization: z.string().min(2, 'Field of specialization is required'),
  departmentId: z.string().min(1, 'Please select an academic department'),
  joiningDate: z.string().min(1, 'Date of joining is required'),
  status: z.enum(['ACTIVE', 'INACTIVE', 'ON_LEAVE']),
});

type FacultyFormData = z.infer<typeof facultySchema>;

export const AddFaculty = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [successMsg, setSuccessMsg] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const { data: deptData } = useQuery({
    queryKey: ['departments-list'],
    queryFn: () => departmentService.getAll(),
  });

  const departments = deptData?.data || [
    { id: 'dept-1', name: 'Computer Science & Engineering', code: 'CSE' },
    { id: 'dept-2', name: 'Electrical Engineering', code: 'EE' },
    { id: 'dept-3', name: 'Mechanical Engineering', code: 'ME' },
  ];

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FacultyFormData>({
    resolver: zodResolver(facultySchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      employeeId: '',
      phone: '',
      designation: '',
      qualification: '',
      specialization: '',
      departmentId: '',
      joiningDate: new Date().toISOString().split('T')[0],
      status: 'ACTIVE',
    },
  });

  const selectedDeptId = watch('departmentId');
  const typedEmail = watch('email');

  const [emailCheck, setEmailCheck] = useState<{ checking: boolean; exists: boolean; message?: string }>({
    checking: false,
    exists: false,
  });

  // Real-time email uniqueness verification against PostgreSQL database
  useEffect(() => {
    if (!typedEmail || !typedEmail.includes('@') || !typedEmail.includes('.')) {
      setEmailCheck({ checking: false, exists: false });
      return;
    }

    const timer = setTimeout(async () => {
      setEmailCheck({ checking: true, exists: false });
      try {
        const res = await api.get('/faculties/check-email', { params: { email: typedEmail } });
        if (res.data?.data?.exists) {
          const f = res.data.data.faculty;
          setEmailCheck({
            checking: false,
            exists: true,
            message: `⚠️ Faculty email is already registered to ${f?.name || 'an existing professor'} (Employee ID: ${f?.employeeId || 'N/A'})!`,
          });
        } else {
          setEmailCheck({
            checking: false,
            exists: false,
            message: '✓ Email address is available',
          });
        }
      } catch {
        setEmailCheck({ checking: false, exists: false });
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [typedEmail]);

  // Fetch unchangeable sequential Employee ID when a department is selected
  useEffect(() => {
    if (!selectedDeptId) {
      setValue('employeeId', 'Select department first...');
      return;
    }

    const fetchNextId = async () => {
      try {
        const res = await api.get(`/faculties/next-id`, { params: { departmentId: selectedDeptId } });
        if (res.data?.data?.employeeId) {
          setValue('employeeId', res.data.data.employeeId);
        }
      } catch {
        const deptObj = departments.find((d: any) => d.id === selectedDeptId);
        let code = (deptObj?.code || 'CS').toUpperCase();
        if (code === 'CSE') code = 'CS';
        if (code === 'ECE') code = 'EC';
        setValue('employeeId', `2026${code}FAC001`);
      }
    };

    fetchNextId();
  }, [selectedDeptId, departments, setValue]);

  const mutation = useMutation({
    mutationFn: (data: FacultyFormData) => facultyService.create({ ...data, lastName: data.lastName ?? '' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['faculty-list'] });
      queryClient.invalidateQueries({ queryKey: ['faculty-count'] });
      setSuccessMsg(true);
      setApiError(null);
      setTimeout(() => {
        navigate('/faculty');
      }, 1200);
    },
    onError: (err: any) => {
      const errMsg = err?.response?.data?.message || err?.message || 'Failed to create faculty record';
      setApiError(errMsg);
    },
  });

  const onSubmit = (data: FacultyFormData) => {
    if (emailCheck.exists) {
      setApiError(emailCheck.message || 'Cannot register: Email already exists');
      return;
    }
    setApiError(null);
    mutation.mutate(data);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto font-['Plus_Jakarta_Sans']">
      {/* Top Header */}
      <div className="flex items-center justify-between">
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
              Register New Faculty Member
            </h1>
          </div>
        </div>
      </div>

      {/* Form Container Card */}
      <div className="rounded-3xl border border-amber-200/80 bg-white p-6 md:p-8 shadow-sm dark:border-stone-700/50 dark:bg-[#0d0d10] space-y-6">
        {apiError && (
          <div className="rounded-2xl bg-rose-50 p-4 border border-rose-200 text-rose-800 dark:bg-rose-950/70 dark:border-rose-900 text-xs font-extrabold flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />
            <span>{apiError}</span>
          </div>
        )}

        {successMsg && (
          <div className="rounded-2xl bg-emerald-50 p-4 border border-emerald-200 text-emerald-800 dark:bg-emerald-950/60 dark:border-emerald-800 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
            <span>Faculty member successfully registered! Default login password is <code className="bg-emerald-200 dark:bg-emerald-900 px-1.5 py-0.5 rounded font-mono text-emerald-950 dark:text-emerald-100 font-bold">admin123</code>. Redirecting...</span>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* First Name */}
            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-stone-700 dark:text-stone-200 mb-1.5">
                First Name <span className="text-rose-500 font-bold">*</span>
              </label>
              <input
                {...register('firstName')}
                type="text"
                placeholder="Enter first name"
                className="w-full rounded-2xl border border-amber-200 bg-amber-50/40 px-4 py-2.5 text-sm text-stone-900 focus:border-amber-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-amber-500/20 dark:border-stone-600 dark:bg-[#111113] dark:text-white dark:placeholder:text-stone-500 dark:focus:border-emerald-500 dark:focus:ring-emerald-500/30 dark:focus:bg-[#111113]"
              />
              {errors.firstName && <p className="mt-1 text-[11px] font-bold text-rose-500">{errors.firstName.message}</p>}
            </div>

            {/* Last Name */}
            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-stone-700 dark:text-stone-200 mb-1.5">
                Last Name <span className="text-stone-400 dark:text-stone-500 text-[10px] font-normal">(optional)</span>
              </label>
              <input
                {...register('lastName')}
                type="text"
                placeholder="Enter last name"
                className="w-full rounded-2xl border border-amber-200 bg-amber-50/40 px-4 py-2.5 text-sm text-stone-900 focus:border-amber-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-amber-500/20 dark:border-stone-600 dark:bg-[#111113] dark:text-white dark:placeholder:text-stone-500 dark:focus:border-emerald-500 dark:focus:ring-emerald-500/30 dark:focus:bg-[#111113]"
              />
              
            </div>

            {/* Email Address */}
            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-stone-700 dark:text-stone-200 mb-1.5">
                Email Address <span className="text-rose-500 font-bold">*</span>
              </label>
              <input
                {...register('email')}
                type="email"
                placeholder="Enter institutional email address"
                className={`w-full rounded-2xl border px-4 py-2.5 text-sm text-stone-900 focus:outline-none focus:ring-4 dark:bg-[#111113] dark:text-white dark:placeholder:text-stone-500 ${
                  emailCheck.exists
                    ? 'border-rose-400 bg-rose-50/60 focus:border-rose-500 focus:ring-rose-500/20'
                    : 'border-amber-200 bg-amber-50/40 focus:border-amber-500 focus:bg-white focus:ring-amber-500/20 dark:border-stone-600 dark:focus:border-emerald-500 dark:focus:ring-emerald-500/30 dark:focus:bg-[#111113]'
                }`}
              />
              {emailCheck.checking && (
                <p className="mt-1 text-[11px] font-bold text-amber-600 animate-pulse">Checking email availability in database...</p>
              )}
              {emailCheck.exists && (
                <p className="mt-1 text-[11px] font-bold text-rose-600 dark:text-rose-400">{emailCheck.message}</p>
              )}
              {!emailCheck.checking && !emailCheck.exists && emailCheck.message && (
                <p className="mt-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">{emailCheck.message}</p>
              )}
              {errors.email && !emailCheck.exists && (
                <p className="mt-1 text-[11px] font-bold text-rose-500">{errors.email.message}</p>
              )}
            </div>

            {/* Department */}
            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-stone-700 dark:text-stone-200 mb-1.5">
                Department <span className="text-rose-500 font-bold">*</span>
              </label>
              <div className="relative">
                <select
                  {...register('departmentId')}
                  className="w-full appearance-none rounded-2xl border border-amber-200 bg-amber-50/40 px-4 py-2.5 pr-10 text-sm text-stone-900 focus:border-amber-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-amber-500/20 dark:border-stone-600 dark:bg-[#111113] dark:text-white dark:placeholder:text-stone-500 dark:focus:border-emerald-500 dark:focus:ring-emerald-500/30 dark:focus:bg-[#111113] cursor-pointer"
                >
                  <option value="">Select Department...</option>
                  {departments.map((d: any) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.code || 'DEPT'})
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400 pointer-events-none" />
              </div>
              {errors.departmentId && <p className="mt-1 text-[11px] font-bold text-rose-500">{errors.departmentId.message}</p>}
            </div>

            {/* Employee ID (Locked & Read-Only) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-extrabold uppercase tracking-wider text-stone-700 dark:text-stone-300">
                  Employee ID / Faculty ID <span className="text-rose-500 font-bold">*</span>
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
                className="w-full rounded-2xl border border-amber-200 bg-amber-50/40 px-4 py-2.5 text-sm font-mono font-bold text-stone-900 cursor-not-allowed dark:border-stone-600 dark:bg-[#0d0d0e] dark:text-stone-400 opacity-80"
              />
              {errors.employeeId && <p className="mt-1 text-[11px] font-bold text-rose-500">{errors.employeeId.message}</p>}
            </div>

            {/* Designation */}
            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-stone-700 dark:text-stone-200 mb-1.5">
                Designation <span className="text-rose-500 font-bold">*</span>
              </label>
              <input
                {...register('designation')}
                type="text"
                placeholder="e.g. Professor & HOD / Associate Professor"
                className="w-full rounded-2xl border border-amber-200 bg-amber-50/40 px-4 py-2.5 text-sm text-stone-900 focus:border-amber-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-amber-500/20 dark:border-stone-600 dark:bg-[#111113] dark:text-white dark:placeholder:text-stone-500 dark:focus:border-emerald-500 dark:focus:ring-emerald-500/30 dark:focus:bg-[#111113]"
              />
              {errors.designation && <p className="mt-1 text-[11px] font-bold text-rose-500">{errors.designation.message}</p>}
            </div>

            {/* Specialization */}
            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-stone-700 dark:text-stone-200 mb-1.5">
                Specialization <span className="text-rose-500 font-bold">*</span>
              </label>
              <input
                {...register('specialization')}
                type="text"
                placeholder="e.g. Artificial Intelligence & Cloud Computing"
                className="w-full rounded-2xl border border-amber-200 bg-amber-50/40 px-4 py-2.5 text-sm text-stone-900 focus:border-amber-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-amber-500/20 dark:border-stone-600 dark:bg-[#111113] dark:text-white dark:placeholder:text-stone-500 dark:focus:border-emerald-500 dark:focus:ring-emerald-500/30 dark:focus:bg-[#111113]"
              />
              {errors.specialization && <p className="mt-1 text-[11px] font-bold text-rose-500">{errors.specialization.message}</p>}
            </div>

            {/* Contact Phone */}
            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-stone-700 dark:text-stone-200 mb-1.5">
                Contact Phone <span className="text-rose-500 font-bold">*</span>
              </label>
              <input
                {...register('phone')}
                type="text"
                placeholder="e.g. +1 555-0921"
                className="w-full rounded-2xl border border-amber-200 bg-amber-50/40 px-4 py-2.5 text-sm text-stone-900 focus:border-amber-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-amber-500/20 dark:border-stone-600 dark:bg-[#111113] dark:text-white dark:placeholder:text-stone-500 dark:focus:border-emerald-500 dark:focus:ring-emerald-500/30 dark:focus:bg-[#111113]"
              />
              {errors.phone && <p className="mt-1 text-[11px] font-bold text-rose-500">{errors.phone.message}</p>}
            </div>

            {/* Joining Date (Auto-filled to today) */}
            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-stone-700 dark:text-stone-200 mb-1.5">
                Joining Date <span className="text-rose-500 font-bold">*</span>
              </label>
              <input
                {...register('joiningDate')}
                type="date"
                className="w-full rounded-2xl border border-amber-200 bg-amber-50/40 px-4 py-2.5 text-sm text-stone-900 focus:border-amber-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-amber-500/20 dark:border-stone-600 dark:bg-[#111113] dark:text-white dark:placeholder:text-stone-500 dark:focus:border-emerald-500 dark:focus:ring-emerald-500/30 dark:focus:bg-[#111113]"
              />
              {errors.joiningDate && <p className="mt-1 text-[11px] font-bold text-rose-500">{errors.joiningDate.message}</p>}
            </div>

            {/* Status */}
            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-stone-700 dark:text-stone-200 mb-1.5">
                Faculty Status <span className="text-rose-500 font-bold">*</span>
              </label>
              <div className="relative">
                <select
                  {...register('status')}
                  className="w-full appearance-none rounded-2xl border border-amber-200 bg-amber-50/40 px-4 py-2.5 pr-10 text-sm text-stone-900 focus:border-amber-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-amber-500/20 dark:border-stone-600 dark:bg-[#111113] dark:text-white dark:placeholder:text-stone-500 dark:focus:border-emerald-500 dark:focus:ring-emerald-500/30 dark:focus:bg-[#111113] cursor-pointer"
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="INACTIVE">INACTIVE</option>
                  <option value="ON_LEAVE">ON_LEAVE</option>
                </select>
                <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400 pointer-events-none" />
              </div>
              {errors.status && <p className="mt-1 text-[11px] font-bold text-rose-500">{errors.status.message}</p>}
            </div>
          </div>

          {/* Qualification */}
          <div>
            <label className="block text-xs font-extrabold uppercase tracking-wider text-stone-700 dark:text-stone-200 mb-1.5">
              Academic Qualification <span className="text-rose-500 font-bold">*</span>
            </label>
            <input
              {...register('qualification')}
              type="text"
              placeholder="e.g. Ph.D. in Computer Science & Engineering (MIT)"
              className="w-full rounded-2xl border border-amber-200 bg-amber-50/40 px-4 py-2.5 text-sm text-stone-900 focus:border-amber-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-amber-500/20 dark:border-stone-600 dark:bg-[#111113] dark:text-white dark:placeholder:text-stone-500 dark:focus:border-emerald-500 dark:focus:ring-emerald-500/30 dark:focus:bg-[#111113]"
            />
            {errors.qualification && <p className="mt-1 text-[11px] font-bold text-rose-500">{errors.qualification.message}</p>}
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-amber-100 dark:border-stone-800">
            <Link
              to="/faculty"
              className="px-5 py-2.5 rounded-2xl border border-stone-200 dark:border-stone-700 text-xs font-bold text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={mutation.isPending || emailCheck.exists}
              className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-orange-500 via-amber-500 to-rose-500 px-6 py-2.5 text-xs font-black text-white shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 disabled:opacity-50 transition-all cursor-pointer font-['Outfit']"
            >
              <Save className="h-4 w-4" />
              {mutation.isPending ? 'Saving Record...' : 'Save Faculty'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddFaculty;
