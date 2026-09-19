import React from 'react';
import { Map, Layers } from 'lucide-react';

export default function Navbar({ isServerAlive }) {
  return (
    <header className="header">
      <div className="logo-group">
        <div className="logo-icon">
          <Map size={22} />
        </div>
        <div className="logo-title" style={{ fontSize: '1.25rem', fontWeight: '700', color: '#0f172a' }}>
          Automap <span className="logo-tag" style={{ marginLeft: '4px' }}>Direct</span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: '#64748b' }}>
        <span style={{ 
          width: '10px', 
          height: '10px', 
          borderRadius: '50%', 
          background: isServerAlive ? '#22c55e' : '#ef4444', 
          display: 'inline-block',
          transition: 'background 0.3s ease'
        }}></span>
        <span style={{ fontWeight: 600 }}>
          {isServerAlive ? 'Server Connected' : 'Server Offline'}
        </span>
      </div>
    </header>
  );
}
