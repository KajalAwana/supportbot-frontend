import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MessageCircle, Eye, EyeOff } from 'lucide-react';
import api from '../lib/api.js';
import './Auth.css';

export default function Signup() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (form.password.length < 8) return setError('Password must be at least 8 characters');
    setError(''); setLoading(true);
    try {
      console.log("Submitting form:", form);
      const { data } = await api.post('/api/auth/signup', form);
      console.log("Response from backend:", data);
      localStorage.setItem('token', data.token);
      navigate('/dashboard');
      /*const { data } = await api.post('/auth/signup', form);
      localStorage.setItem('token', data.token);
      navigate('/dashboard');*/
    } catch (err) {
      setError(err.response?.data?.error || 'Signup failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="auth-page">
      <div className="auth-card fade-up">
        <Link to="/" className="auth-logo">
          <div className="logo-icon"><MessageCircle size={18} /></div>
          <span>SupportBot AI</span>
        </Link>
        <h2>Create your account</h2>
        <p className="auth-sub">Start for free — no credit card required</p>
        {error && <div className="auth-error">{error}</div>}
        <form onSubmit={submit}>
          <div className="field">
            <label>Your name</label>
            <input type="text" placeholder="Jane Smith" value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
          </div>
          <div className="field">
            <label>Email</label>
            <input type="email" placeholder="you@company.com" value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
          </div>
          <div className="field">
            <label>Password</label>
            <div className="pw-wrap">
              <input type={showPw ? 'text' : 'password'} placeholder="Min. 8 characters" value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required />
              <button type="button" className="pw-toggle" onClick={() => setShowPw(s => !s)}>
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <button type="submit" className="btn btn-primary auth-btn" disabled={loading}>
            {loading ? 'Creating account…' : 'Create account'}
          </button>
        </form>
        <p className="auth-footer">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
