import React, { useState, useEffect } from 'react';
import { Activity, Globe, CheckCircle, XCircle, Key, Server } from 'lucide-react';

const DomainHealth = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [customDomain, setCustomDomain] = useState('');

  const fetchHealth = async (queryDomain = '') => {
    setLoading(true);
    setError(null);
    try {
      const apiUrl = import.meta.env.DEV 
        ? `http://localhost:3001/api/domain-health${queryDomain ? `?domain=${encodeURIComponent(queryDomain)}` : ''}` 
        : `/api/domain-health${queryDomain ? `?domain=${encodeURIComponent(queryDomain)}` : ''}`;
        
      const res = await fetch(apiUrl);
      if (!res.ok) throw new Error('Failed to fetch domain health');
      
      const json = await res.json();
      
      if (queryDomain) {
        // Append to existing data or replace
        setData(json.health || []);
      } else {
        setData(json.health || []);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (customDomain.trim()) {
      fetchHealth(customDomain.trim());
    }
  };

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
        <button onClick={() => fetchHealth()} style={{ marginTop: '16px', padding: '8px 16px', background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Try Again</button>
      </div>
    );
  }

  return (
    <div className="fade-in">
      <div className="glass-panel" style={{ marginBottom: '24px' }}>
        <h2>Domain Authentication Health</h2>
        <p style={{ color: 'rgba(255,255,255,0.7)', marginBottom: '16px' }}>
          This tool automatically scans your top sending domains to verify that their SPF and DMARC DNS records are correctly published. Missing or invalid records will cause emails to go to the spam folder.
        </p>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '12px', maxWidth: '500px' }}>
          <input 
            type="text" 
            value={customDomain}
            onChange={(e) => setCustomDomain(e.target.value)}
            placeholder="Check a specific domain (e.g. your-company.com)" 
            style={{ flex: 1, padding: '10px 16px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: '#fff', outline: 'none' }}
          />
          <button type="submit" style={{ padding: '0 20px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
            Verify Domain
          </button>
        </form>
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Globe size={28} style={{ color: '#3b82f6' }} />
                <h3 style={{ margin: 0, fontSize: '1.4em' }}>{item.domain}</h3>
              </div>

              {/* NS / DNS Provider Badge */}
              {item.ns && item.ns.records && item.ns.records.length > 0 && (
                <div style={{ fontSize: '0.85em', padding: '6px 12px', background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.2)', borderRadius: '6px', color: '#93c5fd' }}>
                  <strong>DNS Provider NS:</strong> {item.ns.records.join(', ')}
                </div>
              )}
            </div>
            
            <div className="grid-2-cols" style={{ gap: '16px' }}>
              {/* SPF Box */}
              <div style={{ background: 'rgba(0,0,0,0.2)', padding: '16px', borderRadius: '8px', borderLeft: `4px solid ${item.spf?.valid ? '#10b981' : '#ef4444'}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <strong style={{ fontSize: '1.1em' }}>SPF (Sender Policy Framework)</strong>
                  {item.spf?.valid ? <CheckCircle size={22} className="icon-green" /> : <XCircle size={22} className="icon-red" />}
                </div>
                {item.spf?.valid ? (
                  <div>
                    <span style={{ color: '#10b981', display: 'block', marginBottom: '4px', fontSize: '0.9em', fontWeight: 'bold' }}>Valid Record Found</span>
                    <code style={{ fontSize: '0.85em', color: 'rgba(255,255,255,0.6)', wordBreak: 'break-all' }}>{item.spf.record}</code>
                  </div>
                ) : (
                  <span style={{ color: '#ef4444', fontSize: '0.9em' }}>No valid SPF record found. Emails may bounce.</span>
                )}
              </div>

              {/* DKIM Box */}
              <div style={{ background: 'rgba(0,0,0,0.2)', padding: '16px', borderRadius: '8px', borderLeft: `4px solid ${item.dkim?.valid ? '#10b981' : '#f59e0b'}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <strong style={{ fontSize: '1.1em', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Key size={18} /> DKIM Signature
                  </strong>
                  {item.dkim?.valid ? <CheckCircle size={22} className="icon-green" /> : <XCircle size={22} className="icon-yellow" />}
                </div>
                {item.dkim?.valid ? (
                  <div>
                    <span style={{ color: '#10b981', display: 'block', marginBottom: '4px', fontSize: '0.9em', fontWeight: 'bold' }}>
                      Valid Key Found ({item.dkim.selector}._domainkey)
                    </span>
                    <code style={{ fontSize: '0.85em', color: 'rgba(255,255,255,0.6)', wordBreak: 'break-all' }}>{item.dkim.record}</code>
                  </div>
                ) : (
                  <span style={{ color: '#f59e0b', fontSize: '0.9em' }}>No default DKIM selector found on common keys.</span>
                )}
              </div>

              {/* DMARC Box */}
              <div style={{ background: 'rgba(0,0,0,0.2)', padding: '16px', borderRadius: '8px', borderLeft: `4px solid ${item.dmarc?.valid ? '#10b981' : '#ef4444'}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <strong style={{ fontSize: '1.1em' }}>DMARC Policy</strong>
                  {item.dmarc?.valid ? <CheckCircle size={22} className="icon-green" /> : <XCircle size={22} className="icon-red" />}
                </div>
                {item.dmarc?.valid ? (
                  <div>
                    <span style={{ color: '#10b981', display: 'block', marginBottom: '4px', fontSize: '0.9em', fontWeight: 'bold' }}>Valid Policy Found</span>
                    <code style={{ fontSize: '0.85em', color: 'rgba(255,255,255,0.6)', wordBreak: 'break-all' }}>{item.dmarc.record}</code>
                  </div>
                ) : (
                  <span style={{ color: '#ef4444', fontSize: '0.9em' }}>No valid DMARC record found. Vulnerable to spoofing.</span>
                )}
              </div>

              {/* MX Records Box */}
              <div style={{ background: 'rgba(0,0,0,0.2)', padding: '16px', borderRadius: '8px', borderLeft: `4px solid ${item.mx?.valid ? '#10b981' : '#ef4444'}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <strong style={{ fontSize: '1.1em', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Server size={18} /> MX Mail Exchangers
                  </strong>
                  {item.mx?.valid ? <CheckCircle size={22} className="icon-green" /> : <XCircle size={22} className="icon-red" />}
                </div>
                {item.mx?.valid && item.mx.records.length > 0 ? (
                  <div>
                    <span style={{ color: '#10b981', display: 'block', marginBottom: '4px', fontSize: '0.9em', fontWeight: 'bold' }}>
                      {item.mx.records.length} MX Server(s) Configured
                    </span>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      {item.mx.records.map((mxRec, mIdx) => (
                        <code key={mIdx} style={{ fontSize: '0.85em', color: 'rgba(255,255,255,0.6)' }}>
                          {mxRec}
                        </code>
                      ))}
                    </div>
                  </div>
                ) : (
                  <span style={{ color: '#ef4444', fontSize: '0.9em' }}>No MX records configured. Cannot receive emails.</span>
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
