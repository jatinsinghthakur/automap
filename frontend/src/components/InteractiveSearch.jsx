import React, { useState, useEffect } from 'react';
import { fetchDistricts, fetchTehsils, fetchVillages, fetchVillageExtent } from '../services/api';
import { ChevronDown, MapPin, Building, Home, ArrowRight } from 'lucide-react';

export default function InteractiveSearch({ onSelectVillage, isLoading }) {
  const [districts, setDistricts] = useState([]);
  const [tehsils, setTehsils] = useState([]);
  const [villages, setVillages] = useState([]);

  const [selectedDist, setSelectedDist] = useState('142'); // Bulandshahr default
  const [selectedTehsil, setSelectedTehsil] = useState('00751'); // Khurja default
  const [selectedVillage, setSelectedVillage] = useState('121500'); // Kapna default

  const [loadingTehsils, setLoadingTehsils] = useState(false);
  const [loadingVillages, setLoadingVillages] = useState(false);

  // Load districts on mount
  useEffect(() => {
    fetchDistricts().then(setDistricts).catch(console.error);
  }, []);

  // Load tehsils when district changes
  useEffect(() => {
    if (!selectedDist) {
      setTehsils([]);
      setSelectedTehsil('');
      return;
    }
    setLoadingTehsils(true);
    fetchTehsils(selectedDist)
      .then(data => {
        setTehsils(data);
        if (data.length > 0) {
          // If previous tehsil is not in new district, pick first
          if (!data.some(t => t.code === selectedTehsil)) {
            setSelectedTehsil(data[0].code);
          }
        } else {
          setSelectedTehsil('');
        }
      })
      .catch(console.error)
      .finally(() => setLoadingTehsils(false));
  }, [selectedDist]);

  // Load villages when tehsil changes
  useEffect(() => {
    if (!selectedDist || !selectedTehsil) {
      setVillages([]);
      setSelectedVillage('');
      return;
    }
    setLoadingVillages(true);
    fetchVillages(selectedDist, selectedTehsil)
      .then(data => {
        setVillages(data);
        if (data.length > 0) {
          if (!data.some(v => v.code === selectedVillage)) {
            setSelectedVillage(data[0].code);
          }
        } else {
          setSelectedVillage('');
        }
      })
      .catch(console.error)
      .finally(() => setLoadingVillages(false));
  }, [selectedDist, selectedTehsil]);

  const handleFetch = async () => {
    if (!selectedDist || !selectedTehsil || !selectedVillage || isLoading) return;
    
    const dObj = districts.find(d => d.code === selectedDist);
    const tObj = tehsils.find(t => t.code === selectedTehsil);
    const vObj = villages.find(v => v.code === selectedVillage);

    try {
      const extent = await fetchVillageExtent(selectedDist, selectedTehsil, selectedVillage);
      onSelectVillage({
        distCode: selectedDist,
        tehsilCode: selectedTehsil,
        villageCode: selectedVillage,
        districtName: dObj ? dObj.display : selectedDist,
        tehsilName: tObj ? tObj.name : selectedTehsil,
        villageName: vObj ? vObj.name : selectedVillage,
        extent
      });
    } catch (err) {
      alert(err.message || 'Error fetching village map');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div className="dropdown-grid">
        {/* District */}
        <div className="dropdown-col">
          <label className="dropdown-label" htmlFor="dist-select" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <MapPin size={14} color="#2563eb" /> District (ज़िला)
          </label>
          <div className="select-wrapper">
            <select
              id="dist-select"
              className="highlight-select"
              value={selectedDist}
              onChange={(e) => setSelectedDist(e.target.value)}
              disabled={isLoading}
            >
              {districts.map(d => (
                <option key={d.code} value={d.code}>
                  {d.display}
                </option>
              ))}
            </select>
            <div className="select-arrow">
              <ChevronDown size={16} />
            </div>
          </div>
        </div>

        {/* Tehsil */}
        <div className="dropdown-col">
          <label className="dropdown-label" htmlFor="teh-select" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Building size={14} color="#2563eb" /> Tehsil (तहसील)
          </label>
          <div className="select-wrapper">
            <select
              id="teh-select"
              className="highlight-select"
              value={selectedTehsil}
              onChange={(e) => setSelectedTehsil(e.target.value)}
              disabled={isLoading || loadingTehsils}
            >
              {loadingTehsils ? (
                <option>Loading tehsils...</option>
              ) : (
                tehsils.map(t => (
                  <option key={t.code} value={t.code}>
                    {t.display}
                  </option>
                ))
              )}
            </select>
            <div className="select-arrow">
              <ChevronDown size={16} />
            </div>
          </div>
        </div>

        {/* Village */}
        <div className="dropdown-col">
          <label className="dropdown-label" htmlFor="vil-select" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Home size={14} color="#2563eb" /> Village (ग्राम) ({villages.length})
          </label>
          <div className="select-wrapper">
            <select
              id="vil-select"
              className="highlight-select"
              value={selectedVillage}
              onChange={(e) => setSelectedVillage(e.target.value)}
              disabled={isLoading || loadingVillages}
            >
              {loadingVillages ? (
                <option>Loading villages...</option>
              ) : (
                villages.map(v => (
                  <option key={v.code} value={v.code}>
                    {v.display}
                  </option>
                ))
              )}
            </select>
            <div className="select-arrow">
              <ChevronDown size={16} />
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
        <button
          type="button"
          className="search-submit-btn"
          onClick={handleFetch}
          disabled={isLoading || !selectedVillage}
        >
          <span>{isLoading ? 'Loading Map...' : 'Fetch Selected Village'}</span>
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}
