import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart2, List } from 'lucide-react';

const StatCard = ({ title, value, icon, colorClass, delay, type, percentage, subText, onGraphClick }) => {
  const navigate = useNavigate();

  return (
    <div className={`glass-panel stat-card fade-in ${delay}`} style={{ position: 'relative' }}>
      <div className="stat-info">
        <div className="title">{title}</div>
        <div className="value">{(value !== undefined && value !== null) ? value.toLocaleString() : '0'}</div>
        {subText ? (
          <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', marginTop: '4px' }}>
            {subText}
          </div>
        ) : percentage !== undefined ? (
          <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', marginTop: '4px' }}>
            {percentage}% of Total Sent
          </div>
        ) : null}
      </div>
      <div className={`stat-icon ${colorClass}`}>
        {icon}
      </div>
      
      {/* Action Buttons */}
      <div style={{ 
        position: 'absolute', bottom: '12px', right: '16px', 
        display: 'flex', gap: '8px'
      }}>
        {onGraphClick && (
          <button 
            onClick={() => onGraphClick(type)}
            title="View Graph"
            style={{ 
              background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.1)', 
              color: '#fff', padding: '6px', borderRadius: '6px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}
          >
            <BarChart2 size={16} />
          </button>
        )}
        {type && (
          <button 
            onClick={() => navigate(`/logs/${type}`)}
            title="View Logs"
            style={{ 
              background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.1)', 
              color: '#fff', padding: '6px', borderRadius: '6px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}
          >
            <List size={16} />
          </button>
        )}
      </div>
    </div>
  );
};

export default StatCard;
