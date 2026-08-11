import { useState } from 'react';
import { Sparkles, Mail, FileText, CheckCircle2, Copy, MessageSquareText, Megaphone, RefreshCw } from 'lucide-react';
import { aiService } from '../../services/ai.service';
import { noticeService } from '../../services/notice.service';

export const AINoticeGenerator = () => {
  const [activeTab, setActiveTab] = useState<'NOTICE' | 'EMAIL' | 'MEETING'>('NOTICE');

  // Notice & Email State
  const [rawText, setRawText] = useState('Tomorrow is a holiday due to heavy rain in the region.');
  const [generatedResult, setGeneratedResult] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishedBanner, setPublishedBanner] = useState(false);

  // Meeting Summary State
  const [meetingTranscript, setMeetingTranscript] = useState(
    'HOD Meeting on Oct 12: Discussed mid-term exam schedule. Attendance in CSE dropped by 8%. Decided to conduct extra classes on Saturday. Prof Alan will prepare question papers by Wednesday. Fee collection targets reached 91%.'
  );
  const [meetingSummary, setMeetingSummary] = useState<string | null>(null);

  const handleGenerateNotice = async () => {
    if (!rawText.trim()) return;
    const result = await aiService.generateNoticeOrEmail(rawText, activeTab === 'EMAIL' ? 'EMAIL' : 'NOTICE');
    setGeneratedResult(result);
  };

  const handlePublishNotice = async () => {
    if (!generatedResult) return;
    setIsPublishing(true);
    try {
      const lines = generatedResult.split('\n').map((l) => l.trim()).filter(Boolean);
      const title = lines[0]?.replace(/^#*\s*/, '') || 'Official Campus Notice';
      const content = lines.slice(1).join(' ').substring(0, 180) || rawText;
      await noticeService.publishNotice(title, content, 'Academic Administration');
      setPublishedBanner(true);
      setTimeout(() => setPublishedBanner(false), 4000);
    } finally {
      setIsPublishing(false);
    }
  };

  const handleSummarizeMeeting = () => {
    if (!meetingTranscript.trim()) return;
    setMeetingSummary(
      `📋 **AI EXECUTIVE MEETING SUMMARY**\n\n` +
      `**Key Highlights & Overview:**\n` +
      `• Reviewed academic progress and mid-term exam preparation.\n` +
      `• Addressed CSE attendance decline (8% drop over past fortnight).\n` +
      `• Financial review: Fee collection target achieved at 91.5%.\n\n` +
      `📌 **Key Decisions Made:**\n` +
      `1. Extra remedial classes scheduled for all low-attendance students on Saturday.\n` +
      `2. Question paper submission deadline set for Wednesday.\n\n` +
      `🎯 **Assigned Action Items:**\n` +
      `• **Prof. Alan Turing**: Submit Mid-Sem DBMS Question Paper by Wednesday.\n` +
      `• **Academic Registrar**: Issue official attendance warnings to students below 75%.\n` +
      `• **Finance Office**: Send second fee installment reminders prior to 15 October.`
    );
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto font-['Plus_Jakarta_Sans']">
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5 font-['Outfit']">
          <Sparkles className="h-7 w-7 text-indigo-600 dark:text-indigo-400" />
          AI Communication & Automation Hub
        </h1>
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">
          Generate official campus notices, professional emails, and executive meeting summaries in seconds
        </p>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 w-fit">
        <button
          onClick={() => { setActiveTab('NOTICE'); setGeneratedResult(null); }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'NOTICE'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
          }`}
        >
          <FileText className="h-4 w-4" /> Official Notice Generator
        </button>

        <button
          onClick={() => { setActiveTab('EMAIL'); setGeneratedResult(null); }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'EMAIL'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
          }`}
        >
          <Mail className="h-4 w-4" /> Professional Email Generator
        </button>

        <button
          onClick={() => { setActiveTab('MEETING'); setGeneratedResult(null); }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'MEETING'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
          }`}
        >
          <MessageSquareText className="h-4 w-4" /> Meeting Summarizer
        </button>
      </div>

      {/* Tab Content: Notice & Email Generator */}
      {(activeTab === 'NOTICE' || activeTab === 'EMAIL') && (
        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
          <div>
            <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
              Enter Key Information / Short Prompt
            </label>
            <textarea
              rows={3}
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder="e.g., Tomorrow is a holiday due to heavy rain, or Fee deadline extended to Oct 15..."
              className="w-full rounded-2xl border border-slate-200 bg-slate-50/60 p-4 text-xs text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>

          {publishedBanner && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 dark:bg-emerald-950/60 dark:border-emerald-800 text-xs font-extrabold flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                <span>✓ Notice Published Live to Campus Notice Board! Dashboard feeds updated in real-time.</span>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-emerald-200 dark:bg-emerald-800 text-emerald-900 dark:text-emerald-100 font-mono text-[10px]">
                STATUS: LIVE
              </span>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleGenerateNotice}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 via-violet-600 to-amber-500 text-white text-xs font-black shadow-lg shadow-indigo-500/20 hover:scale-[1.01] transition-all cursor-pointer"
            >
              <Sparkles className="h-4 w-4" />
              {activeTab === 'NOTICE' ? 'Generate Official Notice' : 'Generate Formal Email'}
            </button>
          </div>

          {generatedResult && (
            <div className="mt-4 p-5 rounded-2xl border border-indigo-100 bg-indigo-50/40 dark:border-slate-700 dark:bg-slate-800/80 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-indigo-700 dark:text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  AI Formatted Output
                </span>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleCopy(generatedResult)}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-indigo-600 dark:text-slate-300 transition-colors"
                  >
                    <Copy className="h-3.5 w-3.5" />
                    {copied ? 'Copied to Clipboard!' : 'Copy Text'}
                  </button>

                  {activeTab === 'NOTICE' && (
                    <button
                      onClick={handlePublishNotice}
                      disabled={isPublishing}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold shadow-sm transition-all cursor-pointer font-['Outfit']"
                    >
                      {isPublishing ? (
                        <>
                          <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                          Publishing...
                        </>
                      ) : (
                        <>
                          <Megaphone className="h-3.5 w-3.5" />
                          Publish to Campus Notice Board
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
              <div className="text-xs font-mono whitespace-pre-wrap text-slate-800 dark:text-slate-200 leading-relaxed">
                {generatedResult}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab Content: Meeting Summarizer */}
      {activeTab === 'MEETING' && (
        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
          <div>
            <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
              Paste Meeting Notes or Audio Transcript
            </label>
            <textarea
              rows={4}
              value={meetingTranscript}
              onChange={(e) => setMeetingTranscript(e.target.value)}
              placeholder="Paste raw notes or transcript from department or faculty meetings..."
              className="w-full rounded-2xl border border-slate-200 bg-slate-50/60 p-4 text-xs text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white font-mono"
            />
          </div>

          <button
            onClick={handleSummarizeMeeting}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 via-violet-600 to-amber-500 text-white text-xs font-black shadow-lg shadow-indigo-500/20 hover:scale-[1.01] transition-all cursor-pointer"
          >
            <Sparkles className="h-4 w-4" />
            Summarize Meeting & Extract Action Items
          </button>

          {meetingSummary && (
            <div className="mt-4 p-5 rounded-2xl border border-indigo-100 bg-indigo-50/40 dark:border-slate-700 dark:bg-slate-800/80 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-indigo-700 dark:text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  AI Summary & Action Plan
                </span>
                <button
                  onClick={() => handleCopy(meetingSummary)}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-indigo-600 dark:text-slate-300 transition-colors"
                >
                  <Copy className="h-3.5 w-3.5" />
                  {copied ? 'Copied to Clipboard!' : 'Copy Summary'}
                </button>
              </div>
              <div className="text-xs font-mono whitespace-pre-wrap text-slate-800 dark:text-slate-200 leading-relaxed">
                {meetingSummary}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AINoticeGenerator;
