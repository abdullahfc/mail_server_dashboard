import React from 'react';

const DataTable = ({ title, data, valueKey, delay, countLabel }) => (
  <div className={`glass-panel fade-in ${delay}`}>
    <h2>{title}</h2>
    {data && data.length > 0 ? (
      <div style={{ maxHeight: '350px', overflowY: 'auto', paddingRight: '5px' }} className="custom-scrollbar">
        <table className="data-table">
          <thead>
            <tr>
              <th>{valueKey === 'domain' ? 'Domain' : 'Email Address'}</th>
              <th style={{ textAlign: 'right' }}>{countLabel || 'Errors / Bounces'}</th>
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
      </div>
    ) : (
      <p style={{ padding: '20px 0' }}>No data available for today.</p>
    )}
  </div>
);

export default DataTable;
