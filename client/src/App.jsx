import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Activity, AlertTriangle } from 'lucide-react';
import './index.css';

import DashboardHome from './pages/DashboardHome';
import LogsView from './pages/LogsView';
import MessageTrace from './pages/MessageTrace';
import ReputationMonitor from './pages/ReputationMonitor';
import DomainHealth from './pages/DomainHealth';

function App() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState('today'); // New state for global range

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const apiUrl = import.meta.env.DEV 
          ? `http://localhost:3001/api/stats?range=${timeRange}` 
          : `/api/stats?range=${timeRange}`;
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
  }, [timeRange]);

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
    <Router>
      <div className="dashboard-container">
        <header className="header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.05)', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <img src="/logo.png" alt="Logo" style={{ width: '48px', height: '48px', objectFit: 'contain', filter: 'drop-shadow(0 0 10px rgba(139,92,246,0.3))' }} />
            <div>
              <h1 style={{ margin: 0, fontSize: '24px', background: 'linear-gradient(to right, #a78bfa, #818cf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontWeight: 'bold' }}>
                Mail Server Dashboard
              </h1>
              <p style={{ margin: '4px 0 0', color: '#9ca3af', fontSize: '14px' }}>Enterprise Analytics & Log Monitoring</p>
            </div>
          </div>
          <div className="live-badge">
            <div className="dot"></div>
            Live Updates
          </div>
        </header>

        <nav className="main-nav" style={{ display: 'flex', gap: '8px', marginBottom: '32px' }}>
          <a href="/" className={`nav-link ${window.location.pathname === '/' ? 'active' : ''}`}>Dashboard</a>
          <a href="/trace" className={`nav-link ${window.location.pathname === '/trace' ? 'active' : ''}`}>Message Trace</a>
          <a href="/reputation" className={`nav-link ${window.location.pathname === '/reputation' ? 'active' : ''}`}>Reputation Health</a>
          <a href="/domain-health" className={`nav-link ${window.location.pathname === '/domain-health' ? 'active' : ''}`}>Domain Auth</a>
        </nav>

        <Routes>
          <Route path="/" element={<DashboardHome stats={stats} timeRange={timeRange} setTimeRange={setTimeRange} />} />
          <Route path="/logs/:type" element={<LogsView />} />
          {/* Phase 2 Routes */}
          <Route path="/trace" element={<MessageTrace />} />
          <Route path="/reputation" element={<ReputationMonitor />} />
          <Route path="/domain-health" element={<DomainHealth />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
