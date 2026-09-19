import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import InteractiveSearch from './components/InteractiveSearch';
import MapViewer from './components/MapViewer';
import PlotSidebar from './components/PlotSidebar';
import { buildWmsUrl, fetchDistricts, fetchVillageExtent, fetchPlotInfo } from './services/api';
import { generateMapPdf, downloadMapImage } from './services/pdfGenerator';
import { AlertCircle, Compass } from 'lucide-react';

export default function App() {
  const [isLoading, setIsLoading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isServerAlive, setIsServerAlive] = useState(false);

  const [villageData, setVillageData] = useState(null);
  const [extent, setExtent] = useState(null);
  const [mapUrl, setMapUrl] = useState('');
  const [selectedPlot, setSelectedPlot] = useState(null);

  // Initial load: check server and load placeholder map
  useEffect(() => {
    fetchDistricts()
      .then(() => setIsServerAlive(true))
      .catch(() => setIsServerAlive(false));

    const loadDefaultMap = async () => {
      setIsLoading(true);
      try {
        const ext = await fetchVillageExtent('142', '00751', '121500');
        const url = buildWmsUrl(ext, 2200);
        setVillageData({
          distCode: '142',
          tehsilCode: '00751',
          villageCode: '121500',
          districtName: 'Bulandshahr (बुलन्द शहर)',
          tehsilName: 'Khurja',
          villageName: 'Kapna'
        });
        setExtent(ext);
        setMapUrl(url);
      } catch (err) {
        console.error('Failed to load default map:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadDefaultMap();
  }, []);



  const handleInteractiveSelect = (result) => {
    setIsLoading(true);
    setErrorMessage('');
    setSelectedPlot(null); // Clear sidebar on new search
    try {
      const url = buildWmsUrl(result.extent, 2200);
      setVillageData(result);
      setExtent(result.extent);
      setMapUrl(url);
    } catch (err) {
      setErrorMessage(err.message || 'Failed to render map');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMapClick = async (geoX, geoY) => {
    if (!extent) return;
    
    // Set loading state in sidebar
    setSelectedPlot({ isLoading: true });
    
    try {
      const info = await fetchPlotInfo(extent.gisCode, geoX, geoY);
      setSelectedPlot(info);
    } catch (err) {
      console.error('Plot fetch error:', err);
      setSelectedPlot({ error: err.message || 'Failed to fetch plot details.' });
    }
  };

  const handleDownloadPdf = async () => {
    if (!mapUrl || !villageData || !extent || isDownloading) return;
    setIsDownloading(true);
    try {
      await generateMapPdf({ imgUrl: mapUrl, villageData, extent });
    } catch (err) {
      console.error(err);
      alert('Error generating PDF: ' + err.message);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDownloadImage = () => {
    if (!mapUrl || !villageData || !extent) return;
    downloadMapImage(mapUrl, villageData, extent);
  };

  return (
    <div className="app-container">
      {/* Navbar Header */}
      <Navbar isServerAlive={isServerAlive} />

      {/* Search Input Card */}
      <div className="search-card">
        <InteractiveSearch onSelectVillage={handleInteractiveSelect} isLoading={isLoading} />
      </div>

      {/* Error Banner */}
      {errorMessage && (
        <div className="error-banner">
          <AlertCircle size={18} />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="state-container">
          <div className="spinner"></div>
          <p style={{ fontWeight: 500, color: '#1e293b' }}>
            Fetching vector cadastral map from UP BhuNaksha GeoServer...
          </p>
          <p style={{ fontSize: '0.85rem' }}>
            Resolving spatial coordinates and rendering large, high-legibility khasra numbers.
          </p>
        </div>
      )}

      {/* Map Display & Download Action Card */}
      {!isLoading && mapUrl && villageData && extent && (
        <div className={`map-view-wrapper ${selectedPlot ? 'sidebar-open' : ''}`}>
          <MapViewer
            mapUrl={mapUrl}
            villageData={villageData}
            extent={extent}
            selectedPlot={selectedPlot}
            onDownloadPdf={handleDownloadPdf}
            onDownloadImage={handleDownloadImage}
            isDownloading={isDownloading}
            onMapClick={handleMapClick}
          />
          <PlotSidebar 
            plotInfo={selectedPlot} 
            villageData={villageData}
            extent={extent}
            onClose={() => setSelectedPlot(null)} 
          />
        </div>
      )}

      {/* Empty State when no map is loaded */}
      {!isLoading && !mapUrl && !errorMessage && (
        <div className="state-container">
          <Compass size={48} strokeWidth={1.5} color="#94a3b8" />
          <p style={{ fontWeight: 500 }}>No village map loaded yet</p>
          <p style={{ fontSize: '0.85rem' }}>
            Select a District, Tehsil, and Village above to fetch the map.
          </p>
        </div>
      )}
    </div>
  );
}
