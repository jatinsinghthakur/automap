import React, { useState, useRef, useEffect } from 'react';
import { Search, Sparkles, ArrowRight } from 'lucide-react';

export default function OneShotSearch({ onSearch, isLoading }) {
  const [query, setQuery] = useState('bulandshahr khurja kapna');
  const inputRef = useRef(null);

  // Highlight and focus cursor on mount so user immediately sees active input field
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!query.trim() || isLoading) return;
    onSearch(query);
  };

  const handlePillClick = (example) => {
    setQuery(example);
    onSearch(example);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="search-form-group">
        <div className="highlight-input-group">
          <input
            ref={inputRef}
            type="text"
            className="highlight-input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type District Tehsil Village (e.g. bulandshahr khurja kapna or 14-digit GIS code)..."
            disabled={isLoading}
            autoComplete="off"
            spellCheck="false"
          />
          <div className="input-icon-left">
            <Search size={20} />
          </div>
        </div>
        <button
          type="submit"
          className="search-submit-btn"
          disabled={isLoading}
        >
          <span>{isLoading ? 'Searching...' : 'Search Map'}</span>
          <ArrowRight size={16} />
        </button>
      </div>

      <div className="suggestion-pills">
        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Sparkles size={13} color="#f59e0b" /> Examples:
        </span>
        <button
          type="button"
          className="pill-btn"
          onClick={() => handlePillClick('bulandshahr khurja kapna')}
        >
          bulandshahr khurja kapna
        </button>
        <button
          type="button"
          className="pill-btn"
          onClick={() => handlePillClick('bulandshahr khurja arnia khurd')}
        >
          bulandshahr khurja arnia khurd
        </button>
        <button
          type="button"
          className="pill-btn"
          onClick={() => handlePillClick('14200751121533')}
        >
          14200751121533 (Bhadaura)
        </button>
      </div>
    </form>
  );
}
