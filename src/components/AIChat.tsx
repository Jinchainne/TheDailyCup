import { useState, useRef, useEffect } from 'react';
import { X, Send, Loader2, User } from 'lucide-react';
import { requestMimoChat } from '../lib/mimo';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function AIChat() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Welcome to The Daily Cup. I can help with menu picks, prices, recommendations, and ordering questions. What would you like to explore?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);

    try {
      const content = await requestMimoChat([
        {
          role: 'system',
          content: `You are a friendly AI assistant for The Daily Cup, a food and beverage app that accepts RITUAL payments on Ritual.

Our menu includes coffee, tea, burgers, pizza, Vietnamese dishes, desserts, and juice.
Menu prices now range from 0.10 to 1.00 RITUAL depending on the item, with simple drinks and bakery items at the low end and premium platters or hotpot at the high end.

Payment: RITUAL on Ritual Testnet (Chain ID 1979). Delivery is available with map-based address selection.
Keep responses short and helpful. Always suggest specific items with prices in RITUAL.`
        },
        ...messages.slice(-8),
        { role: 'user', content: userMsg }
      ], { temperature: 0.7, maxTokens: 400 });
      setMessages(prev => [...prev, { role: 'assistant', content }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Something went wrong while contacting the AI assistant. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 w-16 h-16 rounded-full overflow-hidden shadow-lg shadow-amber-200 hover:shadow-xl hover:scale-110 transition-all z-50 border-3 border-amber-400 cursor-pointer"
          style={{ border: '3px solid #f59e0b' }}
        >
          <img src="/agent.png" alt="AI Assistant" className="w-full h-full object-cover" />
        </button>
      )}

      {/* Chat window */}
      {open && (
        <div className="fixed bottom-6 right-6 w-96 max-w-[calc(100vw-2rem)] h-[500px] max-h-[calc(100vh-4rem)] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col z-50 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white px-4 py-3 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                <img src="/agent.png" alt="AI" className="w-5 h-5 rounded-full object-cover" />
              </div>
              <div>
                <p className="text-sm font-bold">AI Assistant</p>
                <p className="text-[10px] text-blue-100">AI support for menu and checkout questions</p>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="p-1 hover:bg-white/20 rounded-lg transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'assistant' && (
                  <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <img src="/agent.png" alt="AI" className="w-4 h-4 rounded-full object-cover" />
                  </div>
                )}
                <div className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white rounded-br-md'
                    : 'bg-slate-100 text-slate-800 rounded-bl-md'
                }`}>
                  {msg.content}
                </div>
                {msg.role === 'user' && (
                  <div className="w-7 h-7 rounded-lg bg-slate-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <User className="w-4 h-4 text-slate-500" />
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div className="flex gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <img src="/agent.png" alt="AI" className="w-4 h-4 rounded-full object-cover" />
                </div>
                <div className="bg-slate-100 rounded-2xl rounded-bl-md px-3 py-2">
                  <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-slate-200 p-3 flex-shrink-0">
            <div className="flex gap-2">
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') sendMessage(); }}
                placeholder="Ask about the menu, prices, or recommendations..."
                className="flex-1 text-sm"
                disabled={loading}
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim() || loading}
                className="w-9 h-9 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 rounded-xl flex items-center justify-center transition-colors"
              >
                <Send className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}



