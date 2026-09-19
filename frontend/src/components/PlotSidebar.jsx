import React, { useState, useEffect } from 'react';
import { 
  X, 
  Users, 
  FileText, 
  Download, 
  AlertCircle, 
  ChevronDown, 
  ChevronUp,
  Layers
} from 'lucide-react';
import { generatePlotReportPdf } from '../services/pdfGenerator';

export default function PlotSidebar({ plotInfo, villageData, extent, onClose }) {
  const [showRawText, setShowRawText] = useState(false);
  const [ordersExpanded, setOrdersExpanded] = useState(false);
  // Track open subdivisions by index: default index 0 open
  const [openSubdivisions, setOpenSubdivisions] = useState({ 0: true });

  // Horizontal resizing state: desktop stretchable from 380px up to 760px (2x)
  const [sidebarWidth, setSidebarWidth] = useState(380);
  const [isResizing, setIsResizing] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  useEffect(() => {
    document.documentElement.style.setProperty('--sidebar-width', `${sidebarWidth}px`);
    if (isResizing) {
      document.documentElement.classList.add('sidebar-resizing');
    } else {
      document.documentElement.classList.remove('sidebar-resizing');
    }
    return () => {
      document.documentElement.style.removeProperty('--sidebar-width');
      document.documentElement.classList.remove('sidebar-resizing');
    };
  }, [sidebarWidth, isResizing]);

  if (!plotInfo) return null;

  const subdivisions = plotInfo.subdivisions || [];
  const hasMultipleSubdivisions = subdivisions.length > 1;
  const hasOrders = plotInfo.orders && plotInfo.orders.length > 0;

  const toggleSubdivision = (idx) => {
    setOpenSubdivisions(prev => ({
      ...prev,
      [idx]: !prev[idx]
    }));
  };

  // Base plot number for report and header
  const displayPlotNo = plotInfo.basePlotNo || plotInfo.plotNo;

  // Handle horizontal drag resizing
  const handleResizeStart = (e) => {
    e.preventDefault();
    setIsResizing(true);
    const startX = e.clientX;
    const startWidth = sidebarWidth;

    const handleMouseMove = (ev) => {
      // Dragging leftwards increases width (as sidebar is docked right)
      const delta = startX - ev.clientX;
      const nextWidth = Math.min(Math.max(startWidth + delta, 380), 760);
      setSidebarWidth(nextWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  // Download Plot Report PDF directly
  const handleDownloadPlotReport = async () => {
    if (isGeneratingPdf || !plotInfo) return;
    setIsGeneratingPdf(true);
    try {
      await generatePlotReportPdf({ plotInfo, villageData, extent });
    } catch (err) {
      console.error('Failed to generate plot report PDF:', err);
      alert('Error generating Plot Report: ' + (err.message || 'Unknown error'));
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <aside 
      className={`plot-sidebar ${isResizing ? 'resizing' : ''}`}
      style={{ width: `${sidebarWidth}px` }}
      aria-label="Plot Details Sidebar"
    >
      {/* Desktop Horizontal Stretch Handle */}
      <div 
        className={`sidebar-resize-handle ${isResizing ? 'active' : ''}`}
        onMouseDown={handleResizeStart}
        title="Drag left/right to resize sidebar width (380px - 760px)"
      >
        <div className="resize-handle-bar" />
      </div>

      {/* 1. Header: Clean Plot No. and Total Area in Hectares only */}
      <div className="sidebar-header">
        <div className="sidebar-header-titles">
          <div className="sidebar-eyebrow">UP Land Record / भूलेख विवरण</div>
          <div className="sidebar-title-row">
            <h3 className="sidebar-title">
              {displayPlotNo ? `Plot No. ${displayPlotNo}` : 'Plot Information'}
            </h3>
            {plotInfo.areaHectare && plotInfo.areaHectare !== '---' && (
              <span className="header-total-area-badge" title="Total Area of Plot in Hectares">
                {plotInfo.areaHectare} Ha
              </span>
            )}
          </div>
        </div>
        <button 
          className="close-btn" 
          onClick={onClose} 
          aria-label="Close plot details sidebar"
          title="Close Sidebar"
        >
          <X size={20} />
        </button>
      </div>

      <div className="sidebar-content">
        {/* Loading State */}
        {plotInfo.isLoading && (
          <div className="sidebar-loading">
            <div className="spinner sidebar-spinner"></div>
            <div className="sidebar-loading-text">
              <p className="loading-main">Fetching authentic plot records...</p>
              <p className="loading-sub">Connecting to UP BhuNaksha GeoServer</p>
            </div>
          </div>
        )}

        {/* Not Found State (Clicked outside boundary) */}
        {!plotInfo.isLoading && plotInfo.notFound && (
          <div className="sidebar-empty">
            <div className="sidebar-empty-icon">
              <AlertCircle size={32} color="#f59e0b" />
            </div>
            <h4 className="empty-title">No Plot Located</h4>
            <p className="empty-desc">
              The clicked location does not fall within a digitized plot boundary in this village.
            </p>
            <p className="empty-hint">
              💡 Tip: Click inside any black line boundary on the map to view that plot.
            </p>
          </div>
        )}

        {/* Error State */}
        {!plotInfo.isLoading && plotInfo.error && (
          <div className="sidebar-error">
            <AlertCircle size={24} color="#ef4444" />
            <p className="error-title">Unable to Load Plot Data</p>
            <p className="error-desc">{plotInfo.error}</p>
          </div>
        )}

        {/* Loaded Data */}
        {!plotInfo.isLoading && !plotInfo.notFound && !plotInfo.error && (
          <div className="plot-details-wrapper">
            {/* 2. Khasra Numbers & Khata Key-Value Pairing Card */}
            <div className="khasra-khata-card">
              <div className="khasra-khata-card-header">
                <span className="card-subheading">Khasra & Khata Details</span>
              </div>

              <div className="khasra-khata-pairs">
                {subdivisions.length > 0 ? (
                  subdivisions.map((sub, idx) => (
                    <div key={idx} className="pair-row">
                      <div className="pair-left">
                        <span className="pair-label">Khata No:</span>
                        <code className="pair-code khata-code">{sub.khataNo}</code>
                      </div>
                      <div className="pair-arrow">→</div>
                      <div className="pair-center">
                        <span className="pair-label">Khasra:</span>
                        <span className="pair-value khasra-value">{sub.khasraNo}</span>
                      </div>
                      <div className="pair-right">
                        <span className="pair-area">{sub.areaHectare} Ha</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="pair-row">
                    <div className="pair-left">
                      <span className="pair-label">Khata No:</span>
                      <code className="pair-code khata-code">{plotInfo.khataNo}</code>
                    </div>
                    <div className="pair-arrow">→</div>
                    <div className="pair-center">
                      <span className="pair-label">Khasra:</span>
                      <span className="pair-value khasra-value">{plotInfo.plotNo}</span>
                    </div>
                    <div className="pair-right">
                      <span className="pair-area">{plotInfo.areaHectare} Ha</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Directly Download Full Plot Report PDF Button */}
              <button
                type="button"
                className="plot-report-download-btn"
                onClick={handleDownloadPlotReport}
                disabled={isGeneratingPdf}
                title="Download Full Cadastral Plot Report PDF"
              >
                {isGeneratingPdf ? (
                  <>
                    <div className="btn-spinner" />
                    <span>Generating Plot Report...</span>
                  </>
                ) : (
                  <>
                    <Download size={15} />
                    <span>Plot Report</span>
                  </>
                )}
              </button>
            </div>

            {/* 3. Subdivisions & Owners Section */}
            {hasMultipleSubdivisions ? (
              <div className="subdivisions-container">
                <div className="subdivisions-header">
                  <Layers size={15} color="#2563eb" />
                  <span>Subdivisions / अंश विभाजन ({subdivisions.length})</span>
                </div>

                <div className="subdivisions-list">
                  {subdivisions.map((sub, idx) => {
                    const isOpen = !!openSubdivisions[idx];
                    const ownerCount = sub.owners?.length || 0;
                    return (
                      <div key={idx} className="subdivision-accordion-item">
                        <button
                          type="button"
                          className={`subdivision-tile ${isOpen ? 'expanded' : ''}`}
                          onClick={() => toggleSubdivision(idx)}
                          aria-expanded={isOpen}
                        >
                          <div className="sub-tile-info">
                            <span className="sub-khasra-title">Khasra {sub.khasraNo}</span>
                            <span className="sub-khata-meta">Khata #{sub.khataNo}</span>
                            <span className="sub-area-meta">{sub.areaHectare} Ha</span>
                          </div>
                          <div className="sub-tile-action">
                            {/* Capsule with inline text for number of owners */}
                            <div className="owners-capsule" title={`${ownerCount} Registered Land Owners for Khasra ${sub.khasraNo}`}>
                              <Users size={12} className="capsule-icon" />
                              <span className="capsule-count">{ownerCount}</span>
                              <span className="capsule-text">
                                {ownerCount === 1 ? 'Registered Owner' : 'Registered Owners'}
                              </span>
                            </div>
                            {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                          </div>
                        </button>

                        {isOpen && (
                          <div className="subdivision-owners-pane">
                            {sub.owners && sub.owners.length > 0 ? (
                              <div className="compact-owners-list">
                                {sub.owners.map((owner, oIdx) => (
                                  <div key={oIdx} className="compact-owner-tile">
                                    <div className="compact-serial">#{owner.serial || (oIdx + 1)}</div>
                                    <div className="compact-details">
                                      <div className="compact-name">{owner.name}</div>
                                      <div className="compact-meta">
                                        {owner.guardian && (
                                          <span className="compact-guardian">
                                            संरक्षक: {owner.guardian}
                                          </span>
                                        )}
                                        {owner.guardian && owner.residence && (
                                          <span className="meta-sep">•</span>
                                        )}
                                        {owner.residence && (
                                          <span className="compact-residence">
                                            निवास: {owner.residence}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="no-data-notice">
                                No individual owner records listed for this subdivision.
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* Single Subdivision / Standard Plot Owners List */
              <div className="section-block">
                <div className="section-header-row">
                  <div className="section-title">
                    <Users size={15} color="#10b981" />
                    <span>Khatedar / Land Owners</span>
                  </div>
                  <div className="owners-capsule">
                    <Users size={12} className="capsule-icon" />
                    <span className="capsule-count">{plotInfo.owners?.length || 0}</span>
                    <span className="capsule-text">
                      {(plotInfo.owners?.length || 0) === 1 ? 'Registered Owner' : 'Registered Owners'}
                    </span>
                  </div>
                </div>

                {plotInfo.owners && plotInfo.owners.length > 0 ? (
                  <div className="compact-owners-list">
                    {plotInfo.owners.map((owner, idx) => (
                      <div key={idx} className="compact-owner-tile">
                        <div className="compact-serial">#{owner.serial || (idx + 1)}</div>
                        <div className="compact-details">
                          <div className="compact-name">{owner.name}</div>
                          <div className="compact-meta">
                            {owner.guardian && (
                              <span className="compact-guardian">
                                संरक्षक: {owner.guardian}
                              </span>
                            )}
                            {owner.guardian && owner.residence && (
                              <span className="meta-sep">•</span>
                            )}
                            {owner.residence && (
                              <span className="compact-residence">
                                निवास: {owner.residence}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="no-data-notice">
                    No individual owner record listed for this parcel (e.g. Government/Public Land).
                  </div>
                )}
              </div>
            )}

            {/* 4. Mutation & Court Orders: Collapsible Tile */}
            {hasOrders && (
              <div className="orders-expandable-section">
                <button
                  type="button"
                  className={`orders-tile-btn ${ordersExpanded ? 'active' : ''}`}
                  onClick={() => setOrdersExpanded(!ordersExpanded)}
                  aria-expanded={ordersExpanded}
                >
                  <div className="orders-tile-left">
                    <FileText size={16} color="#d97706" />
                    <span className="orders-tile-title">
                      राजस्व आदेश / Mutation & Court Orders
                    </span>
                    <span className="orders-count-badge">{plotInfo.orders.length}</span>
                  </div>
                  {ordersExpanded ? <ChevronUp size={16} color="#92400e" /> : <ChevronDown size={16} color="#92400e" />}
                </button>

                {ordersExpanded && (
                  <div className="orders-expanded-content">
                    {plotInfo.orders.map((ord, idx) => (
                      <div key={idx} className="order-card">
                        <div className="order-serial">#{ord.serial || (idx + 1)}</div>
                        <div className="order-body">
                          {ord.khataNo && <span className="order-khata">खाता सं. {ord.khataNo}:</span>}
                          <p className="order-text">{ord.text}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 5. Collapsible Raw Official Server Text */}
            {plotInfo.rawText && (
              <div className="raw-toggle-section">
                <button 
                  className="raw-toggle-btn" 
                  onClick={() => setShowRawText(!showRawText)}
                  type="button"
                >
                  <span>{showRawText ? 'Hide' : 'View'} Official Server Response</span>
                  {showRawText ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
                {showRawText && (
                  <pre className="raw-response-box">
                    {plotInfo.rawText}
                  </pre>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}
