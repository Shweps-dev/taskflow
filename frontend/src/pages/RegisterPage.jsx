import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

export default function RegisterPage() {
  const { register } = useAuth();
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handle = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      await register(form.username, form.email, form.password);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-glow" />
      <div className="auth-card fade-in">
        <div className="auth-logo">
          <span className="auth-logo-icon">⬡</span>
          <span className="auth-logo-text">TaskFlow</span>
        </div>
        <h1 className="auth-title">Create account</h1>
        <p className="auth-sub">Start organizing your work</p>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={submit} className="auth-form">
          <div className="field">
            <label>Username</label>
            <input
              type="text" name="username" value={form.username}
              onChange={handle} placeholder="yourname" required autoFocus
            />
          </div>
          <div className="field">
            <label>Email</label>
            <input
              type="email" name="email" value={form.email}
              onChange={handle} placeholder="you@example.com" required
            />
          </div>
          <div className="field">
            <label>Password <span style={{color:'var(--text3)',fontSize:'12px'}}>min. 6 chars</span></label>
            <input
              type="password" name="password" value={form.password}
              onChange={handle} placeholder="••••••••" required minLength={6}
            />
          </div>
          <button className="btn btn-primary auth-submit" disabled={loading}>
            {loading ? 'Creating…' : 'Create account →'}
          </button>
        </form>

        <p className="auth-footer">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
