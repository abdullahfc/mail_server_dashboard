import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Activity, Mail, Clock, CheckCircle, XCircle } from 'lucide-react';

const SmtpBadge = ({ reason }) => {
  if (!reason) return <span style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 8px', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: '600', backgroundColor: 'rgba(255, 255, 255, 0.05)', color: 'rgba(255, 255, 255, 0.6)', marginLeft: '8px', fontFamily: 'monospace', verticalAlign: 'middle' }}>N/A</span>;
  
  // Strip bracketed IP addresses like [68.232.129.85] and standalone IPs first
  const cleanedReason = reason.replace(/\[\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\]/g, '').replace(/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g, '');
  const match = cleanedReason.match(/\b([245]\d{2})\b/);
  
  const code = match ? match[1] : 'N/A';
  let bg = 'rgba(255, 255, 255, 0.05)';
  let color = 'rgba(255, 255, 255, 0.6)';
  
  if (code.startsWith('2')) {
    bg = 'rgba(16, 185, 129, 0.15)';
    color = '#34d399';
  } else if (code.startsWith('4')) {
    bg = 'rgba(245, 158, 11, 0.15)';
    color = '#fbbf24';
  } else if (code.startsWith('5')) {
    bg = 'rgba(239, 68, 68, 0.15)';
    color = '#f87171';
  }
  
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      padding: '2px 8px',
      borderRadius: '9999px',
      fontSize: '0.75rem',
      fontWeight: '600',
      backgroundColor: bg,
      color: color,
      marginLeft: '8px',
      fontFamily: 'monospace',
      verticalAlign: 'middle'
    }}>
      {code}
    </span>
  );
};

const MessageTrace = () => {
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState('');
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searched, setSearched] = useState(false);

  const performTrace = async (searchQuery) => {
    if (!searchQuery.trim()) return;
    
    setLoading(true);
    setError(null);
    setSearched(true);
    
    try {
      const apiUrl = import.meta.env.DEV 
        ? `http://localhost:3001/api/trace?query=${encodeURIComponent(searchQuery)}` 
        : `/api/trace?query=${encodeURIComponent(searchQuery)}`;
        
      const res = await fetch(apiUrl);
      if (!res.ok) throw new Error('Trace failed');
      
      const data = await res.json();
      setLogs(data.logs || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const urlQuery = searchParams.get('query');
    if (urlQuery) {
      setQuery(urlQuery);
      performTrace(urlQuery);
    }
  }, [searchParams]);

  const handleTrace = (e) => {
    e.preventDefault();
    performTrace(query);
  };

  const getStatusIcon = (status) => {
    switch(status.toLowerCase()) {
      case 'sent': return <CheckCircle size={20} className="icon-green" />;
      case 'bounced': return <XCircle size={20} className="icon-red" />;
      case 'deferred': return <Clock size={20} className="icon-yellow" />;
      default: return <Mail size={20} className="icon-blue" />;
    }
  };

  return (
    <div className="fade-in">
      <div className="glass-panel" style={{ marginBottom: '24px' }}>
        <h2>Advanced Message Trace</h2>
        <p style={{ color: 'rgba(255,255,255,0.7)', marginBottom: '16px' }}>
          Enter a Postfix Queue ID (e.g. 454F520492) or an Email Address to trace its exact delivery journey.
        </p>
        
        <form onSubmit={handleTrace} style={{ display: 'flex', gap: '12px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.5)' }} />
            <input 
              type="text" 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by Email or Queue ID..." 
              style={{ width: '100%', padding: '12px 12px 12px 40px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: '#fff', outline: 'none' }}
            />
          </div>
          <button type="submit" disabled={loading} style={{ padding: '0 24px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
            {loading ? 'Tracing...' : 'Trace Message'}
          </button>
        </form>
      </div>

      {loading && (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '40px' }}>
          <Activity className="animate-spin" style={{ margin: '0 auto 16px', color: '#10b981' }} size={32} />
          <p>Scanning mail logs...</p>
        </div>
      )}

      {error && (
        <div className="glass-panel" style={{ color: '#ef4444' }}>
          <p>Error: {error}</p>
        </div>
      )}

      {!loading && searched && logs.length === 0 && !error && (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '40px', color: 'rgba(255,255,255,0.5)' }}>
          <Search size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
          <h3>No records found</h3>
          <p>No delivery attempts found for "{query}" in the current database.</p>
        </div>
      )}

      {!loading && logs.length > 0 && (
        <>
          <hr style={{ border: 'none', borderTop: '1px dashed rgba(255,255,255,0.1)', margin: '32px 0' }} />
          <div className="glass-panel">
            <h3>Trace Results ({logs.length} found)</h3>
          <div style={{ marginTop: '20px' }}>
            {logs.map((log, idx) => (
              <div key={idx} style={{ display: 'flex', gap: '16px', padding: '16px', borderBottom: '1px solid rgba(255,255,255,0.05)', background: idx % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent' }}>
                <div style={{ marginTop: '2px' }}>
                  {getStatusIcon(log.status)}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <strong style={{ fontSize: '1.1em' }}>{log.queue_id || 'Unknown ID'} &rarr; {log.recipient}</strong>
                    <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9em' }}>{new Date(log.date).toLocaleString()}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '16px', fontSize: '0.9em', color: 'rgba(255,255,255,0.7)', marginBottom: '8px', alignItems: 'center' }}>
                    <span><strong>Sender:</strong> {log.sender || 'System'}</span>
                    <span>
                      <strong>Status:</strong>{" "}
                      <span style={{ textTransform: 'uppercase', color: log.status === 'sent' ? '#10b981' : log.status === 'bounced' ? '#ef4444' : '#f59e0b' }}>
                        {log.status}
                      </span>
                      <SmtpBadge reason={log.reason} />
                    </span>
                  </div>
                  {log.categories && log.categories.length > 0 && (
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '10px', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.8em', color: 'rgba(255,255,255,0.4)', fontWeight: 'bold' }}>Active Tabs:</span>
                      {log.categories.map((cat, cIdx) => (
                        <span key={cIdx} style={{ 
                          fontSize: '0.75rem', 
                          padding: '2px 8px', 
                          background: 'rgba(139, 92, 246, 0.1)', 
                          border: '1px solid rgba(139, 92, 246, 0.2)', 
                          color: '#c084fc', 
                          borderRadius: '4px',
                          fontWeight: '600'
                        }}>
                          {cat}
                        </span>
                      ))}
                    </div>
                  )}
                  <div style={{ padding: '8px 12px', background: 'rgba(0,0,0,0.3)', borderRadius: '4px', fontSize: '0.85em', fontFamily: 'monospace', color: '#94a3b8' }}>
                    {log.reason}
                  </div>
                </div>
              </div>
            ))}
          </div>
          </div>
        </>
      )}
    </div>
  );
};

export default MessageTrace;
