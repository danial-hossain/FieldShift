import React, { useState, useRef, useEffect } from 'react';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';

const SUGGESTED_PROMPTS = [
  { label: '🌾 Recommend Best Rotation', text: 'Based on my field soil texture and organic matter, what is the most resilient 3-year crop rotation?' },
  { label: '💧 Water & Drought Stress', text: 'How will my field irrigation capacity hold up under higher temperatures or rainfall deficits?' },
  { label: '🌿 Legume Nitrogen Benefits', text: 'How do pulses like Lentil and Chickpea contribute to nitrogen fixation and soil health in this rotation?' },
  { label: '⚠️ Environmental Risks', text: 'What are the main disease, pest, or waterlogging risks given the observed NASA POWER weather telemetry?' },
  { label: '📈 Profit vs Soil Trade-off', text: 'How can I maximize agricultural revenue without degrading organic matter and long-term soil structure?' }
];

export default function AiAssistantView({
  activeField,
  nasa,
  summary,
  plan,
  ml,
  rl,
  user,
  onBack
}) {
  const [messages, setMessages] = useState([
    {
      id: 'welcome-1',
      role: 'assistant',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      model: 'gemini-3.5-flash',
      text: `Hello! I am your **FieldShift Agronomic AI Assistant**, powered by **Google Gemini**.

I have synchronized telemetry for **${activeField?.name || 'your farm'}** (${activeField?.soil_texture || 'loam'}, ${activeField?.organic_matter ?? activeField?.organic_matter_pct ?? 'N/A'}% organic matter) and recent climate telemetry. 

Ask me anything about optimal crop sequences, soil moisture retention, fertilizer strategies, or climate adaptation!`
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const chatBottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleCopy = (id, text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const buildContextPayload = () => {
    const rotationStr = plan?.selected_crop_by_period
      ? Object.entries(plan.selected_crop_by_period).map(([p, c]) => `${p}: ${c}`).join(', ')
      : '';

    return {
      field: {
        name: activeField?.name,
        latitude: activeField?.latitude,
        longitude: activeField?.longitude,
        field_size_ha: activeField?.field_size_ha || activeField?.area_ha,
        soil_texture: activeField?.soil_texture,
        organic_matter_pct: activeField?.organic_matter ?? activeField?.organic_matter_pct,
        irrigation_capacity_mm: activeField?.irrigation_capacity_mm,
        previous_crop: activeField?.previous_crop
      },
      weather: {
        temperature_c: nasa?.telemetry?.observed_temperature_c,
        humidity_pct: nasa?.telemetry?.average_humidity_pct,
        precipitation_mm: nasa?.telemetry?.precipitation_daily_mm,
        wind_speed_ms: nasa?.telemetry?.wind_speed_ms
      },
      plan: {
        rotation_str: rotationStr,
        yield_tons: plan?.objective_value
      }
    };
  };

  const callGeminiDirect = async (userPrompt, chatHistory, contextData) => {
    const sysPrompt = `You are FieldShift Agronomic AI Assistant, a specialist in sustainable farming, crop rotation, and agronomic science.
Active Field: ${contextData.field.name || 'Current parcel'} (${contextData.field.soil_texture || 'loam'}, OM: ${contextData.field.organic_matter_pct || 'moderate'}%).
Observed Climate: ${contextData.weather.temperature_c ? `${contextData.weather.temperature_c}°C, ${contextData.weather.humidity_pct}% humidity` : 'Regional baseline'}.
Provide structured, highly practical advice with bullet points and bold highlights.`;

    const contents = [
      { role: 'user', parts: [{ text: `System rules: ${sysPrompt}\n\nAcknowledge in 1 sentence.` }] },
      { role: 'model', parts: [{ text: 'Understood. Ready to provide field-specific agronomic advice.' }] }
    ];

    chatHistory.slice(-4).forEach(m => {
      contents.append
      contents.push({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.text }]
      });
    });

    contents.push({ role: 'user', parts: [{ text: userPrompt }] });

    const models = ['gemini-3.5-flash', 'gemini-3.5-flash-lite', 'gemini-flash-latest'];
    for (const m of models) {
      try {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${GEMINI_API_KEY}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents })
        });
        if (res.ok) {
          const data = await res.json();
          const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (reply) return { reply, model: m };
        }
      } catch (err) {
        // try next model
      }
    }

    throw new Error('All model endpoints unavailable.');
  };

  const handleSend = async (textToSend) => {
    const messageContent = (textToSend || inputText).trim();
    if (!messageContent || loading) return;

    const userMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      text: messageContent
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setLoading(true);

    const contextData = buildContextPayload();
    const historyPayload = messages.map(m => ({ role: m.role, text: m.text }));

    try {
      let replyText = '';
      let modelUsed = 'gemini-3.5-flash';

      // 1. Try Backend API first
      try {
        const response = await fetch('/api/assistant/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: messageContent,
            history: historyPayload,
            context: contextData
          })
        });

        if (response.ok) {
          const resJson = await response.json();
          replyText = resJson.reply;
          modelUsed = resJson.model || 'gemini-3.5-flash';
        }
      } catch (backendErr) {
        // Backend request failed or unreachable, will use direct client fallback
      }

      // 2. Direct fallback if backend was unavailable
      if (!replyText) {
        const directResult = await callGeminiDirect(messageContent, messages, contextData);
        replyText = directResult.reply;
        modelUsed = directResult.model;
      }

      const aiMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        model: modelUsed,
        text: replyText
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      const errorMessage = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        model: 'system-fallback',
        text: `⚠️ **Advisory Notice:** Unable to reach Gemini server (${error.message}). 

**Rule-of-Thumb Agronomic Check:**
For **${activeField?.soil_texture || 'this soil'}**, ensure rotation avoids back-to-back legumes to prevent Fusarium root rot, and verify water budget against the seasonal capacity of ${activeField?.irrigation_capacity_mm || 100} mm.`
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClear = () => {
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        role: 'assistant',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        model: 'gemini-3.5-flash',
        text: 'Chat history cleared. I am ready for your next agronomic query!'
      }
    ]);
  };

  // Simple Markdown-to-JSX Parser
  const renderFormattedText = (rawText) => {
    if (!rawText) return null;
    const lines = rawText.split('\n');

    return lines.map((line, lIdx) => {
      // Unordered list
      if (line.trim().startsWith('* ') || line.trim().startsWith('- ')) {
        const itemContent = line.trim().substring(2);
        return (
          <li key={lIdx} className="ai-chat-list-item">
            {renderInlineMarkdown(itemContent)}
          </li>
        );
      }
      // Blank line
      if (!line.trim()) {
        return <div key={lIdx} style={{ height: 8 }} />;
      }
      // Regular line
      return (
        <p key={lIdx} className="ai-chat-paragraph">
          {renderInlineMarkdown(line)}
        </p>
      );
    });
  };

  const renderInlineMarkdown = (text) => {
    // Splits by **bold**
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="ai-chat-strong">{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  return (
    <div className="ai-assistant-container">
      {/* Top Header */}
      <div className="view-sub-header ai-view-header">
        <div className="ai-title-group">
          <div className="ai-title-with-badge">
            <h2>AI Assistant &amp; Decision Support</h2>
            <span className="ai-status-pill online">
              <span className="ai-status-dot" />
              Gemini 3.5 Flash Online
            </span>
          </div>
          <p>Scientific multi-objective crop rotation, soil dynamics &amp; climate advisory powered by Google Gemini</p>
        </div>
        {onBack && (
          <button type="button" className="back-btn" onClick={onBack}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
            <span>Back to Dashboard</span>
          </button>
        )}
      </div>

      {/* Field & Environmental Context Ribbon */}
      <div className="ai-context-ribbon">
        <div className="ai-context-label">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          <span>Linked Field Context</span>
        </div>
        <div className="ai-context-chips">
          <span className="ai-context-chip field-name">
            <strong>{activeField?.name || 'Selected Parcel'}</strong>
          </span>
          <span className="ai-context-chip">
            Soil: <strong>{activeField?.soil_texture || 'Loam'}</strong>
          </span>
          <span className="ai-context-chip">
            Organic Matter: <strong>{activeField?.organic_matter ?? activeField?.organic_matter_pct ?? 4.5}%</strong>
          </span>
          <span className="ai-context-chip">
            Irrigation: <strong>{activeField?.irrigation_capacity_mm || 110} mm</strong>
          </span>
          {nasa?.telemetry && (
            <span className="ai-context-chip weather">
              NASA Weather: <strong>{nasa.telemetry.observed_temperature_c}°C · {nasa.telemetry.average_humidity_pct}% RH</strong>
            </span>
          )}
        </div>
      </div>

      {/* Main Chat Deck */}
      <div className="ai-chat-deck dash-card">
        {/* Messages Feed */}
        <div className="ai-messages-feed">
          {messages.map(msg => (
            <div key={msg.id} className={`ai-message-row ${msg.role}`}>
              {msg.role === 'assistant' && (
                <div className="ai-avatar-assistant">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2a8 8 0 0 0-8 8c0 5 8 12 8 12s8-7 8-12a8 8 0 0 0-8-8z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                </div>
              )}

              <div className="ai-bubble-container">
                <div className={`ai-message-bubble ${msg.role}`}>
                  {renderFormattedText(msg.text)}
                </div>

                <div className="ai-bubble-footer">
                  <span className="ai-timestamp">{msg.time}</span>
                  {msg.role === 'assistant' && (
                    <>
                      <span className="ai-model-tag">{msg.model || 'Gemini'}</span>
                      <button
                        type="button"
                        className="ai-copy-btn"
                        onClick={() => handleCopy(msg.id, msg.text)}
                        title="Copy message text"
                      >
                        {copiedId === msg.id ? '✓ Copied' : 'Copy'}
                      </button>
                    </>
                  )}
                </div>
              </div>

              {msg.role === 'user' && (
                <div className="ai-avatar-user">
                  {user ? (user.name || user.email || 'U').slice(0, 1).toUpperCase() : 'U'}
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="ai-message-row assistant">
              <div className="ai-avatar-assistant">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2a8 8 0 0 0-8 8c0 5 8 12 8 12s8-7 8-12a8 8 0 0 0-8-8z" />
                </svg>
              </div>
              <div className="ai-bubble-container">
                <div className="ai-message-bubble assistant ai-loading-bubble">
                  <span className="ai-typing-text">Gemini is analyzing field telemetry</span>
                  <span className="ai-typing-dot" />
                  <span className="ai-typing-dot" />
                  <span className="ai-typing-dot" />
                </div>
              </div>
            </div>
          )}

          <div ref={chatBottomRef} />
        </div>

        {/* Suggestion Chips */}
        <div className="ai-suggestions-row">
          <span className="ai-suggestions-title">Quick Inquiries:</span>
          <div className="ai-suggestions-scroll">
            {SUGGESTED_PROMPTS.map((prompt, idx) => (
              <button
                key={idx}
                type="button"
                className="ai-prompt-chip"
                onClick={() => handleSend(prompt.text)}
                disabled={loading}
              >
                {prompt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Input Bar */}
        <div className="ai-chat-input-bar">
          <button
            type="button"
            className="ai-clear-btn"
            onClick={handleClear}
            title="Clear conversation history"
          >
            Clear Chat
          </button>

          <div className="ai-input-wrapper">
            <textarea
              ref={inputRef}
              rows={1}
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask FieldShift AI about crop choice, water stress, soil nutrients, or weather impacts…"
              className="ai-textarea"
              disabled={loading}
            />
            <button
              type="button"
              className="ai-send-btn"
              onClick={() => handleSend()}
              disabled={loading || !inputText.trim()}
              title="Send message (Enter)"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"></line>
                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
              </svg>
            </button>
          </div>
        </div>

        {/* Footer Disclaimer */}
        <div className="ai-footer-disclaimer">
          Gemini-powered agricultural decision support · AI estimates are research advisory simulations and do not replace certified on-ground soil assays.
        </div>
      </div>
    </div>
  );
}
