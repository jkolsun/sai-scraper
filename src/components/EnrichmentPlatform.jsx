import React, { useState, useEffect, useCallback } from 'react';

// ==================== THEME (Matching SAIScraper beige/cream) ====================
const theme = {
  // Backgrounds
  bgPrimary: '#F5F5F0',      // Light beige/cream
  bgSecondary: '#FFFFFF',     // White
  bgTertiary: '#EEEEE8',      // Slightly darker beige
  bgHover: '#E8E8E0',         // Hover state
  // Text
  textPrimary: '#1A1A1A',     // Near black
  textSecondary: '#6B6B6B',   // Grey
  textMuted: '#9A9A9A',       // Light grey
  // Accent (Golden/Olive)
  accent: '#B8960C',          // Golden olive
  accentLight: '#D4AF37',     // Lighter gold
  // Status colors
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  // Borders
  border: '#E5E5E0',          // Light border
  borderLight: '#D0D0C8',     // Darker border
  // Gradients
  gradientStart: '#B8960C',
  gradientEnd: '#D4AF37'
};

// ==================== ICONS ====================
const Icons = {
  upload: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>,
  file: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>,
  check: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>,
  x: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  loader: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{animation: 'spin 1s linear infinite'}}><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/></svg>,
  download: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
  search: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  globe: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>,
  mail: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>,
  users: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  zap: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
  instagram: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>,
  linkedin: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>,
  twitter: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"/></svg>,
  dollar: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
  briefcase: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>,
  code: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>,
  externalLink: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>,
  filter: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>,
  trash: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>,
  play: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>,
  trendingUp: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
};

// ==================== API BASE URL ====================
const getApiBase = () => {
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    return '';
  }
  return '';
};

