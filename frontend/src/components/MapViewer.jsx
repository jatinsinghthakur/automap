import React, { useState, useRef } from 'react';
import DownloadSplitButton from './DownloadSplitButton';
import { ZoomIn, ZoomOut, RotateCcw, Maximize2, MapPin, Hash, Globe } from 'lucide-react';

export default function MapViewer({
  mapUrl,
  villageData,
  extent,
  onDownloadPdf,
  onDownloadImage,
  isDownloading
}) {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const viewportRef = useRef(null);

  const handleZoomIn = () => setScale(prev => Math.min(prev + 0.3, 4));
  const handleZoomOut = () => setScale(prev => Math.max(prev - 0.3, 0.5));
  const handleReset = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleMouseDown = (e) => {
    if (scale <= 1) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  const toggleFullscreen = () => {
    if (!viewportRef.current) return;
    if (!document.fullscreenElement) {
      viewportRef.current.requestFullscreen().catch(err => console.log(err));
    } else {
      document.exitFullscreen();
    }
  };

  return (
    <div className="map-card">
      {/* Action Toolbar Right Above Map */}
      <div className="map-toolbar">
        {/* Village Metadata Badges */}
        <div className="village-badge-group">
          <div className="badge-item badge-accent">
            <MapPin size={14} />
            <span>{villageData.villageName || villageData.villageCode}</span>
          </div>
          <div className="badge-item">
            <span>{villageData.tehsilName || villageData.tehsilCode}</span>
          </div>
          <div className="badge-item">
            <span>{villageData.districtName || villageData.distCode}</span>
          </div>
          <div className="badge-item" title="14-digit GIS Code">
            <Hash size={13} color="#64748b" />
            <code>{extent.gisCode}</code>
          </div>
          <div className="badge-item" title="Coordinate Reference System">
            <Globe size={13} color="#64748b" />
            <span>{extent.crs || 'EPSG:32644'}</span>
          </div>
        </div>

        {/* User Required Download Button: "download<arrow_here>" with PDF & Image options */}
        <DownloadSplitButton
          onDownloadPdf={onDownloadPdf}
          onDownloadImage={onDownloadImage}
          isDownloading={isDownloading}
        />
      </div>

      {/* Interactive Map Viewport */}
      <div
        className="map-viewport"
        ref={viewportRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Zoom & View Controls Overlay */}
        <div className="map-controls">
          <button className="map-ctrl-btn" onClick={handleZoomIn} title="Zoom In">
            <ZoomIn size={18} />
          </button>
          <button className="map-ctrl-btn" onClick={handleZoomOut} title="Zoom Out">
            <ZoomOut size={18} />
          </button>
          <button className="map-ctrl-btn" onClick={handleReset} title="Reset View">
            <RotateCcw size={16} />
          </button>
          <button className="map-ctrl-btn" onClick={toggleFullscreen} title="Fullscreen View">
            <Maximize2 size={16} />
          </button>
        </div>

        {/* Map Image */}
        <img
          src={mapUrl}
          alt={`Cadastral map of ${villageData.villageName}`}
          className="map-img"
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
            cursor: scale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default'
          }}
          draggable="false"
        />
      </div>
    </div>
  );
}
