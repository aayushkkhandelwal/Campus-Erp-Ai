import { useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Building2, ArrowLeft, Save, Lock } from 'lucide-react';
import { departmentService } from '../../services/department.service';

const deptSchema = z.object({
  name: z.string().min(3, 'Department name is required'),
  code: z.string().min(2, 'Department code is required'),
  description: z.string().optional(),
  headOfDepartment: z.string().optional(),
});

type DeptFormData = z.infer<typeof deptSchema>;

export const EditDepartment = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: deptResponse, isLoading } = useQuery({
    queryKey: ['department-detail', id],
    queryFn: () => departmentService.getById(id || ''),
    enabled: !!id,
  });

  // Handle both direct object and wrapped { data: {...} } API shapes
  const dept = (deptResponse as any)?.data ?? deptResponse;

  const {
    register,
    handleSubmit,
    reset,
    setValue,
  } = useForm<DeptFormData>({
    resolver: zodResolver(deptSchema),
  });

  useEffect(() => {
    if (dept) {
      const name = dept.name ?? '';
      const code = dept.code ?? '';
      const description = dept.description ?? '';
      const headOfDepartment = dept.headOfDepartment ?? '';
      reset({ name, code, description, headOfDepartment });
      // Force-set in case reset doesn't trigger re-render
      setValue('name', name);
      setValue('code', code);
      setValue('description', description);
      setValue('headOfDepartment', headOfDepartment);
    }
  }, [dept, reset, setValue]);

  const mutation = useMutation({
    mutationFn: (data: DeptFormData) => departmentService.update(id || '', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments-list'] });
      queryClient.invalidateQueries({ queryKey: ['department-detail', id] });
      navigate('/departments');
    },
  });


  const onSubmit = (data: DeptFormData) => {
    mutation.mutate(data);
  };

  if (isLoading) {
    return <div className="p-8 text-center text-stone-500 font-bold">Loading department details...</div>;
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto font-['Plus_Jakarta_Sans']">
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
            Edit Department
          </h1>
          <p className="text-xs text-stone-500 dark:text-stone-400">
            Updating settings for {dept?.name} ({dept?.code})
          </p>
        </div>
      </div>

      <div className="rounded-3xl border border-amber-200/80 bg-white p-6 md:p-8 shadow-sm dark:border-stone-800 dark:bg-stone-900">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-extrabold uppercase tracking-wider text-stone-700 dark:text-stone-200">
                Department Name *
              </label>
              <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/80 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-900">
                <Lock className="h-3 w-3 text-amber-600" />
                Locked System Field
              </span>
            </div>
            <input
              {...register('name')}
              type="text"
              readOnly
              disabled
              className="w-full rounded-2xl border border-amber-200 bg-amber-50/40 px-4 py-2.5 text-sm font-bold text-stone-900 cursor-not-allowed dark:border-stone-600 dark:bg-[#0d0d0e] dark:text-stone-400 opacity-80"
            />
          </div>



          {/* Department Code (Locked System Field) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-extrabold uppercase tracking-wider text-stone-700 dark:text-stone-300">
                Department Code *
              </label>
              <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/80 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-900">
                <Lock className="h-3 w-3 text-amber-600" />
                Locked System Field
              </span>
            </div>
            <input
              {...register('code')}
              type="text"
              readOnly
              disabled
              className="w-full rounded-2xl border border-amber-200 bg-amber-50/40 px-4 py-2.5 text-sm font-mono font-bold text-stone-900 cursor-not-allowed dark:border-stone-600 dark:bg-[#0d0d0e] dark:text-stone-400 opacity-80"
            />
          </div>

          {/* Head of Department */}
          <div>
            <label className="block text-xs font-extrabold uppercase tracking-wider text-stone-700 dark:text-stone-200 mb-1.5">Head of Department (HOD)</label>
            <input
              {...register('headOfDepartment')}
              type="text"
              placeholder="e.g. Dr. Robert Langdon"
              className="w-full rounded-2xl border border-amber-200 bg-amber-50/40 px-4 py-2.5 text-sm text-stone-900 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-500/20 dark:border-stone-600 dark:bg-[#111113] dark:text-white dark:placeholder:text-stone-500 dark:focus:border-emerald-500 dark:focus:ring-emerald-500/30 dark:focus:bg-[#111113]"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-extrabold uppercase tracking-wider text-stone-700 dark:text-stone-200 mb-1.5">Description</label>
            <textarea
              {...register('description')}
              rows={3}
              placeholder="Summary of academic courses and research areas..."
              className="w-full rounded-2xl border border-amber-200 bg-amber-50/40 px-4 py-2.5 text-sm text-stone-900 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-500/20 dark:border-stone-600 dark:bg-[#111113] dark:text-white dark:placeholder:text-stone-500 dark:focus:border-emerald-500 dark:focus:ring-emerald-500/30 dark:focus:bg-[#111113]"
            />
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-amber-100 dark:border-stone-800">
            <Link to="/departments" className="px-5 py-2.5 rounded-2xl border border-stone-200 dark:border-stone-700 text-xs font-bold text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors">Cancel</Link>
            <button type="submit" className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-amber-500 px-6 py-2.5 text-xs font-black text-white shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 font-['Outfit']">
              <Save className="h-4 w-4" /> Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditDepartment;