// ==================== MAIN COMPONENT ====================
function EnrichmentPlatform() {
  // Theme is defined at module level

  // Core state
  const [activeTab, setActiveTab] = useState('upload'); // 'upload', 'enriching', 'results'
  const [leads, setLeads] = useState([]);
  const [enrichedLeads, setEnrichedLeads] = useState([]);
  const [enrichmentProgress, setEnrichmentProgress] = useState({ current: 0, total: 0, status: 'idle' });
  const [selectedEnrichments, setSelectedEnrichments] = useState(['email', 'techStack', 'social', 'funding']);

  // UI state
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState(null);
  const [selectedLeads, setSelectedLeads] = useState(new Set());
  const [expandedLead, setExpandedLead] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Stats
  const [stats, setStats] = useState({
    totalEnriched: 0,
    emailsFound: 0,
    socialsFound: 0,
    techStackFound: 0
  });

  // Load saved data
  useEffect(() => {
    try {
      const savedLeads = localStorage.getItem('enrichment_leads');
      const savedEnriched = localStorage.getItem('enrichment_results');
      if (savedLeads) setLeads(JSON.parse(savedLeads));
      if (savedEnriched) {
        const enriched = JSON.parse(savedEnriched);
        setEnrichedLeads(enriched);
        if (enriched.length > 0) setActiveTab('results');
      }
    } catch (e) {
      console.error('Error loading saved data:', e);
    }
  }, []);

  // Save data
  useEffect(() => {
    try {
      localStorage.setItem('enrichment_leads', JSON.stringify(leads));
    } catch (e) {}
  }, [leads]);

  useEffect(() => {
    try {
      localStorage.setItem('enrichment_results', JSON.stringify(enrichedLeads));
    } catch (e) {}
  }, [enrichedLeads]);

  // Update stats when enriched leads change
  useEffect(() => {
    const newStats = {
      totalEnriched: enrichedLeads.length,
      emailsFound: enrichedLeads.filter(l => l.primaryEmail || l.enrichment?.email?.emails?.length > 0).length,
      socialsFound: enrichedLeads.filter(l => l.socialScore > 0 || Object.values(l.socialProfiles || {}).some(Boolean)).length,
      techStackFound: enrichedLeads.filter(l => l.technologies?.length > 0).length
    };
    setStats(newStats);
  }, [enrichedLeads]);

  // ==================== FILE HANDLING ====================
  const parseCSV = (text) => {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length < 2) throw new Error('CSV must have headers and at least one row');

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/['"]/g, ''));
    const rows = [];

    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]);
      if (values.length === 0) continue;

      const row = {};
      headers.forEach((header, idx) => {
        row[header] = values[idx]?.trim().replace(/['"]/g, '') || '';
      });

      // Map common column names
      const lead = {
        name: row.name || row.company || row.companyname || row['company name'] || row.business || '',
        domain: row.domain || row.website || row.url || row.site || '',
        email: row.email || row['email address'] || '',
        phone: row.phone || row.telephone || row.mobile || '',
        industry: row.industry || row.sector || '',
        location: row.location || row.city || row.state || row.country || '',
        employees: row.employees || row.size || row['company size'] || '',
        linkedin: row.linkedin || row['linkedin url'] || '',
        source: 'csv_upload'
      };

      // Clean domain
      if (lead.domain) {
        lead.domain = lead.domain.replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/.*$/, '').toLowerCase();
      }

      // Only add if we have at least name or domain
      if (lead.name || lead.domain) {
        rows.push(lead);
      }
    }

    return rows;
  };

  const parseCSVLine = (line) => {
    const values = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current);
    return values;
  };

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const file = e.dataTransfer?.files?.[0];
    if (file) processFile(file);
  }, []);

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const processFile = async (file) => {
    setError(null);

    if (!file.name.endsWith('.csv')) {
      setError('Please upload a CSV file');
      return;
    }

    try {
      const text = await file.text();
      const parsedLeads = parseCSV(text);

      if (parsedLeads.length === 0) {
        setError('No valid leads found in CSV. Make sure you have columns like "name", "domain", or "company".');
        return;
      }

      setLeads(parsedLeads);
      setError(null);
    } catch (err) {
      setError(`Error parsing CSV: ${err.message}`);
    }
  };

  // ==================== ENRICHMENT ====================
  const startEnrichment = async () => {
    if (leads.length === 0) return;

    setActiveTab('enriching');
    setEnrichmentProgress({ current: 0, total: leads.length, status: 'running' });
    setEnrichedLeads([]);

    const results = [];
    const batchSize = 5;

    for (let i = 0; i < leads.length; i += batchSize) {
      const batch = leads.slice(i, i + batchSize);

      try {
        const response = await fetch(`${getApiBase()}/api/enrich-bulk`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            companies: batch,
            enrichmentTypes: selectedEnrichments
          })
        });

        if (response.ok) {
          const data = await response.json();
          results.push(...(data.results || []));
        } else {
          // If API fails, add leads without enrichment
          results.push(...batch.map(lead => ({
            ...lead,
            enrichmentStatus: 'failed',
            enrichmentError: 'API error'
          })));
        }
      } catch (err) {
        // Network error - add leads without enrichment
        results.push(...batch.map(lead => ({
          ...lead,
          enrichmentStatus: 'failed',
          enrichmentError: err.message
        })));
      }

      setEnrichmentProgress({
        current: Math.min(i + batchSize, leads.length),
        total: leads.length,
        status: 'running'
      });
      setEnrichedLeads([...results]);

      // Small delay between batches
      if (i + batchSize < leads.length) {
        await new Promise(r => setTimeout(r, 500));
      }
    }

    setEnrichmentProgress({ current: leads.length, total: leads.length, status: 'complete' });
    setActiveTab('results');
  };

  // ==================== EXPORT ====================
  const exportToCSV = () => {
    if (enrichedLeads.length === 0) return;

    const headers = [
      'name', 'domain', 'primaryEmail', 'phone', 'industry', 'location', 'employees',
      'technologies', 'socialScore', 'instagram', 'linkedin', 'twitter', 'tiktok',
      'isHiring', 'fundingRound', 'fundingAmount', 'enrichmentScore', 'signals'
    ];

    const rows = enrichedLeads.map(lead => [
      lead.name || '',
      lead.domain || '',
      lead.primaryEmail || lead.enrichment?.email?.emails?.[0] || '',
      lead.phone || '',
      lead.industry || '',
      lead.location || '',
      lead.employees || '',
      (lead.technologies || []).join('; '),
      lead.socialScore || 0,
      lead.socialProfiles?.instagram?.url || lead.enrichment?.social?.profiles?.instagram?.url || '',
      lead.socialProfiles?.linkedin?.url || lead.enrichment?.social?.profiles?.linkedin?.url || '',
      lead.socialProfiles?.twitter?.url || lead.enrichment?.social?.profiles?.twitter?.url || '',
      lead.socialProfiles?.tiktok?.url || lead.enrichment?.social?.profiles?.tiktok?.url || '',
      lead.isHiring ? 'Yes' : 'No',
      lead.fundingInfo?.round || '',
      lead.fundingInfo?.amount || '',
      lead.enrichmentScore || 0,
      (lead.allSignals || []).join('; ')
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `enriched-leads-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ==================== RENDER HELPERS ====================
  const renderUploadTab = () => (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '40px 20px' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h1 style={{
          fontSize: '32px',
          fontWeight: 700,
          color: theme.textPrimary,
          marginBottom: '12px',
          background: `linear-gradient(135deg, ${theme.gradientStart}, ${theme.gradientEnd})`,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          Lead Enrichment Platform
        </h1>
        <p style={{ color: theme.textSecondary, fontSize: '16px' }}>
          Upload your leads and enrich them with emails, social profiles, tech stack, and growth signals
        </p>
      </div>

      {/* Upload Zone */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        style={{
          border: `2px dashed ${dragActive ? theme.accent : theme.border}`,
          borderRadius: '16px',
          padding: '60px 40px',
          textAlign: 'center',
          background: dragActive ? `${theme.accent}10` : theme.bgSecondary,
          transition: 'all 0.2s',
          cursor: 'pointer',
          marginBottom: '30px'
        }}
        onClick={() => document.getElementById('file-input').click()}
      >
        <input
          id="file-input"
          type="file"
          accept=".csv"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />
        <div style={{ color: theme.accent, marginBottom: '16px' }}>{Icons.upload}</div>
        <h3 style={{ color: theme.textPrimary, fontSize: '18px', marginBottom: '8px' }}>
          Drop your CSV file here
        </h3>
        <p style={{ color: theme.textMuted, fontSize: '14px' }}>
          or click to browse
        </p>
        <p style={{ color: theme.textMuted, fontSize: '12px', marginTop: '16px' }}>
          Required columns: name or domain. Optional: email, phone, industry, location
        </p>
      </div>

      {error && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: '10px',
          padding: '14px',
          marginBottom: '20px',
          color: theme.error,
          fontSize: '14px'
        }}>
          {error}
        </div>
      )}

      {/* Leads Preview */}
      {leads.length > 0 && (
        <div style={{ marginTop: '30px' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px'
          }}>
            <h3 style={{ color: theme.textPrimary, fontSize: '16px', fontWeight: 600 }}>
              {leads.length} leads ready to enrich
            </h3>
            <button
              onClick={() => setLeads([])}
              style={{
                background: 'none',
                border: 'none',
                color: theme.textMuted,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '13px'
              }}
            >
              {Icons.trash} Clear
            </button>
          </div>

          {/* Preview table */}
          <div style={{
            background: theme.bgSecondary,
            borderRadius: '12px',
            border: `1px solid ${theme.border}`,
            overflow: 'hidden',
            marginBottom: '24px'
          }}>
            <div style={{ overflowX: 'auto', maxHeight: '300px', overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: theme.bgTertiary }}>
                    <th style={{ padding: '12px 16px', textAlign: 'left', color: theme.textSecondary, fontSize: '12px', fontWeight: 600, textTransform: 'uppercase' }}>Company</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', color: theme.textSecondary, fontSize: '12px', fontWeight: 600, textTransform: 'uppercase' }}>Domain</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', color: theme.textSecondary, fontSize: '12px', fontWeight: 600, textTransform: 'uppercase' }}>Industry</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', color: theme.textSecondary, fontSize: '12px', fontWeight: 600, textTransform: 'uppercase' }}>Location</th>
                  </tr>
                </thead>
                <tbody>
                  {leads.slice(0, 10).map((lead, idx) => (
                    <tr key={idx} style={{ borderTop: `1px solid ${theme.border}` }}>
                      <td style={{ padding: '12px 16px', color: theme.textPrimary, fontSize: '14px' }}>{lead.name || '-'}</td>
                      <td style={{ padding: '12px 16px', color: theme.textSecondary, fontSize: '14px' }}>{lead.domain || '-'}</td>
                      <td style={{ padding: '12px 16px', color: theme.textSecondary, fontSize: '14px' }}>{lead.industry || '-'}</td>
                      <td style={{ padding: '12px 16px', color: theme.textSecondary, fontSize: '14px' }}>{lead.location || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {leads.length > 10 && (
              <div style={{ padding: '12px', textAlign: 'center', color: theme.textMuted, fontSize: '13px', borderTop: `1px solid ${theme.border}` }}>
                + {leads.length - 10} more leads
              </div>
            )}
          </div>

          {/* Enrichment Options */}
          <div style={{
            background: theme.bgSecondary,
            borderRadius: '12px',
            border: `1px solid ${theme.border}`,
            padding: '20px',
            marginBottom: '24px'
          }}>
            <h4 style={{ color: theme.textPrimary, fontSize: '14px', fontWeight: 600, marginBottom: '16px' }}>
              Select Enrichment Types
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
              {[
                { id: 'email', label: 'Email Discovery', icon: Icons.mail, desc: 'Find email addresses' },
                { id: 'techStack', label: 'Tech Stack', icon: Icons.code, desc: 'Detect technologies used' },
                { id: 'social', label: 'Social Profiles', icon: Icons.instagram, desc: 'Find social media accounts' },
                { id: 'funding', label: 'Funding & Hiring', icon: Icons.trendingUp, desc: 'Growth signals & news' }
              ].map(opt => (
                <label
                  key={opt.id}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px',
                    padding: '14px',
                    background: selectedEnrichments.includes(opt.id) ? `${theme.accent}15` : theme.bgTertiary,
                    border: `1px solid ${selectedEnrichments.includes(opt.id) ? theme.accent : theme.border}`,
                    borderRadius: '10px',
                    cursor: 'pointer',
                    transition: 'all 0.15s'
                  }}
                >
                  <input
                    type="checkbox"
                    checked={selectedEnrichments.includes(opt.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedEnrichments([...selectedEnrichments, opt.id]);
                      } else {
                        setSelectedEnrichments(selectedEnrichments.filter(id => id !== opt.id));
                      }
                    }}
                    style={{ marginTop: '2px', accentColor: theme.accent }}
                  />
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: theme.textPrimary, fontSize: '14px', fontWeight: 500 }}>
                      <span style={{ color: theme.accent }}>{opt.icon}</span>
                      {opt.label}
                    </div>
                    <div style={{ color: theme.textMuted, fontSize: '12px', marginTop: '4px' }}>{opt.desc}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Start Button */}
          <button
            onClick={startEnrichment}
            disabled={selectedEnrichments.length === 0}
            style={{
              width: '100%',
              padding: '16px',
              background: selectedEnrichments.length === 0 ? theme.bgTertiary : `linear-gradient(135deg, ${theme.gradientStart}, ${theme.gradientEnd})`,
              border: 'none',
              borderRadius: '12px',
              color: selectedEnrichments.length === 0 ? theme.textMuted : 'white',
              fontSize: '16px',
              fontWeight: 600,
              cursor: selectedEnrichments.length === 0 ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px'
            }}
          >
            {Icons.zap} Start Enrichment
          </button>
        </div>
      )}
    </div>
  );

  const renderEnrichingTab = () => (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '80px 20px', textAlign: 'center' }}>
      <div style={{
        width: '80px',
        height: '80px',
        borderRadius: '50%',
        background: `linear-gradient(135deg, ${theme.gradientStart}, ${theme.gradientEnd})`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto 24px',
        animation: 'pulse 2s ease-in-out infinite'
      }}>
        <div style={{ color: 'white', transform: 'scale(2)' }}>{Icons.zap}</div>
      </div>

      <h2 style={{ color: theme.textPrimary, fontSize: '24px', marginBottom: '12px' }}>
        Enriching Your Leads
      </h2>
      <p style={{ color: theme.textSecondary, fontSize: '14px', marginBottom: '32px' }}>
        Finding emails, social profiles, tech stack, and growth signals...
      </p>

      {/* Progress Bar */}
      <div style={{
        background: theme.bgTertiary,
        borderRadius: '8px',
        height: '12px',
        overflow: 'hidden',
        marginBottom: '16px'
      }}>
        <div style={{
          height: '100%',
          width: `${(enrichmentProgress.current / enrichmentProgress.total) * 100}%`,
          background: `linear-gradient(90deg, ${theme.gradientStart}, ${theme.gradientEnd})`,
          borderRadius: '8px',
          transition: 'width 0.3s ease'
        }} />
      </div>

      <p style={{ color: theme.textMuted, fontSize: '14px' }}>
        {enrichmentProgress.current} of {enrichmentProgress.total} leads processed
      </p>

      {/* Live Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '16px',
        marginTop: '40px'
      }}>
        {[
          { label: 'Processed', value: enrichedLeads.length, icon: Icons.check },
          { label: 'Emails Found', value: enrichedLeads.filter(l => l.primaryEmail).length, icon: Icons.mail },
          { label: 'Socials Found', value: enrichedLeads.filter(l => l.socialScore > 0).length, icon: Icons.users },
          { label: 'Tech Detected', value: enrichedLeads.filter(l => l.technologies?.length > 0).length, icon: Icons.code }
        ].map((stat, idx) => (
          <div key={idx} style={{
            background: theme.bgSecondary,
            borderRadius: '12px',
            padding: '16px',
            border: `1px solid ${theme.border}`
          }}>
            <div style={{ color: theme.accent, marginBottom: '8px' }}>{stat.icon}</div>
            <div style={{ color: theme.textPrimary, fontSize: '24px', fontWeight: 700 }}>{stat.value}</div>
            <div style={{ color: theme.textMuted, fontSize: '12px' }}>{stat.label}</div>
          </div>
        ))}
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.05); opacity: 0.8; }
        }
      `}</style>
    </div>
  );

  const renderResultsTab = () => {
    const filteredLeads = enrichedLeads.filter(lead => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        lead.name?.toLowerCase().includes(q) ||
        lead.domain?.toLowerCase().includes(q) ||
        lead.industry?.toLowerCase().includes(q)
      );
    });

    return (
      <div style={{ padding: '24px' }}>
        {/* Stats Header */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
          gap: '16px',
          marginBottom: '24px'
        }}>
          {[
            { label: 'Total Enriched', value: stats.totalEnriched, icon: Icons.users, color: theme.accent },
            { label: 'Emails Found', value: stats.emailsFound, icon: Icons.mail, color: '#10B981' },
            { label: 'Social Profiles', value: stats.socialsFound, icon: Icons.instagram, color: '#F59E0B' },
            { label: 'Tech Stacks', value: stats.techStackFound, icon: Icons.code, color: '#8B5CF6' },
            { label: 'Avg Score', value: Math.round(enrichedLeads.reduce((sum, l) => sum + (l.enrichmentScore || 0), 0) / (enrichedLeads.length || 1)), icon: Icons.zap, color: '#EC4899' }
          ].map((stat, idx) => (
            <div key={idx} style={{
              background: theme.bgSecondary,
              borderRadius: '12px',
              padding: '20px',
              border: `1px solid ${theme.border}`
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                <div style={{ color: stat.color }}>{stat.icon}</div>
                <span style={{ color: theme.textMuted, fontSize: '13px' }}>{stat.label}</span>
              </div>
              <div style={{ color: theme.textPrimary, fontSize: '28px', fontWeight: 700 }}>{stat.value}</div>
            </div>
          ))}
        </div>

        {/* Actions Bar */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
          gap: '16px'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: theme.bgSecondary,
            border: `1px solid ${theme.border}`,
            borderRadius: '10px',
            padding: '10px 14px',
            flex: 1,
            maxWidth: '400px'
          }}>
            <span style={{ color: theme.textMuted }}>{Icons.search}</span>
            <input
              type="text"
              placeholder="Search leads..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                background: 'none',
                border: 'none',
                outline: 'none',
                color: theme.textPrimary,
                fontSize: '14px',
                width: '100%'
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={() => {
                setActiveTab('upload');
                setLeads([]);
                setEnrichedLeads([]);
              }}
              style={{
                padding: '10px 16px',
                background: theme.bgSecondary,
                border: `1px solid ${theme.border}`,
                borderRadius: '10px',
                color: theme.textSecondary,
                fontSize: '14px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              {Icons.upload} New Upload
            </button>
            <button
              onClick={exportToCSV}
              style={{
                padding: '10px 20px',
                background: `linear-gradient(135deg, ${theme.gradientStart}, ${theme.gradientEnd})`,
                border: 'none',
                borderRadius: '10px',
                color: 'white',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              {Icons.download} Export CSV
            </button>
          </div>
        </div>

        {/* Results Table */}
        <div style={{
          background: theme.bgSecondary,
          borderRadius: '12px',
          border: `1px solid ${theme.border}`,
          overflow: 'hidden'
        }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '1000px' }}>
              <thead>
                <tr style={{ background: theme.bgTertiary }}>
                  <th style={{ padding: '14px 16px', textAlign: 'left', color: theme.textSecondary, fontSize: '12px', fontWeight: 600, textTransform: 'uppercase' }}>Company</th>
                  <th style={{ padding: '14px 16px', textAlign: 'left', color: theme.textSecondary, fontSize: '12px', fontWeight: 600, textTransform: 'uppercase' }}>Email</th>
                  <th style={{ padding: '14px 16px', textAlign: 'left', color: theme.textSecondary, fontSize: '12px', fontWeight: 600, textTransform: 'uppercase' }}>Social</th>
                  <th style={{ padding: '14px 16px', textAlign: 'left', color: theme.textSecondary, fontSize: '12px', fontWeight: 600, textTransform: 'uppercase' }}>Tech Stack</th>
                  <th style={{ padding: '14px 16px', textAlign: 'left', color: theme.textSecondary, fontSize: '12px', fontWeight: 600, textTransform: 'uppercase' }}>Signals</th>
                  <th style={{ padding: '14px 16px', textAlign: 'center', color: theme.textSecondary, fontSize: '12px', fontWeight: 600, textTransform: 'uppercase' }}>Score</th>
                </tr>
              </thead>
              <tbody>
                {filteredLeads.map((lead, idx) => (
                  <tr
                    key={idx}
                    onClick={() => setExpandedLead(expandedLead === idx ? null : idx)}
                    style={{
                      borderTop: `1px solid ${theme.border}`,
                      cursor: 'pointer',
                      background: expandedLead === idx ? theme.bgTertiary : 'transparent'
                    }}
                  >
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '8px',
                          background: theme.bgTertiary,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: theme.textMuted,
                          fontSize: '14px',
                          fontWeight: 600
                        }}>
                          {(lead.name || lead.domain || '?')[0].toUpperCase()}
                        </div>
                        <div>
                          <div style={{ color: theme.textPrimary, fontSize: '14px', fontWeight: 500 }}>{lead.name || '-'}</div>
                          <div style={{ color: theme.textMuted, fontSize: '12px' }}>{lead.domain || '-'}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      {lead.primaryEmail || lead.enrichment?.email?.emails?.[0] ? (
                        <div style={{ color: theme.textPrimary, fontSize: '13px' }}>
                          {lead.primaryEmail || lead.enrichment?.email?.emails?.[0]}
                        </div>
                      ) : (
                        <span style={{ color: theme.textMuted, fontSize: '13px' }}>-</span>
                      )}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        {(lead.socialProfiles?.instagram || lead.enrichment?.social?.profiles?.instagram) && (
                          <span style={{ color: '#E4405F' }} title="Instagram">{Icons.instagram}</span>
                        )}
                        {(lead.socialProfiles?.linkedin || lead.enrichment?.social?.profiles?.linkedin) && (
                          <span style={{ color: '#0A66C2' }} title="LinkedIn">{Icons.linkedin}</span>
                        )}
                        {(lead.socialProfiles?.twitter || lead.enrichment?.social?.profiles?.twitter) && (
                          <span style={{ color: '#1DA1F2' }} title="Twitter">{Icons.twitter}</span>
                        )}
                        {!lead.socialProfiles?.instagram && !lead.socialProfiles?.linkedin && !lead.socialProfiles?.twitter &&
                         !lead.enrichment?.social?.profiles?.instagram && !lead.enrichment?.social?.profiles?.linkedin && !lead.enrichment?.social?.profiles?.twitter && (
                          <span style={{ color: theme.textMuted }}>-</span>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                        {(lead.technologies || []).slice(0, 3).map((tech, i) => (
                          <span key={i} style={{
                            background: theme.bgTertiary,
                            padding: '3px 8px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            color: theme.textSecondary
                          }}>
                            {tech}
                          </span>
                        ))}
                        {(lead.technologies || []).length > 3 && (
                          <span style={{ color: theme.textMuted, fontSize: '11px' }}>
                            +{lead.technologies.length - 3}
                          </span>
                        )}
                        {(!lead.technologies || lead.technologies.length === 0) && (
                          <span style={{ color: theme.textMuted, fontSize: '13px' }}>-</span>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                        {(lead.allSignals || []).slice(0, 2).map((signal, i) => (
                          <span key={i} style={{
                            background: `${theme.accent}20`,
                            padding: '3px 8px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            color: theme.accent
                          }}>
                            {signal.slice(0, 30)}{signal.length > 30 ? '...' : ''}
                          </span>
                        ))}
                        {(!lead.allSignals || lead.allSignals.length === 0) && (
                          <span style={{ color: theme.textMuted, fontSize: '13px' }}>-</span>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                      <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        background: `${lead.enrichmentScore >= 70 ? theme.success : lead.enrichmentScore >= 40 ? theme.warning : theme.error}20`,
                        color: lead.enrichmentScore >= 70 ? theme.success : lead.enrichmentScore >= 40 ? theme.warning : theme.error,
                        fontSize: '14px',
                        fontWeight: 600
                      }}>
                        {lead.enrichmentScore || 0}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredLeads.length === 0 && (
            <div style={{ padding: '60px 20px', textAlign: 'center' }}>
              <p style={{ color: theme.textMuted }}>No leads found</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  // ==================== MAIN RENDER ====================
  return (
    <div style={{
      minHeight: '100vh',
      background: theme.bgPrimary,
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      {/* Navigation */}
      <nav style={{
        background: theme.bgSecondary,
        borderBottom: `1px solid ${theme.border}`,
        padding: '12px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <h1 style={{
            fontSize: '18px',
            fontWeight: 700,
            color: theme.textPrimary,
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span style={{ color: theme.accent }}>{Icons.zap}</span>
            LeadEnrich
          </h1>

          <div style={{ display: 'flex', gap: '4px' }}>
            {[
              { id: 'upload', label: 'Upload', icon: Icons.upload },
              { id: 'results', label: 'Results', icon: Icons.users, count: enrichedLeads.length }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => tab.id === 'upload' || enrichedLeads.length > 0 ? setActiveTab(tab.id) : null}
                disabled={tab.id === 'results' && enrichedLeads.length === 0}
                style={{
                  padding: '8px 16px',
                  background: activeTab === tab.id ? theme.bgTertiary : 'transparent',
                  border: 'none',
                  borderRadius: '8px',
                  color: activeTab === tab.id ? theme.textPrimary : theme.textMuted,
                  fontSize: '14px',
                  cursor: tab.id === 'results' && enrichedLeads.length === 0 ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  opacity: tab.id === 'results' && enrichedLeads.length === 0 ? 0.5 : 1
                }}
              >
                {tab.icon}
                {tab.label}
                {tab.count > 0 && (
                  <span style={{
                    background: theme.accent,
                    color: 'white',
                    padding: '2px 8px',
                    borderRadius: '10px',
                    fontSize: '11px',
                    fontWeight: 600
                  }}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Content */}
      <main>
        {activeTab === 'upload' && renderUploadTab()}
        {activeTab === 'enriching' && renderEnrichingTab()}
        {activeTab === 'results' && renderResultsTab()}
      </main>

      {/* Global Styles */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }
        ::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        ::-webkit-scrollbar-track {
          background: ${theme.bgTertiary};
        }
        ::-webkit-scrollbar-thumb {
          background: ${theme.border};
          border-radius: 4px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: ${theme.borderLight};
        }
      `}</style>
    </div>
  );
}

export default EnrichmentPlatform;
