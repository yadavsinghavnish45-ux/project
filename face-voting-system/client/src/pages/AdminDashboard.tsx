import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminApi } from '../services/api';
import type { PartyWithVotes } from '@shared/index';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [parties, setParties] = useState<PartyWithVotes[]>([]);
  const [results, setResults] = useState<Array<{ id: string; name: string; logoPath: string | null; votes: number; percentage: string }>>([]);
  const [totalVotes, setTotalVotes] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingParty, setEditingParty] = useState<PartyWithVotes | null>(null);
  const [formData, setFormData] = useState({ name: '', logoPath: '' });
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [partiesRes, resultsRes] = await Promise.all([
        adminApi.getParties(),
        adminApi.getResults(),
      ]);
      setParties(partiesRes.data.parties);
      setResults(resultsRes.data.results);
      setTotalVotes(resultsRes.data.totalVotes);
    } catch (err: any) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        navigate('/admin/login');
      } else {
        setError(err.response?.data?.message || 'Failed to load data');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAddParty = () => {
    setEditingParty(null);
    setFormData({ name: '', logoPath: '' });
    setFormError('');
    setShowAddModal(true);
  };

  const handleEditParty = (party: PartyWithVotes) => {
    setEditingParty(party);
    setFormData({ name: party.name, logoPath: party.logoPath || '' });
    setFormError('');
    setShowAddModal(true);
  };

  const handleSubmitParty = async () => {
    setFormError('');
    if (!formData.name.trim()) {
      setFormError('Party name is required');
      return;
    }

    setSubmitting(true);
    try {
      if (editingParty) {
        await adminApi.updateParty(editingParty.id, formData);
      } else {
        await adminApi.createParty(formData);
      }
      setShowAddModal(false);
      loadData();
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Failed to save party');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteParty = async (party: PartyWithVotes) => {
    if (!window.confirm(`Are you sure you want to ${party.voteCount > 0 ? 'deactivate' : 'delete'} "${party.name}"?`)) {
      return;
    }

    try {
      await adminApi.deleteParty(party.id);
      loadData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete party');
    }
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    setEditingParty(null);
    setFormError('');
  };

  const handleLogout = async () => {
    try {
      await adminApi.login('', '');
    } catch {}
    navigate('/admin/login');
  };

  if (loading) {
    return (
      <div className="admin-page">
        <div className="loading"><div className="spinner" /></div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <header className="admin-header">
        <h1 className="voting-title">Admin Dashboard</h1>
        <div className="user-info">
          <button className="btn btn-secondary" onClick={handleLogout}>Logout</button>
        </div>
      </header>

      <main className="admin-main">
        {error && <div className="alert alert-error">{error}</div>}

        <div className="results-summary">
          <div className="result-card">
            <div className="result-value">{totalVotes}</div>
            <div className="result-label">Total Votes</div>
          </div>
          <div className="result-card">
            <div className="result-value">{parties.length}</div>
            <div className="result-label">Active Parties</div>
          </div>
        </div>

        <div className="admin-section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 className="admin-section-title">Parties</h2>
            <button className="btn btn-primary" onClick={handleAddParty}>Add Party</button>
          </div>

          {parties.length === 0 ? (
            <div className="empty-state">
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📋</div>
              <h3>No parties yet</h3>
              <p>Click "Add Party" to create the first party.</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="party-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Logo</th>
                    <th>Status</th>
                    <th>Votes</th>
                    <th>Percentage</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {parties.map(party => (
                    <tr key={party.id}>
                      <td>{party.name}</td>
                      <td>
                        {party.logoPath ? (
                          <img src={party.logoPath} alt={party.name} style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }} />
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>—</span>
                        )}
                      </td>
                      <td>
                        <span style={{
                          padding: '0.25rem 0.5rem',
                          borderRadius: '9999px',
                          fontSize: '0.75rem',
                          fontWeight: 500,
                          background: party.isActive ? '#f0fdf4' : '#fef2f2',
                          color: party.isActive ? 'var(--success)' : 'var(--danger)',
                        }}>
                          {party.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>{party.voteCount}</td>
                      <td>
                        {totalVotes > 0 ? ((party.voteCount / totalVotes) * 100).toFixed(1) : '0.0'}%
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button className="btn btn-icon btn-secondary" onClick={() => handleEditParty(party)} title="Edit">✏️</button>
                          <button className="btn btn-icon btn-danger" onClick={() => handleDeleteParty(party)} title={party.voteCount > 0 ? 'Deactivate' : 'Delete'}>🗑️</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="admin-section">
          <h2 className="admin-section-title">Results</h2>
          {results.length === 0 ? (
            <div className="empty-state">
              <p>No votes cast yet.</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="party-table">
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Party</th>
                    <th>Votes</th>
                    <th>Percentage</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((result, index) => (
                    <tr key={result.id}>
                      <td style={{ fontWeight: 600 }}>{index + 1}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          {result.logoPath ? (
                            <img src={result.logoPath} alt={result.name} style={{ width: '24px', height: '24px', borderRadius: '50%', objectFit: 'cover' }} />
                          ) : (
                            <span style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, color: 'var(--primary)' }}>
                              {result.name.charAt(0)}
                            </span>
                          )}
                          {result.name}
                        </div>
                      </td>
                      <td>{result.votes}</td>
                      <td>{result.percentage}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {showAddModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <h2 className="modal-title">{editingParty ? 'Edit Party' : 'Add Party'}</h2>
              <button className="modal-close" onClick={handleCloseModal}>×</button>
            </div>
            <div className="modal-body">
              {formError && <div className="alert alert-error">{formError}</div>}
              <div className="form-group">
                <label htmlFor="name">Party Name</label>
                <input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter party name"
                  required
                  disabled={submitting}
                  autoFocus
                />
              </div>
              <div className="form-group">
                <label htmlFor="logoPath">Logo URL (optional)</label>
                <input
                  id="logoPath"
                  type="url"
                  value={formData.logoPath}
                  onChange={(e) => setFormData(prev => ({ ...prev, logoPath: e.target.value }))}
                  placeholder="https://example.com/logo.png"
                  disabled={submitting}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={handleCloseModal} disabled={submitting}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSubmitParty} disabled={submitting}>
                {submitting ? 'Saving...' : editingParty ? 'Update' : 'Add'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}