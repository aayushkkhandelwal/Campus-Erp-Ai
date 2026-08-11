import { useState } from 'react';
import { Sparkles, X, Send, Bot, User, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { aiService } from '../../services/ai.service';

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
}

export const AICopilotWidget = () => {
  const { user } = useAuth();
  const role = user?.role || 'ADMIN';

  const [isOpen, setIsOpen] = useState(false);
  const [inputPrompt, setInputPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: `Hello ${user?.fullName || 'there'}! 👋 I am your AI ERP Assistant. Ask me anything about attendance, fees, faculty workloads, or student performance.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const quickPrompts: Record<string, string[]> = {
    SUPER_ADMIN: [
      'Show monthly and annual SaaS revenue stats',
      'Which college tenants have the most students?',
      'Which college accounts are suspended?',
      'Show total storage used across all tenants',
    ],
    ADMIN: [
      'Which students have attendance below 75%?',
      'Which department collected the most fees?',
      'Which faculty has the highest workload?',
      'Show students with pending fees over 30 days',
      'Which subjects have the lowest average marks?',
    ],
    FACULTY: [
      'Which students are at risk due to low attendance?',
      'Who needs extra help in DBMS?',
      'Generate a 50-mark question paper',
    ],
    STUDENT: [
      'What is my attendance?',
      'When is my next DBMS exam?',
      'How much fee is pending?',
      'Explain Normalization in DBMS',
    ],
  };

  const currentPrompts = quickPrompts[role] || quickPrompts.ADMIN;

  const handleSend = async (promptToSend?: string) => {
    const query = promptToSend || inputPrompt;
    if (!query.trim()) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!promptToSend) setInputPrompt('');
    setLoading(true);

    try {
      const responseText = await aiService.queryERPData(query, role, user);
      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: responseText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `ai-err-${Date.now()}`,
          sender: 'ai',
          text: 'Sorry, I encountered an issue analyzing ERP data. Please try again.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-full bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 p-3.5 text-white shadow-xl shadow-orange-500/30 hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer border-2 border-white/40"
        title="Open AI ERP Copilot"
      >
        <Sparkles className="h-6 w-6 animate-pulse text-yellow-200" />
        <span className="hidden md:inline text-xs font-black tracking-wide font-['Outfit'] pr-1">
          AI Copilot
        </span>
      </button>

      {/* Floating Copilot Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-end sm:p-6 bg-stone-900/40 backdrop-blur-sm transition-all duration-200">
          <div className="w-full sm:w-[420px] h-[580px] rounded-t-3xl sm:rounded-3xl border border-amber-200/80 bg-white shadow-2xl dark:border-stone-800 dark:bg-stone-900 flex flex-col overflow-hidden transition-colors">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-amber-100 dark:border-stone-800 bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-rose-500/10">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md">
                  <Bot className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-stone-900 dark:text-white font-['Outfit'] flex items-center gap-1.5">
                    AI ERP Copilot
                    <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-950 px-2 py-0.5 rounded-full">
                      {role}
                    </span>
                  </h3>
                  <p className="text-[11px] font-medium text-stone-500 dark:text-stone-400">
                    Real-time natural language query engine
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-xl text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-2.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.sender === 'ai' && (
                    <div className="h-7 w-7 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold text-xs shrink-0 mt-1">
                      AI
                    </div>
                  )}

                  <div
                    className={`max-w-[85%] rounded-2xl p-3.5 space-y-1 ${
                      msg.sender === 'user'
                        ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-br-none shadow-md font-medium'
                        : 'bg-amber-50/70 border border-amber-100 text-stone-900 dark:bg-stone-800/80 dark:border-stone-700 dark:text-stone-100 rounded-bl-none font-normal'
                    }`}
                  >
                    <p className="whitespace-pre-line leading-relaxed">{msg.text}</p>
                    <span
                      className={`text-[9px] block text-right font-semibold ${
                        msg.sender === 'user' ? 'text-amber-100' : 'text-stone-400'
                      }`}
                    >
                      {msg.timestamp}
                    </span>
                  </div>

                  {msg.sender === 'user' && (
                    <div className="h-7 w-7 rounded-xl bg-stone-800 text-white flex items-center justify-center font-bold text-xs shrink-0 mt-1">
                      <User className="h-3.5 w-3.5" />
                    </div>
                  )}
                </div>
              ))}

              {loading && (
                <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 text-xs font-bold p-2">
                  <Sparkles className="h-4 w-4 animate-spin" />
                  <span>Analyzing ERP database...</span>
                </div>
              )}
            </div>

            {/* Quick Prompt Pills */}
            <div className="px-3 py-2 border-t border-amber-100 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/50 flex items-center gap-1.5 overflow-x-auto">
              {currentPrompts.map((p: string) => (
                <button
                  key={p}
                  onClick={() => handleSend(p)}
                  className="whitespace-nowrap rounded-xl bg-white dark:bg-stone-800 border border-amber-200 dark:border-stone-700 px-2.5 py-1 text-[11px] font-bold text-amber-800 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-stone-700 transition-colors flex items-center gap-1 cursor-pointer shrink-0"
                >
                  <span>{p}</span>
                  <ArrowRight className="h-2.5 w-2.5 opacity-60" />
                </button>
              ))}
            </div>

            {/* Input Bar */}
            <div className="p-3 border-t border-amber-100 dark:border-stone-800 bg-white dark:bg-stone-900">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  value={inputPrompt}
                  onChange={(e) => setInputPrompt(e.target.value)}
                  placeholder={`Ask AI Copilot (${role})...`}
                  className="flex-1 rounded-2xl border border-amber-200 bg-amber-50/40 px-4 py-2.5 text-xs text-stone-900 focus:border-amber-500 focus:outline-none dark:border-stone-700 dark:bg-stone-800 dark:text-white"
                />
                <button
                  type="submit"
                  disabled={loading || !inputPrompt.trim()}
                  className="p-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-white disabled:opacity-50 hover:shadow-md transition-all cursor-pointer"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AICopilotWidget;
