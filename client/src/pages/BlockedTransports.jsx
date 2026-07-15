import React, { useState, useEffect } from 'react';
import { ShieldAlert, Trash2, Plus, Server, Check } from 'lucide-react';

const BlockedTransports = () => {
  const [blocked, setBlocked] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [newTarget, setNewTarget] = useState('');
  const [newType, setNewType] = useState('email'); // 'email' or 'domain'
  const [actionLoading, setActionLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const fetchBlocklist = async () => {
    try {
      const apiUrl = import.meta.env.DEV 
        ? 'http://localhost:3001/api/blocked-transports' 
        : '/api/blocked-transports';
        
      const res = await fetch(apiUrl);
      if (!res.ok) throw new Error('Failed to fetch blocklist');
      const data = await res.json();
      setBlocked(data.blocked || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlocklist();
  }, []);

  const handleAddBlock = async (e) => {
    e.preventDefault();
    if (!newTarget.trim()) return;
    
    setActionLoading(true);
    setError(null);
    setSuccessMsg('');

    try {
      const apiUrl = import.meta.env.DEV 
        ? 'http://localhost:3001/api/blocked-transports' 
        : '/api/blocked-transports';

      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target: newTarget.trim(), type: newType })
      });

      if (!res.ok) throw new Error('Failed to add entry to blocklist');
      
      setSuccessMsg(`Successfully blocked: ${newTarget}`);
      setNewTarget('');
      await fetchBlocklist();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteBlock = async (target) => {
    if (!window.confirm(`Are you sure you want to unblock: ${target}?`)) return;
    
    setActionLoading(true);
    setError(null);
    setSuccessMsg('');

    try {
      const apiUrl = import.meta.env.DEV 
        ? 'http://localhost:3001/api/blocked-transports' 
        : '/api/blocked-transports';

      const res = await fetch(apiUrl, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target })
      });

      if (!res.ok) throw new Error('Failed to remove entry from blocklist');
      
      setSuccessMsg(`Successfully unblocked: ${target}`);
      await fetchBlocklist();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="fade-in">
      <div className="glass-panel" style={{ marginBottom: '24px' }}>
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <ShieldAlert size={28} className="icon-red" />
          Postfix Blocklist Manager
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.7)', marginTop: '8px', marginBottom: '20px' }}>
          Add domains or specific email addresses to `/etc/postfix/blocked_transports`. 
          Postfix will hard reject mail to blocked targets instantly, protecting your IP reputation.
        </p>

        {successMsg && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: '6px', color: '#10b981', marginBottom: '16px' }}>
            <Check size={18} />
            <span>{successMsg}</span>
          </div>
        )}

        {error && (
          <div style={{ padding: '12px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '6px', color: '#ef4444', marginBottom: '16px' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleAddBlock} style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '250px' }}>
            <input 
              type="text" 
              value={newTarget}
              onChange={(e) => setNewTarget(e.target.value)}
              placeholder="e.g. invalid-domain.com or user@gmail.com" 
              style={{ width: '100%', padding: '12px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: '#fff', outline: 'none' }}
              required
            />
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <select 
              value={newType} 
              onChange={(e) => setNewType(e.target.value)}
              style={{ padding: '12px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: '#fff', outline: 'none', cursor: 'pointer' }}
            >
              <option value="email">Email Address</option>
              <option value="domain">Entire Domain</option>
            </select>
            <button 
              type="submit" 
              disabled={actionLoading} 
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0 24px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
            >
              <Plus size={18} />
              Block Target
            </button>
          </div>
        </form>
      </div>

      <div className="glass-panel">
        <h3 style={{ marginBottom: '16px' }}>Active Blocks ({blocked.length})</h3>
        
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'rgba(255,255,255,0.5)' }}>
            Loading active block entries...
          </div>
        ) : blocked.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'rgba(255,255,255,0.5)' }}>
            No active blocks found in the configuration.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: '40%' }}>Blocked Email / Domain</th>
                  <th style={{ width: '50%' }}>Bounce Error Code & Status</th>
                  <th style={{ width: '10%', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {blocked.map((item, idx) => (
                  <tr key={idx}>
                    <td style={{ color: '#ef4444', fontWeight: '600', fontFamily: 'monospace' }}>{item.target}</td>
                    <td style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9em' }}>{item.error}</td>
                    <td style={{ textAlign: 'right' }}>
                      <button 
                        onClick={() => handleDeleteBlock(item.target)}
                        disabled={actionLoading}
                        style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '8px', borderRadius: '4px', transition: 'all 0.2s' }}
                        onMouseOver={(e) => e.currentTarget.style.color = '#ef4444'}
                        onMouseOut={(e) => e.currentTarget.style.color = '#94a3b8'}
                        title="Unblock Target"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default BlockedTransports;
