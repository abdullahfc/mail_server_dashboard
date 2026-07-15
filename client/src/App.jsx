import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { 
  Activity, AlertTriangle, LayoutDashboard, Search, ShieldAlert, ShieldCheck, 
  Globe, Mail, ShieldX, UserX
} from 'lucide-react';
import './index.css';

import DashboardHome from './pages/DashboardHome';
import LogsView from './pages/LogsView';
import MessageTrace from './pages/MessageTrace';
import ReputationMonitor from './pages/ReputationMonitor';
import DomainHealth from './pages/DomainHealth';
import BlockedTransports from './pages/BlockedTransports';

const Sidebar = () => {
  const location = useLocation();
  const isActive = (path) => location.pathname === path;

  return (
    <aside className="sidebar">
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
        <img src="/logo.png" alt="Logo" style={{ width: '40px', height: '40px', objectFit: 'contain', filter: 'drop-shadow(0 0 10px rgba(139,92,246,0.3))' }} />
        <div>
          <h1 style={{ margin: 0, fontSize: '18px', background: 'linear-gradient(to right, #a78bfa, #818cf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontWeight: 'bold' }}>
            Fusion Cortex
          </h1>
          <p style={{ margin: 0, color: '#64748b', fontSize: '11px', fontWeight: 'bold' }}>MAIL DASHBOARD</p>
        </div>
      </div>

      <div className="sidebar-nav-title">Main Navigation</div>
      <Link to="/" className={`sidebar-link ${isActive('/') ? 'active' : ''}`}>
        <LayoutDashboard size={18} />
        <span>Dashboard</span>
      </Link>
      <Link to="/trace" className={`sidebar-link ${isActive('/trace') ? 'active' : ''}`}>
        <Search size={18} />
        <span>Message Trace</span>
      </Link>
      <Link to="/reputation" className={`sidebar-link ${isActive('/reputation') ? 'active' : ''}`}>
        <ShieldCheck size={18} />
        <span>Reputation Health</span>
      </Link>
      <Link to="/domain-health" className={`sidebar-link ${isActive('/domain-health') ? 'active' : ''}`}>
        <Globe size={18} />
        <span>Domain Auth</span>
      </Link>

      <div className="sidebar-nav-title">Logs & Filters</div>
      <Link to="/logs/other" className={`sidebar-link ${isActive('/logs/other') ? 'active' : ''}`}>
        <AlertTriangle size={18} />
        <span>Domains Causing Errors</span>
      </Link>
      <Link to="/logs/invalid" className={`sidebar-link ${isActive('/logs/invalid') ? 'active' : ''}`}>
        <UserX size={18} />
        <span>Invalid Email Addresses</span>
      </Link>
      <Link to="/logs/gmail" className={`sidebar-link ${isActive('/logs/gmail') ? 'active' : ''}`}>
        <Mail size={18} />
        <span>Gmail Bounces/Deferred</span>
      </Link>
      <Link to="/logs/yahoo" className={`sidebar-link ${isActive('/logs/yahoo') ? 'active' : ''}`}>
        <Mail size={18} />
        <span>Yahoo Bounces/Deferred</span>
      </Link>
      <Link to="/logs/outlook" className={`sidebar-link ${isActive('/logs/outlook') ? 'active' : ''}`}>
        <Mail size={18} />
        <span>Outlook Bounces/Deferred</span>
      </Link>
      <Link to="/logs/outgoing_spam" className={`sidebar-link ${isActive('/logs/outgoing_spam') ? 'active' : ''}`}>
        <ShieldAlert size={18} />
        <span>Domains Reporting SPAM</span>
      </Link>

      <div className="sidebar-nav-title">Configurations</div>
      <Link to="/blocked" className={`sidebar-link ${isActive('/blocked') ? 'active' : ''}`}>
        <ShieldX size={18} />
        <span>Blocked Targets</span>
      </Link>

      <div style={{ marginTop: 'auto', paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#10b981', fontWeight: '600' }}>
          <div style={{ width: '8px', height: '8px', backgroundColor: '#10b981', borderRadius: '50%', animation: 'pulse 2s infinite' }}></div>
          <span>Live Logs</span>
        </div>
        <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)' }}>v1.2.0</span>
      </div>
    </aside>
  );
};

function App() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState('today');

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
      <div className="sidebar-layout">
        <Sidebar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<DashboardHome stats={stats} timeRange={timeRange} setTimeRange={setTimeRange} />} />
            <Route path="/logs/:type" element={<LogsView />} />
            <Route path="/trace" element={<MessageTrace />} />
            <Route path="/reputation" element={<ReputationMonitor />} />
            <Route path="/domain-health" element={<DomainHealth />} />
            <Route path="/blocked" element={<BlockedTransports />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
