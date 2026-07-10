import React, { useState, useEffect } from 'react';
import { Activity, Globe, CheckCircle, XCircle } from 'lucide-react';

const DomainHealth = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchHealth = async () => {
      try {
        const apiUrl = import.meta.env.DEV 
          ? `http://localhost:3001/api/domain-health` 
          : `/api/domain-health`;
          
        const res = await fetch(apiUrl);
        if (!res.ok) throw new Error('Failed to fetch domain health');
        
        const json = await res.json();
        setData(json.health || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchHealth();
  }, []);

  if (loading) {
    return (
      <div className="glass-panel" style={{ textAlign: 'center', padding: '60px' }}>
        <Activity className="animate-spin" style={{ margin: '0 auto 16px', color: '#10b981' }} size={48} />
        <h2 style={{ marginBottom: '8px' }}>Analyzing Sender Domains</h2>
        <p style={{ color: 'rgba(255,255,255,0.6)' }}>Performing live DNS lookups for SPF, DKIM, and DMARC records...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-panel" style={{ color: '#ef4444' }}>
        <h2>Domain Authentication Scan Failed</h2>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="fade-in">
      <div className="glass-panel" style={{ marginBottom: '24px' }}>
        <h2>Domain Authentication Health</h2>
        <p style={{ color: 'rgba(255,255,255,0.7)', marginBottom: 0 }}>
          This tool automatically scans your top sending domains to verify that their SPF and DMARC DNS records are correctly published. Missing or invalid records will cause emails to go to the spam folder.
        </p>
      </div>

      <div style={{ display: 'grid', gap: '16px' }}>
        {data.length === 0 && (
          <div className="glass-panel" style={{ textAlign: 'center', color: 'rgba(255,255,255,0.5)' }}>
            <Globe size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
            <h3>No sending domains found</h3>
            <p>Once you send emails, your sender domains will automatically appear here for health scanning.</p>
          </div>
        )}

        {data.map((item, idx) => (
          <div key={idx} className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '16px' }}>
              <Globe size={28} style={{ color: '#3b82f6' }} />
              <h3 style={{ margin: 0, fontSize: '1.4em' }}>{item.domain}</h3>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              {/* SPF Box */}
              <div style={{ background: 'rgba(0,0,0,0.2)', padding: '16px', borderRadius: '8px', borderLeft: `4px solid ${item.spf.valid ? '#10b981' : '#ef4444'}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <strong style={{ fontSize: '1.2em' }}>SPF (Sender Policy Framework)</strong>
                  {item.spf.valid ? <CheckCircle size={24} className="icon-green" /> : <XCircle size={24} className="icon-red" />}
                </div>
                {item.spf.valid ? (
                  <div>
                    <span style={{ color: '#10b981', display: 'block', marginBottom: '4px' }}>Valid Record Found</span>
                    <code style={{ fontSize: '0.85em', color: 'rgba(255,255,255,0.5)', wordBreak: 'break-all' }}>{item.spf.record}</code>
                  </div>
                ) : (
                  <span style={{ color: '#ef4444' }}>No valid SPF record found. Emails may bounce.</span>
                )}
              </div>

              {/* DMARC Box */}
              <div style={{ background: 'rgba(0,0,0,0.2)', padding: '16px', borderRadius: '8px', borderLeft: `4px solid ${item.dmarc.valid ? '#10b981' : '#ef4444'}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <strong style={{ fontSize: '1.2em' }}>DMARC</strong>
                  {item.dmarc.valid ? <CheckCircle size={24} className="icon-green" /> : <XCircle size={24} className="icon-red" />}
                </div>
                {item.dmarc.valid ? (
                  <div>
                    <span style={{ color: '#10b981', display: 'block', marginBottom: '4px' }}>Valid Record Found</span>
                    <code style={{ fontSize: '0.85em', color: 'rgba(255,255,255,0.5)', wordBreak: 'break-all' }}>{item.dmarc.record}</code>
                  </div>
                ) : (
                  <span style={{ color: '#ef4444' }}>No valid DMARC record found. Vulnerable to spoofing.</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DomainHealth;
