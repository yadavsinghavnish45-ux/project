import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { authApi } from '../services/api';

export default function VerifyEmail() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Invalid verification link');
      return;
    }

    const verify = async () => {
      try {
        const response = await authApi.verifyEmail(token);
        setStatus('success');
        setMessage(response.data.message);
      } catch (err: any) {
        setStatus('error');
        setMessage(err.response?.data?.message || 'Verification failed');
      }
    };

    verify();
  }, [token]);

  return (
    <div className="page">
      <div className="page-container card" style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>
          {status === 'loading' && '⏳'}
          {status === 'success' && '✅'}
          {status === 'error' && '❌'}
        </div>
        <h1 className="page-title">
          {status === 'loading' && 'Verifying...'}
          {status === 'success' && 'Email Verified'}
          {status === 'error' && 'Verification Failed'}
        </h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>{message}</p>

        {status === 'success' && (
          <Link to="/login" className="btn btn-primary" style={{ display: 'inline-block' }}>
            Go to Login
          </Link>
        )}

        {status === 'error' && (
          <Link to="/register" className="btn btn-primary" style={{ display: 'inline-block' }}>
            Register Again
          </Link>
        )}
      </div>
    </div>
  );
}