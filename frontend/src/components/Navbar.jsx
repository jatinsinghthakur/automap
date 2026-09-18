import React from 'react';
import { Map, Layers } from 'lucide-react';

export default function Navbar() {
  return (
    <header className="header">
      <div className="logo-group">
        <div className="logo-icon">
          <Map size={22} />
        </div>
        <div>
          <div className="logo-title">
            UP BhuNaksha Explorer
            <span className="logo-tag">HD Print Edition</span>
          </div>
          <div className="logo-subtitle">
            Direct Cadastral GeoServer Viewer & High-Clarity PDF Exporter
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: '#64748b' }}>
        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e', display: 'inline-block' }}></span>
        <span>GeoServer Online</span>
      </div>
    </header>
  );
}
