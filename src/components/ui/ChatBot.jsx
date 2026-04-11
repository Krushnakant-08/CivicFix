import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';

// ─── Rule-based response engine ──────────────────────────
const FAQ_PATTERNS = [
  {
    patterns: ['hello', 'hi', 'hey', 'greetings', 'good morning', 'good evening', 'good afternoon'],
    response: "Hello! 👋 I'm CivicBot, your CivicFix assistant. How can I help you today?",
    quickReplies: ['How to report?', 'Track a report', 'What categories?'],
  },
  {
    patterns: ['how to report', 'submit report', 'report issue', 'file complaint', 'report a problem', 'how do i report'],
    response: "📝 **Reporting an issue is easy!**\n\n1. Go to the **Report Issue** page\n2. Enter a descriptive title\n3. Select a category (Roads, Water, etc.)\n4. Use GPS or type your location\n5. Describe the issue in detail\n6. Optionally attach up to 3 photos\n7. Submit! You'll get a tracking ID instantly.\n\n💡 You can report even without signing in (anonymously).",
    quickReplies: ['Track a report', 'Categories', 'What is GPS?'],
    link: { to: '/report', text: 'Go to Report Page →' },
  },
  {
    patterns: ['track', 'tracking', 'track report', 'find report', 'check status', 'where is my report', 'tracking id'],
    response: "🔍 **To track your report:**\n\n1. Go to the **Track Report** page\n2. Enter your Tracking ID (format: CF-YYMMDD-XXXXX)\n3. View the current status, timeline, and AI insights\n\nYour tracking ID was shown after submission. You can also find it in **My Reports** if you were logged in.",
    quickReplies: ['Report statuses', 'My reports', 'Lost tracking ID'],
    link: { to: '/track', text: 'Go to Track Page →' },
  },
  {
    patterns: ['categories', 'what categories', 'category', 'types of issues', 'what can i report'],
    response: "📂 **CivicFix supports 7 categories:**\n\n🛣️ **Roads** — Potholes, road damage, pavement\n🗑️ **Sanitation** — Garbage, dustbins, drains\n💧 **Water** — Leaks, supply issues, pipes\n💡 **Electricity** — Streetlights, power outages\n🌳 **Parks** — Park maintenance, playgrounds\n🚦 **Traffic** — Signals, signs, congestion\n📋 **Other** — Anything that doesn't fit above",
    quickReplies: ['How to report?', 'Track a report'],
  },
  {
    patterns: ['status', 'statuses', 'report status', 'what does status mean', 'status meaning'],
    response: "📊 **Report Status Guide:**\n\n📝 **Reported** — Just submitted, awaiting review\n👀 **Acknowledged** — Department has seen it\n📋 **Assigned** — Assigned to a specific department\n🔧 **In Progress** — Work has started\n✅ **Resolved** — Issue has been fixed\n🔒 **Closed** — Finalized and archived\n❌ **Rejected** — Declined (with reason)",
    quickReplies: ['Track a report', 'How to report?'],
  },
  {
    patterns: ['my reports', 'view my reports', 'my submissions', 'my issues'],
    response: "📋 **My Reports** shows all issues you've submitted (when logged in).\n\nYou can:\n- Filter by status (Reported, In Progress, Resolved, etc.)\n- Expand details and view timeline\n- See AI analysis for each report\n\nNote: Anonymous reports won't appear here.",
    quickReplies: ['Track a report', 'How to report?'],
    link: { to: '/my-reports', text: 'Go to My Reports →' },
  },
  {
    patterns: ['gps', 'location', 'where', 'auto detect', 'geolocation'],
    response: "📍 **GPS Auto-Location:**\n\nWhen reporting, click the **GPS button** next to the location field. Your browser will ask for permission to access your location.\n\nOnce allowed, CivicFix will:\n1. Get your precise coordinates\n2. Reverse-geocode to show the street address\n3. Attach GPS data for the map view\n\nYou can also type the address manually.",
    quickReplies: ['How to report?', 'Map view'],
  },
  {
    patterns: ['map', 'map view', 'see map', 'heatmap', 'where are issues'],
    response: "🗺️ **Interactive Map View:**\n\nSee all reported issues on an interactive map with:\n- 📍 Color-coded markers by category\n- 🔥 Heatmap mode for issue density\n- 🔍 Filter by category, status, priority\n- 📍 \"Near Me\" button for your area\n- 📊 Click markers for details\n\nThe map is publicly accessible — no login required.",
    quickReplies: ['How to report?', 'Categories'],
    link: { to: '/map', text: 'Open Map View →' },
  },
  {
    patterns: ['feed', 'community', 'public feed', 'see all reports', 'browse issues'],
    response: "🌐 **Community Feed** shows all reported issues:\n\n- Browse in a 2-column grid\n- Filter by category, status, priority\n- Upvote issues you care about (login required)\n- Click to view full details\n\nUpvoting helps prioritize issues!",
    quickReplies: ['How to report?', 'Map view'],
    link: { to: '/feed', text: 'Go to Feed →' },
  },
  {
    patterns: ['upvote', 'vote', 'like', 'support'],
    response: "👍 **Upvoting** helps highlight important issues!\n\n- Sign in and go to the **Community Feed**\n- Click the upvote button on any report\n- Higher upvote counts = higher priority\n- The reporter gets notified when you upvote\n\nYou can remove your upvote by clicking again.",
    quickReplies: ['Community Feed', 'How to report?'],
  },
  {
    patterns: ['anonymous', 'privacy', 'without login', 'no account'],
    response: "🔒 **Anonymous Reporting:**\n\nYou can submit reports without creating an account! Your report will be:\n- ✅ Accepted and processed normally\n- 🔒 Not linked to any identity\n- ⚠️ But you won't receive status updates\n\n💡 **Tip:** Create an account to track your reports and get notifications when status changes.",
    quickReplies: ['How to report?', 'Register'],
  },
  {
    patterns: ['ai', 'artificial intelligence', 'how does ai work', 'ai analysis', 'machine learning'],
    response: "🤖 **CivicFix AI Intelligence:**\n\nWhen you submit a report, our AI automatically:\n- 🏷️ Extracts relevant tags\n- ⚡ Assesses priority & severity\n- 🏢 Suggests the right department\n- 📅 Estimates resolution time\n- 🔍 Checks for duplicate reports\n- 🛡️ Filters spam/low-quality submissions\n\nAll AI analysis is rule-based NLP — no external APIs needed!",
    quickReplies: ['How to report?', 'Categories'],
  },
  {
    patterns: ['notification', 'notifications', 'alerts', 'updates', 'bell'],
    response: "🔔 **Notifications keep you updated:**\n\n- Status changes on your reports\n- Department assignment updates\n- When someone upvotes your report\n- Resolution confirmations\n\nView all notifications by clicking the 🔔 bell icon in the navbar. Real-time via WebSocket!",
    quickReplies: ['Track a report', 'My reports'],
  },
  {
    patterns: ['contact', 'help', 'support', 'phone', 'email'],
    response: "📞 **Need more help?**\n\nCivicFix is a civic issue tracking platform. For urgent issues:\n- 🚨 Contact your local municipality directly\n- 📧 Report through the app for tracked resolution\n\nFor app-related queries, reach out to the admin through the platform.",
    quickReplies: ['How to report?', 'Categories'],
  },
  {
    patterns: ['thank', 'thanks', 'thank you', 'thx'],
    response: "You're welcome! 😊 Happy to help. Is there anything else you'd like to know about CivicFix?",
    quickReplies: ['How to report?', 'Track a report', 'Categories'],
  },
  {
    patterns: ['lost tracking id', 'forgot tracking id', 'lost id'],
    response: "😬 **Lost your Tracking ID?**\n\nIf you were **logged in** when you submitted:\n→ Go to **My Reports** to find it.\n\nIf you submitted **anonymously**:\n→ Unfortunately, there's no way to recover it. Next time, copy the tracking ID right after submission!\n\n💡 **Tip:** Always save your tracking ID somewhere safe.",
    quickReplies: ['My reports', 'How to report?'],
  },
];

