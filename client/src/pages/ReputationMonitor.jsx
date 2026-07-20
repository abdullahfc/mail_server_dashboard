import React, { useState, useEffect } from 'react';
import { Activity, ShieldAlert, ShieldCheck, Server, XCircle, CheckCircle, Search, Cpu } from 'lucide-react';

const ReputationMonitor = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [customIp, setCustomIp] = useState('');
  const [showCloudmarkLogs, setShowCloudmarkLogs] = useState(false);

  const fetchReputation = async (targetIp = '') => {
    setLoading(true);
    setError(null);
    try {
      const apiUrl = import.meta.env.DEV 
        ? `http://localhost:3001/api/reputation${targetIp ? `?ip=${encodeURIComponent(targetIp)}` : ''}` 
        : `/api/reputation${targetIp ? `?ip=${encodeURIComponent(targetIp)}` : ''}`;
        
      const res = await fetch(apiUrl);
      if (!res.ok) throw new Error('Failed to fetch reputation data');
      
      const json = await res.json();
      setData(json);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReputation();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (customIp.trim()) {
      fetchReputation(customIp.trim());
    } else {
      fetchReputation();
    }
  };

  const listedCount = data?.blacklists?.filter(bl => bl.listed).length || 0;
  const totalCount = data?.blacklists?.length || 0;

  return (
    <div className="fade-in">
      {/* Top Controls & IP Lookup Search Bar */}
      <div className="glass-panel" style={{ marginBottom: '24px' }}>
        <h2 style={{ marginBottom: '8px' }}>IP Reputation & Blacklist Scanner</h2>
        <p style={{ color: 'rgba(255,255,255,0.7)', marginBottom: '16px' }}>
          Real-time IP reputation monitor scanning 24+ major global DNSBL networks and Cloudmark CSI status.
        </p>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '12px', maxWidth: '550px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)' }} />
            <input 
              type="text" 
              value={customIp}
              onChange={(e) => setCustomIp(e.target.value)}
              placeholder="Enter IP to scan (e.g. 69.197.168.189) or leave empty for server IP" 
              style={{ width: '100%', padding: '10px 14px 10px 42px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: '#fff', outline: 'none' }}
            />
          </div>
          <button type="submit" style={{ padding: '0 24px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
            Scan IP
          </button>
        </form>
      </div>

      {loading && (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '60px' }}>
          <Activity className="animate-spin" style={{ margin: '0 auto 16px', color: '#3b82f6' }} size={48} />
          <h2 style={{ marginBottom: '8px' }}>Scanning 24+ Global Blacklists</h2>
          <p style={{ color: 'rgba(255,255,255,0.6)' }}>Checking Spamhaus, Barracuda, Abusix, Sorbs, UCEPROTECT, and Cloudmark CSI for {customIp || 'Server IP'}...</p>
        </div>
      )}

      {error && (
        <div className="glass-panel" style={{ color: '#ef4444' }}>
          <h2>Reputation Scan Failed</h2>
          <p>{error}</p>
        </div>
      )}

      {!loading && !error && data && (
        <>
          {/* Main Health Status Banner */}
          <div className="glass-panel" style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
              <div style={{ padding: '20px', background: listedCount > 0 ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)', borderRadius: '50%' }}>
                {listedCount > 0 ? (
                  <ShieldAlert size={56} className="icon-red" />
                ) : (
                  <ShieldCheck size={56} className="icon-green" />
                )}
              </div>
              <div>
                <h2 style={{ fontSize: '1.8em', margin: '0 0 6px 0', color: listedCount > 0 ? '#ef4444' : '#10b981' }}>
                  {listedCount > 0 ? `Listed on ${listedCount} Blacklist(s)` : 'Clean Reputation (0 Blacklists)'}
                </h2>
                <p style={{ color: 'rgba(255,255,255,0.7)', margin: 0, fontSize: '1.05em', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Server size={18} /> Scanned IP Address: <strong style={{ color: '#3b82f6' }}>{data.ip}</strong>
                </p>
              </div>
            </div>

            <div style={{ padding: '12px 20px', background: 'rgba(0,0,0,0.3)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
              <div style={{ fontSize: '0.85em', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', fontWeight: 'bold' }}>Scan Result</div>
              <div style={{ fontSize: '1.4em', fontWeight: 'bold', color: listedCount === 0 ? '#10b981' : '#ef4444' }}>
                {totalCount - listedCount} / {totalCount} Clean
              </div>
            </div>
          </div>

          {/* Cloudmark CSI & Specialty Reputation Row */}
          <div className="glass-panel" style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
              <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Cpu size={22} style={{ color: '#a78bfa' }} /> Cloudmark CSI (Cloudmark Sender Intelligence) Status
              </h3>
              <a 
                href="https://csi.cloudmark.com/en/reset/" 
                target="_blank" 
                rel="noopener noreferrer"
                style={{ fontSize: '0.85em', padding: '6px 14px', background: 'rgba(167, 139, 250, 0.15)', border: '1px solid rgba(167, 139, 250, 0.3)', borderRadius: '6px', color: '#c084fc', textDecoration: 'none', fontWeight: 'bold' }}
              >
                Submit Delisting Request (CSI Portal) &rarr;
              </a>
            </div>

            <div style={{ 
              padding: '16px 20px', 
              borderRadius: '8px', 
              background: data.cloudmark?.listed ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.08)', 
              border: `1px solid ${data.cloudmark?.listed ? '#ef4444' : 'rgba(16,185,129,0.3)'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px'
            }}>
              <div>
                <strong style={{ fontSize: '1.15em', display: 'block', color: data.cloudmark?.listed ? '#ef4444' : '#10b981' }}>
                  {data.cloudmark?.listed ? 'Cloudmark CSI Rejections Detected' : 'Clean (No Cloudmark CSI Blocks Detected)'}
                </strong>
                <span style={{ fontSize: '0.9em', color: 'rgba(255,255,255,0.6)' }}>
                  {data.cloudmark?.listed 
                    ? `Found ${data.cloudmark.count} mail bounce log(s) explicitly matching Cloudmark CSI reputation blocks.` 
                    : 'Your mail server logs show 0 rejections or bounces originating from Cloudmark CSI reputation filters.'}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                {data.cloudmark?.listed && data.cloudmark?.logs?.length > 0 && (
                  <button 
                    onClick={() => setShowCloudmarkLogs(!showCloudmarkLogs)}
                    style={{ padding: '8px 16px', background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85em', fontWeight: 'bold' }}
                  >
                    {showCloudmarkLogs ? 'Hide Cloudmark Logs' : `View Cloudmark Logs (${data.cloudmark.logs.length})`}
                  </button>
                )}
                {data.cloudmark?.listed ? <XCircle size={32} className="icon-red" /> : <CheckCircle size={32} className="icon-green" />}
              </div>
            </div>

            {/* Expandable Cloudmark Logs Table */}
            {showCloudmarkLogs && data.cloudmark?.logs?.length > 0 && (
              <div style={{ marginTop: '16px', background: 'rgba(0,0,0,0.3)', borderRadius: '8px', padding: '16px', border: '1px solid rgba(255,255,255,0.08)' }}>
                <h4 style={{ margin: '0 0 12px 0', fontSize: '1em', color: '#a78bfa' }}>Recent Cloudmark Rejection Logs (Top 50)</h4>
                <div style={{ maxHeight: '350px', overflowY: 'auto' }}>
                  {data.cloudmark.logs.map((log, lIdx) => (
                    <div key={lIdx} style={{ padding: '10px 12px', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '0.85em' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ color: '#fff', fontWeight: 'bold' }}>Queue ID: {log.queue_id || 'N/A'} | Sender: {log.sender} &rarr; Recipient: {log.recipient}</span>
                        <span style={{ color: 'rgba(255,255,255,0.4)' }}>{log.date}</span>
                      </div>
                      <code style={{ display: 'block', color: '#ef4444', background: 'rgba(0,0,0,0.4)', padding: '6px 10px', borderRadius: '4px', wordBreak: 'break-all', fontSize: '0.82em', fontFamily: 'monospace' }}>
                        {log.reason}
                      </code>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* DNSBL Blacklists Grid */}
          <div className="glass-panel">
            <h3 style={{ marginBottom: '20px' }}>Global DNSBL Blacklists ({totalCount} Networks Scanned)</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '14px' }}>
              {data.blacklists?.map((bl, idx) => (
                <div key={idx} style={{ 
                  padding: '16px', 
                  borderRadius: '8px', 
                  background: 'rgba(0,0,0,0.2)',
                  border: `1px solid ${bl.listed ? '#ef4444' : 'rgba(255,255,255,0.08)'}`,
                  borderLeft: `4px solid ${bl.listed ? '#ef4444' : '#10b981'}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <div style={{ flex: 1, paddingRight: '10px' }}>
                    <strong style={{ fontSize: '1em', display: 'block', marginBottom: '2px', color: '#f8fafc' }}>{bl.name}</strong>
                    <span style={{ fontSize: '0.85em', color: bl.listed ? '#ef4444' : '#10b981', fontWeight: 'bold' }}>
                      {bl.listed ? 'Listed / Blacklisted' : 'OK / Not Listed'}
                    </span>
                    {bl.error && <div style={{ fontSize: '0.75em', color: '#f59e0b', marginTop: '2px' }}>{bl.error}</div>}
                  </div>
                  <div>
                    {bl.listed ? <XCircle size={26} className="icon-red" /> : <CheckCircle size={26} className="icon-green" />}
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

export default ReputationMonitor;
