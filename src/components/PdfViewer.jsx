import React from 'react';

const PdfViewer = ({ pdfUrl }) => {
  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <iframe
        src={`https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(pdfUrl)}`}
        style={{ width: '100%', height: '100%', border: 'none' }}
        title="PDF Viewer"
      />
    </div>
  );
};

export default PdfViewer;
