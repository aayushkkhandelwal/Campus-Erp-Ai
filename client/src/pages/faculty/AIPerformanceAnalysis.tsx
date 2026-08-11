import { useState } from 'react';
import { AlertTriangle, Sparkles } from 'lucide-react';

export const AIPerformanceAnalysis = () => {
  const [subject, setSubject] = useState('DBMS (CS-501)');
  const [draftNotice, setDraftNotice] = useState('Tomorrow DBMS lecture will be held in Lab 3 at 09:00 AM.');
  const [generatedNotice, setGeneratedNotice] = useState<string | null>(null);

  const atRiskStudents = [
    { name: 'Rahul Sharma', rollNo: '2026IT001', attendance: '62%', internal: '22/30', issue: 'Missed 8 consecutive lectures & low quiz score', risk: 'HIGH' },
    { name: 'Aman Verma', rollNo: '2026IT002', attendance: '71%', internal: '25/30', issue: 'Attendance dropped by 12% in 2 weeks', risk: 'MEDIUM' },
    { name: 'Rohan Gupta', rollNo: '2026IT004', attendance: '74%', internal: '22/30', issue: 'Scored low in Mid-Sem internal exam', risk: 'MEDIUM' },
  ];

  const handleRewriteNotice = () => {
    setGeneratedNotice(
      `📢 **OFFICIAL CLASS ANNOUNCEMENT**\n\n` +
      `**Subject:** DBMS Lecture Location Update (Lab 3)\n\n` +
      `Dear Students of Semester 5 (Section A),\n\n` +
      `Please note that tomorrow's Database Management Systems (DBMS) lecture scheduled at 09:00 AM will be held in **Lab 3 (Second Floor)** instead of Lecture Room 201.\n\n` +
      `Please bring your SQL lab workbooks for the hands-on queries session.\n\n` +
      `Regards,\n` +
      `Dr. Amit Sharma (HOD & Course Instructor)`
    );
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-black text-stone-900 dark:text-white flex items-center gap-2 font-['Outfit']">
          <AlertTriangle className="h-7 w-7 text-rose-600 dark:text-rose-400" />
          AI Student Performance & At-Risk Analysis
        </h1>
        <p className="text-xs font-semibold text-stone-500 dark:text-stone-400 mt-1">
          Automated risk detection based on attendance trends, internal marks, and assignment completion
        </p>
      </div>

      {/* Select Subject Header */}
      <div className="rounded-3xl border border-amber-200/80 bg-white p-5 shadow-sm dark:border-stone-800 dark:bg-stone-900">
        <div className="max-w-md">
          <label className="block text-xs font-extrabold uppercase tracking-wider text-stone-700 dark:text-stone-300 mb-1.5">
            Select Class Subject
          </label>
          <select
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full rounded-2xl border border-amber-200 bg-amber-50/40 px-4 py-2.5 text-xs font-bold text-stone-900 focus:border-rose-500 focus:outline-none dark:border-stone-700 dark:bg-stone-800 dark:text-white"
          >
            <option value="DBMS (CS-501)">DBMS (CS-501) - Semester 5</option>
            <option value="Operating Systems (CS-502)">Operating Systems (CS-502) - Semester 5</option>
            <option value="Java Programming (CS-303)">Java Programming (CS-303) - Semester 3</option>
          </select>
        </div>
      </div>

      {/* At Risk Table */}
      <div className="rounded-3xl border border-amber-200/80 bg-white p-6 shadow-sm dark:border-stone-800 dark:bg-stone-900 space-y-4">
        <h3 className="text-base font-black text-stone-900 dark:text-white font-['Outfit'] flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-rose-500" />
          Students Needing Extra Support in {subject}
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-amber-100 dark:border-stone-800 text-stone-400 uppercase tracking-wider font-extrabold">
                <th className="py-3 px-4">Roll No</th>
                <th className="py-3 px-4">Student Name</th>
                <th className="py-3 px-4">Attendance</th>
                <th className="py-3 px-4">Internal Marks</th>
                <th className="py-3 px-4">AI Diagnostic Flag</th>
                <th className="py-3 px-4">Risk Level</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-amber-100 dark:divide-stone-800">
              {atRiskStudents.map((s, idx) => (
                <tr key={idx} className="hover:bg-amber-50/40 dark:hover:bg-stone-800/40 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-amber-600 dark:text-amber-400">{s.rollNo}</td>
                  <td className="py-3.5 px-4 font-extrabold text-stone-900 dark:text-white">{s.name}</td>
                  <td className="py-3.5 px-4 font-extrabold text-rose-600 dark:text-rose-400">{s.attendance}</td>
                  <td className="py-3.5 px-4 font-bold text-stone-700 dark:text-stone-300">{s.internal}</td>
                  <td className="py-3.5 px-4 font-semibold text-stone-600 dark:text-stone-400">{s.issue}</td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                        s.risk === 'HIGH'
                          ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                      }`}
                    >
                      {s.risk} RISK
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* AI Notice Rewriter */}
      <div className="rounded-3xl border border-amber-200/80 bg-white p-6 shadow-sm dark:border-stone-800 dark:bg-stone-900 space-y-4">
        <h3 className="text-base font-black text-stone-900 dark:text-white font-['Outfit'] flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-orange-500" />
          AI Class Notice & Announcement Draft Generator
        </h3>

        <div className="space-y-3">
          <textarea
            rows={3}
            value={draftNotice}
            onChange={(e) => setDraftNotice(e.target.value)}
            placeholder="Type rough notice draft..."
            className="w-full rounded-2xl border border-amber-200 bg-amber-50/40 p-4 text-xs text-stone-900 focus:border-orange-500 focus:outline-none dark:border-stone-700 dark:bg-stone-800 dark:text-white"
          />

          <button
            onClick={handleRewriteNotice}
            className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-orange-500 to-rose-500 px-5 py-2.5 text-xs font-black text-white shadow-md hover:shadow-lg cursor-pointer"
          >
            <Sparkles className="h-4 w-4 text-yellow-200" />
            Rewrite into Professional Notice
          </button>
        </div>

        {generatedNotice && (
          <div className="p-4 rounded-2xl bg-stone-900 text-amber-100 text-xs font-mono whitespace-pre-wrap leading-relaxed">
            {generatedNotice}
          </div>
        )}
      </div>
    </div>
  );
};

export default AIPerformanceAnalysis;
