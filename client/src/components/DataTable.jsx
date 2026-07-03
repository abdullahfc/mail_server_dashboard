import React from 'react';

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

export default DataTable;
