import { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  MessageCircle, ArrowLeft, Plus, Trash2, Save,
  Bot, ChevronDown, ChevronUp, HelpCircle, Send, X
} from 'lucide-react';
import api from '../lib/api.js';
import './BotEditor.css';

const COLORS = ['#5b4cf6','#0ea5e9','#10b981','#f59e0b','#ef4444','#ec4899','#8b5cf6','#06b6d4'];
const TONES = ['Friendly and approachable','Professional and formal','Casual and fun','Empathetic and supportive','Concise and direct'];

function LivePreview({ bot }) {
  const [messages, setMessages] = useState([
    { role: 'bot', text: bot.welcome_message || `Hi! I'm ${bot.business_name || 'your'} support bot. How can I help?` }
  ]);
  const [input, setInput] = useState('');

  useEffect(() => {
    setMessages([{ role: 'bot', text: bot.welcome_message || `Hi! I'm ${bot.business_name || 'your'} support bot. How can I help?` }]);
  }, [bot.welcome_message, bot.business_name]);

  const send = () => {
    if (!input.trim()) return;
    const q = input.trim();
    setInput('');
    setMessages(m => [...m, { role: 'user', text: q }]);
    // FAQ lookup for preview
    const match = bot.faqs?.find(f => f.question.toLowerCase().includes(q.toLowerCase().slice(0, 8)));
    setTimeout(() => {
      setMessages(m => [...m, {
        role: 'bot',
        text: match ? match.answer : "I'll need to look into that. Feel free to contact us directly for more help!"
      }]);
    }, 800);
  };

  const color = bot.theme_color || '#5b4cf6';

  return (
    <div className="preview-widget">
      <div className="preview-header" style={{ background: color }}>
        <div className="preview-avatar"><Bot size={15} /></div>
        <div>
          <div className="preview-name">{bot.business_name || 'Your Bot'}</div>
          <div className="preview-online"><span className="online-dot" /> Online</div>
        </div>
      </div>
      <div className="preview-messages">
        {messages.map((m, i) => (
          <div key={i} className={`prev-msg prev-msg-${m.role}`}>
            {m.role === 'bot' && <div className="prev-avatar" style={{ background: color }}><Bot size={11} /></div>}
            <div className="prev-bubble" style={m.role === 'bot' ? {} : { background: color }}>{m.text}</div>
          </div>
        ))}
      </div>
      <div className="preview-input">
        <input value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && send()} placeholder="Type a message…" />
        <button onClick={send} style={{ background: color }}><Send size={14} /></button>
      </div>
    </div>
  );
}

