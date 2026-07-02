import React, { useState, useEffect } from 'react';
import { 
  Send, 
  AlertCircle, 
  Clock, 
  Mail, 
  Activity, 
  AlertTriangle 
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import './index.css';

const StatCard = ({ title, value, icon, colorClass, delay }) => (
  <div className={`glass-panel stat-card fade-in ${delay}`}>
    <div className="stat-info">
      <div className="title">{title}</div>
      <div className="value">{value.toLocaleString()}</div>
    </div>
    <div className={`stat-icon ${colorClass}`}>
      {icon}
    </div>
  </div>
);

const DataTable = ({ title, data, valueKey, delay }) => (
  <div className={`glass-panel fade-in ${delay}`}>
    <h2>{title}</h2>
    {data && data.length > 0 ? (
      <table className="data-table">
        <thead>
          <tr>
            <th>{valueKey === 'domain' ? 'Domain' : 'Email Address'}</th>
            <th style={{ textAlign: 'right' }}>Errors / Bounces</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item, index) => (
            <tr key={index}>
              <td>{item[valueKey]}</td>
              <td style={{ textAlign: 'right' }}>
                <span className="count-badge">{item.count.toLocaleString()}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    ) : (
      <p style={{ padding: '20px 0' }}>No data available for today.</p>
    )}
  </div>
);

function App() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Automatically determine if we are running locally (development) or on the server (production)
        const apiUrl = import.meta.env.DEV ? 'http://localhost:3001/api/stats' : '/api/stats';
        
        const response = await fetch(apiUrl);
        if (!response.ok) throw new Error('Failed to fetch stats');
        const data = await response.json();
        setStats(data);
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
    // Refresh every 5 minutes
    const interval = setInterval(fetchStats, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="loading">
        <Activity className="animate-spin" style={{ marginRight: '12px' }} size={32} />
        Loading Dashboard Data...
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-container">
        <div className="glass-panel" style={{ textAlign: 'center', color: 'var(--accent-red)' }}>
          <AlertTriangle size={48} style={{ margin: '0 auto 16px' }} />
          <h2>Error Connecting to Server</h2>
          <p>{error}</p>
          <p style={{ marginTop: '16px' }}>Make sure the backend server is running on port 3001.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <header className="header">
        <div>
          <h1>ISPConfig Mail Dashboard</h1>
          <p>Real-time analytics and email log monitoring</p>
        </div>
        <div className="live-badge">
          <div className="dot"></div>
          Live Updates
        </div>
      </header>

      <div className="stats-grid">
        <StatCard 
          title="Total Sent Today" 
          value={stats.totalSent} 
          icon={<Send size={24} />} 
          colorClass="icon-green"
          delay=""
        />
        <StatCard 
          title="Total Bounces" 
          value={stats.totalBounces} 
          icon={<AlertCircle size={24} />} 
          colorClass="icon-red"
          delay="delay-1"
        />
        <StatCard 
          title="Total Deferred" 
          value={stats.totalDeferred} 
          icon={<Clock size={24} />} 
          colorClass="icon-yellow"
          delay="delay-2"
        />
        <StatCard 
          title="Gmail Bounces" 
          value={stats.gmailBounces} 
          icon={<Mail size={24} />} 
          colorClass="icon-purple"
          delay="delay-3"
        />
        <StatCard 
          title="Outlook Bounces" 
          value={stats.outlookBounces} 
          icon={<Mail size={24} />} 
          colorClass="icon-blue"
          delay="delay-3"
        />
      </div>

      {stats.historicalData && stats.historicalData.length > 0 && (
        <div className="glass-panel fade-in delay-2" style={{ marginBottom: '32px' }}>
          <h2>30-Day Activity Overview</h2>
          <div style={{ width: '100%', height: 300, marginTop: '20px' }}>
            <ResponsiveContainer>
              <AreaChart data={stats.historicalData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSent" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--accent-green)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="var(--accent-green)" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorBounces" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--accent-red)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="var(--accent-red)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} />
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--panel-bg)', border: '1px solid var(--panel-border)', borderRadius: '8px' }}
                  itemStyle={{ color: 'var(--text-primary)' }}
                />
                <Area type="monotone" dataKey="sent" stroke="var(--accent-green)" fillOpacity={1} fill="url(#colorSent)" name="Sent" />
                <Area type="monotone" dataKey="bounces" stroke="var(--accent-red)" fillOpacity={1} fill="url(#colorBounces)" name="Bounces" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div className="tables-grid">
        <DataTable 
          title="Top Domains Causing Errors" 
          data={stats.topRecipientDomainsError} 
          valueKey="domain"
          delay="delay-1"
        />
        <DataTable 
          title="Top Email Addresses Causing Errors" 
          data={stats.topRecipientEmailsError} 
          valueKey="email"
          delay="delay-2"
        />
        <DataTable 
          title="Top Sender Domains (Gmail Bounces)" 
          data={stats.topBouncedDomainsGmail} 
          valueKey="domain"
          delay="delay-3"
        />
        <DataTable 
          title="Top Sender Domains (Outlook Bounces)" 
          data={stats.topBouncedDomainsOutlook} 
          valueKey="domain"
          delay="delay-3"
        />
      </div>
    </div>
  );
}

export default App;
