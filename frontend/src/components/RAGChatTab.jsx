import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Bookmark, ExternalLink } from 'lucide-react';

const RAGChatTab = ({ companyName, apiBaseUrl }) => {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `Hello! I have indexed the earnings call transcripts, investor presentations, and quarterly reports for **${companyName}**. Ask me anything about their performance, margins, product guidance, or challenges.`,
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      const response = await fetch(`${apiBaseUrl}/api/company/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_name: companyName,
          message: userMessage
        })
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: data.answer,
          sources: data.sources || []
        }]);
      } else {
        const errData = await response.json();
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: `Error: ${errData.detail || 'Could not retrieve answers.'}`
        }]);
      }
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "Network error. Make sure the backend server is running."
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in flex flex-col glass-card" style={{ height: '580px', padding: '0', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-glass)', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <Bot size={20} color="var(--color-cyan)" />
        <div>
          <h3 style={{ fontSize: '15px' }}>Interactive Transcript RAG Chatbot</h3>
          <p style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>Semantic Vector Search over earnings communications</p>
        </div>
      </div>

      {/* Messages area */}
      <div style={{ height: '440px', overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {messages.map((m, idx) => (
          <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '85%' }}>
            
            {/* Sender bubble */}
            <div style={{ 
              display: 'flex', 
              gap: '10px', 
              alignItems: 'flex-start',
              flexDirection: m.role === 'user' ? 'row-reverse' : 'row'
            }}>
              <div style={{ 
                background: m.role === 'user' ? 'var(--color-cyan-glow)' : 'var(--border-glass)', 
                padding: '8px', 
                borderRadius: '50%',
                border: `1px solid ${m.role === 'user' ? 'var(--color-cyan)' : 'var(--border-glass)'}`
              }}>
                {m.role === 'user' ? <User size={16} color="var(--color-cyan)" /> : <Bot size={16} color="var(--color-text-secondary)" />}
              </div>

              <div style={{ 
                background: m.role === 'user' ? 'rgba(0, 240, 255, 0.05)' : 'rgba(255, 255, 255, 0.02)',
                border: '1px solid var(--border-glass)',
                padding: '12px 16px',
                borderRadius: '12px',
                fontSize: '13.5px',
                lineHeight: '1.6',
                color: 'var(--color-text-primary)',
                whiteSpace: 'pre-wrap'
              }}>
                {m.content}
              </div>
            </div>

            {/* Sources list */}
            {m.sources && m.sources.length > 0 && (
              <div className="animate-fade-in" style={{ paddingLeft: '44px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                  <Bookmark size={12} /> RETRIEVED SOURCES
                </span>
                
                <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
                  {m.sources.map((src, sIdx) => (
                    <div 
                      key={sIdx} 
                      style={{ 
                        background: 'rgba(255,255,255,0.01)', 
                        border: '1px solid var(--border-glass)', 
                        borderRadius: '6px', 
                        padding: '6px 10px', 
                        fontSize: '11px', 
                        color: 'var(--color-text-secondary)',
                        whiteSpace: 'nowrap',
                        flexShrink: 0
                      }}
                      title={src.text}
                    >
                      <strong style={{ color: 'var(--color-cyan)' }}>{src.metadata?.quarter}</strong>: {src.metadata?.section}
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        ))}

        {loading && (
          <div style={{ display: 'flex', gap: '10px', alignSelf: 'flex-start' }}>
            <div style={{ background: 'var(--border-glass)', padding: '8px', borderRadius: '50%' }}>
              <Bot size={16} color="var(--color-cyan)" className="animate-pulse" />
            </div>
            <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-glass)', padding: '12px 16px', borderRadius: '12px', display: 'flex', gap: '6px', alignItems: 'center' }}>
              <div style={{ width: '6px', height: '6px', background: 'var(--color-cyan)', borderRadius: '50%', animation: 'bounce 1.4s infinite ease-in-out' }} />
              <div style={{ width: '6px', height: '6px', background: 'var(--color-cyan)', borderRadius: '50%', animation: 'bounce 1.4s infinite ease-in-out 0.2s' }} />
              <div style={{ width: '6px', height: '6px', background: 'var(--color-cyan)', borderRadius: '50%', animation: 'bounce 1.4s infinite ease-in-out 0.4s' }} />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} style={{ padding: '16px 24px', borderTop: '1px solid var(--border-glass)', display: 'flex', gap: '12px', background: 'rgba(0,0,0,0.2)' }}>
        <input
          type="text"
          className="glass-input"
          placeholder={`Ask a question about ${companyName}'s margins, product roadmap, risks...`}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={loading}
          style={{ flex: 1, fontSize: '13.5px' }}
        />
        <button type="submit" className="glass-btn primary" disabled={loading || !input.trim()} style={{ padding: '10px 16px' }}>
          <Send size={15} />
        </button>
      </form>
    </div>
  );
};

export default RAGChatTab;
