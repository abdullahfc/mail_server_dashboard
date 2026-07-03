import React from 'react';
import { useNavigate } from 'react-router-dom';

const StatCard = ({ title, value, icon, colorClass, delay, type, percentage }) => {
  const navigate = useNavigate();

  return (
    <div 
      className={`glass-panel stat-card fade-in ${delay}`} 
      onClick={() => type && navigate(`/logs/${type}`)}
      style={{ cursor: type ? 'pointer' : 'default', position: 'relative' }}
    >
      <div className="stat-info">
        <div className="title">{title}</div>
        <div className="value">{(value !== undefined && value !== null) ? value.toLocaleString() : '0'}</div>
        {percentage !== undefined && (
          <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', marginTop: '4px' }}>
            {percentage}% of Total Sent
          </div>
        )}
      </div>
      <div className={`stat-icon ${colorClass}`}>
        {icon}
      </div>
    </div>
  );
};

export default StatCard;
