import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MessageCircle, Zap, Code2, BarChart3, Check, ChevronRight, Star, Send, X, Bot } from 'lucide-react';
import './Landing.css';

const DEMO_FAQS = [
  { q: "What are your business hours?", a: "We're open Monday–Friday, 9am–6pm EST. You can also reach us 24/7 through this chat!" },
  { q: "Do you offer refunds?", a: "Yes! We offer a 30-day money-back guarantee on all purchases, no questions asked." },
  { q: "How long does shipping take?", a: "Standard shipping takes 3–5 business days. Express (1–2 days) is also available at checkout." },
];

function DemoChat() {
  const [messages, setMessages] = useState([
    { role: 'bot', text: "Hi! I'm Acme Corp's support bot. How can I help you today? 👋" }
  ]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);

  function getBotResponse(msg) {
    const lower = msg.toLowerCase();
    for (const faq of DEMO_FAQS) {
      if (lower.includes('hours') || lower.includes('open')) return DEMO_FAQS[0].a;
      if (lower.includes('refund') || lower.includes('return') || lower.includes('money')) return DEMO_FAQS[1].a;
      if (lower.includes('ship') || lower.includes('deliver') || lower.includes('long')) return DEMO_FAQS[2].a;
    }
    return "Great question! I'd be happy to help with that. For more detailed info, you can also reach our team at support@acmecorp.com.";
  }

  const send = () => {
    if (!input.trim()) return;
    const userMsg = input.trim();
    setInput('');
    setMessages(m => [...m, { role: 'user', text: userMsg }]);
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      setMessages(m => [...m, { role: 'bot', text: getBotResponse(userMsg) }]);
    }, 1200);
  };

  return (
    <div className="demo-chat">
      <div className="demo-chat-header">
        <div className="demo-bot-avatar"><Bot size={16} /></div>
        <div>
          <div className="demo-bot-name">Acme Corp Support</div>
          <div className="demo-bot-status"><span className="demo-dot" />Online</div>
        </div>
      </div>
      <div className="demo-chat-messages">
        {messages.map((m, i) => (
          <div key={i} className={`demo-msg demo-msg-${m.role}`}>
            {m.role === 'bot' && <div className="demo-msg-avatar"><Bot size={12} /></div>}
            <div className="demo-msg-bubble">{m.text}</div>
          </div>
        ))}
        {typing && (
          <div className="demo-msg demo-msg-bot">
            <div className="demo-msg-avatar"><Bot size={12} /></div>
            <div className="demo-msg-bubble demo-typing">
              <span /><span /><span />
            </div>
          </div>
        )}
      </div>
      <div className="demo-chat-input">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && send()}
          placeholder="Ask something..."
        />
        <button onClick={send}><Send size={16} /></button>
      </div>
      <div className="demo-suggestions">
        {["Refund policy?", "Business hours?", "Shipping time?"].map(s => (
          <button key={s} onClick={() => { setInput(s); }}>
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function Landing() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', h);
    return () => window.removeEventListener('scroll', h);
  }, []);

  return (
    <div className="landing">
      {/* Nav */}
      <nav className={`landing-nav ${scrolled ? 'scrolled' : ''}`}>
        <div className="nav-inner">
          <div className="nav-logo">
            <div className="logo-icon"><MessageCircle size={18} /></div>
            <span>SupportBot AI</span>
          </div>
          <div className="nav-links">
            <a href="#features">Features</a>
            <a href="#pricing">Pricing</a>
          </div>
          <div className="nav-cta">
            <Link to="/login" className="btn btn-ghost">Log in</Link>
            <Link to="/signup" className="btn btn-primary">Start free <ChevronRight size={16} /></Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="hero">
        <div className="hero-bg" />
        <div className="hero-inner">
          <div className="hero-badge fade-up">
            <Zap size={13} /> Powered by GPT-4o mini
          </div>
          <h1 className="hero-title fade-up" style={{ animationDelay: '.05s' }}>
            Customer support<br />
            <span className="gradient-text">on autopilot</span>
          </h1>
          <p className="hero-sub fade-up" style={{ animationDelay: '.1s' }}>
            Create an AI chatbot for your website in minutes. No code.<br />
            Just your FAQs — and we handle the rest.
          </p>
          <div className="hero-actions fade-up" style={{ animationDelay: '.15s' }}>
            <Link to="/signup" className="btn btn-primary btn-lg">
              Create your bot free <ChevronRight size={18} />
            </Link>
            <a href="#demo" className="btn btn-outline btn-lg">See demo</a>
          </div>
          <p className="hero-footnote fade-up" style={{ animationDelay: '.2s' }}>
            Free plan available · No credit card required
          </p>
        </div>
      </section>

      {/* Demo */}
      <section className="demo-section" id="demo">
        <div className="section-inner">
          <div className="demo-layout">
            <div className="demo-text fade-up">
              <p className="section-label">Live demo</p>
              <h2>See it in action</h2>
              <p className="demo-desc">
                This is what your customers will experience. Type a question or click a suggestion below.
              </p>
              <ul className="demo-checklist">
                {["Instant answers from your FAQs", "AI fallback for unknown questions", "Matches your brand color", "Works on any website"].map(item => (
                  <li key={item}><Check size={16} />{item}</li>
                ))}
              </ul>
            </div>
            <div className="demo-widget fade-up" style={{ animationDelay: '.1s' }}>
              <DemoChat />
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="features-section" id="features">
        <div className="section-inner">
          <p className="section-label center">Features</p>
          <h2 className="center">Everything you need to launch</h2>
          <div className="features-grid">
            {[
              { icon: <Zap size={22} />, title: "Set up in minutes", desc: "Add your business name, paste your FAQs, and you're done. No technical skills required." },
              { icon: <Code2 size={22} />, title: "One-line embed", desc: "Copy a single script tag and paste it into your website. Works with any platform." },
              { icon: <MessageCircle size={22} />, title: "AI-powered fallback", desc: "For questions not in your FAQs, GPT-4o mini gives smart, contextual answers." },
              { icon: <BarChart3 size={22} />, title: "Usage dashboard", desc: "Track message volume, monitor your limits, and see your bot's activity at a glance." },
            ].map((f, i) => (
              <div key={i} className="feature-card fade-up" style={{ animationDelay: `${i * .07}s` }}>
                <div className="feature-icon">{f.icon}</div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Steps */}
      <section className="steps-section">
        <div className="section-inner">
          <p className="section-label center">How it works</p>
          <h2 className="center">3 steps to launch</h2>
          <div className="steps">
            {[
              { n: "01", title: "Sign up & create your bot", desc: "Enter your business name and add your most common customer questions." },
              { n: "02", title: "Customize & save", desc: "Set the tone, add instructions, pick your brand color." },
              { n: "03", title: "Embed on your site", desc: "Copy one line of code. Your AI support bot is live instantly." },
            ].map((s, i) => (
              <div key={i} className="step fade-up" style={{ animationDelay: `${i * .1}s` }}>
                <div className="step-num">{s.n}</div>
                <h3>{s.title}</h3>
                <p>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="pricing-section" id="pricing">
        <div className="section-inner">
          <p className="section-label center">Pricing</p>
          <h2 className="center">Simple, transparent pricing</h2>
          <div className="pricing-grid">
            <div className="pricing-card fade-up">
              <div className="plan-name">Free</div>
              <div className="plan-price">$0<span>/mo</span></div>
              <ul className="plan-features">
                {["1 chatbot", "100 messages/month", "FAQ-based answers", "AI fallback", "Embed code"].map(f => (
                  <li key={f}><Check size={15} />{f}</li>
                ))}
              </ul>
              <Link to="/signup" className="btn btn-outline" style={{ width: '100%', justifyContent: 'center' }}>
                Get started free
              </Link>
            </div>
            <div className="pricing-card pricing-card-pro fade-up" style={{ animationDelay: '.1s' }}>
              <div className="plan-badge">Most Popular</div>
              <div className="plan-name">Pro</div>
              <div className="plan-price">$15<span>/mo</span></div>
              <ul className="plan-features">
                {["Unlimited chatbots", "5,000 messages/month", "Everything in Free", "Priority support", "Custom branding"].map(f => (
                  <li key={f}><Check size={15} />{f}</li>
                ))}
              </ul>
              <Link to="/signup" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                Start Pro trial
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta-section">
        <div className="section-inner center">
          <h2 className="fade-up">Ready to automate your support?</h2>
          <p className="fade-up" style={{ animationDelay: '.05s' }}>Join hundreds of small businesses saving hours every week.</p>
          <Link to="/signup" className="btn btn-primary btn-lg fade-up" style={{ animationDelay: '.1s' }}>
            Create your free bot <ChevronRight size={18} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="footer-inner">
          <div className="nav-logo">
            <div className="logo-icon"><MessageCircle size={16} /></div>
            <span>SupportBot AI</span>
          </div>
          <p className="footer-copy">© 2025 SupportBot AI. Built for small businesses.</p>
        </div>
      </footer>
    </div>
  );
}
