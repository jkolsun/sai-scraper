import React, { useState } from 'react';
import SAIScraper from './components/SAIScraper';
import EnrichmentPlatform from './components/EnrichmentPlatform';

// Icons
const Icons = {
  search: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  upload: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>,
};

function App() {
  const [mode, setMode] = useState('scraper'); // 'scraper' or 'enrichment'

  return (
    <div style={{ minHeight: '100vh', background: '#F5F5F0' }}>
      {/* Mode Switcher */}
      <div style={{
        position: 'fixed',
        top: '16px',
        right: '16px',
        zIndex: 9999,
        display: 'flex',
        background: '#FFFFFF',
        borderRadius: '12px',
        padding: '4px',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
        border: '1px solid #E5E5E0'
      }}>
        <button
          onClick={() => setMode('scraper')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 16px',
            background: mode === 'scraper' ? '#B8960C' : 'transparent',
            border: 'none',
            borderRadius: '8px',
            color: mode === 'scraper' ? '#FFFFFF' : '#6B6B6B',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.15s'
          }}
        >
          {Icons.search}
          Discovery
        </button>
        <button
          onClick={() => setMode('enrichment')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 16px',
            background: mode === 'enrichment' ? '#B8960C' : 'transparent',
            border: 'none',
            borderRadius: '8px',
            color: mode === 'enrichment' ? '#FFFFFF' : '#6B6B6B',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.15s'
          }}
        >
          {Icons.upload}
          Enrichment
        </button>
      </div>

      {/* Render active mode */}
      {mode === 'scraper' ? <SAIScraper /> : <EnrichmentPlatform />}
    </div>
  );
}

export default App;
