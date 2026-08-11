import { useState } from 'react';
import { FileSpreadsheet, Save, CheckCircle2, Award } from 'lucide-react';

interface StudentGradeRecord {
  id: string;
  name: string;
  rollNo: string;
  internalMarks: number;
  externalMarks: number;
}

export const EnterMarks = () => {
  const [subject, setSubject] = useState('DBMS (CS-501)');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const [students, setStudents] = useState<StudentGradeRecord[]>([
    { id: '1', name: 'Rahul Sharma', rollNo: '2026IT001', internalMarks: 28, externalMarks: 64 },
    { id: '2', name: 'Aman Verma', rollNo: '2026IT002', internalMarks: 25, externalMarks: 58 },
    { id: '3', name: 'Priya Patel', rollNo: '2026IT003', internalMarks: 30, externalMarks: 68 },
    { id: '4', name: 'Rohan Gupta', rollNo: '2026IT004', internalMarks: 22, externalMarks: 52 },
    { id: '5', name: 'Neha Singh', rollNo: '2026IT005', internalMarks: 27, externalMarks: 61 },
  ]);

  const updateInternal = (id: string, val: number) => {
    const clamped = Math.min(30, Math.max(0, val || 0));
    setStudents((prev) =>
      prev.map((s) => (s.id === id ? { ...s, internalMarks: clamped } : s))
    );
  };

  const updateExternal = (id: string, val: number) => {
    const clamped = Math.min(70, Math.max(0, val || 0));
    setStudents((prev) =>
      prev.map((s) => (s.id === id ? { ...s, externalMarks: clamped } : s))
    );
  };

  const calculateGrade = (total: number) => {
    if (total >= 90) return 'A+';
    if (total >= 80) return 'A';
    if (total >= 70) return 'B+';
    if (total >= 60) return 'B';
    if (total >= 50) return 'C';
    return 'F';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-black text-stone-900 dark:text-white flex items-center gap-2 font-['Outfit']">
          <FileSpreadsheet className="h-7 w-7 text-orange-600 dark:text-orange-400" />
          Enter Student Examination Marks
        </h1>
        <p className="text-xs font-semibold text-stone-500 dark:text-stone-400 mt-1">
          Input internal (30 max) and external (70 max) exam scores with automated grade calculation
        </p>
      </div>

      {savedSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 dark:bg-emerald-950/60 dark:border-emerald-800 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-emerald-600" />
          Grade sheets for {subject} successfully submitted and compiled!
        </div>
      )}

      {/* Select Subject Header */}
      <div className="rounded-3xl border border-amber-200/80 bg-white p-5 shadow-sm dark:border-stone-800 dark:bg-stone-900">
        <div className="max-w-md">
          <label className="block text-xs font-extrabold uppercase tracking-wider text-stone-700 dark:text-stone-300 mb-1.5">
            Select Subject
          </label>
          <select
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full rounded-2xl border border-amber-200 bg-amber-50/40 px-4 py-2.5 text-sm text-stone-900 focus:border-orange-500 focus:outline-none dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100"
          >
            <option value="DBMS (CS-501)">DBMS (CS-501) - Semester 5</option>
            <option value="Operating Systems (CS-502)">Operating Systems (CS-502) - Semester 5</option>
            <option value="Java Programming (CS-303)">Java Programming (CS-303) - Semester 3</option>
          </select>
        </div>
      </div>

      {/* Grade Entry Table */}
      <div className="rounded-3xl border border-amber-200/80 bg-white p-6 shadow-sm dark:border-stone-800 dark:bg-stone-900">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-amber-100 dark:border-stone-800 text-stone-400 uppercase tracking-wider font-extrabold">
                  <th className="py-3 px-4">Roll No</th>
                  <th className="py-3 px-4">Student Name</th>
                  <th className="py-3 px-4">Internal (Max 30)</th>
                  <th className="py-3 px-4">External (Max 70)</th>
                  <th className="py-3 px-4">Total (100)</th>
                  <th className="py-3 px-4 text-center">Grade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-amber-100 dark:divide-stone-800">
                {students.map((s) => {
                  const total = s.internalMarks + s.externalMarks;
                  const grade = calculateGrade(total);
                  return (
                    <tr key={s.id} className="hover:bg-amber-50/40 dark:hover:bg-stone-800/40 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-orange-600 dark:text-orange-400">
                        {s.rollNo}
                      </td>
                      <td className="py-3.5 px-4 font-extrabold text-stone-900 dark:text-white">
                        {s.name}
                      </td>
                      <td className="py-3.5 px-4">
                        <input
                          type="number"
                          min={0}
                          max={30}
                          value={s.internalMarks}
                          onChange={(e) => updateInternal(s.id, parseInt(e.target.value) || 0)}
                          className="w-20 rounded-xl border border-amber-200 bg-amber-50/50 px-3 py-1.5 text-xs font-bold text-stone-900 focus:border-orange-500 focus:outline-none dark:border-stone-700 dark:bg-stone-800 dark:text-white"
                        />
                      </td>
                      <td className="py-3.5 px-4">
                        <input
                          type="number"
                          min={0}
                          max={70}
                          value={s.externalMarks}
                          onChange={(e) => updateExternal(s.id, parseInt(e.target.value) || 0)}
                          className="w-20 rounded-xl border border-amber-200 bg-amber-50/50 px-3 py-1.5 text-xs font-bold text-stone-900 focus:border-orange-500 focus:outline-none dark:border-stone-700 dark:bg-stone-800 dark:text-white"
                        />
                      </td>
                      <td className="py-3.5 px-4 font-extrabold text-stone-900 dark:text-white">
                        {total} / 100
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full font-black text-xs bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300">
                          <Award className="h-3 w-3 text-amber-500" />
                          {grade}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-end pt-4 border-t border-amber-100 dark:border-stone-800">
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-orange-500 to-rose-500 px-6 py-2.5 text-xs font-black text-white shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 cursor-pointer"
            >
              <Save className="h-4 w-4" />
              Save & Compile Grade Sheet
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EnterMarks;
