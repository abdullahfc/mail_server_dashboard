import React, { useState } from 'react';
import { 
  Send, AlertCircle, Clock, Mail, CheckCircle, ShieldAlert, XCircle, UserMinus 
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import StatCard from '../components/StatCard';
import DataTable from '../components/DataTable';

const DashboardHome = ({ stats, timeRange, setTimeRange }) => {
  const [activeGraphMetric, setActiveGraphMetric] = useState('sent');
  const [graphTimeRange, setGraphTimeRange] = useState('30d');

  const calcPercentage = (value) => {
    if (!stats.totalSent || stats.totalSent === 0) return 0;
    return ((value / stats.totalSent) * 100).toFixed(1);
  };

  const handleGraphClick = (metric) => {
    setActiveGraphMetric(metric);
  };

  // Maps metric to label for the graph
  const getGraphLabel = (metric) => {
    const labels = {
      sent: 'Total Sent',
      bounces: 'Total Bounces',
      deferred: 'Total Deferred',
      gmail: 'Gmail Bounces',
      yahoo: 'Yahoo Bounces',
      outlook: 'Outlook Bounces',
      invalid: 'Total Invalid',
      spam: 'Spam Reports'
    };
    return labels[metric] || 'Total Sent';
  };

  const getFilteredHistoricalData = () => {
    if (!stats || !stats.historicalData || stats.historicalData.length === 0) return [];
    
    let days = 30;
    if (graphTimeRange === '24h') days = 1; // Show last 1 data point (or more if intra-day, but our backend groups by day)
    else if (graphTimeRange === '7d') days = 7;
    else if (graphTimeRange === '30d') days = 30;
    else if (graphTimeRange === 'all') days = 365;

    // Filter to last 'days' items
    return stats.historicalData.slice(-days);
  };

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
        <select 
          value={timeRange} 
          onChange={(e) => setTimeRange(e.target.value)}
          style={{ 
            padding: '10px 16px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', 
            borderRadius: '8px', color: '#fff', outline: 'none', cursor: 'pointer' 
          }}
        >
          <option value="1h">Last 1 Hour</option>
          <option value="24h">Last 24 Hours</option>
          <option value="today">Today</option>
          <option value="7d">Last 7 Days</option>
          <option value="30d">Last 30 Days</option>
          <option value="all">All Time (Years)</option>
        </select>
      </div>

      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
        <StatCard 
          title="Total Sent Today" 
          value={stats.totalSent} 
          icon={<Send size={24} />} 
          colorClass="icon-green"
          type="sent"
          onGraphClick={handleGraphClick}
          delay=""
        />
        <StatCard 
          title="Total Delivered" 
          value={stats.totalDelivered} 
          percentage={calcPercentage(stats.totalDelivered)}
          icon={<CheckCircle size={24} />} 
          colorClass="icon-green"
          type="sent"
          delay=""
        />
        <StatCard 
          title="Total Bounces" 
          value={stats.totalBounces} 
          percentage={calcPercentage(stats.totalBounces)}
          icon={<AlertCircle size={24} />} 
          colorClass="icon-red"
          type="bounces"
          onGraphClick={handleGraphClick}
          delay="delay-1"
        />
        <StatCard 
          title="Total Deferred" 
          value={stats.totalDeferred} 
          percentage={calcPercentage(stats.totalDeferred)}
          icon={<Clock size={24} />} 
          colorClass="icon-yellow"
          type="deferred"
          onGraphClick={handleGraphClick}
          delay="delay-2"
        />
      </div>

      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', marginTop: '24px' }}>
        <StatCard 
          title="Gmail Bounces" 
          value={stats.gmailBounces} 
          percentage={calcPercentage(stats.gmailBounces)}
          icon={<Mail size={24} />} 
          colorClass="icon-purple"
          type="gmail"
          onGraphClick={handleGraphClick}
          delay="delay-3"
        />
        <StatCard 
          title="Yahoo Bounces" 
          value={stats.yahooBounces} 
          percentage={calcPercentage(stats.yahooBounces)}
          icon={<Mail size={24} />} 
          colorClass="icon-purple"
          type="yahoo"
          onGraphClick={handleGraphClick}
          delay="delay-3"
        />
        <StatCard 
          title="Outlook Bounces" 
          value={stats.outlookBounces} 
          percentage={calcPercentage(stats.outlookBounces)}
          icon={<Mail size={24} />} 
          colorClass="icon-blue"
          type="outlook"
          onGraphClick={handleGraphClick}
          delay="delay-4"
        />
        <StatCard 
          title="Total Invalid" 
          value={stats.totalInvalid} 
          percentage={calcPercentage(stats.totalInvalid)}
          icon={<XCircle size={24} />} 
          colorClass="icon-red"
          type="invalid"
          onGraphClick={handleGraphClick}
          delay="delay-4"
        />
        <StatCard 
          title="Spam Reports" 
          value={stats.totalSpam} 
          percentage={calcPercentage(stats.totalSpam)}
          icon={<ShieldAlert size={24} />} 
          colorClass="icon-yellow"
          type="spam"
          onGraphClick={handleGraphClick}
          delay="delay-4"
        />
        <StatCard 
          title="Unsubscribes" 
          value={stats.totalUnsubscribes} 
          icon={<UserMinus size={24} />} 
          colorClass="icon-gray"
          delay="delay-4"
        />
      </div>

      <div className="glass-panel chart-container fade-in delay-3">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ margin: 0 }}>Activity Overview ({getGraphLabel(activeGraphMetric)})</h2>
          <select 
            value={graphTimeRange} 
            onChange={(e) => setGraphTimeRange(e.target.value)}
            style={{ 
              padding: '6px 12px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', 
              borderRadius: '6px', color: '#fff', outline: 'none', cursor: 'pointer' 
            }}
          >
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="all">All Time (Years)</option>
          </select>
        </div>
        <div style={{ width: '100%', height: '300px' }}>
          {getFilteredHistoricalData().length > 0 ? (
            <ResponsiveContainer>
              <AreaChart data={getFilteredHistoricalData()} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorMetric" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => val.toLocaleString()} />
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }}
                  itemStyle={{ color: '#10b981' }}
                />
                <Area type="monotone" dataKey={activeGraphMetric} stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorMetric)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'rgba(255,255,255,0.5)' }}>
              No historical data available.
            </div>
          )}
        </div>
      </div>

      <div className="grid-2-cols" style={{ marginTop: '24px' }}>
        <DataTable title="Top Domains Causing Errors (Overall)" data={stats.topRecipientDomainsError} valueKey="domain" delay="delay-4" />
        <DataTable title="Top Email Addresses Causing Errors" data={stats.topRecipientEmailsError} valueKey="email" delay="delay-5" />
      </div>
      
      <div className="grid-2-cols" style={{ marginTop: '24px' }}>
        <DataTable title="Gmail Bounces by Sender Domain" data={stats.topBouncedDomainsGmail} valueKey="domain" delay="delay-4" />
        <DataTable title="Yahoo Bounces by Sender Domain" data={stats.topBouncedDomainsYahoo} valueKey="domain" delay="delay-5" />
      </div>
    </>
  );
};

export default DashboardHome;
