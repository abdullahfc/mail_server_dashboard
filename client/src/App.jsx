import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Activity, AlertTriangle } from 'lucide-react';
import './index.css';

import DashboardHome from './pages/DashboardHome';
import LogsView from './pages/LogsView';

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
        <header className="header">
          <div>
            <h1>ISPConfig Mail Dashboard PRO</h1>
            <p>Real-time analytics and email log monitoring</p>
          </div>
          <div className="live-badge">
            <div className="dot"></div>
            Live Updates
          </div>
        </header>

        <Routes>
          <Route path="/" element={<DashboardHome stats={stats} timeRange={timeRange} setTimeRange={setTimeRange} />} />
          <Route path="/logs/:type" element={<LogsView />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
