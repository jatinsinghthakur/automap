import React, { useState, useRef, useEffect } from 'react';
import { Download, ChevronDown, FileText, Image as ImageIcon } from 'lucide-react';

export default function DownloadSplitButton({ onDownloadPdf, onDownloadImage, isDownloading }) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMainClick = (e) => {
    e.preventDefault();
    if (isDownloading) return;
    onDownloadPdf();
  };

  const toggleDropdown = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsOpen(prev => !prev);
  };

  return (
    <div className="split-download-group" ref={menuRef}>
      {/* Main button: triggers default PDF download */}
      <button 
        className="split-btn-main" 
        onClick={handleMainClick}
        disabled={isDownloading}
        title="Download high-resolution print-ready PDF"
      >
        <Download size={17} />
        <span>{isDownloading ? 'Preparing...' : 'Download'}</span>
      </button>

      {/* Arrow button: opens dropdown menu */}
      <button 
        className="split-btn-arrow" 
        onClick={toggleDropdown}
        disabled={isDownloading}
        aria-label="More download formats"
        title="Select format (PDF or Image)"
      >
        <ChevronDown size={17} style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s ease' }} />
      </button>

      {/* Dropdown with exact options: <download_icon>pdf, <download_icon>image */}
      {isOpen && (
        <div className="split-dropdown-menu">
          <button 
            className="dropdown-menu-item"
            onClick={() => {
              setIsOpen(false);
              onDownloadPdf();
            }}
          >
            <Download size={15} />
            <span>PDF</span>
          </button>
          
          <button 
            className="dropdown-menu-item"
            onClick={() => {
              setIsOpen(false);
              onDownloadImage();
            }}
          >
            <Download size={15} />
            <span>Image</span>
          </button>
        </div>
      )}
    </div>
  );
}
