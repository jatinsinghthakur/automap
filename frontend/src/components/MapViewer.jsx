import React, { useState, useRef, useEffect } from 'react';
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
  const [pinchStart, setPinchStart] = useState({ dist: 0, scale: 1, pos: {x:0, y:0}, dx: 0, dy: 0 });
  const viewportRef = useRef(null);

  const scaleRef = useRef(scale);
  const positionRef = useRef(position);
  scaleRef.current = scale;
  positionRef.current = position;

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const handleWheel = (e) => {
      e.preventDefault();
      const oldScale = scaleRef.current;
      const newScale = Math.min(Math.max(oldScale - (e.deltaY * 0.002), 0.5), 4);
      
      if (newScale !== oldScale) {
        const rect = el.getBoundingClientRect();
        const dx = (e.clientX - rect.left) - rect.width / 2;
        const dy = (e.clientY - rect.top) - rect.height / 2;
        
        const ratio = newScale / oldScale;
        const newX = dx - (dx - positionRef.current.x) * ratio;
        const newY = dy - (dy - positionRef.current.y) * ratio;
        
        setScale(newScale);
        setPosition({ x: newX, y: newY });
      }
    };
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, []);

  const handleZoom = (delta) => {
    const oldScale = scaleRef.current;
    const newScale = Math.min(Math.max(oldScale + delta, 0.5), 4);
    if (newScale !== oldScale) {
      const ratio = newScale / oldScale;
      const newX = 0 - (0 - positionRef.current.x) * ratio;
      const newY = 0 - (0 - positionRef.current.y) * ratio;
      setScale(newScale);
      setPosition({ x: newX, y: newY });
    }
  };

  const handleZoomIn = () => handleZoom(0.3);
  const handleZoomOut = () => handleZoom(-0.3);
  const handleReset = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleMouseDown = (e) => {
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

  const getPinchDist = (touches) => {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const getPinchCenter = (touches) => {
    return {
      x: (touches[0].clientX + touches[1].clientX) / 2,
      y: (touches[0].clientY + touches[1].clientY) / 2
    };
  };

  const handleTouchStart = (e) => {
    if (e.touches.length === 2) {
      const center = getPinchCenter(e.touches);
      const rect = viewportRef.current.getBoundingClientRect();
      const dx = (center.x - rect.left) - rect.width / 2;
      const dy = (center.y - rect.top) - rect.height / 2;

      setPinchStart({ 
        dist: getPinchDist(e.touches), 
        scale,
        pos: position,
        dx,
        dy
      });
    } else if (e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({ x: e.touches[0].clientX - position.x, y: e.touches[0].clientY - position.y });
    }
  };

  const handleTouchMove = (e) => {
    if (e.touches.length === 2 && pinchStart.dist > 0) {
      const currentDist = getPinchDist(e.touches);
      const ratio = currentDist / pinchStart.dist;
      const newScale = Math.min(Math.max(pinchStart.scale * ratio, 0.5), 4);
      
      const actualRatio = newScale / pinchStart.scale;
      const newX = pinchStart.dx - (pinchStart.dx - pinchStart.pos.x) * actualRatio;
      const newY = pinchStart.dy - (pinchStart.dy - pinchStart.pos.y) * actualRatio;
      
      const currentCenter = getPinchCenter(e.touches);
      const rect = viewportRef.current.getBoundingClientRect();
      const currentDx = (currentCenter.x - rect.left) - rect.width / 2;
      const currentDy = (currentCenter.y - rect.top) - rect.height / 2;
      
      const finalX = newX + (currentDx - pinchStart.dx);
      const finalY = newY + (currentDy - pinchStart.dy);
      
      setScale(newScale);
      setPosition({ x: finalX, y: finalY });
    } else if (e.touches.length === 1 && isDragging) {
      setPosition({
        x: e.touches[0].clientX - dragStart.x,
        y: e.touches[0].clientY - dragStart.y
      });
    }
  };

  const handleTouchEnd = (e) => {
    if (e.touches.length < 2) {
      setPinchStart({ dist: 0, scale: 1, pos: {x:0, y:0}, dx: 0, dy: 0 });
    }
    if (e.touches.length === 0) {
      setIsDragging(false);
    }
  };

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
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ touchAction: 'none' }}
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
            cursor: isDragging ? 'grabbing' : 'grab'
          }}
          draggable="false"
        />
      </div>
    </div>
  );
}
