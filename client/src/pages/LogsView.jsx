import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Activity, AlertTriangle } from 'lucide-react';

const SmtpBadge = ({ reason }) => {
  if (!reason) return <span style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 8px', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: '600', backgroundColor: 'rgba(255, 255, 255, 0.05)', color: 'rgba(255, 255, 255, 0.6)', marginRight: '8px', fontFamily: 'monospace', flexShrink: 0 }}>N/A</span>;
  
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
      marginRight: '8px',
      fontFamily: 'monospace',
      flexShrink: 0
    }}>
      {code}
    </span>
  );
};

const LogsView = () => {
  const { type } = useParams();
  const navigate = useNavigate();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [range, setRange] = useState('today');

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500);
    return () => clearTimeout(handler);
  }, [search]);

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      try {
        const apiUrl = import.meta.env.DEV 
          ? `http://localhost:3001/api/logs?type=${type}&search=${debouncedSearch}&range=${range}` 
          : `/api/logs?type=${type}&search=${debouncedSearch}&range=${range}`;
        
        const response = await fetch(apiUrl);
        if (!response.ok) throw new Error('Failed to fetch logs');
        const data = await response.json();
        setLogs(data.logs || []);
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, [type, debouncedSearch, range]);

  const getTitle = () => {
    const titles = {
      sent: 'Successfully Sent Emails',
      errors: 'Total Bounced & Deferred Emails',
      gmail: 'Gmail Bounced Emails',
      yahoo: 'Yahoo Bounced Emails',
      outlook: 'Outlook/Hotmail Bounced Emails',
      other: 'Other Bounced Emails',
      invalid: 'Invalid Recipient Emails',
      spam: 'SPAM Blocked Emails',
      outgoing_spam: 'Domains Marking Our Emails as SPAM',
      incoming_spam: 'Incoming SPAM Emails Blocked',
      queue: 'Active Mail Queue',
      sender_volume: 'Daily Sending Volume by Sender Email'
    };
    return titles[type] || 'Email Logs';
  };

  return (
    <div className="dashboard-container fade-in">
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px', gap: '16px' }}>
        <button 
          onClick={() => navigate('/')} 
          style={{ 
            background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', 
            padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' 
          }}
        >
          <ArrowLeft size={18} /> Back to Dashboard
        </button>
        <h1 style={{ margin: 0 }}>{getTitle()}</h1>
      </div>

      <div className="glass-panel" style={{ marginBottom: '24px', display: 'flex', gap: '16px', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.5)' }} />
          <input 
            type="text" 
            placeholder="Search by Email Address..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ 
              width: '100%', padding: '12px 12px 12px 40px', background: 'rgba(0,0,0,0.2)', 
              border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', outline: 'none' 
            }}
          />
        </div>
        
        <select 
          value={range}
          onChange={(e) => setRange(e.target.value)}
          style={{ 
            padding: '12px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', 
            borderRadius: '8px', color: '#fff', outline: 'none' 
          }}
        >
          <option value="today">Today</option>
          <option value="3d">Last 3 Days</option>
          <option value="7d">Last 7 Days</option>
          <option value="30d">Last 30 Days</option>
          <option value="all">All Time</option>
        </select>
      </div>

      <div className="glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div className="loading" style={{ padding: '60px 0' }}>
            <Activity className="animate-spin" style={{ marginRight: '12px' }} size={32} />
            Loading Logs...
          </div>
        ) : error ? (
          <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--accent-red)' }}>
            <AlertTriangle size={48} style={{ margin: '0 auto 16px' }} />
            <h2>Error Fetching Logs</h2>
            <p>{error}</p>
          </div>
        ) : logs.length === 0 ? (
          <div style={{ padding: '60px 20px', textAlign: 'center', color: 'rgba(255,255,255,0.5)' }}>
            No logs found for this filter.
          </div>
        ) : (
          <div style={{ overflowX: 'auto', overflowY: 'auto', maxHeight: '600px' }}>
            {type === 'sender_volume' ? (
              <table className="data-table" style={{ width: '100%', minWidth: '800px' }}>
                <thead>
                  <tr>
                    <th style={{ width: '40%' }}>SENDER EMAIL ADDRESS</th>
                    <th style={{ width: '20%' }}>TOTAL SENT</th>
                    <th style={{ width: '15%' }}>BOUNCES</th>
                    <th style={{ width: '15%' }}>DEFERRED</th>
                    <th style={{ width: '10%' }}>ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log, index) => (
                    <tr key={index}>
                      <td style={{ fontWeight: 'bold', color: '#60a5fa' }}>{log.email || log.sender}</td>
                      <td style={{ fontWeight: 'bold', color: '#10b981' }}>{log.sent_count || log.count || 0}</td>
                      <td style={{ color: (log.bounced_count > 0) ? '#ef4444' : 'rgba(255,255,255,0.5)', fontWeight: (log.bounced_count > 0) ? 'bold' : 'normal' }}>
                        {log.bounced_count || 0}
                      </td>
                      <td style={{ color: (log.deferred_count > 0) ? '#f59e0b' : 'rgba(255,255,255,0.5)', fontWeight: (log.deferred_count > 0) ? 'bold' : 'normal' }}>
                        {log.deferred_count || 0}
                      </td>
                      <td>
                        <button 
                          onClick={() => navigate(`/trace?query=${encodeURIComponent(log.email || log.sender)}`)}
                          style={{ padding: '4px 12px', background: 'rgba(59, 130, 246, 0.15)', border: '1px solid rgba(59, 130, 246, 0.3)', borderRadius: '4px', color: '#93c5fd', cursor: 'pointer', fontSize: '0.8em', fontWeight: 'bold' }}
                        >
                          Trace
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <table className="data-table" style={{ width: '100%', minWidth: '800px' }}>
                <thead>
                  <tr>
                    <th style={{ width: '15%' }}>QUEUE ID</th>
                    <th style={{ width: '25%' }}>EMAIL</th>
                    <th style={{ width: '20%' }}>DATE</th>
                    <th style={{ width: '40%' }}>REASON</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log, index) => (
                    <tr key={index}>
                      <td style={{ fontFamily: 'monospace', color: '#94a3b8' }}>{log.queue_id || '-'}</td>
                      <td style={{ color: '#60a5fa', fontWeight: '500' }}>{log.email}</td>
                      <td style={{ color: 'rgba(255,255,255,0.7)' }}>{log.date}</td>
                      <td style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.8)', wordBreak: 'break-word' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <SmtpBadge reason={log.reason} />
                          <span>{log.reason}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default LogsView;
