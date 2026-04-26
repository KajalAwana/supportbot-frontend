import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  MessageCircle, Plus, Bot, Trash2, Edit3, Code2,
  BarChart3, LogOut, Zap, Copy, Check, X, ExternalLink, Crown
} from 'lucide-react';
import api from '../lib/api.js';
import './Dashboard.css';

function EmbedModal({ bot, onClose }) {
  const [copied, setCopied] = useState(false);
  const apiUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3001';
  const embedCode = `<script src="${apiUrl}/embed.js" data-bot-key="${bot.embed_key}" defer></script>`;

  const copy = () => {
    navigator.clipboard.writeText(embedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Embed {bot.business_name}</h3>
          <button className="btn btn-ghost icon-btn" onClick={onClose}><X size={18} /></button>
        </div>
        <p className="modal-desc">
          Copy this one-line script and paste it just before the <code>&lt;/body&gt;</code> tag on your website.
        </p>
        <div className="embed-code-block">
          <code>{embedCode}</code>
          <button className="copy-btn" onClick={copy}>
            {copied ? <><Check size={14} /> Copied!</> : <><Copy size={14} /> Copy</>}
          </button>
        </div>
        <div className="embed-instructions">
          <p className="embed-step"><span>1</span> Copy the script above</p>
          <p className="embed-step"><span>2</span> Open your website's HTML</p>
          <p className="embed-step"><span>3</span> Paste before <code>&lt;/body&gt;</code></p>
          <p className="embed-step"><span>4</span> Save and publish — you're live! 🎉</p>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [user, setUser] = useState(null);
  const [bots, setBots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [embedBot, setEmbedBot] = useState(null);
  const [upgradeLoading, setUpgradeLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    if (searchParams.get('upgraded') === 'true') {
      showToast('🎉 Welcome to Pro! Your account has been upgraded.', 'success');
    }
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [userRes, botsRes] = await Promise.all([
        api.get('/auth/me'),
        api.get('/bots')
      ]);
      setUser(userRes.data.user);
      setBots(botsRes.data.bots);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const deleteBot = async (id) => {
    if (!confirm('Delete this bot? This cannot be undone.')) return;
    try {
      await api.delete(`/bots/${id}`);
      setBots(b => b.filter(x => x.id !== id));
      showToast('Bot deleted');
    } catch {
      showToast('Failed to delete bot', 'error');
    }
  };

  const upgrade = async () => {
    setUpgradeLoading(true);
    try {
      const { data } = await api.post('/stripe/create-checkout');
      window.location.href = data.url;
    } catch {
      showToast('Failed to start checkout', 'error');
      setUpgradeLoading(false);
    }
  };

  const manageSubscription = async () => {
    try {
      const { data } = await api.post('/stripe/portal');
      window.location.href = data.url;
    } catch {
      showToast('Failed to open billing portal', 'error');
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  if (loading) return (
    <div className="dash-loading">
      <div className="spinner" />
    </div>
  );

  const FREE_LIMIT = 100;
  const PRO_LIMIT = 5000;
  const limit = user?.plan === 'pro' ? PRO_LIMIT : FREE_LIMIT;
  const usage = user?.message_count || 0;
  const usagePct = Math.min((usage / limit) * 100, 100);

  return (
    <div className="dashboard">
      {/* Sidebar */}
      <aside className="sidebar">
        <Link to="/" className="sidebar-logo">
          <div className="logo-icon"><MessageCircle size={16} /></div>
          <span>SupportBot AI</span>
        </Link>
        <nav className="sidebar-nav">
          <div className="sidebar-nav-item active">
            <Bot size={18} /> My Bots
          </div>
          <div className="sidebar-nav-item">
            <BarChart3 size={18} /> Usage
          </div>
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-user">
            <div className="user-avatar">{user?.name?.[0]?.toUpperCase()}</div>
            <div>
              <div className="user-name">{user?.name}</div>
              <div className="user-plan">
                <span className={`badge badge-${user?.plan}`}>{user?.plan}</span>
              </div>
            </div>
          </div>
          <button className="btn btn-ghost sidebar-logout" onClick={logout}>
            <LogOut size={16} /> Sign out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="dash-main">
        <div className="dash-header">
          <div>
            <h1>My Bots</h1>
            <p className="dash-sub">Manage your AI customer support bots</p>
          </div>
          <Link to="/dashboard/bot/new" className="btn btn-primary">
            <Plus size={18} /> New Bot
          </Link>
        </div>

        {/* Usage card */}
        <div className="usage-card">
          <div className="usage-info">
            <div className="usage-label">
              <Zap size={15} />
              Messages this month
            </div>
            <div className="usage-nums">
              <span className="usage-count">{usage.toLocaleString()}</span>
              <span className="usage-limit">/ {limit.toLocaleString()}</span>
            </div>
          </div>
          <div className="usage-bar-wrap">
            <div className="usage-bar" style={{ width: `${usagePct}%`, background: usagePct > 85 ? 'var(--danger)' : 'var(--accent)' }} />
          </div>
          {user?.plan === 'free' && (
            <div className="usage-upgrade">
              <p>Need more messages?</p>
              <button className="btn btn-primary btn-sm" onClick={upgrade} disabled={upgradeLoading}>
                <Crown size={14} /> {upgradeLoading ? 'Loading…' : 'Upgrade to Pro — $15/mo'}
              </button>
            </div>
          )}
          {user?.plan === 'pro' && (
            <div className="usage-manage">
              <span className="badge badge-pro">✦ Pro Plan</span>
              <button className="btn btn-ghost btn-sm" onClick={manageSubscription}>
                <ExternalLink size={13} /> Manage billing
              </button>
            </div>
          )}
        </div>

        {/* Bots grid */}
        {bots.length === 0 ? (
          <div className="empty-state fade-up">
            <div className="empty-icon"><Bot size={32} /></div>
            <h3>No bots yet</h3>
            <p>Create your first AI support bot in under 5 minutes.</p>
            <Link to="/dashboard/bot/new" className="btn btn-primary">
              <Plus size={18} /> Create your first bot
            </Link>
          </div>
        ) : (
          <div className="bots-grid">
            {bots.map((bot, i) => (
              <div key={bot.id} className="bot-card fade-up" style={{ animationDelay: `${i * .05}s` }}>
                <div className="bot-card-header">
                  <div className="bot-color-dot" style={{ background: bot.theme_color }} />
                  <div className="bot-card-meta">
                    <h3>{bot.business_name}</h3>
                    <span className="tag">{bot.faqs?.length || 0} FAQs</span>
                  </div>
                  <div className={`bot-status ${bot.is_active ? 'active' : 'inactive'}`}>
                    {bot.is_active ? 'Active' : 'Inactive'}
                  </div>
                </div>
                <p className="bot-welcome">{bot.welcome_message}</p>
                <div className="bot-card-actions">
                  <button className="btn btn-ghost btn-sm" onClick={() => setEmbedBot(bot)}>
                    <Code2 size={14} /> Embed
                  </button>
                  <Link to={`/dashboard/bot/${bot.id}`} className="btn btn-outline btn-sm">
                    <Edit3 size={14} /> Edit
                  </Link>
                  <button className="btn btn-danger btn-sm" onClick={() => deleteBot(bot.id)}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
            {/* Add new bot card */}
            <Link to="/dashboard/bot/new" className="bot-card-new fade-up" style={{ animationDelay: `${bots.length * .05}s` }}>
              <Plus size={24} />
              <span>New Bot</span>
            </Link>
          </div>
        )}
      </main>

      {embedBot && <EmbedModal bot={embedBot} onClose={() => setEmbedBot(null)} />}

      {toast && (
        <div className="toast-container">
          <div className={`toast toast-${toast.type}`}>{toast.msg}</div>
        </div>
      )}
    </div>
  );
}
