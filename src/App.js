import React, { useState, useEffect, createContext, useContext } from 'react';
import DiscoveryPlatform from './components/DiscoveryPlatform';
import EnrichmentPlatform from './components/EnrichmentPlatform';

// ==================== THEME CONTEXT ====================
export const ThemeContext = createContext();

export const useTheme = () => useContext(ThemeContext);

// Light Theme (Beige/Cream)
const lightTheme = {
  name: 'light',
  bgPrimary: '#F5F5F0',
  bgSecondary: '#FFFFFF',
  bgTertiary: '#EEEEE8',
  bgHover: '#E8E8E0',
  textPrimary: '#1A1A1A',
  textSecondary: '#6B6B6B',
  textMuted: '#9A9A9A',
  accent: '#B8960C',
  accentLight: '#D4AF37',
  accentMuted: 'rgba(184, 150, 12, 0.1)',
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  border: '#E5E5E0',
  borderDark: '#D0D0C8',
  shadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
  shadowMd: '0 4px 16px rgba(0, 0, 0, 0.08)',
  shadowLg: '0 8px 32px rgba(0, 0, 0, 0.12)',
  gradientStart: '#B8960C',
  gradientEnd: '#D4AF37'
};

// Dark Theme
const darkTheme = {
  name: 'dark',
  bgPrimary: '#0D0D12',
  bgSecondary: '#16161D',
  bgTertiary: '#1E1E26',
  bgHover: '#26262F',
  textPrimary: '#FFFFFF',
  textSecondary: '#A0A0B0',
  textMuted: '#606070',
  accent: '#D4AF37',
  accentLight: '#E8C547',
  accentMuted: 'rgba(212, 175, 55, 0.15)',
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  border: '#2A2A35',
  borderDark: '#3A3A45',
  shadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
  shadowMd: '0 4px 16px rgba(0, 0, 0, 0.4)',
  shadowLg: '0 8px 32px rgba(0, 0, 0, 0.5)',
  gradientStart: '#D4AF37',
  gradientEnd: '#B8960C'
};

// Icons
const Icons = {
  search: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  upload: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>,
  sun: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>,
  moon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>,
};

function App() {
  const [mode, setMode] = useState('scraper'); // 'scraper' or 'enrichment'
  const [isDark, setIsDark] = useState(() => {
    // Check localStorage or system preference
    const saved = localStorage.getItem('theme_mode');
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  const theme = isDark ? darkTheme : lightTheme;

  // Save theme preference
  useEffect(() => {
    localStorage.setItem('theme_mode', isDark ? 'dark' : 'light');
  }, [isDark]);

  return (
    <ThemeContext.Provider value={{ theme, isDark, setIsDark }}>
      <div style={{ minHeight: '100vh', background: theme.bgPrimary, transition: 'background 0.3s ease' }}>
        {/* Mode Switcher - Centered */}
        <div style={{
          position: 'fixed',
          top: '16px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 9999
        }}>
          <div style={{
            display: 'flex',
            background: theme.bgSecondary,
            borderRadius: '12px',
            padding: '4px',
            boxShadow: theme.shadowMd,
            border: `1px solid ${theme.border}`
          }}>
            <button
              onClick={() => setMode('scraper')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 16px',
                background: mode === 'scraper' ? theme.accent : 'transparent',
                border: 'none',
                borderRadius: '8px',
                color: mode === 'scraper' ? '#FFFFFF' : theme.textSecondary,
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
                background: mode === 'enrichment' ? theme.accent : 'transparent',
                border: 'none',
                borderRadius: '8px',
                color: mode === 'enrichment' ? '#FFFFFF' : theme.textSecondary,
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
        </div>

        {/* Theme Toggle - Right side */}
        <button
          onClick={() => setIsDark(!isDark)}
          style={{
            position: 'fixed',
            top: '16px',
            right: '16px',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '42px',
            height: '42px',
            background: theme.bgSecondary,
            border: `1px solid ${theme.border}`,
            borderRadius: '10px',
            color: theme.textSecondary,
            cursor: 'pointer',
            boxShadow: theme.shadowMd,
            transition: 'all 0.15s'
          }}
          title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {isDark ? Icons.sun : Icons.moon}
        </button>

        {/* Render active mode */}
        {mode === 'scraper' ? <DiscoveryPlatform /> : <EnrichmentPlatform />}
      </div>
    </ThemeContext.Provider>
  );
}

export default App;
