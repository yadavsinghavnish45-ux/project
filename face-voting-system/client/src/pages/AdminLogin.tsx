import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminApi } from '../services/api';

export default function AdminLogin() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username || !password) {
      setError('Please enter both username and password');
      return;
    }

    setSubmitting(true);
    try {
      await adminApi.login(username, password);
      navigate('/admin');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page">
      <div className="page-container card">
        <h1 className="page-title">Admin Login</h1>
        <p className="page-subtitle">Manage parties and view results</p>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Admin username"
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
              placeholder="Admin password"
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
          <a href="/login">Voter Login</a>
        </p>
      </div>
    </div>
  );
}