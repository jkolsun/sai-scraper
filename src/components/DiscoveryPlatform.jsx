import React, { useState, useEffect, useCallback } from 'react';
import { useTheme } from '../App';

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
  users: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  zap: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
  briefcase: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>,
  externalLink: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>,
  trash: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>,
  refresh: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>,
  target: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>,
  alertCircle: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>,
  chevronDown: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>,
  chevronUp: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="18 15 12 9 6 15"/></svg>,
  phone: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>,
  mail: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
};

// ==================== API BASE URL ====================
const getApiBase = () => {
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    return '';
  }
  return '';
};

// ==================== SIGNAL TYPE LABELS ====================
const signalLabels = {
  receptionist: { label: 'Receptionist', color: '#10B981', icon: Icons.phone },
  dispatcher: { label: 'Dispatcher', color: '#8B5CF6', icon: Icons.zap },
  office_manager: { label: 'Office Manager', color: '#F59E0B', icon: Icons.briefcase },
  recent_hiring: { label: 'Recent Hiring', color: '#3B82F6', icon: Icons.users }
};

// ==================== MAIN COMPONENT ====================
function DiscoveryPlatform() {
  const { theme } = useTheme();

  // Core state
  const [activeTab, setActiveTab] = useState('upload');
  const [leads, setLeads] = useState([]);
  const [signalFoundLeads, setSignalFoundLeads] = useState([]);
  const [noSignalLeads, setNoSignalLeads] = useState([]);
  const [scanProgress, setScanProgress] = useState({ current: 0, total: 0, status: 'idle', currentCompany: '' });

  // UI state
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [manualDomain, setManualDomain] = useState('');
  const [manualName, setManualName] = useState('');
  const [expandedLead, setExpandedLead] = useState(null);
  const [resultsView, setResultsView] = useState('signal'); // 'signal' or 'blast'

  // Load saved data
  useEffect(() => {
    try {
      const savedLeads = localStorage.getItem('discovery_leads');
      const savedSignal = localStorage.getItem('discovery_signal_found');
      const savedNoSignal = localStorage.getItem('discovery_no_signal');
      if (savedLeads) setLeads(JSON.parse(savedLeads));
      if (savedSignal) {
        const signal = JSON.parse(savedSignal);
        setSignalFoundLeads(signal);
        if (signal.length > 0) setActiveTab('results');
      }
      if (savedNoSignal) setNoSignalLeads(JSON.parse(savedNoSignal));
    } catch (e) {
      console.error('Error loading saved data:', e);
    }
  }, []);

  // Save data
  useEffect(() => {
    try {
      localStorage.setItem('discovery_leads', JSON.stringify(leads));
    } catch (e) {}
  }, [leads]);

  useEffect(() => {
    try {
      localStorage.setItem('discovery_signal_found', JSON.stringify(signalFoundLeads));
    } catch (e) {}
  }, [signalFoundLeads]);

  useEffect(() => {
    try {
      localStorage.setItem('discovery_no_signal', JSON.stringify(noSignalLeads));
    } catch (e) {}
  }, [noSignalLeads]);

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

      const lead = {
        name: row.name || row.company || row.companyname || row['company name'] || row.business || '',
        domain: row.domain || row.website || row.url || row.site || '',
        email: row.email || row['email address'] || '',
        phone: row.phone || row.telephone || row.mobile || '',
        industry: row.industry || row.sector || '',
        location: row.location || row.city || row.state || row.country || '',
        source: 'csv_upload'
      };

      if (lead.domain) {
        lead.domain = lead.domain.replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/.*$/, '').toLowerCase();
      }

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
  // eslint-disable-next-line react-hooks/exhaustive-deps
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

  // ==================== INDEED SCANNING ====================
  const startScan = async () => {
    if (leads.length === 0) return;

    setActiveTab('scanning');
    setScanProgress({ current: 0, total: leads.length, status: 'running', currentCompany: '' });
    setSignalFoundLeads([]);
    setNoSignalLeads([]);

    const signalResults = [];
    const noSignalResults = [];

    for (let i = 0; i < leads.length; i++) {
      const lead = leads[i];

      setScanProgress({
        current: i,
        total: leads.length,
        status: 'running',
        currentCompany: lead.name || lead.domain
      });

      try {
        const response = await fetch(`${getApiBase()}/api/indeed-scan`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            domain: lead.domain,
            companyName: lead.name
          })
        });

        if (response.ok) {
          const data = await response.json();

          const enrichedLead = {
            ...lead,
            scanResult: data,
            signalFound: data.signalFound,
            signalType: data.signalType,
            signalTypes: data.signalTypes || [],
            totalJobCount: data.totalJobCount,
            jobsFound: data.jobsFound || [],
            details: data.details
          };

          if (data.signalFound) {
            signalResults.push(enrichedLead);
            setSignalFoundLeads([...signalResults]);
          } else {
            noSignalResults.push(enrichedLead);
            setNoSignalLeads([...noSignalResults]);
          }
        } else {
          // API error - add to no signal
          noSignalResults.push({
            ...lead,
            signalFound: false,
            scanError: 'API error'
          });
          setNoSignalLeads([...noSignalResults]);
        }
      } catch (err) {
        // Network error - add to no signal
        noSignalResults.push({
          ...lead,
          signalFound: false,
          scanError: err.message
        });
        setNoSignalLeads([...noSignalResults]);
      }

      // Small delay to avoid rate limiting
      if (i < leads.length - 1) {
        await new Promise(r => setTimeout(r, 300));
      }
    }

    setScanProgress({ current: leads.length, total: leads.length, status: 'complete', currentCompany: '' });
    setActiveTab('results');
  };

  // ==================== LEAD MANAGEMENT ====================
  const addManualLead = () => {
    if (!manualDomain && !manualName) {
      setError('Please enter a domain or company name');
      return;
    }

    const domain = manualDomain.replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/.*$/, '').toLowerCase();

    setLeads(prev => [...prev, {
      name: manualName || domain,
      domain: domain,
      email: '',
      phone: '',
      industry: '',
      location: '',
      source: 'manual'
    }]);

    setManualDomain('');
    setManualName('');
    setError(null);
  };

  const deleteLead = (idx, isSignal) => {
    if (isSignal) {
      setSignalFoundLeads(prev => prev.filter((_, i) => i !== idx));
    } else {
      setNoSignalLeads(prev => prev.filter((_, i) => i !== idx));
    }
    setExpandedLead(null);
  };

  const clearAllData = () => {
    setLeads([]);
    setSignalFoundLeads([]);
    setNoSignalLeads([]);
    setExpandedLead(null);
    setActiveTab('upload');
    localStorage.removeItem('discovery_leads');
    localStorage.removeItem('discovery_signal_found');
    localStorage.removeItem('discovery_no_signal');
  };

  // ==================== EXPORT ====================
  const exportSignalFoundCSV = () => {
    if (signalFoundLeads.length === 0) return;

    const headers = [
      'company_name', 'domain', 'signal_type', 'all_signals', 'jobs_found', 'job_titles', 'job_urls',
      'email', 'phone', 'industry', 'location'
    ];

    const rows = signalFoundLeads.map(lead => {
      const jobTitles = (lead.jobsFound || []).map(j => j.title).join('; ');
      const jobUrls = (lead.jobsFound || []).slice(0, 3).map(j => j.url).join('; ');

      return [
        lead.name || '',
        lead.domain || '',
        lead.signalType || '',
        (lead.signalTypes || []).join('; '),
        lead.totalJobCount || 0,
        jobTitles,
        jobUrls,
        lead.email || '',
        lead.phone || '',
        lead.industry || '',
        lead.location || ''
      ];
    });

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    downloadCSV(csv, 'signal-found-campaign');
  };

  const exportNoSignalCSV = () => {
    if (noSignalLeads.length === 0) return;

    const headers = ['company_name', 'domain', 'email', 'phone', 'industry', 'location'];

    const rows = noSignalLeads.map(lead => [
      lead.name || '',
      lead.domain || '',
      lead.email || '',
      lead.phone || '',
      lead.industry || '',
      lead.location || ''
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    downloadCSV(csv, 'general-blast-campaign');
  };

  const downloadCSV = (csv, filename) => {
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ==================== RENDER: UPLOAD TAB ====================
  const renderUploadTab = () => (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '40px 20px' }}>
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
          Indeed Hiring Signal Scanner
        </h1>
        <p style={{ color: theme.textSecondary, fontSize: '16px' }}>
          Upload your leads to detect hiring signals: Receptionist, Dispatcher, and Recent Hiring Activity
        </p>
      </div>

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
          Required columns: name or domain
        </p>
      </div>

      {/* Manual Lead Entry */}
      <div style={{
        background: theme.bgSecondary,
        borderRadius: '12px',
        border: `1px solid ${theme.border}`,
        padding: '20px',
        marginBottom: '20px'
      }}>
        <h4 style={{ color: theme.textPrimary, fontSize: '14px', fontWeight: 600, marginBottom: '16px' }}>
          Or Add Leads Manually
        </h4>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
          <div style={{ flex: 1 }}>
            <label style={{ color: theme.textMuted, fontSize: '12px', display: 'block', marginBottom: '6px' }}>Domain</label>
            <input
              type="text"
              value={manualDomain}
              onChange={(e) => setManualDomain(e.target.value)}
              placeholder="example.com"
              style={{
                width: '100%',
                padding: '10px 14px',
                background: theme.bgTertiary,
                border: `1px solid ${theme.border}`,
                borderRadius: '8px',
                color: theme.textPrimary,
                fontSize: '14px',
                outline: 'none'
              }}
              onKeyPress={(e) => e.key === 'Enter' && addManualLead()}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ color: theme.textMuted, fontSize: '12px', display: 'block', marginBottom: '6px' }}>Company Name</label>
            <input
              type="text"
              value={manualName}
              onChange={(e) => setManualName(e.target.value)}
              placeholder="Company Inc."
              style={{
                width: '100%',
                padding: '10px 14px',
                background: theme.bgTertiary,
                border: `1px solid ${theme.border}`,
                borderRadius: '8px',
                color: theme.textPrimary,
                fontSize: '14px',
                outline: 'none'
              }}
              onKeyPress={(e) => e.key === 'Enter' && addManualLead()}
            />
          </div>
          <button
            onClick={addManualLead}
            style={{
              padding: '10px 20px',
              background: theme.accent,
              border: 'none',
              borderRadius: '8px',
              color: 'white',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            + Add Lead
          </button>
        </div>
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

      {leads.length > 0 && (
        <div style={{ marginTop: '30px' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px'
          }}>
            <h3 style={{ color: theme.textPrimary, fontSize: '16px', fontWeight: 600 }}>
              {leads.length} leads ready to scan
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
                    <th style={{ padding: '12px 16px', textAlign: 'center', color: theme.textSecondary, fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', width: '60px' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {leads.slice(0, 10).map((lead, idx) => (
                    <tr key={idx} style={{ borderTop: `1px solid ${theme.border}` }}>
                      <td style={{ padding: '12px 16px', color: theme.textPrimary, fontSize: '14px' }}>{lead.name || '-'}</td>
                      <td style={{ padding: '12px 16px', color: theme.textSecondary, fontSize: '14px' }}>{lead.domain || '-'}</td>
                      <td style={{ padding: '12px 16px', color: theme.textSecondary, fontSize: '14px' }}>{lead.industry || '-'}</td>
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <button
                          onClick={() => setLeads(prev => prev.filter((_, i) => i !== idx))}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: theme.textMuted,
                            cursor: 'pointer',
                            padding: '4px',
                            borderRadius: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                          title="Remove lead"
                        >
                          {Icons.x}
                        </button>
                      </td>
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

          {/* Signal Types Info */}
          <div style={{
            background: theme.bgSecondary,
            borderRadius: '12px',
            border: `1px solid ${theme.border}`,
            padding: '20px',
            marginBottom: '24px'
          }}>
            <h4 style={{ color: theme.textPrimary, fontSize: '14px', fontWeight: 600, marginBottom: '16px' }}>
              Hiring Signals We Detect
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
              {Object.entries(signalLabels).map(([key, value]) => (
                <div
                  key={key}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '12px',
                    background: theme.bgTertiary,
                    borderRadius: '8px'
                  }}
                >
                  <span style={{ color: value.color }}>{value.icon}</span>
                  <span style={{ color: theme.textPrimary, fontSize: '13px' }}>{value.label}</span>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={startScan}
            style={{
              width: '100%',
              padding: '16px',
              background: `linear-gradient(135deg, ${theme.gradientStart}, ${theme.gradientEnd})`,
              border: 'none',
              borderRadius: '12px',
              color: 'white',
              fontSize: '16px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px'
            }}
          >
            {Icons.search} Start Indeed Scan
          </button>
        </div>
      )}
    </div>
  );

  // ==================== RENDER: SCANNING TAB ====================
  const renderScanningTab = () => (
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
        <div style={{ color: 'white', transform: 'scale(2)' }}>{Icons.search}</div>
      </div>

      <h2 style={{ color: theme.textPrimary, fontSize: '24px', marginBottom: '12px' }}>
        Scanning Indeed for Hiring Signals
      </h2>
      <p style={{ color: theme.textSecondary, fontSize: '14px', marginBottom: '8px' }}>
        Looking for receptionist, dispatcher, and recent hiring activity...
      </p>
      {scanProgress.currentCompany && (
        <p style={{ color: theme.accent, fontSize: '14px', marginBottom: '32px' }}>
          Currently scanning: {scanProgress.currentCompany}
        </p>
      )}

      <div style={{
        background: theme.bgTertiary,
        borderRadius: '8px',
        height: '12px',
        overflow: 'hidden',
        marginBottom: '16px'
      }}>
        <div style={{
          height: '100%',
          width: `${(scanProgress.current / scanProgress.total) * 100}%`,
          background: `linear-gradient(90deg, ${theme.gradientStart}, ${theme.gradientEnd})`,
          borderRadius: '8px',
          transition: 'width 0.3s ease'
        }} />
      </div>

      <p style={{ color: theme.textMuted, fontSize: '14px' }}>
        {scanProgress.current} of {scanProgress.total} leads scanned
      </p>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '16px',
        marginTop: '40px'
      }}>
        <div style={{
          background: theme.bgSecondary,
          borderRadius: '12px',
          padding: '20px',
          border: `1px solid ${theme.success}40`
        }}>
          <div style={{ color: theme.success, marginBottom: '8px' }}>{Icons.target}</div>
          <div style={{ color: theme.textPrimary, fontSize: '28px', fontWeight: 700 }}>{signalFoundLeads.length}</div>
          <div style={{ color: theme.success, fontSize: '13px', fontWeight: 500 }}>Signals Found</div>
        </div>
        <div style={{
          background: theme.bgSecondary,
          borderRadius: '12px',
          padding: '20px',
          border: `1px solid ${theme.border}`
        }}>
          <div style={{ color: theme.textMuted, marginBottom: '8px' }}>{Icons.users}</div>
          <div style={{ color: theme.textPrimary, fontSize: '28px', fontWeight: 700 }}>{noSignalLeads.length}</div>
          <div style={{ color: theme.textMuted, fontSize: '13px' }}>General Blast</div>
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.05); opacity: 0.8; }
        }
      `}</style>
    </div>
  );

  // ==================== RENDER: RESULTS TAB ====================
  const renderResultsTab = () => (
    <div style={{ padding: '24px' }}>
      {/* Stats Header */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '16px',
        marginBottom: '24px'
      }}>
        <div style={{
          background: theme.bgSecondary,
          borderRadius: '12px',
          padding: '20px',
          border: `1px solid ${theme.success}40`
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <div style={{ color: theme.success }}>{Icons.target}</div>
            <span style={{ color: theme.textMuted, fontSize: '13px' }}>Signal Found</span>
          </div>
          <div style={{ color: theme.textPrimary, fontSize: '28px', fontWeight: 700 }}>{signalFoundLeads.length}</div>
        </div>
        <div style={{
          background: theme.bgSecondary,
          borderRadius: '12px',
          padding: '20px',
          border: `1px solid ${theme.border}`
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <div style={{ color: theme.textMuted }}>{Icons.users}</div>
            <span style={{ color: theme.textMuted, fontSize: '13px' }}>General Blast</span>
          </div>
          <div style={{ color: theme.textPrimary, fontSize: '28px', fontWeight: 700 }}>{noSignalLeads.length}</div>
        </div>
        <div style={{
          background: theme.bgSecondary,
          borderRadius: '12px',
          padding: '20px',
          border: `1px solid ${theme.border}`
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <div style={{ color: theme.accent }}>{Icons.briefcase}</div>
            <span style={{ color: theme.textMuted, fontSize: '13px' }}>Total Scanned</span>
          </div>
          <div style={{ color: theme.textPrimary, fontSize: '28px', fontWeight: 700 }}>{signalFoundLeads.length + noSignalLeads.length}</div>
        </div>
        <div style={{
          background: theme.bgSecondary,
          borderRadius: '12px',
          padding: '20px',
          border: `1px solid ${theme.border}`
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <div style={{ color: theme.warning }}>{Icons.zap}</div>
            <span style={{ color: theme.textMuted, fontSize: '13px' }}>Signal Rate</span>
          </div>
          <div style={{ color: theme.textPrimary, fontSize: '28px', fontWeight: 700 }}>
            {signalFoundLeads.length + noSignalLeads.length > 0
              ? Math.round((signalFoundLeads.length / (signalFoundLeads.length + noSignalLeads.length)) * 100)
              : 0}%
          </div>
        </div>
      </div>

      {/* Actions Bar */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
        gap: '16px'
      }}>
        {/* Campaign Toggle */}
        <div style={{
          display: 'flex',
          background: theme.bgSecondary,
          borderRadius: '10px',
          padding: '4px',
          border: `1px solid ${theme.border}`
        }}>
          <button
            onClick={() => setResultsView('signal')}
            style={{
              padding: '10px 20px',
              background: resultsView === 'signal' ? theme.success : 'transparent',
              border: 'none',
              borderRadius: '8px',
              color: resultsView === 'signal' ? 'white' : theme.textSecondary,
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            {Icons.target} Signal Found ({signalFoundLeads.length})
          </button>
          <button
            onClick={() => setResultsView('blast')}
            style={{
              padding: '10px 20px',
              background: resultsView === 'blast' ? theme.bgTertiary : 'transparent',
              border: 'none',
              borderRadius: '8px',
              color: resultsView === 'blast' ? theme.textPrimary : theme.textSecondary,
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            {Icons.users} General Blast ({noSignalLeads.length})
          </button>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={clearAllData}
            style={{
              padding: '10px 16px',
              background: 'transparent',
              border: `1px solid ${theme.error}50`,
              borderRadius: '10px',
              color: theme.error,
              fontSize: '14px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            {Icons.trash} Clear All
          </button>
          <button
            onClick={() => setActiveTab('upload')}
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
            {Icons.upload} New Scan
          </button>
          <button
            onClick={resultsView === 'signal' ? exportSignalFoundCSV : exportNoSignalCSV}
            disabled={(resultsView === 'signal' && signalFoundLeads.length === 0) || (resultsView === 'blast' && noSignalLeads.length === 0)}
            style={{
              padding: '10px 20px',
              background: (resultsView === 'signal' && signalFoundLeads.length === 0) || (resultsView === 'blast' && noSignalLeads.length === 0)
                ? theme.bgTertiary
                : `linear-gradient(135deg, ${theme.gradientStart}, ${theme.gradientEnd})`,
              border: 'none',
              borderRadius: '10px',
              color: (resultsView === 'signal' && signalFoundLeads.length === 0) || (resultsView === 'blast' && noSignalLeads.length === 0)
                ? theme.textMuted
                : 'white',
              fontSize: '14px',
              fontWeight: 600,
              cursor: (resultsView === 'signal' && signalFoundLeads.length === 0) || (resultsView === 'blast' && noSignalLeads.length === 0)
                ? 'not-allowed'
                : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            {Icons.download} Export {resultsView === 'signal' ? 'Signal Found' : 'General Blast'} CSV
          </button>
        </div>
      </div>

      {/* Results Table */}
      {resultsView === 'signal' ? renderSignalFoundTable() : renderNoSignalTable()}
    </div>
  );

  // ==================== RENDER: SIGNAL FOUND TABLE ====================
  const renderSignalFoundTable = () => (
    <div style={{
      background: theme.bgSecondary,
      borderRadius: '12px',
      border: `1px solid ${theme.success}30`,
      overflow: 'hidden'
    }}>
      <div style={{
        padding: '16px 20px',
        background: `${theme.success}10`,
        borderBottom: `1px solid ${theme.success}30`,
        display: 'flex',
        alignItems: 'center',
        gap: '10px'
      }}>
        <span style={{ color: theme.success }}>{Icons.target}</span>
        <span style={{ color: theme.textPrimary, fontSize: '15px', fontWeight: 600 }}>
          Signal Found Campaign
        </span>
        <span style={{ color: theme.success, fontSize: '13px' }}>
          - Companies actively hiring target roles
        </span>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '900px' }}>
          <thead>
            <tr style={{ background: theme.bgTertiary }}>
              <th style={{ padding: '14px 16px', textAlign: 'left', color: theme.textSecondary, fontSize: '12px', fontWeight: 600, textTransform: 'uppercase' }}>Company</th>
              <th style={{ padding: '14px 16px', textAlign: 'left', color: theme.textSecondary, fontSize: '12px', fontWeight: 600, textTransform: 'uppercase' }}>Signal Type</th>
              <th style={{ padding: '14px 16px', textAlign: 'center', color: theme.textSecondary, fontSize: '12px', fontWeight: 600, textTransform: 'uppercase' }}>Jobs Found</th>
              <th style={{ padding: '14px 16px', textAlign: 'left', color: theme.textSecondary, fontSize: '12px', fontWeight: 600, textTransform: 'uppercase' }}>Sample Jobs</th>
              <th style={{ padding: '14px 16px', textAlign: 'center', color: theme.textSecondary, fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', width: '100px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {signalFoundLeads.map((lead, idx) => (
              <React.Fragment key={idx}>
                <tr style={{
                  borderTop: `1px solid ${theme.border}`,
                  background: expandedLead === `signal-${idx}` ? theme.bgTertiary : 'transparent'
                }}>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '8px',
                        background: `${theme.success}20`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: theme.success,
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
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {(lead.signalTypes || [lead.signalType]).filter(Boolean).map((type, i) => {
                        const signal = signalLabels[type] || { label: type, color: theme.accent };
                        return (
                          <span
                            key={i}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              background: `${signal.color}20`,
                              color: signal.color,
                              padding: '4px 10px',
                              borderRadius: '6px',
                              fontSize: '12px',
                              fontWeight: 500
                            }}
                          >
                            {signal.icon} {signal.label}
                          </span>
                        );
                      })}
                    </div>
                  </td>
                  <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                    <span style={{
                      background: theme.bgTertiary,
                      padding: '4px 12px',
                      borderRadius: '12px',
                      fontSize: '14px',
                      fontWeight: 600,
                      color: theme.textPrimary
                    }}>
                      {lead.totalJobCount || 0}
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {(lead.jobsFound || []).slice(0, 2).map((job, i) => (
                        <a
                          key={i}
                          href={job.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            color: theme.accent,
                            fontSize: '12px',
                            textDecoration: 'none',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          {job.title.substring(0, 40)}{job.title.length > 40 ? '...' : ''} {Icons.externalLink}
                        </a>
                      ))}
                      {(lead.jobsFound || []).length > 2 && (
                        <span style={{ color: theme.textMuted, fontSize: '11px' }}>
                          +{lead.jobsFound.length - 2} more
                        </span>
                      )}
                    </div>
                  </td>
                  <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                      <button
                        onClick={() => deleteLead(idx, true)}
                        style={{
                          padding: '6px 8px',
                          background: 'transparent',
                          border: `1px solid ${theme.error}40`,
                          borderRadius: '6px',
                          color: theme.error,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center'
                        }}
                        title="Delete"
                      >
                        {Icons.trash}
                      </button>
                      <button
                        onClick={() => setExpandedLead(expandedLead === `signal-${idx}` ? null : `signal-${idx}`)}
                        style={{
                          padding: '6px 8px',
                          background: 'transparent',
                          border: 'none',
                          color: theme.textMuted,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center'
                        }}
                        title={expandedLead === `signal-${idx}` ? 'Collapse' : 'Expand'}
                      >
                        {expandedLead === `signal-${idx}` ? Icons.chevronUp : Icons.chevronDown}
                      </button>
                    </div>
                  </td>
                </tr>
                {expandedLead === `signal-${idx}` && (
                  <tr>
                    <td colSpan="5" style={{ padding: 0 }}>
                      <div style={{
                        background: theme.bgTertiary,
                        padding: '20px',
                        borderTop: `1px solid ${theme.border}`
                      }}>
                        <h4 style={{ color: theme.textPrimary, fontSize: '14px', fontWeight: 600, marginBottom: '12px' }}>
                          All Job Postings Found
                        </h4>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                          {(lead.jobsFound || []).map((job, i) => (
                            <a
                              key={i}
                              href={job.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                display: 'block',
                                padding: '12px',
                                background: theme.bgSecondary,
                                borderRadius: '8px',
                                textDecoration: 'none',
                                border: `1px solid ${theme.border}`
                              }}
                            >
                              <div style={{ color: theme.textPrimary, fontSize: '13px', fontWeight: 500, marginBottom: '4px' }}>
                                {job.title}
                              </div>
                              <div style={{ color: theme.textMuted, fontSize: '11px' }}>
                                {job.snippet?.substring(0, 100)}{job.snippet?.length > 100 ? '...' : ''}
                              </div>
                            </a>
                          ))}
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
      {signalFoundLeads.length === 0 && (
        <div style={{ padding: '60px 20px', textAlign: 'center' }}>
          <p style={{ color: theme.textMuted }}>No leads with hiring signals found</p>
        </div>
      )}
    </div>
  );

  // ==================== RENDER: NO SIGNAL TABLE ====================
  const renderNoSignalTable = () => (
    <div style={{
      background: theme.bgSecondary,
      borderRadius: '12px',
      border: `1px solid ${theme.border}`,
      overflow: 'hidden'
    }}>
      <div style={{
        padding: '16px 20px',
        background: theme.bgTertiary,
        borderBottom: `1px solid ${theme.border}`,
        display: 'flex',
        alignItems: 'center',
        gap: '10px'
      }}>
        <span style={{ color: theme.textMuted }}>{Icons.users}</span>
        <span style={{ color: theme.textPrimary, fontSize: '15px', fontWeight: 600 }}>
          General Blast Campaign
        </span>
        <span style={{ color: theme.textMuted, fontSize: '13px' }}>
          - Companies without specific hiring signals
        </span>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: theme.bgTertiary }}>
              <th style={{ padding: '14px 16px', textAlign: 'left', color: theme.textSecondary, fontSize: '12px', fontWeight: 600, textTransform: 'uppercase' }}>Company</th>
              <th style={{ padding: '14px 16px', textAlign: 'left', color: theme.textSecondary, fontSize: '12px', fontWeight: 600, textTransform: 'uppercase' }}>Domain</th>
              <th style={{ padding: '14px 16px', textAlign: 'left', color: theme.textSecondary, fontSize: '12px', fontWeight: 600, textTransform: 'uppercase' }}>Industry</th>
              <th style={{ padding: '14px 16px', textAlign: 'left', color: theme.textSecondary, fontSize: '12px', fontWeight: 600, textTransform: 'uppercase' }}>Location</th>
              <th style={{ padding: '14px 16px', textAlign: 'center', color: theme.textSecondary, fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', width: '80px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {noSignalLeads.map((lead, idx) => (
              <tr key={idx} style={{ borderTop: `1px solid ${theme.border}` }}>
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
                    <span style={{ color: theme.textPrimary, fontSize: '14px' }}>{lead.name || '-'}</span>
                  </div>
                </td>
                <td style={{ padding: '14px 16px', color: theme.textSecondary, fontSize: '14px' }}>{lead.domain || '-'}</td>
                <td style={{ padding: '14px 16px', color: theme.textSecondary, fontSize: '14px' }}>{lead.industry || '-'}</td>
                <td style={{ padding: '14px 16px', color: theme.textSecondary, fontSize: '14px' }}>{lead.location || '-'}</td>
                <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                  <button
                    onClick={() => deleteLead(idx, false)}
                    style={{
                      padding: '6px 8px',
                      background: 'transparent',
                      border: `1px solid ${theme.error}40`,
                      borderRadius: '6px',
                      color: theme.error,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto'
                    }}
                    title="Delete"
                  >
                    {Icons.trash}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {noSignalLeads.length === 0 && (
        <div style={{ padding: '60px 20px', textAlign: 'center' }}>
          <p style={{ color: theme.textMuted }}>No leads in general blast campaign</p>
        </div>
      )}
    </div>
  );

  // ==================== MAIN RENDER ====================
  return (
    <div style={{
      minHeight: '100vh',
      background: theme.bgPrimary,
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
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
            <span style={{ color: theme.accent }}>{Icons.search}</span>
            Indeed Scanner
          </h1>

          <div style={{ display: 'flex', gap: '4px' }}>
            {[
              { id: 'upload', label: 'Upload', icon: Icons.upload },
              { id: 'results', label: 'Results', icon: Icons.target, count: signalFoundLeads.length + noSignalLeads.length }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => (tab.id === 'upload' || signalFoundLeads.length + noSignalLeads.length > 0) ? setActiveTab(tab.id) : null}
                disabled={tab.id === 'results' && signalFoundLeads.length + noSignalLeads.length === 0}
                style={{
                  padding: '8px 16px',
                  background: activeTab === tab.id ? theme.bgTertiary : 'transparent',
                  border: 'none',
                  borderRadius: '8px',
                  color: activeTab === tab.id ? theme.textPrimary : theme.textMuted,
                  fontSize: '14px',
                  cursor: tab.id === 'results' && signalFoundLeads.length + noSignalLeads.length === 0 ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  opacity: tab.id === 'results' && signalFoundLeads.length + noSignalLeads.length === 0 ? 0.5 : 1
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

      <main>
        {activeTab === 'upload' && renderUploadTab()}
        {activeTab === 'scanning' && renderScanningTab()}
        {activeTab === 'results' && renderResultsTab()}
      </main>

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

export default DiscoveryPlatform;