export default function BotEditor() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id && id !== 'new';

  const [form, setForm] = useState({
    business_name: '',
    welcome_message: '',
    instructions: '',
    theme_color: '#5b4cf6',
    faqs: []
  });
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);
  const [newFaq, setNewFaq] = useState({ question: '', answer: '' });
  const [expandedFaq, setExpandedFaq] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    if (isEdit) {
      api.get(`/bots/${id}`).then(({ data }) => {
        const b = data.bot;
        setForm({
          business_name: b.business_name,
          welcome_message: b.welcome_message,
          instructions: b.instructions || '',
          theme_color: b.theme_color,
          faqs: b.faqs || []
        });
      }).catch(() => navigate('/dashboard')).finally(() => setLoading(false));
    }
  }, [id]);

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const addFaq = () => {
    if (!newFaq.question.trim() || !newFaq.answer.trim()) return;
    set('faqs', [...form.faqs, { ...newFaq, id: Date.now() }]);
    setNewFaq({ question: '', answer: '' });
  };

  const removeFaq = (idx) => set('faqs', form.faqs.filter((_, i) => i !== idx));

  const save = async () => {
    if (!form.business_name.trim()) return setError('Business name is required');
    setError(''); setSaving(true);
    try {
      if (isEdit) {
        await api.put(`/bots/${id}`, form);
        showToast('Bot saved!');
      } else {
        await api.post('/bots', form);
        showToast('Bot created!');
        setTimeout(() => navigate('/dashboard'), 1200);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save');
    } finally { setSaving(false); }
  };

  if (loading) return <div className="dash-loading"><div className="spinner" /></div>;

  return (
    <div className="editor-page">
      {/* Header */}
      <div className="editor-header">
        <Link to="/dashboard" className="btn btn-ghost btn-sm">
          <ArrowLeft size={16} /> Back
        </Link>
        <div className="editor-title">
          <div className="logo-icon small"><MessageCircle size={15} /></div>
          <h2>{isEdit ? `Edit: ${form.business_name}` : 'Create New Bot'}</h2>
        </div>
        <button className="btn btn-primary btn-sm" onClick={save} disabled={saving}>
          <Save size={14} /> {saving ? 'Saving…' : 'Save Bot'}
        </button>
      </div>

      <div className="editor-body">
        {/* Form */}
        <div className="editor-form">
          {error && <div className="auth-error">{error}</div>}

          {/* Section: Basics */}
          <div className="editor-section">
            <h3 className="section-heading"><Bot size={16} /> Basic Info</h3>
            <div className="field">
              <label>Business Name *</label>
              <input placeholder="e.g. Acme Store" value={form.business_name}
                onChange={e => set('business_name', e.target.value)} />
            </div>
            <div className="field">
              <label>Welcome Message</label>
              <input placeholder="Hi! How can I help you today?"
                value={form.welcome_message} onChange={e => set('welcome_message', e.target.value)} />
            </div>
          </div>

          {/* Section: Tone */}
          <div className="editor-section">
            <h3 className="section-heading"><MessageCircle size={16} /> Tone & Style</h3>
            <div className="field">
              <label>Tone Preset</label>
              <div className="tone-presets">
                {TONES.map(t => (
                  <button key={t}
                    className={`tone-btn ${form.instructions === t ? 'active' : ''}`}
                    onClick={() => set('instructions', t)}>
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div className="field">
              <label>Custom Instructions (optional)</label>
              <textarea rows={3} placeholder="e.g. Always sign off with 'Have a great day!'"
                value={form.instructions} onChange={e => set('instructions', e.target.value)} />
            </div>
          </div>

          {/* Section: Color */}
          <div className="editor-section">
            <h3 className="section-heading">Brand Color</h3>
            <div className="color-grid">
              {COLORS.map(c => (
                <button key={c} className={`color-swatch ${form.theme_color === c ? 'selected' : ''}`}
                  style={{ background: c }} onClick={() => set('theme_color', c)} />
              ))}
              <label className="color-custom" title="Custom color">
                <input type="color" value={form.theme_color} onChange={e => set('theme_color', e.target.value)} />
                <span style={{ background: form.theme_color }} />
              </label>
            </div>
          </div>

          {/* Section: FAQs */}
          <div className="editor-section">
            <h3 className="section-heading"><HelpCircle size={16} /> FAQs ({form.faqs.length})</h3>
            <p className="section-desc">Add your most common customer questions. The bot will answer these directly.</p>

            {/* Existing FAQs */}
            <div className="faq-list">
              {form.faqs.map((faq, i) => (
                <div key={faq.id || i} className="faq-item">
                  <button className="faq-toggle" onClick={() => setExpandedFaq(expandedFaq === i ? null : i)}>
                    <span>{faq.question}</span>
                    {expandedFaq === i ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                  </button>
                  {expandedFaq === i && (
                    <div className="faq-answer">
                      <p>{faq.answer}</p>
                    </div>
                  )}
                  <button className="faq-delete" onClick={() => removeFaq(i)}><Trash2 size={13} /></button>
                </div>
              ))}
            </div>

            {/* Add new FAQ */}
            <div className="faq-add">
              <div className="field">
                <label>Question</label>
                <input placeholder="e.g. What are your business hours?"
                  value={newFaq.question} onChange={e => setNewFaq(f => ({ ...f, question: e.target.value }))} />
              </div>
              <div className="field">
                <label>Answer</label>
                <textarea rows={2} placeholder="e.g. We're open Mon–Fri, 9am–6pm EST."
                  value={newFaq.answer} onChange={e => setNewFaq(f => ({ ...f, answer: e.target.value }))} />
              </div>
              <button className="btn btn-outline btn-sm" onClick={addFaq}>
                <Plus size={14} /> Add FAQ
              </button>
            </div>
          </div>
        </div>

        {/* Preview */}
        <div className="editor-preview">
          <div className="preview-sticky">
            <h3 className="preview-label">Live Preview</h3>
            <p className="preview-sub">This is how your visitors will see the bot</p>
            <LivePreview bot={form} />
          </div>
        </div>
      </div>

      {toast && (
        <div className="toast-container">
          <div className={`toast toast-${toast.type}`}>{toast.msg}</div>
        </div>
      )}
    </div>
  );
}