const FALLBACK_RESPONSE = {
  response: "🤔 I'm not sure I understand. Try asking about:\n\n- How to **report** an issue\n- How to **track** a report\n- Available **categories**\n- Report **statuses**\n- The **map** view\n- **AI** analysis\n- **Notifications**\n\nOr just say **Hi** to start!",
  quickReplies: ['How to report?', 'Track a report', 'Categories', 'Help'],
};

function findResponse(input) {
  const lower = input.toLowerCase().trim();

  for (const faq of FAQ_PATTERNS) {
    for (const pattern of faq.patterns) {
      if (lower.includes(pattern)) {
        return faq;
      }
    }
  }

  return FALLBACK_RESPONSE;
}

// ─── ChatBot Component ──────────────────────────────────
export default function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      sender: 'bot',
      text: "Hello! 👋 I'm **CivicBot**, your CivicFix assistant. Ask me anything about reporting issues, tracking, or using the platform!",
      quickReplies: ['How to report?', 'Track a report', 'Categories'],
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Focus input when opening
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  const handleSend = useCallback((text) => {
    const userMsg = text || input.trim();
    if (!userMsg) return;

    // Add user message
    setMessages((prev) => [...prev, { sender: 'user', text: userMsg }]);
    setInput('');
    setIsTyping(true);

    // Simulate typing delay
    setTimeout(() => {
      const match = findResponse(userMsg);
      setMessages((prev) => [
        ...prev,
        {
          sender: 'bot',
          text: match.response,
          quickReplies: match.quickReplies,
          link: match.link,
        },
      ]);
      setIsTyping(false);
    }, 600 + Math.random() * 400);
  }, [input]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Simple markdown-like bold rendering
  const renderText = (text) => {
    return text.split('\n').map((line, i) => (
      <span key={i}>
        {line.split(/(\*\*[^*]+\*\*)/).map((part, j) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={j} className="font-bold">{part.slice(2, -2)}</strong>;
          }
          return part;
        })}
        {i < text.split('\n').length - 1 && <br />}
      </span>
    ));
  };

  return (
    <>
      {/* Floating Action Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="chatbot-fab"
          aria-label="Open CivicBot assistant"
          id="chatbot-fab"
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        </button>
      )}

      {/* Chat Panel */}
      {isOpen && (
        <div className="chatbot-panel" role="dialog" aria-label="CivicBot Assistant">
          {/* Header */}
          <div className="chatbot-header">
            <div className="flex items-center gap-3">
              <div className="chatbot-avatar">
                <span>🤖</span>
              </div>
              <div>
                <h3 className="chatbot-title">CivicBot</h3>
                <p className="chatbot-subtitle">CivicFix Assistant</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="chatbot-close"
              aria-label="Close chatbot"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div className="chatbot-messages custom-scrollbar">
            {messages.map((msg, i) => (
              <div key={i} className={`chatbot-msg ${msg.sender === 'user' ? 'chatbot-msg--user' : 'chatbot-msg--bot'}`}>
                <div className={`chatbot-bubble ${msg.sender === 'user' ? 'chatbot-bubble--user' : 'chatbot-bubble--bot'}`}>
                  {renderText(msg.text)}
                </div>

                {/* Link button */}
                {msg.link && (
                  <Link to={msg.link.to} onClick={() => setIsOpen(false)} className="chatbot-link-btn">
                    {msg.link.text}
                  </Link>
                )}

                {/* Quick replies */}
                {msg.sender === 'bot' && msg.quickReplies && i === messages.length - 1 && !isTyping && (
                  <div className="chatbot-quick-replies">
                    {msg.quickReplies.map((qr) => (
                      <button key={qr} onClick={() => handleSend(qr)} className="chatbot-qr-btn">
                        {qr}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {/* Typing indicator */}
            {isTyping && (
              <div className="chatbot-msg chatbot-msg--bot">
                <div className="chatbot-bubble chatbot-bubble--bot chatbot-typing">
                  <span className="chatbot-dot"></span>
                  <span className="chatbot-dot"></span>
                  <span className="chatbot-dot"></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="chatbot-input-area">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask me anything..."
              className="chatbot-input"
              aria-label="Type your message"
            />
            <button
              onClick={() => handleSend()}
              disabled={!input.trim()}
              className="chatbot-send"
              aria-label="Send message"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
