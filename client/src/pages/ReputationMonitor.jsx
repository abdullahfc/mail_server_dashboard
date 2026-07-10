import React, { useState, useEffect } from 'react';
import { Activity, Shield, ShieldAlert, ShieldCheck, Server, XCircle, CheckCircle } from 'lucide-react';

const ReputationMonitor = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchReputation = async () => {
      try {
        const apiUrl = import.meta.env.DEV 
          ? `http://localhost:3001/api/reputation` 
          : `/api/reputation`;
          
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

    fetchReputation();
  }, []);

  if (loading) {
    return (
      <div className="glass-panel" style={{ textAlign: 'center', padding: '60px' }}>
        <Activity className="animate-spin" style={{ margin: '0 auto 16px', color: '#10b981' }} size={48} />
        <h2 style={{ marginBottom: '8px' }}>Scanning Global Blacklists</h2>
        <p style={{ color: 'rgba(255,255,255,0.6)' }}>Checking Spamhaus, Barracuda, and others for your server IP...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-panel" style={{ color: '#ef4444' }}>
        <h2>Reputation Scan Failed</h2>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="fade-in">
      <div className="glass-panel" style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '24px' }}>
        <div style={{ padding: '24px', background: data?.listed ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)', borderRadius: '50%' }}>
          {data?.listed ? (
            <ShieldAlert size={64} className="icon-red" />
          ) : (
            <ShieldCheck size={64} className="icon-green" />
          )}
        </div>
        <div>
          <h2 style={{ fontSize: '2em', margin: '0 0 8px 0', color: data?.listed ? '#ef4444' : '#10b981' }}>
            {data?.listed ? 'Poor Reputation (Blacklisted)' : 'Excellent Reputation (Clean)'}
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.7)', margin: 0, fontSize: '1.1em', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Server size={18} /> Server IP: <strong>{data?.ip}</strong>
          </p>
        </div>
      </div>

      <div className="glass-panel">
        <h3 style={{ marginBottom: '20px' }}>DNSBL (DNS Blackhole List) Status</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
          {data?.blacklists?.map((bl, idx) => (
            <div key={idx} style={{ 
              padding: '20px', 
              borderRadius: '8px', 
              background: 'rgba(0,0,0,0.2)',
              border: `1px solid ${bl.listed ? '#ef4444' : 'rgba(16, 185, 129, 0.3)'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div>
                <strong style={{ fontSize: '1.2em', display: 'block', marginBottom: '4px' }}>{bl.name}</strong>
                <span style={{ fontSize: '0.9em', color: 'rgba(255,255,255,0.5)' }}>
                  {bl.listed ? 'Currently Listed' : 'Not Listed'}
                </span>
                {bl.error && <div style={{ fontSize: '0.8em', color: '#ef4444', marginTop: '4px' }}>Error: {bl.error}</div>}
              </div>
              <div>
                {bl.listed ? <XCircle size={32} className="icon-red" /> : <CheckCircle size={32} className="icon-green" />}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ReputationMonitor;
