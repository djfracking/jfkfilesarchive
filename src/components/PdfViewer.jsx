import React, { useEffect, useState } from 'react';

const PdfViewer = ({ pdfUrl }) => {
  const [useGoogleViewer, setUseGoogleViewer] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Detect if the user is on mobile and default to Google Docs Viewer
    const mobileCheck = window.innerWidth < 768;
    setIsMobile(mobileCheck);
    if (mobileCheck) setUseGoogleViewer(true);
  }, []);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      {/* Toggle & Download Buttons */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
        {!isMobile && (
          <button onClick={() => setUseGoogleViewer(!useGoogleViewer)}>
            {useGoogleViewer ? 'Use Browser Viewer' : 'Use Google Docs Viewer'}
          </button>
        )}
        <button onClick={() => window.open(pdfUrl, '_blank')}>Download PDF</button>
      </div>

      {/* PDF Viewer */}
      <div style={{ width: '100%', height: '100%' }}>
        {useGoogleViewer ? (
          <iframe
            src={`https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(pdfUrl)}`}
            style={{ width: '100%', height: '100%', border: 'none' }}
            title="Google Docs PDF Viewer"
          />
        ) : (
          <iframe
            src={pdfUrl}
            style={{ width: '100%', height: '100%', border: 'none' }}
            title="PDF Viewer"
          />
        )}
      </div>
    </div>
  );
};

export default PdfViewer;
