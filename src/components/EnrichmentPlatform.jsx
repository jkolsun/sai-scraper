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
  refresh: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>,
  trendingUp: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>,
  target: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>,
  clock: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  messageCircle: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>,
  lightbulb: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18h6"/><path d="M10 22h4"/><path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14"/></svg>,
  alertCircle: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>,
  award: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></svg>,
  chevronDown: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>,
  chevronUp: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="18 15 12 9 6 15"/></svg>,
  tiktok: <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/></svg>,
  youtube: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"/><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"/></svg>,
  facebook: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
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
  const { theme } = useTheme();

  // Core state
  const [activeTab, setActiveTab] = useState('upload');
  const [leads, setLeads] = useState([]);
  const [enrichedLeads, setEnrichedLeads] = useState([]);
  const [enrichmentProgress, setEnrichmentProgress] = useState({ current: 0, total: 0, status: 'idle' });
  const [selectedEnrichments, setSelectedEnrichments] = useState(['email', 'techStack', 'social', 'funding']);

  // UI state
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [expandedLead, setExpandedLead] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [detailTab, setDetailTab] = useState('overview');
  const [selectedLeads, setSelectedLeads] = useState(new Set());
  const [manualDomain, setManualDomain] = useState('');
  const [manualName, setManualName] = useState('');

  // Stats
  const [stats, setStats] = useState({
    totalEnriched: 0,
    emailsFound: 0,
    socialsFound: 0,
    techStackFound: 0,
    highUrgency: 0
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

  // Update stats
  useEffect(() => {
    const newStats = {
      totalEnriched: enrichedLeads.length,
      emailsFound: enrichedLeads.filter(l => l.primaryEmail || l.enrichment?.email?.emails?.length > 0).length,
      socialsFound: enrichedLeads.filter(l => l.socialScore > 0 || Object.values(l.socialProfiles || {}).some(Boolean)).length,
      techStackFound: enrichedLeads.filter(l => l.technologies?.length > 0).length,
      highUrgency: enrichedLeads.filter(l => (l.outreachIntelligence?.urgencyScore || 0) >= 50).length
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
          results.push(...batch.map(lead => ({
            ...lead,
            enrichmentStatus: 'failed',
            enrichmentError: 'API error'
          })));
        }
      } catch (err) {
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

      if (i + batchSize < leads.length) {
        await new Promise(r => setTimeout(r, 500));
      }
    }

    setEnrichmentProgress({ current: leads.length, total: leads.length, status: 'complete' });
    setActiveTab('results');
  };

  // ==================== LEAD MANAGEMENT ====================
  const deleteLead = (idx) => {
    setEnrichedLeads(prev => prev.filter((_, i) => i !== idx));
    setExpandedLead(null);
  };

  const deleteSelectedLeads = () => {
    setEnrichedLeads(prev => prev.filter((_, i) => !selectedLeads.has(i)));
    setSelectedLeads(new Set());
    setExpandedLead(null);
  };

  const toggleSelectLead = (idx) => {
    setSelectedLeads(prev => {
      const newSet = new Set(prev);
      if (newSet.has(idx)) {
        newSet.delete(idx);
      } else {
        newSet.add(idx);
      }
      return newSet;
    });
  };

  const selectAllLeads = () => {
    if (selectedLeads.size === enrichedLeads.length) {
      setSelectedLeads(new Set());
    } else {
      setSelectedLeads(new Set(enrichedLeads.map((_, i) => i)));
    }
  };

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

  const rescanLead = async (lead, idx) => {
    setError(null);

    try {
      const response = await fetch(`${getApiBase()}/api/enrich-bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companies: [lead],
          enrichmentTypes: selectedEnrichments
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.results?.[0]) {
          setEnrichedLeads(prev => {
            const newLeads = [...prev];
            newLeads[idx] = data.results[0];
            return newLeads;
          });
          setSuccessMessage('Lead re-scanned successfully');
          setTimeout(() => setSuccessMessage(null), 3000);
        }
      } else {
        setError('Failed to re-scan lead');
      }
    } catch (err) {
      setError(`Error: ${err.message}`);
    }
  };

  const clearAllData = () => {
    setLeads([]);
    setEnrichedLeads([]);
    setSelectedLeads(new Set());
    setExpandedLead(null);
    setActiveTab('upload');
    localStorage.removeItem('enrichment_leads');
    localStorage.removeItem('enrichment_results');
  };

  // ==================== EXPORT ====================
  const exportToCSV = () => {
    if (enrichedLeads.length === 0) return;

    const headers = [
      'name', 'domain', 'primaryEmail', 'phone', 'industry', 'location', 'employees',
      'technologies', 'socialScore', 'instagram', 'linkedin', 'twitter', 'tiktok', 'youtube', 'facebook',
      'isHiring', 'hiringDepartments', 'fundingRound', 'fundingAmount',
      'urgencyScore', 'bestTimeToReach', 'whyReachOut', 'icebreaker', 'painPoints', 'enrichmentScore'
    ];

    const rows = enrichedLeads.map(lead => {
      const intel = lead.outreachIntelligence || {};
      return [
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
        lead.socialProfiles?.youtube?.url || lead.enrichment?.social?.profiles?.youtube?.url || '',
        lead.socialProfiles?.facebook?.url || lead.enrichment?.social?.profiles?.facebook?.url || '',
        lead.isHiring ? 'Yes' : 'No',
        lead.enrichment?.funding?.hiring?.departments?.join('; ') || '',
        lead.fundingInfo?.series || lead.enrichment?.funding?.funding?.series || '',
        lead.fundingInfo?.amount || lead.enrichment?.funding?.funding?.amount || '',
        intel.urgencyScore || 0,
        intel.whenToReachOut?.bestTime || '',
        (intel.whyReachOut || []).map(w => w.reason).join('; '),
        intel.icebreakers?.[0]?.opener || '',
        (intel.painPoints || []).map(p => p.pain).join('; '),
        lead.enrichmentScore || 0
      ];
    });

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
          Lead Enrichment Platform
        </h1>
        <p style={{ color: theme.textSecondary, fontSize: '16px' }}>
          Upload your leads and get actionable outreach intelligence: emails, social profiles, WHY to reach out, WHEN to reach out, and personalized talking points
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
          Required columns: name or domain. Optional: email, phone, industry, location
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
            <label style={{ color: theme.textMuted, fontSize: '12px', display: 'block', marginBottom: '6px' }}>Domain *</label>
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
            <label style={{ color: theme.textMuted, fontSize: '12px', display: 'block', marginBottom: '6px' }}>Company Name (optional)</label>
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
                    <th style={{ padding: '12px 16px', textAlign: 'center', color: theme.textSecondary, fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', width: '60px' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {leads.slice(0, 10).map((lead, idx) => (
                    <tr key={idx} style={{ borderTop: `1px solid ${theme.border}` }}>
                      <td style={{ padding: '12px 16px', color: theme.textPrimary, fontSize: '14px' }}>{lead.name || '-'}</td>
                      <td style={{ padding: '12px 16px', color: theme.textSecondary, fontSize: '14px' }}>{lead.domain || '-'}</td>
                      <td style={{ padding: '12px 16px', color: theme.textSecondary, fontSize: '14px' }}>{lead.industry || '-'}</td>
                      <td style={{ padding: '12px 16px', color: theme.textSecondary, fontSize: '14px' }}>{lead.location || '-'}</td>
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

  // ==================== RENDER: ENRICHING TAB ====================
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
        Finding emails, social profiles, tech stack, growth signals, and generating outreach intelligence...
      </p>

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
          { label: 'High Priority', value: enrichedLeads.filter(l => (l.outreachIntelligence?.urgencyScore || 0) >= 50).length, icon: Icons.target }
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

  // ==================== RENDER: LEAD DETAIL PANEL ====================
  const renderLeadDetail = (lead) => {
    const intel = lead.outreachIntelligence || {};
    const social = lead.enrichment?.social || {};
    const funding = lead.enrichment?.funding || {};
    const profiles = social.profiles || lead.socialProfiles || {};

    return (
      <tr>
        <td colSpan="8" style={{ padding: 0 }}>
          <div style={{
            background: theme.bgTertiary,
            borderTop: `1px solid ${theme.border}`,
            padding: '24px'
          }}>
            {/* Detail Tabs */}
            <div style={{ display: 'flex', gap: '4px', marginBottom: '20px', borderBottom: `1px solid ${theme.border}`, paddingBottom: '12px' }}>
              {[
                { id: 'overview', label: 'Overview', icon: Icons.target },
                { id: 'outreach', label: 'Why Reach Out', icon: Icons.lightbulb },
                { id: 'timing', label: 'When to Reach', icon: Icons.clock },
                { id: 'personalization', label: 'Personalization', icon: Icons.messageCircle },
                { id: 'social', label: 'Social Profiles', icon: Icons.users }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={(e) => { e.stopPropagation(); setDetailTab(tab.id); }}
                  style={{
                    padding: '8px 16px',
                    background: detailTab === tab.id ? theme.bgSecondary : 'transparent',
                    border: detailTab === tab.id ? `1px solid ${theme.border}` : '1px solid transparent',
                    borderRadius: '8px',
                    color: detailTab === tab.id ? theme.textPrimary : theme.textMuted,
                    fontSize: '13px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  {tab.icon} {tab.label}
                </button>
              ))}
            </div>

            {/* Overview Tab */}
            {detailTab === 'overview' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
                {/* Lead Score Card */}
                <div style={{ background: theme.bgSecondary, borderRadius: '12px', padding: '16px', border: `1px solid ${lead.leadTier === 'hot' ? theme.error : lead.leadTier === 'warm' ? theme.warning : theme.border}` }}>
                  <h4 style={{ color: theme.textSecondary, fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', marginBottom: '12px' }}>Lead Score</h4>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                    <div style={{
                      width: '60px',
                      height: '60px',
                      borderRadius: '50%',
                      background: lead.leadTier === 'hot' ? `${theme.error}20` : lead.leadTier === 'warm' ? `${theme.warning}20` : `${theme.accent}20`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: lead.leadTier === 'hot' ? theme.error : lead.leadTier === 'warm' ? theme.warning : theme.accent,
                      fontSize: '22px',
                      fontWeight: 700
                    }}>
                      {lead.leadScore || 0}
                    </div>
                    <div>
                      <div style={{ color: theme.textPrimary, fontSize: '16px', fontWeight: 600 }}>{lead.leadTierLabel || 'Cold'}</div>
                      <div style={{ color: theme.textMuted, fontSize: '12px' }}>
                        {lead.leadTier === 'hot' ? 'Priority outreach' : lead.leadTier === 'warm' ? 'Good prospect' : lead.leadTier === 'nurture' ? 'Needs nurturing' : 'Low priority'}
                      </div>
                    </div>
                  </div>
                  {lead.leadScoreBreakdown && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {Object.entries(lead.leadScoreBreakdown).map(([key, value]) => (
                        <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ color: theme.textMuted, fontSize: '11px', textTransform: 'capitalize' }}>{key}</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <div style={{ width: '60px', height: '4px', background: theme.bgTertiary, borderRadius: '2px', overflow: 'hidden' }}>
                              <div style={{ width: `${(value / 25) * 100}%`, height: '100%', background: theme.accent, borderRadius: '2px' }} />
                            </div>
                            <span style={{ color: theme.textSecondary, fontSize: '11px', width: '20px' }}>{value}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Best Channel Card */}
                <div style={{ background: theme.bgSecondary, borderRadius: '12px', padding: '16px', border: `1px solid ${theme.border}` }}>
                  <h4 style={{ color: theme.textSecondary, fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', marginBottom: '12px' }}>Best Outreach Channel</h4>
                  {lead.recommendedChannel ? (
                    <>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                        <div style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '10px',
                          background: lead.recommendedChannel.channel === 'LinkedIn' ? '#0A66C220' :
                                     lead.recommendedChannel.channel === 'Twitter/X' ? '#1DA1F220' :
                                     lead.recommendedChannel.channel === 'Instagram' ? '#E4405F20' :
                                     `${theme.success}20`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: lead.recommendedChannel.channel === 'LinkedIn' ? '#0A66C2' :
                                 lead.recommendedChannel.channel === 'Twitter/X' ? '#1DA1F2' :
                                 lead.recommendedChannel.channel === 'Instagram' ? '#E4405F' :
                                 theme.success
                        }}>
                          {lead.recommendedChannel.channel === 'LinkedIn' ? Icons.linkedin :
                           lead.recommendedChannel.channel === 'Twitter/X' ? Icons.twitter :
                           lead.recommendedChannel.channel === 'Instagram' ? Icons.instagram :
                           lead.recommendedChannel.channel === 'Email' ? Icons.mail : Icons.globe}
                        </div>
                        <div>
                          <div style={{ color: theme.textPrimary, fontSize: '15px', fontWeight: 600 }}>{lead.recommendedChannel.channel}</div>
                          <div style={{ color: theme.textMuted, fontSize: '11px' }}>Score: {lead.recommendedChannel.score}</div>
                        </div>
                      </div>
                      <div style={{ color: theme.textSecondary, fontSize: '12px', marginBottom: '10px' }}>{lead.recommendedChannel.approach}</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {(lead.recommendedChannel.reasons || []).map((reason, i) => (
                          <div key={i} style={{ color: theme.textMuted, fontSize: '11px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ color: theme.success }}>{Icons.check}</span> {reason}
                          </div>
                        ))}
                      </div>
                      {lead.alternativeChannels?.length > 0 && (
                        <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: `1px solid ${theme.border}` }}>
                          <div style={{ color: theme.textMuted, fontSize: '10px', marginBottom: '6px' }}>ALTERNATIVES</div>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            {lead.alternativeChannels.map((ch, i) => (
                              <span key={i} style={{ background: theme.bgTertiary, padding: '4px 8px', borderRadius: '4px', fontSize: '11px', color: theme.textSecondary }}>
                                {ch.channel}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div style={{ color: theme.textMuted, fontSize: '13px' }}>No channel recommendation available</div>
                  )}
                </div>

                {/* Contact Info */}
                <div style={{ background: theme.bgSecondary, borderRadius: '12px', padding: '16px', border: `1px solid ${theme.border}` }}>
                  <h4 style={{ color: theme.textSecondary, fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', marginBottom: '12px' }}>Contact Information</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div>
                      <div style={{ color: theme.textMuted, fontSize: '11px' }}>Primary Email</div>
                      <div style={{ color: theme.textPrimary, fontSize: '14px' }}>{lead.primaryEmail || lead.enrichment?.email?.emails?.[0] || '-'}</div>
                    </div>
                    <div>
                      <div style={{ color: theme.textMuted, fontSize: '11px' }}>Domain</div>
                      <div style={{ color: theme.textPrimary, fontSize: '14px' }}>{lead.domain || '-'}</div>
                    </div>
                    <div>
                      <div style={{ color: theme.textMuted, fontSize: '11px' }}>Phone</div>
                      <div style={{ color: theme.textPrimary, fontSize: '14px' }}>{lead.phone || '-'}</div>
                    </div>
                  </div>
                </div>

                {/* Tech Stack */}
                <div style={{ background: theme.bgSecondary, borderRadius: '12px', padding: '16px', border: `1px solid ${theme.border}` }}>
                  <h4 style={{ color: theme.textSecondary, fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', marginBottom: '12px' }}>Tech Stack</h4>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {(lead.technologies || []).length > 0 ? (
                      lead.technologies.map((tech, i) => (
                        <span key={i} style={{
                          background: `${theme.accent}20`,
                          color: theme.accent,
                          padding: '4px 10px',
                          borderRadius: '6px',
                          fontSize: '12px'
                        }}>
                          {tech}
                        </span>
                      ))
                    ) : (
                      <span style={{ color: theme.textMuted, fontSize: '13px' }}>No tech stack detected</span>
                    )}
                  </div>
                </div>

                {/* Growth Signals */}
                <div style={{ background: theme.bgSecondary, borderRadius: '12px', padding: '16px', border: `1px solid ${theme.border}` }}>
                  <h4 style={{ color: theme.textSecondary, fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', marginBottom: '12px' }}>Growth Signals</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {funding.funding?.recentRound && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px', background: `${theme.success}15`, borderRadius: '6px' }}>
                        <span style={{ color: theme.success }}>{Icons.dollar}</span>
                        <div>
                          <div style={{ color: theme.textPrimary, fontSize: '13px', fontWeight: 500 }}>
                            {funding.funding.series} {funding.funding.amount ? `- ${funding.funding.amount}` : ''}
                          </div>
                          <div style={{ color: theme.textMuted, fontSize: '11px' }}>Recent funding round</div>
                        </div>
                      </div>
                    )}
                    {funding.hiring?.isHiring && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px', background: `${theme.warning}15`, borderRadius: '6px' }}>
                        <span style={{ color: theme.warning }}>{Icons.briefcase}</span>
                        <div>
                          <div style={{ color: theme.textPrimary, fontSize: '13px', fontWeight: 500 }}>
                            Hiring {funding.hiring.openRoles ? `${funding.hiring.openRoles}+ roles` : ''}
                          </div>
                          <div style={{ color: theme.textMuted, fontSize: '11px' }}>{funding.hiring.departments?.join(', ') || 'Multiple departments'}</div>
                        </div>
                      </div>
                    )}
                    {!funding.funding?.recentRound && !funding.hiring?.isHiring && (
                      <span style={{ color: theme.textMuted, fontSize: '13px' }}>No recent growth signals detected</span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Why Reach Out Tab */}
            {detailTab === 'outreach' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                {/* Reasons to Reach Out */}
                <div style={{ background: theme.bgSecondary, borderRadius: '12px', padding: '20px', border: `1px solid ${theme.border}` }}>
                  <h4 style={{ color: theme.textPrimary, fontSize: '14px', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ color: theme.accent }}>{Icons.lightbulb}</span>
                    Why You Should Reach Out
                  </h4>
                  {(intel.whyReachOut || []).length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {intel.whyReachOut.map((reason, i) => (
                        <div key={i} style={{ padding: '12px', background: theme.bgTertiary, borderRadius: '8px', borderLeft: `3px solid ${reason.urgency === 'high' ? theme.error : theme.accent}` }}>
                          <div style={{ color: theme.textPrimary, fontSize: '14px', fontWeight: 500, marginBottom: '4px' }}>
                            {reason.reason}
                            {reason.urgency === 'high' && <span style={{ marginLeft: '8px', background: theme.error, color: 'white', padding: '2px 6px', borderRadius: '4px', fontSize: '10px' }}>URGENT</span>}
                          </div>
                          <div style={{ color: theme.textSecondary, fontSize: '13px', marginBottom: '6px' }}>{reason.insight}</div>
                          <div style={{ color: theme.accent, fontSize: '12px' }}>Angle: {reason.angle}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={{ color: theme.textMuted, fontSize: '13px' }}>No specific outreach reasons identified yet. Try enabling more enrichment types.</p>
                  )}
                </div>

                {/* Pain Points */}
                <div style={{ background: theme.bgSecondary, borderRadius: '12px', padding: '20px', border: `1px solid ${theme.border}` }}>
                  <h4 style={{ color: theme.textPrimary, fontSize: '14px', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ color: theme.warning }}>{Icons.alertCircle}</span>
                    Potential Pain Points
                  </h4>
                  {(intel.painPoints || []).length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {intel.painPoints.map((pain, i) => (
                        <div key={i} style={{ padding: '12px', background: theme.bgTertiary, borderRadius: '8px' }}>
                          <div style={{ color: theme.textPrimary, fontSize: '14px', fontWeight: 500, marginBottom: '4px' }}>{pain.pain}</div>
                          <div style={{ color: theme.textSecondary, fontSize: '13px', marginBottom: '6px' }}>Impact: {pain.implication}</div>
                          <div style={{ color: theme.success, fontSize: '12px' }}>Opportunity: {pain.opportunity}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={{ color: theme.textMuted, fontSize: '13px' }}>No obvious pain points detected.</p>
                  )}
                </div>
              </div>
            )}

            {/* When to Reach Out Tab */}
            {detailTab === 'timing' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                {/* Timing */}
                <div style={{ background: theme.bgSecondary, borderRadius: '12px', padding: '20px', border: `1px solid ${theme.border}` }}>
                  <h4 style={{ color: theme.textPrimary, fontSize: '14px', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ color: theme.accent }}>{Icons.clock}</span>
                    Best Time to Reach Out
                  </h4>
                  <div style={{
                    padding: '16px',
                    background: intel.whenToReachOut?.urgency === 'high' ? `${theme.error}15` : theme.bgTertiary,
                    borderRadius: '10px',
                    border: intel.whenToReachOut?.urgency === 'high' ? `1px solid ${theme.error}30` : `1px solid ${theme.border}`
                  }}>
                    <div style={{ color: theme.textPrimary, fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>
                      {intel.whenToReachOut?.bestTime || 'Tuesday-Thursday, 9-11am their local time'}
                    </div>
                    {intel.whenToReachOut?.urgency === 'high' && (
                      <div style={{ display: 'inline-block', background: theme.error, color: 'white', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 600, marginBottom: '12px' }}>
                        HIGH URGENCY - Act Now!
                      </div>
                    )}
                    {(intel.whenToReachOut?.triggers || []).length > 0 && (
                      <div style={{ marginTop: '12px' }}>
                        <div style={{ color: theme.textSecondary, fontSize: '12px', marginBottom: '8px' }}>Timing Triggers:</div>
                        {intel.whenToReachOut.triggers.map((trigger, i) => (
                          <div key={i} style={{ color: theme.textPrimary, fontSize: '13px', padding: '6px 0', borderBottom: i < intel.whenToReachOut.triggers.length - 1 ? `1px solid ${theme.border}` : 'none' }}>
                            {trigger}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Urgency Score */}
                <div style={{ background: theme.bgSecondary, borderRadius: '12px', padding: '20px', border: `1px solid ${theme.border}` }}>
                  <h4 style={{ color: theme.textPrimary, fontSize: '14px', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ color: theme.accent }}>{Icons.zap}</span>
                    Urgency Score
                  </h4>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <div style={{
                      width: '100px',
                      height: '100px',
                      borderRadius: '50%',
                      background: `conic-gradient(${intel.urgencyScore >= 70 ? theme.error : intel.urgencyScore >= 40 ? theme.warning : theme.success} ${(intel.urgencyScore || 0) * 3.6}deg, ${theme.bgTertiary} 0deg)`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      position: 'relative'
                    }}>
                      <div style={{
                        width: '80px',
                        height: '80px',
                        borderRadius: '50%',
                        background: theme.bgSecondary,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexDirection: 'column'
                      }}>
                        <div style={{ fontSize: '28px', fontWeight: 700, color: intel.urgencyScore >= 70 ? theme.error : intel.urgencyScore >= 40 ? theme.warning : theme.success }}>
                          {intel.urgencyScore || 0}
                        </div>
                      </div>
                    </div>
                    <div>
                      <div style={{ color: theme.textPrimary, fontSize: '16px', fontWeight: 600 }}>
                        {intel.urgencyScore >= 70 ? 'Hot Lead!' : intel.urgencyScore >= 40 ? 'Warm Lead' : 'Standard Lead'}
                      </div>
                      <div style={{ color: theme.textSecondary, fontSize: '13px', marginTop: '4px' }}>
                        {intel.urgencyScore >= 70 ? 'Multiple high-priority signals detected. Prioritize this lead!' :
                         intel.urgencyScore >= 40 ? 'Good signals present. Worth pursuing soon.' :
                         'Normal priority. Follow standard outreach cadence.'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Personalization Tab */}
            {detailTab === 'personalization' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                {/* Icebreakers */}
                <div style={{ background: theme.bgSecondary, borderRadius: '12px', padding: '20px', border: `1px solid ${theme.border}` }}>
                  <h4 style={{ color: theme.textPrimary, fontSize: '14px', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ color: theme.accent }}>{Icons.messageCircle}</span>
                    Icebreaker Openers
                  </h4>
                  {(intel.icebreakers || []).length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {intel.icebreakers.map((ice, i) => (
                        <div key={i} style={{ padding: '12px', background: theme.bgTertiary, borderRadius: '8px' }}>
                          <div style={{ color: theme.textPrimary, fontSize: '14px', fontWeight: 500, marginBottom: '6px', fontStyle: 'italic' }}>
                            "{ice.opener}"
                          </div>
                          <div style={{ color: theme.textSecondary, fontSize: '12px' }}>{ice.context}</div>
                          <div style={{
                            display: 'inline-block',
                            marginTop: '8px',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            fontSize: '10px',
                            fontWeight: 600,
                            background: ice.effectiveness === 'high' ? `${theme.success}20` : `${theme.warning}20`,
                            color: ice.effectiveness === 'high' ? theme.success : theme.warning
                          }}>
                            {ice.effectiveness === 'high' ? 'HIGH IMPACT' : 'MEDIUM IMPACT'}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={{ color: theme.textMuted, fontSize: '13px' }}>No specific icebreakers generated.</p>
                  )}
                </div>

                {/* Personalization Hooks */}
                <div style={{ background: theme.bgSecondary, borderRadius: '12px', padding: '20px', border: `1px solid ${theme.border}` }}>
                  <h4 style={{ color: theme.textPrimary, fontSize: '14px', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ color: theme.accent }}>{Icons.award}</span>
                    Personalization Hooks
                  </h4>
                  {(intel.personalization || []).length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {intel.personalization.map((p, i) => (
                        <div key={i} style={{ padding: '12px', background: theme.bgTertiary, borderRadius: '8px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                            <span style={{
                              padding: '2px 8px',
                              borderRadius: '4px',
                              fontSize: '10px',
                              fontWeight: 600,
                              background: `${theme.accent}20`,
                              color: theme.accent,
                              textTransform: 'uppercase'
                            }}>
                              {p.type}
                            </span>
                          </div>
                          <div style={{ color: theme.textPrimary, fontSize: '14px', fontWeight: 500, marginBottom: '4px' }}>{p.hook}</div>
                          <div style={{ color: theme.textSecondary, fontSize: '12px' }}>{p.usage}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={{ color: theme.textMuted, fontSize: '13px' }}>No personalization hooks available.</p>
                  )}

                  {/* Value Props */}
                  {(intel.valueProps || []).length > 0 && (
                    <div style={{ marginTop: '20px' }}>
                      <h5 style={{ color: theme.textSecondary, fontSize: '12px', fontWeight: 600, marginBottom: '12px', textTransform: 'uppercase' }}>Value Propositions to Use</h5>
                      {intel.valueProps.map((vp, i) => (
                        <div key={i} style={{ padding: '10px', background: `${theme.success}10`, borderRadius: '6px', marginBottom: '8px' }}>
                          <div style={{ color: theme.textPrimary, fontSize: '13px', fontWeight: 500 }}>{vp.prop}</div>
                          <div style={{ color: theme.textSecondary, fontSize: '12px', marginTop: '4px' }}>Angle: {vp.angle}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Social Profiles Tab */}
            {detailTab === 'social' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                {[
                  { key: 'linkedin', name: 'LinkedIn', icon: Icons.linkedin, color: '#0A66C2' },
                  { key: 'twitter', name: 'Twitter/X', icon: Icons.twitter, color: '#1DA1F2' },
                  { key: 'instagram', name: 'Instagram', icon: Icons.instagram, color: '#E4405F' },
                  { key: 'tiktok', name: 'TikTok', icon: Icons.tiktok, color: '#000000' },
                  { key: 'youtube', name: 'YouTube', icon: Icons.youtube, color: '#FF0000' },
                  { key: 'facebook', name: 'Facebook', icon: Icons.facebook, color: '#1877F2' }
                ].map(platform => {
                  const profile = profiles[platform.key];
                  return (
                    <div
                      key={platform.key}
                      style={{
                        background: theme.bgSecondary,
                        borderRadius: '12px',
                        padding: '16px',
                        border: `1px solid ${profile ? platform.color + '40' : theme.border}`,
                        opacity: profile ? 1 : 0.5
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                        <span style={{ color: platform.color }}>{platform.icon}</span>
                        <span style={{ color: theme.textPrimary, fontSize: '14px', fontWeight: 500 }}>{platform.name}</span>
                        {profile && <span style={{ color: theme.success, marginLeft: 'auto' }}>{Icons.check}</span>}
                      </div>
                      {profile ? (
                        <div>
                          {profile.title && <div style={{ color: theme.textSecondary, fontSize: '13px', marginBottom: '8px' }}>{profile.title}</div>}
                          <a
                            href={profile.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              color: platform.color,
                              fontSize: '12px',
                              textDecoration: 'none'
                            }}
                          >
                            View Profile {Icons.externalLink}
                          </a>
                        </div>
                      ) : (
                        <div style={{ color: theme.textMuted, fontSize: '13px' }}>Not found</div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </td>
      </tr>
    );
  };

  // ==================== RENDER: RESULTS TAB ====================
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
            { label: 'Hot Leads', value: enrichedLeads.filter(l => l.leadTier === 'hot').length, icon: Icons.zap, color: '#EF4444' },
            { label: 'Warm Leads', value: enrichedLeads.filter(l => l.leadTier === 'warm').length, icon: Icons.trendingUp, color: '#F59E0B' },
            { label: 'Emails Found', value: stats.emailsFound, icon: Icons.mail, color: '#10B981' },
            { label: 'Social Found', value: stats.socialsFound, icon: Icons.instagram, color: '#8B5CF6' }
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

        {/* Success/Error Messages */}
        {successMessage && (
          <div style={{
            background: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: '10px',
            padding: '12px 16px',
            marginBottom: '16px',
            color: theme.success,
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            {Icons.check} {successMessage}
          </div>
        )}

        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '10px',
            padding: '12px 16px',
            marginBottom: '16px',
            color: theme.error,
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            {Icons.alertCircle} {error}
          </div>
        )}

        {/* Actions Bar */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
          gap: '16px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: theme.bgSecondary,
              border: `1px solid ${theme.border}`,
              borderRadius: '10px',
              padding: '10px 14px',
              maxWidth: '300px',
              flex: 1
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

            {/* Bulk Selection Info */}
            {selectedLeads.size > 0 && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '8px 16px',
                background: `${theme.accent}15`,
                borderRadius: '8px',
                border: `1px solid ${theme.accent}30`
              }}>
                <span style={{ color: theme.textPrimary, fontSize: '13px', fontWeight: 500 }}>
                  {selectedLeads.size} selected
                </span>
                <button
                  onClick={deleteSelectedLeads}
                  style={{
                    padding: '6px 12px',
                    background: theme.error,
                    border: 'none',
                    borderRadius: '6px',
                    color: 'white',
                    fontSize: '12px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  {Icons.trash} Delete Selected
                </button>
                <button
                  onClick={() => setSelectedLeads(new Set())}
                  style={{
                    padding: '6px 12px',
                    background: 'transparent',
                    border: `1px solid ${theme.border}`,
                    borderRadius: '6px',
                    color: theme.textSecondary,
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}
                >
                  Clear Selection
                </button>
              </div>
            )}
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
              title="Clear all data and start fresh"
            >
              {Icons.trash} Clear All
            </button>
            <button
              onClick={() => {
                setActiveTab('upload');
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
              {Icons.upload} Add More Leads
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
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '1400px' }}>
              <thead>
                <tr style={{ background: theme.bgTertiary }}>
                  <th style={{ padding: '14px 16px', textAlign: 'center', width: '50px' }}>
                    <input
                      type="checkbox"
                      checked={selectedLeads.size === filteredLeads.length && filteredLeads.length > 0}
                      onChange={selectAllLeads}
                      style={{ accentColor: theme.accent, cursor: 'pointer', width: '16px', height: '16px' }}
                      title="Select all"
                    />
                  </th>
                  <th style={{ padding: '14px 16px', textAlign: 'left', color: theme.textSecondary, fontSize: '12px', fontWeight: 600, textTransform: 'uppercase' }}>Company</th>
                  <th style={{ padding: '14px 16px', textAlign: 'center', color: theme.textSecondary, fontSize: '12px', fontWeight: 600, textTransform: 'uppercase' }}>Lead Score</th>
                  <th style={{ padding: '14px 16px', textAlign: 'left', color: theme.textSecondary, fontSize: '12px', fontWeight: 600, textTransform: 'uppercase' }}>Best Channel</th>
                  <th style={{ padding: '14px 16px', textAlign: 'left', color: theme.textSecondary, fontSize: '12px', fontWeight: 600, textTransform: 'uppercase' }}>Email</th>
                  <th style={{ padding: '14px 16px', textAlign: 'left', color: theme.textSecondary, fontSize: '12px', fontWeight: 600, textTransform: 'uppercase' }}>Social</th>
                  <th style={{ padding: '14px 16px', textAlign: 'left', color: theme.textSecondary, fontSize: '12px', fontWeight: 600, textTransform: 'uppercase' }}>Why Reach Out</th>
                  <th style={{ padding: '14px 16px', textAlign: 'center', color: theme.textSecondary, fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', width: '120px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredLeads.map((lead, idx) => (
                  <React.Fragment key={idx}>
                    <tr
                      style={{
                        borderTop: `1px solid ${theme.border}`,
                        background: selectedLeads.has(idx) ? `${theme.accent}08` : expandedLead === idx ? theme.bgTertiary : 'transparent',
                        transition: 'background 0.15s'
                      }}
                    >
                      <td style={{ padding: '14px 16px', textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selectedLeads.has(idx)}
                          onChange={() => toggleSelectLead(idx)}
                          style={{ accentColor: theme.accent, cursor: 'pointer', width: '16px', height: '16px' }}
                        />
                      </td>
                      <td
                        style={{ padding: '14px 16px', cursor: 'pointer' }}
                        onClick={() => { setExpandedLead(expandedLead === idx ? null : idx); setDetailTab('overview'); }}
                      >
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
                      {/* Lead Score Column */}
                      <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                          <div style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '44px',
                            height: '44px',
                            borderRadius: '50%',
                            background: lead.leadTier === 'hot' ? `${theme.error}20` : lead.leadTier === 'warm' ? `${theme.warning}20` : lead.leadTier === 'nurture' ? `${theme.accent}20` : `${theme.textMuted}20`,
                            color: lead.leadTier === 'hot' ? theme.error : lead.leadTier === 'warm' ? theme.warning : lead.leadTier === 'nurture' ? theme.accent : theme.textMuted,
                            fontSize: '16px',
                            fontWeight: 700
                          }}>
                            {lead.leadScore || 0}
                          </div>
                          <span style={{
                            fontSize: '10px',
                            fontWeight: 600,
                            textTransform: 'uppercase',
                            color: lead.leadTier === 'hot' ? theme.error : lead.leadTier === 'warm' ? theme.warning : lead.leadTier === 'nurture' ? theme.accent : theme.textMuted
                          }}>
                            {lead.leadTierLabel || 'Cold'}
                          </span>
                        </div>
                      </td>
                      {/* Best Channel Column */}
                      <td style={{ padding: '14px 16px' }}>
                        {lead.recommendedChannel ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{
                              color: lead.recommendedChannel.channel === 'LinkedIn' ? '#0A66C2' :
                                     lead.recommendedChannel.channel === 'Twitter/X' ? '#1DA1F2' :
                                     lead.recommendedChannel.channel === 'Instagram' ? '#E4405F' :
                                     lead.recommendedChannel.channel === 'TikTok' ? '#000' :
                                     lead.recommendedChannel.channel === 'Email' ? theme.success : theme.textMuted
                            }}>
                              {lead.recommendedChannel.channel === 'LinkedIn' ? Icons.linkedin :
                               lead.recommendedChannel.channel === 'Twitter/X' ? Icons.twitter :
                               lead.recommendedChannel.channel === 'Instagram' ? Icons.instagram :
                               lead.recommendedChannel.channel === 'TikTok' ? Icons.tiktok :
                               lead.recommendedChannel.channel === 'Email' ? Icons.mail : Icons.globe}
                            </span>
                            <div>
                              <div style={{ color: theme.textPrimary, fontSize: '13px', fontWeight: 500 }}>{lead.recommendedChannel.channel}</div>
                              <div style={{ color: theme.textMuted, fontSize: '10px' }}>{lead.recommendedChannel.reasons?.[0]?.slice(0, 30) || ''}</div>
                            </div>
                          </div>
                        ) : (
                          <span style={{ color: theme.textMuted, fontSize: '13px' }}>-</span>
                        )}
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
                          {(lead.socialProfiles?.instagram || lead.enrichment?.social?.profiles?.instagram) && <span style={{ color: '#E4405F' }} title="Instagram">{Icons.instagram}</span>}
                          {(lead.socialProfiles?.linkedin || lead.enrichment?.social?.profiles?.linkedin) && <span style={{ color: '#0A66C2' }} title="LinkedIn">{Icons.linkedin}</span>}
                          {(lead.socialProfiles?.twitter || lead.enrichment?.social?.profiles?.twitter) && <span style={{ color: '#1DA1F2' }} title="Twitter">{Icons.twitter}</span>}
                          {(lead.socialProfiles?.tiktok || lead.enrichment?.social?.profiles?.tiktok) && <span style={{ color: '#000' }} title="TikTok">{Icons.tiktok}</span>}
                          {Object.values(lead.socialProfiles || lead.enrichment?.social?.profiles || {}).filter(Boolean).length === 0 && <span style={{ color: theme.textMuted }}>-</span>}
                        </div>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                          {(lead.outreachIntelligence?.whyReachOut || []).slice(0, 2).map((reason, i) => (
                            <span key={i} style={{
                              background: reason.urgency === 'high' ? `${theme.error}20` : `${theme.accent}20`,
                              padding: '3px 8px',
                              borderRadius: '4px',
                              fontSize: '11px',
                              color: reason.urgency === 'high' ? theme.error : theme.accent
                            }}>
                              {reason.reason.slice(0, 25)}{reason.reason.length > 25 ? '...' : ''}
                            </span>
                          ))}
                          {(!lead.outreachIntelligence?.whyReachOut || lead.outreachIntelligence.whyReachOut.length === 0) && <span style={{ color: theme.textMuted, fontSize: '13px' }}>-</span>}
                        </div>
                      </td>
                      <td style={{ padding: '14px 16px', textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                          <button
                            onClick={() => rescanLead(lead, idx)}
                            style={{
                              padding: '6px 8px',
                              background: theme.bgTertiary,
                              border: `1px solid ${theme.border}`,
                              borderRadius: '6px',
                              color: theme.textSecondary,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontSize: '11px'
                            }}
                            title="Re-scan this lead"
                          >
                            {Icons.refresh}
                          </button>
                          <button
                            onClick={() => deleteLead(idx)}
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
                            title="Delete this lead"
                          >
                            {Icons.trash}
                          </button>
                          <button
                            onClick={() => { setExpandedLead(expandedLead === idx ? null : idx); setDetailTab('overview'); }}
                            style={{
                              padding: '6px 8px',
                              background: 'transparent',
                              border: 'none',
                              color: theme.textMuted,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center'
                            }}
                            title={expandedLead === idx ? 'Collapse' : 'Expand'}
                          >
                            {expandedLead === idx ? Icons.chevronUp : Icons.chevronDown}
                          </button>
                        </div>
                      </td>
                    </tr>
                    {expandedLead === idx && renderLeadDetail(lead)}
                  </React.Fragment>
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

      <main>
        {activeTab === 'upload' && renderUploadTab()}
        {activeTab === 'enriching' && renderEnrichingTab()}
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

export default EnrichmentPlatform;
