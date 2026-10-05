import React, { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const registered = searchParams.get('registered') === 'true';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username || !password) {
      setError('Please enter both username and password');
      return;
    }

    setSubmitting(true);
    try {
      await login(username, password);
      navigate('/voting');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page">
      <div className="page-container card">
        <h1 className="page-title">Login</h1>
        <p className="page-subtitle">Enter your credentials to access voting</p>

        {registered && (
          <div className="alert alert-success">
            Registration successful! Please verify your email, then log in.
          </div>
        )}

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              required
              disabled={submitting}
              autoComplete="username"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              disabled={submitting}
              autoComplete="current-password"
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={submitting}>
            {submitting ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <p className="link-text">
          Don't have an account? <Link to="/register">Register</Link>
        </p>

        <p className="link-text" style={{ marginTop: '0.5rem' }}>
          <Link to="/admin/login" style={{ color: 'var(--text-muted)' }}>Admin Login</Link>
        </p>
      </div>
    </div>
  );
}