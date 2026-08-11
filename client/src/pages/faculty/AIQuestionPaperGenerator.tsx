import { useState } from 'react';
import { BookOpen, Sparkles, Printer } from 'lucide-react';
import { aiService, type QuestionItem } from '../../services/ai.service';

export const AIQuestionPaperGenerator = () => {
  const [subject, setSubject] = useState('DBMS (CS-501)');
  const [difficulty, setDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Medium');
  const [totalMarks, setTotalMarks] = useState(50);
  const [isGenerating, setIsGenerating] = useState(false);
  const [questions, setQuestions] = useState<QuestionItem[] | null>(null);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    try {
      const qList = await aiService.generateQuestionPaper({
        subject,
        difficulty,
        totalMarks,
      });
      setQuestions(qList);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-black text-stone-900 dark:text-white flex items-center gap-2 font-['Outfit']">
          <BookOpen className="h-7 w-7 text-orange-600 dark:text-orange-400" />
          AI Exam Question Paper Generator
        </h1>
        <p className="text-xs font-semibold text-stone-500 dark:text-stone-400 mt-1">
          Instant creation of balanced examination question papers with MCQs, short, and essay questions
        </p>
      </div>

      <div className="rounded-3xl border border-amber-200/80 bg-white p-6 shadow-sm dark:border-stone-800 dark:bg-stone-900">
        <form onSubmit={handleGenerate} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-stone-700 dark:text-stone-300 mb-1.5">
                Target Subject
              </label>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full rounded-2xl border border-amber-200 bg-amber-50/40 px-4 py-2.5 text-xs font-bold text-stone-900 focus:border-orange-500 focus:outline-none dark:border-stone-700 dark:bg-stone-800 dark:text-white"
              >
                <option value="DBMS (CS-501)">DBMS (CS-501)</option>
                <option value="Operating Systems (CS-502)">Operating Systems (CS-502)</option>
                <option value="Java Programming (CS-303)">Java Programming (CS-303)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-stone-700 dark:text-stone-300 mb-1.5">
                Difficulty Level
              </label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as 'Easy' | 'Medium' | 'Hard')}
                className="w-full rounded-2xl border border-amber-200 bg-amber-50/40 px-4 py-2.5 text-xs font-bold text-stone-900 focus:border-orange-500 focus:outline-none dark:border-stone-700 dark:bg-stone-800 dark:text-white"
              >
                <option value="Easy">Easy (Fundamentals)</option>
                <option value="Medium">Medium (Balanced)</option>
                <option value="Hard">Hard (Advanced / Application)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-stone-700 dark:text-stone-300 mb-1.5">
                Total Marks
              </label>
              <select
                value={totalMarks}
                onChange={(e) => setTotalMarks(Number(e.target.value))}
                className="w-full rounded-2xl border border-amber-200 bg-amber-50/40 px-4 py-2.5 text-xs font-bold text-stone-900 focus:border-orange-500 focus:outline-none dark:border-stone-700 dark:bg-stone-800 dark:text-white"
              >
                <option value={25}>25 Marks (Class Quiz)</option>
                <option value={50}>50 Marks (Mid-Sem Exam)</option>
                <option value={100}>100 Marks (Final Semester Exam)</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end pt-2">
            <button
              type="submit"
              disabled={isGenerating}
              className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-orange-500 to-rose-500 px-6 py-3 text-xs font-black text-white shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 disabled:opacity-50 transition-all cursor-pointer"
            >
              <Sparkles className="h-4 w-4 text-yellow-200" />
              Generate Question Paper
            </button>
          </div>
        </form>
      </div>

      {/* Generated Paper View */}
      {questions && (
        <div className="rounded-3xl border border-amber-200/80 bg-white p-8 shadow-sm dark:border-stone-800 dark:bg-stone-900 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-stone-200 dark:border-stone-800 text-center">
            <div className="text-left">
              <h2 className="text-xl font-black text-stone-900 dark:text-white font-['Outfit']">
                COLLEGE OF ENGINEERING & TECHNOLOGY
              </h2>
              <p className="text-xs font-bold text-stone-500 dark:text-stone-400">
                Department of Computer Science • Mid-Semester Examination
              </p>
            </div>
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-stone-900 text-white text-xs font-bold shadow-md"
            >
              <Printer className="h-4 w-4" /> Print / Save Paper
            </button>
          </div>

          <div className="flex items-center justify-between text-xs font-extrabold text-stone-700 dark:text-stone-300 border-b border-stone-100 dark:border-stone-800 pb-3">
            <span>Subject: {subject}</span>
            <span>Difficulty: {difficulty}</span>
            <span>Total Marks: {totalMarks}</span>
            <span>Time: 2 Hours</span>
          </div>

          <div className="space-y-6">
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-amber-800 dark:text-amber-400 mb-3">
                SECTION A: Multiple Choice Questions (2 Marks Each)
              </h3>
              <div className="space-y-4">
                {questions
                  .filter((q) => q.type === 'MCQ')
                  .map((q, idx) => (
                    <div key={q.id} className="space-y-1.5 text-xs font-semibold text-stone-800 dark:text-stone-200">
                      <p className="font-extrabold">
                        Q{idx + 1}. {q.question} <span className="text-amber-600 dark:text-amber-400 font-bold">[{q.marks} Marks]</span>
                      </p>
                      <div className="grid grid-cols-2 gap-2 pl-4 text-stone-600 dark:text-stone-400">
                        {q.options?.map((opt, optIdx) => (
                          <div key={optIdx}>
                            ({String.fromCharCode(65 + optIdx)}) {opt}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-amber-800 dark:text-amber-400 mb-3">
                SECTION B: Descriptive & Analytical Questions
              </h3>
              <div className="space-y-4">
                {questions
                  .filter((q) => q.type !== 'MCQ')
                  .map((q, idx) => (
                    <div key={q.id} className="space-y-1 text-xs font-semibold text-stone-800 dark:text-stone-200">
                      <p className="font-extrabold">
                        Q{idx + 4}. {q.question} <span className="text-amber-600 dark:text-amber-400 font-bold">[{q.marks} Marks]</span>
                      </p>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIQuestionPaperGenerator;
