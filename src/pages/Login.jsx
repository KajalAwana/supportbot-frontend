import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MessageCircle, Eye, EyeOff } from 'lucide-react';
import api from '../lib/api.js';
import './Auth.css';

export default function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const { data } = await api.post('/auth/login', form);
      localStorage.setItem('token', data.token);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="auth-page">
      <div className="auth-card fade-up">
        <Link to="/" className="auth-logo">
          <div className="logo-icon"><MessageCircle size={18} /></div>
          <span>SupportBot AI</span>
        </Link>
        <h2>Welcome back</h2>
        <p className="auth-sub">Sign in to your account</p>
        {error && <div className="auth-error">{error}</div>}
        <form onSubmit={submit}>
          <div className="field">
            <label>Email</label>
            <input type="email" placeholder="you@company.com" value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
          </div>
          <div className="field">
            <label>Password</label>
            <div className="pw-wrap">
              <input type={showPw ? 'text' : 'password'} placeholder="••••••••" value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required />
              <button type="button" className="pw-toggle" onClick={() => setShowPw(s => !s)}>
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <button type="submit" className="btn btn-primary auth-btn" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
        <p className="auth-footer">
          Don't have an account? <Link to="/signup">Sign up free</Link>
        </p>
      </div>
    </div>
  );
}
