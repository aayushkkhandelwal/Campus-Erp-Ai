import { useState } from 'react';
import { Sparkles, FileSearch, ShieldAlert, CheckCircle2, AlertTriangle, UserCheck } from 'lucide-react';

export const AIAssignmentChecker = () => {
  const [subject, setSubject] = useState('DBMS (CS-501)');
  const [studentName, setStudentName] = useState('Rahul Sharma (STU2026-001)');
  const [assignmentText, setAssignmentText] = useState(
    'Database normalization is the process of organizing data in a database. First Normal Form requires atomic values. Second Normal Form eliminates partial dependency. Third Normal Form eliminates transitive dependency.'
  );

  const [evaluation, setEvaluation] = useState<{
    summary: string;
    feedback: string[];
    missingSections: string[];
    plagiarismScore: number;
    estimatedGrade: string;
  } | null>(null);

  const [loading, setLoading] = useState(false);

  const handleEvaluate = () => {
    setLoading(true);
    setTimeout(() => {
      setEvaluation({
        summary:
          'The submission correctly defines 1NF, 2NF, and 3NF at a basic level. Clear explanation of atomic attributes and dependency elimination.',
        feedback: [
          'Good concise definitions of fundamental normal forms.',
          'Examples of real-world tables before and after normalization would strengthen the submission.',
          'BCNF (Boyce-Codd Normal Form) definition is missing.',
        ],
        missingSections: ['BCNF & 4NF Explanations', 'SQL DDL Code Examples', 'ER Diagram Translation'],
        plagiarismScore: 6, // 6% similarity (Passed)
        estimatedGrade: 'A- (88/100)',
      });
      setLoading(false);
    }, 800);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto font-['Plus_Jakarta_Sans']">
      <div>
        <h1 className="text-2xl font-black text-stone-900 dark:text-white flex items-center gap-2.5 font-['Outfit']">
          <FileSearch className="h-7 w-7 text-orange-600 dark:text-orange-400" />
          AI Assignment Evaluation & Plagiarism Scanner
        </h1>
        <p className="text-xs font-semibold text-stone-500 dark:text-stone-400 mt-1">
          Automated content summarization, missing section detection, and similarity checking for student submissions
        </p>
      </div>

      <div className="rounded-3xl border border-amber-200/80 bg-white p-6 shadow-sm dark:border-stone-800 dark:bg-stone-900 space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-extrabold uppercase tracking-wider text-stone-700 dark:text-stone-300 mb-1.5">
              Select Subject
            </label>
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full rounded-2xl border border-amber-200 bg-amber-50/40 px-4 py-2.5 text-xs text-stone-900 focus:outline-none dark:border-stone-700 dark:bg-stone-800 dark:text-white font-bold"
            >
              <option value="DBMS (CS-501)">DBMS (CS-501)</option>
              <option value="Operating Systems (CS-502)">Operating Systems (CS-502)</option>
              <option value="Computer Networks (CS-503)">Computer Networks (CS-503)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-extrabold uppercase tracking-wider text-stone-700 dark:text-stone-300 mb-1.5">
              Student Profile
            </label>
            <input
              type="text"
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              className="w-full rounded-2xl border border-amber-200 bg-amber-50/40 px-4 py-2.5 text-xs text-stone-900 focus:outline-none dark:border-stone-700 dark:bg-stone-800 dark:text-white font-bold"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-extrabold uppercase tracking-wider text-stone-700 dark:text-stone-300 mb-1.5">
            Student Submission Text / Essay Content
          </label>
          <textarea
            rows={5}
            value={assignmentText}
            onChange={(e) => setAssignmentText(e.target.value)}
            placeholder="Paste student submission text here..."
            className="w-full rounded-2xl border border-amber-200 bg-amber-50/40 p-4 text-xs text-stone-900 placeholder-stone-400 focus:border-orange-500 focus:outline-none dark:border-stone-700 dark:bg-stone-800 dark:text-white font-mono"
          />
        </div>

        <button
          onClick={handleEvaluate}
          disabled={loading || !assignmentText.trim()}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-orange-500 via-rose-500 to-amber-500 text-white text-xs font-black shadow-lg shadow-orange-500/20 hover:scale-[1.01] transition-all cursor-pointer disabled:opacity-50"
        >
          <Sparkles className="h-4 w-4" />
          {loading ? 'Evaluating Submission...' : 'Run AI Evaluation & Plagiarism Check'}
        </button>
      </div>

      {/* AI Evaluation Results */}
      {evaluation && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 dark:bg-amber-950/60 dark:border-amber-900 dark:text-amber-300 text-xs font-bold flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
            AI Evaluation Disclaimer: Preliminary assessment generated automatically. Faculty remains responsible for final grading.
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-3xl border border-amber-200/80 bg-white p-5 shadow-sm dark:border-stone-800 dark:bg-stone-900">
              <span className="text-xs font-extrabold uppercase text-stone-400">Plagiarism Similarity</span>
              <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-1 font-['Outfit']">
                {evaluation.plagiarismScore}%
              </div>
              <p className="text-xs font-semibold text-emerald-600 mt-1 flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" /> Passed Integrity Check
              </p>
            </div>

            <div className="rounded-3xl border border-amber-200/80 bg-white p-5 shadow-sm dark:border-stone-800 dark:bg-stone-900">
              <span className="text-xs font-extrabold uppercase text-stone-400">Estimated Grade</span>
              <div className="text-3xl font-black text-orange-600 dark:text-orange-400 mt-1 font-['Outfit']">
                {evaluation.estimatedGrade}
              </div>
              <p className="text-xs font-semibold text-stone-500 mt-1">Based on content coverage</p>
            </div>

            <div className="rounded-3xl border border-amber-200/80 bg-white p-5 shadow-sm dark:border-stone-800 dark:bg-stone-900">
              <span className="text-xs font-extrabold uppercase text-stone-400">Missing Sections</span>
              <div className="text-3xl font-black text-rose-600 dark:text-rose-400 mt-1 font-['Outfit']">
                {evaluation.missingSections.length} Items
              </div>
              <p className="text-xs font-semibold text-rose-500 mt-1">Requires follow-up</p>
            </div>
          </div>

          <div className="rounded-3xl border border-amber-200/80 bg-white p-6 shadow-sm dark:border-stone-800 dark:bg-stone-900 space-y-4">
            <div>
              <h3 className="text-sm font-black text-stone-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <UserCheck className="h-4 w-4 text-orange-500" /> Executive Content Summary
              </h3>
              <p className="text-xs font-medium text-stone-700 dark:text-stone-300 mt-1.5 leading-relaxed bg-amber-50/50 dark:bg-stone-800/50 p-3 rounded-2xl border border-amber-100 dark:border-stone-800">
                {evaluation.summary}
              </p>
            </div>

            <div>
              <h3 className="text-sm font-black text-stone-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" /> AI Feedback Highlights
              </h3>
              <ul className="mt-1.5 space-y-1 text-xs font-semibold text-stone-700 dark:text-stone-300">
                {evaluation.feedback.map((item, idx) => (
                  <li key={idx}>• {item}</li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-sm font-black text-stone-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-rose-500" /> Flagged Missing Topics
              </h3>
              <div className="flex flex-wrap gap-2 mt-1.5">
                {evaluation.missingSections.map((sec, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 rounded-full bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300 text-xs font-bold border border-rose-200 dark:border-rose-900"
                  >
                    ⚠️ {sec}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIAssignmentChecker;
