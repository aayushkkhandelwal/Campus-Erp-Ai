import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Building2, ArrowLeft, Save, CheckCircle2, AlertCircle } from 'lucide-react';
import { departmentService } from '../../services/department.service';
import api from '../../services/api';

const deptSchema = z.object({
  name: z.string().min(3, 'Department name is required (minimum 3 characters)'),
  code: z.string().min(2, 'Department code is required (e.g. CSE, EE, ME)'),
  description: z.string().optional(),
  headOfDepartment: z.string().optional(),
});

type DeptFormData = z.infer<typeof deptSchema>;

export const AddDepartment = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [successMsg, setSuccessMsg] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<DeptFormData>({
    resolver: zodResolver(deptSchema),
    defaultValues: {
      name: '',
      code: '',
      description: '',
      headOfDepartment: '',
    },
  });

  const typedName = watch('name');

  const [nameCheck, setNameCheck] = useState<{ checking: boolean; exists: boolean; message?: string }>({
    checking: false,
    exists: false,
  });

  // Auto-generate suggested Department Code based on Department Name
  useEffect(() => {
    if (!typedName || typedName.trim().length < 2) return;
    const words = typedName.trim().split(/\s+/).filter(w => w.toLowerCase() !== '&' && w.toLowerCase() !== 'and' && w.toLowerCase() !== 'of');
    let generatedCode = '';
    if (words.length >= 2) {
      generatedCode = words.map(w => w[0]).join('').toUpperCase();
    } else if (words.length === 1 && words[0].length >= 3) {
      generatedCode = words[0].substring(0, 3).toUpperCase();
    }
    if (generatedCode) {
      setValue('code', generatedCode);
    }
  }, [typedName, setValue]);

  // Real-time department name uniqueness verification
  useEffect(() => {
    if (!typedName || typedName.trim().length < 3) {
      setNameCheck({ checking: false, exists: false });
      return;
    }

    const timer = setTimeout(async () => {
      setNameCheck({ checking: true, exists: false });
      try {
        const res = await api.get('/departments/check-name', { params: { name: typedName } });
        if (res.data?.data?.exists) {
          const d = res.data.data.department;
          setNameCheck({
            checking: false,
            exists: true,
            message: `⚠️ Department '${d?.name}' already exists in database (Code: ${d?.code || 'N/A'})!`,
          });
        } else {
          setNameCheck({
            checking: false,
            exists: false,
            message: '✓ Department name is available',
          });
        }
      } catch {
        setNameCheck({ checking: false, exists: false });
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [typedName]);

  const mutation = useMutation({
    mutationFn: (data: DeptFormData) => departmentService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments-list'] });
      queryClient.invalidateQueries({ queryKey: ['departments-count'] });
      setSuccessMsg(true);
      setApiError(null);
      setTimeout(() => {
        navigate('/departments');
      }, 1200);
    },
    onError: (err: any) => {
      const errMsg = err?.response?.data?.message || err?.message || 'Failed to create department';
      setApiError(errMsg);
    },
  });

  const onSubmit = (data: DeptFormData) => {
    if (nameCheck.exists) {
      setApiError(nameCheck.message || 'Cannot create: Department already exists');
      return;
    }
    setApiError(null);
    mutation.mutate(data);
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto font-['Plus_Jakarta_Sans']">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            to="/departments"
            className="p-2.5 rounded-2xl border border-amber-200 bg-white dark:border-stone-800 dark:bg-stone-900 text-stone-600 dark:text-stone-300 hover:bg-amber-50 dark:hover:bg-stone-800 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-black text-stone-900 dark:text-white flex items-center gap-2 font-['Outfit']">
              <Building2 className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
              Add Academic Department
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
            <span>Department successfully created! Redirecting...</span>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Department Name */}
          <div>
            <label className="block text-xs font-extrabold uppercase tracking-wider text-stone-700 dark:text-stone-200 mb-1.5">
              Department Name <span className="text-rose-500 font-bold">*</span>
            </label>
            <input
              {...register('name')}
              type="text"
              placeholder="e.g. Computer Science & Engineering"
              className={`w-full rounded-2xl border px-4 py-2.5 text-sm text-stone-900 focus:outline-none focus:ring-4 dark:bg-[#111113] dark:text-white dark:placeholder:text-stone-500 ${
                nameCheck.exists
                  ? 'border-rose-400 bg-rose-50/60 focus:border-rose-500 focus:ring-rose-500/20'
                  : 'border-amber-200 bg-amber-50/40 focus:border-emerald-500 focus:bg-white focus:ring-emerald-500/20 dark:border-stone-600 dark:focus:border-emerald-500 dark:focus:ring-emerald-500/30 dark:focus:bg-[#111113]'
              }`}
            />
            {nameCheck.checking && (
              <p className="mt-1 text-[11px] font-bold text-amber-600 animate-pulse">Checking department availability...</p>
            )}
            {nameCheck.exists && (
              <p className="mt-1 text-[11px] font-bold text-rose-600 dark:text-rose-400">{nameCheck.message}</p>
            )}
            {!nameCheck.checking && !nameCheck.exists && nameCheck.message && (
              <p className="mt-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">{nameCheck.message}</p>
            )}
            {errors.name && !nameCheck.exists && (
              <p className="mt-1 text-[11px] font-bold text-rose-500">{errors.name.message}</p>
            )}
          </div>

          {/* Department Code */}
          <div>
            <label className="block text-xs font-extrabold uppercase tracking-wider text-stone-700 dark:text-stone-200 mb-1.5">
              Department Code <span className="text-rose-500 font-bold">*</span>
            </label>
            <input
              {...register('code')}
              type="text"
              placeholder="e.g. CSE, EE, ME"
              className="w-full rounded-2xl border border-amber-200 bg-amber-50/40 px-4 py-2.5 text-sm text-stone-900 font-mono font-bold uppercase focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-500/20 dark:border-stone-600 dark:bg-[#111113] dark:text-white dark:placeholder:text-stone-500 dark:focus:border-emerald-500 dark:focus:ring-emerald-500/30 dark:focus:bg-[#111113]"
            />
            {errors.code && <p className="mt-1 text-[11px] font-bold text-rose-500">{errors.code.message}</p>}
          </div>

          {/* Head of Department */}
          <div>
            <label className="block text-xs font-extrabold uppercase tracking-wider text-stone-700 dark:text-stone-200 mb-1.5">
              Head of Department (HOD)
            </label>
            <input
              {...register('headOfDepartment')}
              type="text"
              placeholder="e.g. Dr. Robert Langdon"
              className="w-full rounded-2xl border border-amber-200 bg-amber-50/40 px-4 py-2.5 text-sm text-stone-900 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-500/20 dark:border-stone-600 dark:bg-[#111113] dark:text-white dark:placeholder:text-stone-500 dark:focus:border-emerald-500 dark:focus:ring-emerald-500/30 dark:focus:bg-[#111113]"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-extrabold uppercase tracking-wider text-stone-700 dark:text-stone-200 mb-1.5">
              Description
            </label>
            <textarea
              {...register('description')}
              rows={3}
              placeholder="Summary of academic courses and research areas..."
              className="w-full rounded-2xl border border-amber-200 bg-amber-50/40 px-4 py-2.5 text-sm text-stone-900 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-500/20 dark:border-stone-600 dark:bg-[#111113] dark:text-white dark:placeholder:text-stone-500 dark:focus:border-emerald-500 dark:focus:ring-emerald-500/30 dark:focus:bg-[#111113]"
            />
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-amber-100 dark:border-stone-800">
            <Link
              to="/departments"
              className="px-5 py-2.5 rounded-2xl border border-stone-200 dark:border-stone-700 text-xs font-bold text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={mutation.isPending || nameCheck.exists}
              className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-amber-500 px-6 py-2.5 text-xs font-black text-white shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 disabled:opacity-50 transition-all cursor-pointer font-['Outfit']"
            >
              <Save className="h-4 w-4" />
              {mutation.isPending ? 'Saving Record...' : 'Save Department'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddDepartment;
