import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Trash2, Loader2, Sparkles, AlertCircle } from 'lucide-react';
import api from '../../api/axios';

const ReportChat = ({ reportId }) => {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content:
        'Hello! I am your MedInsight AI Assistant. You can ask me questions about this specific medical report, abnormal findings, or reference ranges.',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (questionToSend) => {
    const query = questionToSend || input.trim();
    if (!query || loading) return;

    setInput('');
    setError(null);

    const userMessage = { role: 'user', content: query };
    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);

    try {
      const res = await api.post(`/reports/${reportId}/chat`, { question: query });
      const aiMessage = {
        role: 'assistant',
        content: res.data?.answer || 'I could not find an answer in this report.',
        sources: res.data?.sources || [],
        groundedInReport: res.data?.groundedInReport === true,
      };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (err) {
      console.error('Chat error:', err);
      setError(err.response?.data?.message || 'Failed to get an answer from the report assistant.');
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([
      {
        role: 'assistant',
        content:
          'Chat cleared. Feel free to ask any other questions regarding this report.',
      },
    ]);
    setError(null);
  };

  const sampleQuestions = [
    'What values are abnormal in my report?',
    'What is my fasting glucose level?',
    'Explain my lipid panel results',
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col h-[460px] overflow-hidden">
      {/* Chat Header */}
      <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-xl bg-sky-600 flex items-center justify-center text-white shadow-xs">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900 flex items-center space-x-1.5">
              <span>Ask AI About Your Report</span>
              <span className="text-[10px] bg-sky-100 text-sky-800 px-2 py-0.5 rounded-full font-medium">
                Gemini RAG
              </span>
            </h4>
            <p className="text-[11px] text-slate-500">
              Get instant answers about your lab results
            </p>
          </div>
        </div>

        <button
          onClick={clearChat}
          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors title='Clear chat'"
          title="Clear Conversation"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Messages List Area */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex items-start space-x-2.5 ${
              msg.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            {msg.role === 'assistant' && (
              <div className="w-7 h-7 rounded-lg bg-brand-50 border border-brand-100 text-brand-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Bot className="w-4 h-4" />
              </div>
            )}

            <div
              className={`max-w-[82%] rounded-2xl p-3.5 text-xs sm:text-sm leading-relaxed shadow-sm ${
                msg.role === 'user'
                  ? 'bg-brand-600 text-white rounded-br-none'
                  : 'bg-slate-50 border border-slate-200/80 text-slate-800 rounded-bl-none whitespace-pre-line'
              }`}
            >
              {msg.content}

              {/* Source attribution pill */}
              {msg.sources && msg.sources.length > 0 && (
                <div className="mt-2 pt-2 border-t border-slate-200/60 text-[10px] text-slate-400">
                  <span className="font-semibold text-slate-500">Evidence from this report:</span>{' '}
                  <span className="italic">"{msg.sources[0].slice(0, 100)}..."</span>
                </div>
              )}
              {msg.role === 'assistant' && msg.groundedInReport === false && index > 0 && (
                <div className="mt-2 border-t border-amber-200 pt-2 text-[10px] text-amber-800">
                  No readable evidence was available from this report for the response.
                </div>
              )}
            </div>

            {msg.role === 'user' && (
              <div className="w-7 h-7 rounded-lg bg-slate-200 text-slate-600 flex items-center justify-center flex-shrink-0 mt-0.5 text-xs font-bold">
                <User className="w-4 h-4" />
              </div>
            )}
          </div>
        ))}

        {/* Loading Indicator */}
        {loading && (
          <div className="flex items-start space-x-2.5">
            <div className="w-7 h-7 rounded-lg bg-brand-50 border border-brand-100 text-brand-600 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl rounded-bl-none p-3.5 text-xs text-slate-500 flex items-center space-x-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-600" />
              <span>AI is querying the report context...</span>
            </div>
          </div>
        )}

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Prompts */}
      <div className="px-4 py-2 border-t border-slate-100 bg-slate-50/50 flex flex-wrap gap-1.5">
        {sampleQuestions.map((q, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(q)}
            disabled={loading}
            className="text-[11px] bg-white border border-slate-200 text-slate-600 hover:text-brand-600 hover:border-brand-300 px-2.5 py-1 rounded-full transition-colors flex items-center space-x-1"
          >
            <Sparkles className="w-2.5 h-2.5 text-amber-500" />
            <span>{q}</span>
          </button>
        ))}
      </div>

      {/* Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="p-3 bg-white border-t border-slate-200 flex items-center space-x-2"
      >
        <input
          type="text"
          placeholder="Ask a question about this report..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={loading}
          className="flex-1 px-3.5 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
        />
        <button
          type="submit"
          disabled={!input.trim() || loading}
          className="px-4 py-2 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-sm transition-all flex items-center space-x-1.5"
        >
          <Send className="w-3.5 h-3.5" />
          <span>Send</span>
        </button>
      </form>
    </div>
  );
};

export default ReportChat;
