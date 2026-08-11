import { useState } from 'react';
import { BookOpen, Sparkles, Calendar, Compass, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { aiService } from '../../services/ai.service';

export const AIStudyAssistant = () => {
  const { user } = useAuth();
  const [conceptTopic, setConceptTopic] = useState('Normalization in DBMS (3NF & BCNF)');
  const [conceptExplanation, setConceptExplanation] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [studyPlanGenerated, setStudyPlanGenerated] = useState(false);

  const handleExplainConcept = async () => {
    if (!conceptTopic.trim()) return;
    try {
      setLoading(true);
      const explanation = await aiService.queryERPData(conceptTopic, user?.role || 'STUDENT', user);
      setConceptExplanation(explanation);
    } catch {
      setConceptExplanation('Sorry, I encountered an error explaining this topic. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-black text-stone-900 dark:text-white flex items-center gap-2 font-['Outfit']">
          <BookOpen className="h-7 w-7 text-amber-600 dark:text-amber-400" />
          AI Study Assistant & Career Copilot
        </h1>
        <p className="text-xs font-semibold text-stone-500 dark:text-stone-400 mt-1">
          Interactive concept tutor, personalized 15-day exam study planner, and career advisor
        </p>
      </div>

      {/* 1. AI Concept Educator */}
      <div className="rounded-3xl border border-amber-200/80 bg-white p-6 shadow-sm dark:border-stone-800 dark:bg-stone-900 space-y-4">
        <h3 className="text-base font-black text-stone-900 dark:text-white font-['Outfit'] flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-amber-500" />
          1. AI Concept Educator & Practice Questions
        </h3>

        <div className="flex gap-2">
          <input
            type="text"
            value={conceptTopic}
            onChange={(e) => setConceptTopic(e.target.value)}
            placeholder="Type any subject topic (e.g. B-Trees, Normalization, Process Synchronization, Subnetting)..."
            className="flex-1 rounded-2xl border border-amber-200 bg-amber-50/40 px-4 py-2.5 text-xs text-stone-900 focus:border-amber-500 focus:outline-none dark:border-stone-700 dark:bg-stone-800 dark:text-white"
          />
          <button
            onClick={handleExplainConcept}
            disabled={loading || !conceptTopic.trim()}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-black text-xs shadow-md disabled:opacity-50 transition-all cursor-pointer"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {loading ? 'Analyzing...' : 'Explain Topic'}
          </button>
        </div>

        {conceptExplanation && (
          <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 dark:bg-stone-800 dark:border-stone-700 text-xs font-sans text-stone-900 dark:text-amber-100 whitespace-pre-wrap leading-relaxed">
            {conceptExplanation}
          </div>
        )}
      </div>

      {/* 2. AI 15-Day Study Planner */}
      <div className="rounded-3xl border border-amber-200/80 bg-white p-6 shadow-sm dark:border-stone-800 dark:bg-stone-900 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-black text-stone-900 dark:text-white font-['Outfit'] flex items-center gap-2">
            <Calendar className="h-5 w-5 text-orange-500" />
            2. AI 15-Day Mid-Sem Exam Study Planner
          </h3>

          <button
            onClick={() => setStudyPlanGenerated(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-orange-500 text-white text-xs font-black shadow-md cursor-pointer hover:bg-orange-600 transition-colors"
          >
            Generate Study Schedule
          </button>
        </div>

        {studyPlanGenerated && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div className="p-3.5 rounded-2xl border border-amber-100 bg-amber-50/50 dark:border-stone-800 dark:bg-stone-800 space-y-1">
              <span className="text-[10px] font-black text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-950 px-2 py-0.5 rounded-md">Days 1 - 5</span>
              <h4 className="text-xs font-bold text-stone-900 dark:text-white">DBMS & SQL Queries</h4>
              <p className="text-[11px] text-stone-500">Focus: ER Modeling, 3NF, BCNF, Relational Algebra (2 hrs/day)</p>
            </div>

            <div className="p-3.5 rounded-2xl border border-amber-100 bg-amber-50/50 dark:border-stone-800 dark:bg-stone-800 space-y-1">
              <span className="text-[10px] font-black text-orange-700 dark:text-orange-400 bg-orange-100 dark:bg-orange-950 px-2 py-0.5 rounded-md">Days 6 - 10</span>
              <h4 className="text-xs font-bold text-stone-900 dark:text-white">Operating Systems</h4>
              <p className="text-[11px] text-stone-500">Focus: CPU Scheduling, Semaphore Synchronization, Paging (2 hrs/day)</p>
            </div>

            <div className="p-3.5 rounded-2xl border border-amber-100 bg-amber-50/50 dark:border-stone-800 dark:bg-stone-800 space-y-1">
              <span className="text-[10px] font-black text-rose-700 dark:text-rose-400 bg-rose-100 dark:bg-rose-950 px-2 py-0.5 rounded-md">Days 11 - 15</span>
              <h4 className="text-xs font-bold text-stone-900 dark:text-white">Computer Networks & Mock Exams</h4>
              <p className="text-[11px] text-stone-500">Focus: TCP/IP Stack, Subnetting, Previous Year Question Papers (3 hrs/day)</p>
            </div>
          </div>
        )}
      </div>

      {/* 3. AI Career Guidance */}
      <div className="rounded-3xl border border-amber-200/80 bg-white p-6 shadow-sm dark:border-stone-800 dark:bg-stone-900 space-y-4">
        <h3 className="text-base font-black text-stone-900 dark:text-white font-['Outfit'] flex items-center gap-2">
          <Compass className="h-5 w-5 text-rose-500" />
          3. AI Career Guidance & Recommended Certifications
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl border border-amber-100 bg-amber-50/40 dark:border-stone-800 dark:bg-stone-800/40 space-y-2">
            <span className="text-xs font-extrabold text-amber-800 dark:text-amber-400 uppercase tracking-wider">Recommended Certifications</span>
            <ul className="text-xs space-y-1 text-stone-700 dark:text-stone-300 font-semibold">
              <li>• AWS Certified Solutions Architect Associate</li>
              <li>• Oracle Database SQL Certified Associate</li>
              <li>• Google Professional Data Engineer</li>
            </ul>
          </div>

          <div className="p-4 rounded-2xl border border-amber-100 bg-amber-50/40 dark:border-stone-800 dark:bg-stone-800/40 space-y-2">
            <span className="text-xs font-extrabold text-orange-800 dark:text-orange-400 uppercase tracking-wider">Target Internship Roles</span>
            <ul className="text-xs space-y-1 text-stone-700 dark:text-stone-300 font-semibold">
              <li>• Backend Engineering Intern (Node.js & PostgreSQL)</li>
              <li>• Database Administrator Intern</li>
              <li>• Cloud Systems Trainee</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIStudyAssistant;
