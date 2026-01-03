import React, { useState } from 'react';
import { scrapeWithN8n, discoverCompanies } from '../services/n8nService';

// ==================== CONSTANTS ====================
const INDUSTRIES = [
  'SaaS', 'E-commerce', 'Healthcare', 'FinTech', 'EdTech',
  'Real Estate', 'Manufacturing', 'Retail', 'Professional Services',
  'Marketing Agency', 'Logistics', 'Construction', 'Legal', 'Insurance'
];

const EMPLOYEE_RANGES = [
  { label: '1-10', min: 1, max: 10 },
  { label: '11-50', min: 11, max: 50 },
  { label: '51-200', min: 51, max: 200 },
  { label: '201-500', min: 201, max: 500 },
  { label: '501-1000', min: 501, max: 1000 },
  { label: '1000+', min: 1001, max: 100000 }
];

const REVENUE_RANGES = [
  { label: '$0 - $1M', min: 0, max: 1000000 },
  { label: '$1M - $10M', min: 1000000, max: 10000000 },
  { label: '$10M - $50M', min: 10000000, max: 50000000 },
  { label: '$50M - $100M', min: 50000000, max: 100000000 },
  { label: '$100M+', min: 100000000, max: 10000000000 }
];

const LOCATIONS = [
  'United States', 'Canada', 'United Kingdom', 'Germany', 'France',
  'Australia', 'Netherlands', 'Spain', 'Italy', 'Brazil', 'Mexico',
  'India', 'Singapore', 'Japan', 'South Korea'
];

const HIRING_ROLES = [
  'Sales / Account Executive', 'Business Development', 'Marketing',
  'Customer Success', 'SDR / BDR', 'Engineering', 'Product', 'Operations'
];

const TECH_STACK_OPTIONS = [
  'HubSpot', 'Salesforce', 'Marketo', 'Pardot', 'Intercom',
  'Drift', 'Zendesk', 'Freshdesk', 'Segment', 'Mixpanel',
  'Google Analytics', 'Hotjar', 'Calendly', 'Stripe', 'Shopify'
];

const SIGNAL_TYPES = [
  { id: 'afterHoursCoverage', label: 'After Hours Coverage Gap', description: 'Visitors reach the site after business hours, but there is no immediate way to respond or capture them.', icon: '🌙', color: '#6366F1' },
  { id: 'googlePaidTraffic', label: 'Google Paid Traffic Active', description: 'This business is currently paying for search ads to drive visitors to their website.', icon: 'G', color: '#EA4335' },
  { id: 'inboundResponseRisk', label: 'Inbound Response Risk', description: 'Slow or no response to inbound inquiries, risking lost opportunities from paid and organic traffic.', icon: '⚠', color: '#F59E0B' }
];

// High-value target companies - mix of industries known to spend on Google Ads
// These are IDEAL prospects: running ads + likely have after-hours gaps
const MOCK_COMPANIES = [
  // HOME SERVICES - Heavy ad spenders, often lack 24/7 coverage
  { name: 'ABC Plumbing', domain: 'abcplumbing.com', industry: 'Professional Services', employees: '11-50', location: 'United States', revenue: '$1M - $10M' },
  { name: 'Merry Maids', domain: 'merrymaids.com', industry: 'Professional Services', employees: '201-500', location: 'United States', revenue: '$50M - $100M' },
  { name: 'Stanley Steemer', domain: 'stanleysteemer.com', industry: 'Professional Services', employees: '1000+', location: 'United States', revenue: '$100M+' },
  { name: '1-800-GOT-JUNK', domain: '1800gotjunk.com', industry: 'Professional Services', employees: '201-500', location: 'United States', revenue: '$50M - $100M' },
  { name: 'Mosquito Joe', domain: 'mosquitojoe.com', industry: 'Professional Services', employees: '51-200', location: 'United States', revenue: '$10M - $50M' },
  // LEGAL - Known Google Ads spenders, often poor response times
  { name: 'Morgan & Morgan', domain: 'forthepeople.com', industry: 'Legal', employees: '1000+', location: 'United States', revenue: '$100M+' },
  { name: 'Jacoby & Meyers', domain: 'jacobyandmeyers.com', industry: 'Legal', employees: '201-500', location: 'United States', revenue: '$50M - $100M' },
  { name: 'Sokolove Law', domain: 'sokolovelaw.com', industry: 'Legal', employees: '201-500', location: 'United States', revenue: '$50M - $100M' },
  // HEALTHCARE/DENTAL - High CPC advertisers
  { name: 'Aspen Dental', domain: 'aspendental.com', industry: 'Healthcare', employees: '1000+', location: 'United States', revenue: '$100M+' },
  { name: 'ClearChoice', domain: 'clearchoice.com', industry: 'Healthcare', employees: '501-1000', location: 'United States', revenue: '$100M+' },
  { name: 'Ideal Image', domain: 'idealimage.com', industry: 'Healthcare', employees: '501-1000', location: 'United States', revenue: '$100M+' },
  // REAL ESTATE - Always advertising
  { name: 'Offerpad', domain: 'offerpad.com', industry: 'Real Estate', employees: '501-1000', location: 'United States', revenue: '$100M+' },
  { name: 'HomeVestors', domain: 'homevestors.com', industry: 'Real Estate', employees: '201-500', location: 'United States', revenue: '$50M - $100M' },
  { name: 'We Buy Ugly Houses', domain: 'webuyuglyhouses.com', industry: 'Real Estate', employees: '51-200', location: 'United States', revenue: '$10M - $50M' },
  // INSURANCE - Highest CPCs, often slow response
  { name: 'SelectQuote', domain: 'selectquote.com', industry: 'Insurance', employees: '1000+', location: 'United States', revenue: '$100M+' },
  { name: 'eHealth', domain: 'ehealthinsurance.com', industry: 'Insurance', employees: '501-1000', location: 'United States', revenue: '$100M+' },
  { name: 'GoHealth', domain: 'gohealth.com', industry: 'Insurance', employees: '1000+', location: 'United States', revenue: '$100M+' },
  // MARKETING AGENCIES - Run their own ads
  { name: 'WebFX', domain: 'webfx.com', industry: 'Marketing Agency', employees: '201-500', location: 'United States', revenue: '$50M - $100M' },
  { name: 'Thrive Agency', domain: 'thriveagency.com', industry: 'Marketing Agency', employees: '51-200', location: 'United States', revenue: '$10M - $50M' },
  { name: 'Straight North', domain: 'straightnorth.com', industry: 'Marketing Agency', employees: '51-200', location: 'United States', revenue: '$10M - $50M' },
  // E-COMMERCE - Active advertisers
  { name: 'MVMT Watches', domain: 'mvmt.com', industry: 'E-commerce', employees: '51-200', location: 'United States', revenue: '$50M - $100M' },
  { name: 'Ridge Wallet', domain: 'ridge.com', industry: 'E-commerce', employees: '51-200', location: 'United States', revenue: '$50M - $100M' },
  { name: 'Manscaped', domain: 'manscaped.com', industry: 'E-commerce', employees: '201-500', location: 'United States', revenue: '$100M+' },
  // SAAS - Good mix
  { name: 'Monday.com', domain: 'monday.com', industry: 'SaaS', employees: '1000+', location: 'United States', revenue: '$100M+' },
  { name: 'Pipedrive', domain: 'pipedrive.com', industry: 'SaaS', employees: '501-1000', location: 'United States', revenue: '$100M+' },
  { name: 'Freshworks', domain: 'freshworks.com', industry: 'SaaS', employees: '1000+', location: 'United States', revenue: '$100M+' },
  // FINTECH - High value leads
  { name: 'LendingTree', domain: 'lendingtree.com', industry: 'FinTech', employees: '501-1000', location: 'United States', revenue: '$100M+' },
  { name: 'NerdWallet', domain: 'nerdwallet.com', industry: 'FinTech', employees: '501-1000', location: 'United States', revenue: '$100M+' },
  { name: 'Credit Karma', domain: 'creditkarma.com', industry: 'FinTech', employees: '1000+', location: 'United States', revenue: '$100M+' },
  // EDUCATION - Known advertisers
  { name: 'Coursera', domain: 'coursera.org', industry: 'EdTech', employees: '1000+', location: 'United States', revenue: '$100M+' },
  { name: 'Udemy', domain: 'udemy.com', industry: 'EdTech', employees: '1000+', location: 'United States', revenue: '$100M+' }
];

// ==================== ICONS ====================
const Icons = {
  chevronDown: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>,
  chevronUp: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="18 15 12 9 6 15"/></svg>,
  check: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>,
  x: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  search: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  download: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
  stop: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/></svg>,
  zap: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
  database: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>,
  alertCircle: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>,
  externalLink: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>,
  settings: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/></svg>,
  target: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>,
  refresh: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/></svg>,
  sliders: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/></svg>,
  list: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>,
  plus: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  folder: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg>,
  edit: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  trash: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>,
  arrowLeft: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>,
  users: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>,
  move: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="5 9 2 12 5 15"/><polyline points="9 5 12 2 15 5"/><polyline points="15 19 12 22 9 19"/><polyline points="19 9 22 12 19 15"/><line x1="2" y1="12" x2="22" y2="12"/><line x1="12" y1="2" x2="12" y2="22"/></svg>,
  minus: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12"/></svg>
};

// ==================== CHECKBOX COMPONENT ====================
const Checkbox = ({ checked, indeterminate, onChange, disabled }) => (
  <div
    onClick={(e) => { e.stopPropagation(); if (!disabled) onChange(!checked); }}
    style={{
      width: '18px', height: '18px', borderRadius: '4px',
      border: checked || indeterminate ? 'none' : '2px solid #475569',
      background: checked || indeterminate ? '#3B82F6' : 'transparent',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      cursor: disabled ? 'not-allowed' : 'pointer', flexShrink: 0,
      opacity: disabled ? 0.5 : 1
    }}
  >
    {checked && <span style={{ color: 'white' }}>{Icons.check}</span>}
    {indeterminate && !checked && <span style={{ color: 'white' }}>{Icons.minus}</span>}
  </div>
);

// ==================== REUSABLE COMPONENTS ====================
const MultiSelect = ({ label, options, selected, onChange, placeholder }) => {
  const [isOpen, setIsOpen] = useState(false);
  const toggleOption = (option) => {
    if (selected.includes(option)) onChange(selected.filter(s => s !== option));
    else onChange([...selected, option]);
  };
  return (
    <div style={{ position: 'relative' }}>
      {label && <label style={{ display: 'block', color: '#94A3B8', fontSize: '11px', marginBottom: '8px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.8px' }}>{label}</label>}
      <button onClick={() => setIsOpen(!isOpen)}
        style={{ width: '100%', padding: '12px 14px', background: 'rgba(255, 255, 255, 0.03)', border: isOpen ? '1px solid rgba(59, 130, 246, 0.5)' : '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '10px', color: selected.length > 0 ? '#E2E8F0' : '#64748B', fontSize: '13px', fontWeight: 500, textAlign: 'left', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'all 0.2s ease' }}>
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selected.length > 0 ? `${selected.length} selected` : placeholder}</span>
        <span style={{ color: '#64748B', transition: 'transform 0.2s ease', transform: isOpen ? 'rotate(180deg)' : 'rotate(0)' }}>{Icons.chevronDown}</span>
      </button>
      {isOpen && (
        <>
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 40 }} onClick={() => setIsOpen(false)} />
          <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: '6px', background: 'rgba(17, 24, 39, 0.98)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '12px', maxHeight: '220px', overflowY: 'auto', zIndex: 50, boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)' }}>
            {options.map((option, i) => (
              <div key={option} onClick={() => toggleOption(option)} style={{ padding: '11px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', background: selected.includes(option) ? 'rgba(59, 130, 246, 0.1)' : 'transparent', color: '#E2E8F0', fontSize: '13px', fontWeight: 500, borderBottom: i < options.length - 1 ? '1px solid rgba(255, 255, 255, 0.04)' : 'none', transition: 'background 0.15s ease' }}>
                <span style={{ width: '18px', height: '18px', border: selected.includes(option) ? 'none' : '2px solid rgba(255, 255, 255, 0.2)', borderRadius: '5px', background: selected.includes(option) ? 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s ease', flexShrink: 0 }}>
                  {selected.includes(option) && <span style={{ color: 'white' }}>{Icons.check}</span>}
                </span>
                {option}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

const Select = ({ label, options, value, onChange, placeholder }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div style={{ position: 'relative' }}>
      {label && <label style={{ display: 'block', color: '#94A3B8', fontSize: '11px', marginBottom: '8px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.8px' }}>{label}</label>}
      <button onClick={() => setIsOpen(!isOpen)}
        style={{ width: '100%', padding: '12px 14px', background: 'rgba(255, 255, 255, 0.03)', border: isOpen ? '1px solid rgba(59, 130, 246, 0.5)' : '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '10px', color: value ? '#E2E8F0' : '#64748B', fontSize: '13px', fontWeight: 500, textAlign: 'left', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'all 0.2s ease' }}>
        {value || placeholder}
        <span style={{ color: '#64748B', transition: 'transform 0.2s ease', transform: isOpen ? 'rotate(180deg)' : 'rotate(0)' }}>{Icons.chevronDown}</span>
      </button>
      {isOpen && (
        <>
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 40 }} onClick={() => setIsOpen(false)} />
          <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: '6px', background: 'rgba(17, 24, 39, 0.98)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '12px', maxHeight: '220px', overflowY: 'auto', zIndex: 50, boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)' }}>
            <div onClick={() => { onChange(null); setIsOpen(false); }} style={{ padding: '11px 14px', cursor: 'pointer', background: !value ? 'rgba(59, 130, 246, 0.1)' : 'transparent', color: '#64748B', fontSize: '13px', fontWeight: 500, borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>{placeholder}</div>
            {options.map((option, i) => (
              <div key={typeof option === 'object' ? option.label : option} onClick={() => { onChange(typeof option === 'object' ? option.label : option); setIsOpen(false); }}
                style={{ padding: '11px 14px', cursor: 'pointer', background: (typeof option === 'object' ? option.label : option) === value ? 'rgba(59, 130, 246, 0.1)' : 'transparent', color: '#E2E8F0', fontSize: '13px', fontWeight: 500, borderBottom: i < options.length - 1 ? '1px solid rgba(255, 255, 255, 0.04)' : 'none', transition: 'background 0.15s ease' }}>
                {typeof option === 'object' ? option.label : option}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

const SignalCard = ({ signal, enabled, onChange }) => (
  <div onClick={() => onChange(!enabled)}
    style={{ padding: '16px 18px', background: enabled ? `${signal.color}15` : 'rgba(255, 255, 255, 0.02)', border: enabled ? `1px solid ${signal.color}40` : '1px solid rgba(255, 255, 255, 0.06)', borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'flex-start', gap: '16px', transition: 'all 0.2s ease', boxShadow: enabled ? `0 4px 20px ${signal.color}15` : 'none' }}>
    <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: enabled ? signal.color : 'rgba(255, 255, 255, 0.06)', color: enabled ? 'white' : '#94A3B8', fontSize: signal.icon.length > 1 ? '17px' : '15px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.2s ease', boxShadow: enabled ? `0 4px 12px ${signal.color}30` : 'none' }}>{signal.icon}</div>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ color: enabled ? '#F8FAFC' : '#94A3B8', fontSize: '14px', fontWeight: 600, marginBottom: '6px', letterSpacing: '-0.2px', transition: 'color 0.2s ease' }}>{signal.label}</div>
      <div style={{ color: '#64748B', fontSize: '12px', lineHeight: '1.5' }}>{signal.description}</div>
    </div>
    <div style={{ width: '22px', height: '22px', borderRadius: '6px', border: enabled ? 'none' : '2px solid rgba(255, 255, 255, 0.15)', background: enabled ? 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '4px', transition: 'all 0.2s ease', boxShadow: enabled ? '0 2px 8px rgba(59, 130, 246, 0.3)' : 'none' }}>
      {enabled && <span style={{ color: 'white' }}>{Icons.check}</span>}
    </div>
  </div>
);

// ==================== MAIN APP ====================
const SAIScraper = () => {
  // Navigation
  const [currentPage, setCurrentPage] = useState('scraper');
  const [selectedListId, setSelectedListId] = useState(null);

  // n8n mode toggle
  const [useN8n, setUseN8n] = useState(false);
  const [n8nError, setN8nError] = useState(null);

  // Lists
  const [lists, setLists] = useState([
    { id: 1, name: 'Hot Leads', color: '#EF4444', leads: [], createdAt: '2024-01-15' },
    { id: 2, name: 'To Follow Up', color: '#F59E0B', leads: [], createdAt: '2024-01-14' },
    { id: 3, name: 'Qualified', color: '#10B981', leads: [], createdAt: '2024-01-12' }
  ]);
  const [editingListId, setEditingListId] = useState(null);
  const [editingListName, setEditingListName] = useState('');
  const [showCreateList, setShowCreateList] = useState(false);
  const [newListName, setNewListName] = useState('');

  // ICP Filters
  const [icpFilters, setIcpFilters] = useState({ industries: [], employeeRange: null, revenueRange: null, locations: [], hiringRoles: [], techStack: [] });

  // Signal Filters
  const [enabledSignals, setEnabledSignals] = useState({ afterHoursCoverage: true, googlePaidTraffic: true, inboundResponseRisk: false });

  // Search Settings
  const [maxResults, setMaxResults] = useState(100);
  const [minScore, setMinScore] = useState(50);

  // Scraper State
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStatus, setCurrentStatus] = useState('');
  const [companiesFound, setCompaniesFound] = useState(0);

  // Results
  const [results, setResults] = useState([]);

  // Selection State
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [showBulkListPicker, setShowBulkListPicker] = useState(false);

  // Company Detail
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [showListPicker, setShowListPicker] = useState(false);

  // List page state
  const [showMoveToList, setShowMoveToList] = useState(false);
  const [leadToMove, setLeadToMove] = useState(null);

  // Counts
  const activeSignalCount = Object.values(enabledSignals).filter(Boolean).length;
  const activeIcpCount = [icpFilters.industries.length > 0, icpFilters.employeeRange, icpFilters.revenueRange, icpFilters.locations.length > 0, icpFilters.hiringRoles.length > 0, icpFilters.techStack.length > 0].filter(Boolean).length;
  const canStartScraping = activeSignalCount > 0;

  // Selection helpers
  const allSelected = results.length > 0 && selectedIds.size === results.length;
  const someSelected = selectedIds.size > 0 && selectedIds.size < results.length;

  const toggleSelectAll = () => {
    if (allSelected) setSelectedIds(new Set());
    else setSelectedIds(new Set(results.map(r => r.id)));
  };

  const toggleSelect = (id) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  // Helpers
  const getSignalValue = (signal) => {
    const values = {
      afterHoursCoverage: ['No chat after 6pm', 'No weekend coverage', 'Form-only after hours', 'Voicemail after 5pm'][Math.floor(Math.random() * 4)],
      googlePaidTraffic: ['$15K/mo spend', '$25K/mo spend', '$50K/mo spend', '$80K/mo spend'][Math.floor(Math.random() * 4)],
      inboundResponseRisk: ['Avg 4hr response time', 'No live chat', 'Form response >24hrs', 'High bounce rate'][Math.floor(Math.random() * 4)]
    };
    return values[signal] || 'Detected';
  };

  const getWhyNow = (signals) => {
    if (signals.includes('googlePaidTraffic') && signals.includes('afterHoursCoverage')) return 'Paying for ads but missing after-hours leads';
    if (signals.includes('googlePaidTraffic') && signals.includes('inboundResponseRisk')) return 'Ad spend at risk due to slow response';
    if (signals.includes('afterHoursCoverage') && signals.includes('inboundResponseRisk')) return 'Coverage gaps losing inbound opportunities';
    if (signals.includes('googlePaidTraffic')) return 'Active ad spend detected';
    if (signals.includes('afterHoursCoverage')) return 'After-hours coverage gap identified';
    if (signals.includes('inboundResponseRisk')) return 'Inbound response at risk';
    return 'Signal activity detected';
  };

  // Handlers
  const handleClearFilters = () => setIcpFilters({ industries: [], employeeRange: null, revenueRange: null, locations: [], hiringRoles: [], techStack: [] });

  // n8n-powered scrape with company discovery
  const handleN8nScrape = async () => {
    if (!canStartScraping) return;
    setIsRunning(true);
    setProgress(0);
    setResults([]);
    setCompaniesFound(0);
    setSelectedIds(new Set());
    setN8nError(null);

    let eligibleCompanies = [];
    let domains = [];

    // Check if we have filters that require discovery
    const hasDiscoveryFilters = icpFilters.industries.length > 0 || icpFilters.locations.length > 0;

    if (hasDiscoveryFilters) {
      // DISCOVERY MODE: Find new companies based on ICP filters
      setCurrentStatus('Discovering companies matching your ICP...');
      setProgress(10);

      try {
        const discoveredCompanies = await discoverCompanies(icpFilters, maxResults);
        console.log('Discovered companies:', discoveredCompanies);

        if (discoveredCompanies.length === 0) {
          setN8nError('No companies found matching your filters. Try broadening your search.');
          setIsRunning(false);
          return;
        }

        eligibleCompanies = discoveredCompanies.slice(0, maxResults);
        domains = eligibleCompanies.map(c => c.domain);
        setCurrentStatus(`Found ${eligibleCompanies.length} companies, now analyzing signals...`);
        setProgress(30);
      } catch (error) {
        // Fallback to mock companies if discovery fails
        console.error('Discovery failed, falling back to sample companies:', error);
        setCurrentStatus('Discovery service unavailable, using sample companies...');
        eligibleCompanies = [...MOCK_COMPANIES];
        if (icpFilters.industries.length > 0) eligibleCompanies = eligibleCompanies.filter(c => icpFilters.industries.includes(c.industry));
        if (icpFilters.locations.length > 0) eligibleCompanies = eligibleCompanies.filter(c => icpFilters.locations.includes(c.location));
        if (icpFilters.employeeRange) eligibleCompanies = eligibleCompanies.filter(c => c.employees === icpFilters.employeeRange);
        if (icpFilters.revenueRange) eligibleCompanies = eligibleCompanies.filter(c => c.revenue === icpFilters.revenueRange);
        if (eligibleCompanies.length === 0) eligibleCompanies = [...MOCK_COMPANIES];
        eligibleCompanies = eligibleCompanies.slice(0, maxResults);
        domains = eligibleCompanies.map(c => c.domain);
        setProgress(20);
      }
    } else {
      // NO FILTERS: Use sample companies (legacy behavior)
      setCurrentStatus('Sending sample domains to n8n workflow...');
      setProgress(20);
      eligibleCompanies = [...MOCK_COMPANIES].slice(0, maxResults);
      domains = eligibleCompanies.map(c => c.domain);
    }

    try {
      setCurrentStatus('Processing domains through n8n...');
      setProgress(50);

      const n8nResults = await scrapeWithN8n(domains);

      setCurrentStatus('Processing n8n results...');
      setProgress(80);

      // Ensure we have an array
      const resultsArray = Array.isArray(n8nResults) ? n8nResults : [n8nResults];

      console.log('Raw n8n results array:', JSON.stringify(resultsArray, null, 2));

      // Map n8n results back to our format
      const processedResults = resultsArray.map((result, index) => {
        // Handle case where result might be wrapped
        const r = result?.json || result;

        console.log(`Processing item ${index}:`, JSON.stringify(r, null, 2));

        const company = eligibleCompanies.find(c => c.domain === r.domain) || eligibleCompanies[index];

        // Extract signals - handle both array and object formats
        let signalsList = [];
        let signalDetails = [];

        if (Array.isArray(r.signals)) {
          console.log(`Item ${index} has signals array:`, r.signals);
          signalsList = r.signals.filter(s => s && s.detected).map(s => s.id);
          signalDetails = r.signals.filter(s => s && s.detected).map(s => ({
            type: s.label || s.id,
            value: s.value || s.reason,
            detected: r.checkedAt || r.timestamps?.scrapedAt
          }));
        } else if (r.signals && typeof r.signals === 'object') {
          console.log(`Item ${index} has signals object:`, r.signals);
          // Handle signals as object with keys like googleAds, afterHoursCoverage, etc.
          Object.entries(r.signals).forEach(([key, val]) => {
            if (val?.detected) {
              signalsList.push(key);
              signalDetails.push({
                type: val.label || key,
                value: val.value || val.reason || val.details,
                detected: r.checkedAt || r.timestamps?.scrapedAt
              });
            }
          });
        }

        const score = r.score || r.totalScore || 0;
        console.log(`Item ${index} - domain: ${r.domain}, score: ${score}, signals: ${signalsList.length}, disqualified: ${r.disqualified}`);

        return {
          id: Date.now() + index,
          name: company?.name || r.domain || 'Unknown',
          domain: r.domain || company?.domain || 'unknown.com',
          industry: company?.industry || 'Unknown',
          employees: company?.employees || 'Unknown',
          location: company?.location || 'Unknown',
          revenue: company?.revenue || 'Unknown',
          score: score,
          signals: signalsList,
          signalDetails: signalDetails,
          whyNow: r.whyNow || r.explanation || r.disqualifyReason || 'Signal detected',
          scrapedAt: r.checkedAt || r.timestamps?.scrapedAt,
          disqualified: r.disqualified || false,
          readyState: r.readyState
        };
      });

      console.log('All processed results before filter:', processedResults);

      // Show all results including disqualified (score 0) for now - filter less aggressively
      const filteredResults = processedResults.filter(r => r.domain && r.domain !== 'unknown.com');

      console.log('Filtered results:', filteredResults.length);

      setResults(filteredResults.sort((a, b) => b.score - a.score));
      setCompaniesFound(filteredResults.length);
      setProgress(100);
      setCurrentStatus('Complete');
    } catch (error) {
      setN8nError(error.message);
      setCurrentStatus('Error: ' + error.message);
    } finally {
      setIsRunning(false);
    }
  };

  const handleStartScrape = () => {
    if (!canStartScraping) return;

    // Use n8n if enabled
    if (useN8n) {
      handleN8nScrape();
      return;
    }

    // Original mock scrape logic
    setIsRunning(true);
    setProgress(0);
    setResults([]);
    setCompaniesFound(0);
    setSelectedIds(new Set());

    const activeSignals = Object.entries(enabledSignals).filter(([_, e]) => e).map(([k]) => k);
    let eligibleCompanies = [...MOCK_COMPANIES];
    if (icpFilters.industries.length > 0) eligibleCompanies = eligibleCompanies.filter(c => icpFilters.industries.includes(c.industry));
    if (icpFilters.locations.length > 0) eligibleCompanies = eligibleCompanies.filter(c => icpFilters.locations.includes(c.location));
    if (icpFilters.employeeRange) eligibleCompanies = eligibleCompanies.filter(c => c.employees === icpFilters.employeeRange);
    if (icpFilters.revenueRange) eligibleCompanies = eligibleCompanies.filter(c => c.revenue === icpFilters.revenueRange);
    if (eligibleCompanies.length === 0) eligibleCompanies = [...MOCK_COMPANIES];
    eligibleCompanies = eligibleCompanies.slice(0, maxResults);

    const phases = [
      { status: 'Initializing signal sources...', duration: 800 },
      { status: 'Scanning Google Ads Transparency...', duration: 1500 },
      { status: 'Analyzing business hours coverage...', duration: 1200 },
      { status: 'Evaluating inbound response patterns...', duration: 1000 },
      { status: 'Calculating scores...', duration: 800 },
      { status: 'Finalizing results...', duration: 500 }
    ];

    let currentPhase = 0, foundCount = 0;
    const runPhase = () => {
      if (currentPhase >= phases.length) { setIsRunning(false); setCurrentStatus('Complete'); setProgress(100); return; }
      const phase = phases[currentPhase];
      setCurrentStatus(phase.status);
      setProgress(((currentPhase + 1) / phases.length) * 100);

      if (currentPhase >= 1 && currentPhase <= 4 && foundCount < eligibleCompanies.length) {
        const numToAdd = Math.min(Math.floor(Math.random() * 3) + 1, eligibleCompanies.length - foundCount);
        for (let i = 0; i < numToAdd; i++) {
          const company = eligibleCompanies[foundCount + i];
          if (!company) continue;
          const detectedSignals = activeSignals.filter(() => Math.random() > 0.25);
          const score = Math.min(100, detectedSignals.length * 25 + Math.floor(Math.random() * 30));
          if (score >= minScore && detectedSignals.length > 0) {
            const result = {
              id: Date.now() + foundCount + i, name: company.name, domain: company.domain, industry: company.industry,
              employees: company.employees, location: company.location, revenue: company.revenue, score,
              signals: detectedSignals,
              signalDetails: detectedSignals.map(s => ({ type: SIGNAL_TYPES.find(st => st.id === s)?.label || s, value: getSignalValue(s), detected: 'Just now' })),
              whyNow: getWhyNow(detectedSignals), scrapedAt: new Date().toISOString()
            };
            setResults(prev => [...prev, result].sort((a, b) => b.score - a.score));
          }
        }
        foundCount += numToAdd;
        setCompaniesFound(foundCount);
      }
      currentPhase++;
      setTimeout(runPhase, phase.duration);
    };
    runPhase();
  };

  const handleStopScrape = () => { setIsRunning(false); setCurrentStatus('Stopped'); };

  const handleExport = () => {
    const data = selectedIds.size > 0 ? results.filter(r => selectedIds.has(r.id)) : results;
    const csvContent = [
      ['Company', 'Domain', 'Score', 'Industry', 'Employees', 'Location', 'Revenue', 'Signals', 'Why Now'].join(','),
      ...data.map(r => [r.name, r.domain, r.score, r.industry, r.employees, r.location, r.revenue, r.signals.map(s => SIGNAL_TYPES.find(st => st.id === s)?.label).join('; '), r.whyNow].join(','))
    ].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sai-scraper-results-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  // List management
  const handleAddToList = (listId) => {
    if (!selectedCompany) return;
    setLists(lists.map(list => {
      if (list.id === listId && !list.leads.some(l => l.id === selectedCompany.id)) {
        return { ...list, leads: [...list.leads, selectedCompany] };
      }
      return list;
    }));
    setShowListPicker(false);
    setSelectedCompany(null);
  };

  const handleBulkAddToList = (listId) => {
    const leadsToAdd = results.filter(r => selectedIds.has(r.id));
    setLists(lists.map(list => {
      if (list.id === listId) {
        const existingIds = new Set(list.leads.map(l => l.id));
        const newLeads = leadsToAdd.filter(l => !existingIds.has(l.id));
        return { ...list, leads: [...list.leads, ...newLeads] };
      }
      return list;
    }));
    setShowBulkListPicker(false);
    setSelectedIds(new Set());
  };

  const handleCreateList = () => {
    if (!newListName.trim()) return;
    const colors = ['#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899'];
    const newList = { id: Date.now(), name: newListName.trim(), color: colors[lists.length % colors.length], leads: [], createdAt: new Date().toISOString().split('T')[0] };
    setLists([...lists, newList]);
    setNewListName('');
    setShowCreateList(false);
  };

  const handleDeleteList = (listId) => { setLists(lists.filter(l => l.id !== listId)); if (selectedListId === listId) setSelectedListId(null); };
  const handleRenameList = (listId) => { if (!editingListName.trim()) return; setLists(lists.map(l => l.id === listId ? { ...l, name: editingListName.trim() } : l)); setEditingListId(null); setEditingListName(''); };
  const handleRemoveFromList = (listId, leadId) => { setLists(lists.map(list => list.id === listId ? { ...list, leads: list.leads.filter(l => l.id !== leadId) } : list)); };
  const handleMoveToList = (fromListId, toListId, lead) => {
    setLists(lists.map(list => {
      if (list.id === fromListId) return { ...list, leads: list.leads.filter(l => l.id !== lead.id) };
      if (list.id === toListId && !list.leads.some(l => l.id === lead.id)) return { ...list, leads: [...list.leads, lead] };
      return list;
    }));
    setShowMoveToList(false);
    setLeadToMove(null);
  };

  const selectedList = lists.find(l => l.id === selectedListId);

  // ==================== RENDER SCRAPER ====================
  const renderScraperPage = () => (
    <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
      {/* Left Panel */}
      <div style={{ width: '420px', borderRight: '1px solid rgba(255, 255, 255, 0.06)', display: 'flex', flexDirection: 'column', background: 'linear-gradient(180deg, rgba(17, 24, 39, 0.95) 0%, rgba(10, 15, 26, 0.98) 100%)' }}>
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 0 20px 0' }}>
          {/* n8n Toggle */}
          <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255, 255, 255, 0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255, 255, 255, 0.02)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: useN8n ? '#10B981' : '#475569', boxShadow: useN8n ? '0 0 12px rgba(16, 185, 129, 0.5)' : 'none', transition: 'all 0.3s ease' }} />
              <span style={{ color: useN8n ? '#F1F5F9' : '#94A3B8', fontSize: '13px', fontWeight: 600, letterSpacing: '-0.2px' }}>Live Scraping</span>
              {useN8n && <span style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34D399', padding: '3px 10px', borderRadius: '100px', fontSize: '10px', fontWeight: 700, border: '1px solid rgba(16, 185, 129, 0.2)', letterSpacing: '0.5px' }}>ACTIVE</span>}
            </div>
            <button
              onClick={() => setUseN8n(!useN8n)}
              style={{
                width: '48px', height: '26px', borderRadius: '13px', border: 'none',
                background: useN8n ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)' : 'rgba(255, 255, 255, 0.1)',
                cursor: 'pointer', position: 'relative', transition: 'all 0.3s ease',
                boxShadow: useN8n ? '0 2px 8px rgba(16, 185, 129, 0.3)' : 'inset 0 1px 3px rgba(0, 0, 0, 0.3)'
              }}
            >
              <div style={{
                width: '20px', height: '20px', borderRadius: '50%', background: 'white',
                position: 'absolute', top: '3px', left: useN8n ? '25px' : '3px', transition: 'left 0.2s ease',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.2)'
              }} />
            </button>
          </div>

          {/* ICP Filters */}
          <div style={{ padding: '24px', borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(59, 130, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#60A5FA' }}>{Icons.target}</div>
                <span style={{ color: '#F8FAFC', fontSize: '14px', fontWeight: 700, letterSpacing: '-0.3px' }}>ICP Filters</span>
                {activeIcpCount > 0 && <span style={{ background: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)', color: 'white', padding: '3px 10px', borderRadius: '100px', fontSize: '11px', fontWeight: 700 }}>{activeIcpCount}</span>}
              </div>
              {activeIcpCount > 0 && <button onClick={handleClearFilters} style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '6px', padding: '6px 12px', color: '#94A3B8', fontSize: '11px', cursor: 'pointer', fontWeight: 500, transition: 'all 0.2s ease' }}>Clear all</button>}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <MultiSelect label="Industry" options={INDUSTRIES} selected={icpFilters.industries} onChange={(v) => setIcpFilters({ ...icpFilters, industries: v })} placeholder="All industries" />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <Select label="Employees" options={EMPLOYEE_RANGES.map(r => r.label)} value={icpFilters.employeeRange} onChange={(v) => setIcpFilters({ ...icpFilters, employeeRange: v })} placeholder="Any size" />
                <Select label="Revenue" options={REVENUE_RANGES.map(r => r.label)} value={icpFilters.revenueRange} onChange={(v) => setIcpFilters({ ...icpFilters, revenueRange: v })} placeholder="Any revenue" />
              </div>
              <MultiSelect label="Location" options={LOCATIONS} selected={icpFilters.locations} onChange={(v) => setIcpFilters({ ...icpFilters, locations: v })} placeholder="All locations" />
              <MultiSelect label="Hiring for Roles" options={HIRING_ROLES} selected={icpFilters.hiringRoles} onChange={(v) => setIcpFilters({ ...icpFilters, hiringRoles: v })} placeholder="Any role" />
              <MultiSelect label="Uses Tech Stack" options={TECH_STACK_OPTIONS} selected={icpFilters.techStack} onChange={(v) => setIcpFilters({ ...icpFilters, techStack: v })} placeholder="Any technology" />
            </div>
          </div>

          {/* Signal Filters */}
          <div style={{ padding: '24px', borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#34D399' }}>{Icons.zap}</div>
              <span style={{ color: '#F8FAFC', fontSize: '14px', fontWeight: 700, letterSpacing: '-0.3px' }}>Buying Signals</span>
              {activeSignalCount > 0 && <span style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34D399', padding: '3px 10px', borderRadius: '100px', fontSize: '11px', fontWeight: 700, border: '1px solid rgba(16, 185, 129, 0.2)' }}>{activeSignalCount} active</span>}
            </div>
            <p style={{ color: '#64748B', fontSize: '12px', marginBottom: '18px', marginLeft: '42px', lineHeight: '1.5' }}>Find companies showing these intent signals</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {SIGNAL_TYPES.map((signal) => <SignalCard key={signal.id} signal={signal} enabled={enabledSignals[signal.id]} onChange={(v) => setEnabledSignals({ ...enabledSignals, [signal.id]: v })} />)}
            </div>
          </div>

          {/* Search Settings */}
          <div style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(139, 92, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#A78BFA' }}>{Icons.sliders}</div>
              <span style={{ color: '#F8FAFC', fontSize: '14px', fontWeight: 700, letterSpacing: '-0.3px' }}>Search Settings</span>
            </div>
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', color: '#94A3B8', fontSize: '11px', marginBottom: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Max Results</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                {[10, 25, 50, 100].map(num => (
                  <button key={num} onClick={() => setMaxResults(num)} style={{ flex: 1, padding: '12px', background: maxResults === num ? 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)' : 'rgba(255, 255, 255, 0.03)', border: maxResults === num ? 'none' : '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '8px', color: maxResults === num ? 'white' : '#94A3B8', fontSize: '13px', fontWeight: maxResults === num ? 700 : 500, cursor: 'pointer', transition: 'all 0.2s ease', boxShadow: maxResults === num ? '0 2px 8px rgba(59, 130, 246, 0.3)' : 'none' }}>{num}</button>
                ))}
              </div>
            </div>
            <div>
              <label style={{ display: 'block', color: '#94A3B8', fontSize: '11px', marginBottom: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Minimum Score: <span style={{ color: '#60A5FA', fontWeight: 700 }}>{minScore}</span></label>
              <input type="range" min="0" max="80" value={minScore} onChange={(e) => setMinScore(Number(e.target.value))} style={{ width: '100%' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748B', fontSize: '10px', marginTop: '8px', fontWeight: 500 }}><span>All results</span><span>High intent only</span></div>
            </div>
          </div>
        </div>

        {/* Run Button */}
        <div style={{ padding: '24px', borderTop: '1px solid rgba(255, 255, 255, 0.06)', background: 'rgba(0, 0, 0, 0.2)' }}>
          {!canStartScraping && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '14px 16px', background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.15)', borderRadius: '10px', marginBottom: '14px' }}>
              <span style={{ color: '#F87171' }}>{Icons.alertCircle}</span>
              <span style={{ color: '#FDA4AF', fontSize: '13px', fontWeight: 500 }}>Select at least one signal to search</span>
            </div>
          )}
          {n8nError && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '14px 16px', background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.15)', borderRadius: '10px', marginBottom: '14px' }}>
              <span style={{ color: '#F87171' }}>{Icons.alertCircle}</span>
              <span style={{ color: '#FDA4AF', fontSize: '13px', fontWeight: 500 }}>{n8nError}</span>
            </div>
          )}
          {isRunning ? (
            <div>
              <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <span style={{ color: '#E2E8F0', fontSize: '13px', fontWeight: 500 }}>{currentStatus}</span>
                  <span style={{ color: '#60A5FA', fontSize: '13px', fontWeight: 700 }}>{Math.round(progress)}%</span>
                </div>
                <div style={{ background: 'rgba(255, 255, 255, 0.05)', borderRadius: '100px', height: '8px', overflow: 'hidden' }}>
                  <div style={{ width: `${progress}%`, height: '100%', background: 'linear-gradient(90deg, #3B82F6 0%, #10B981 100%)', borderRadius: '100px', transition: 'width 0.3s ease', boxShadow: '0 0 20px rgba(59, 130, 246, 0.4)' }} />
                </div>
                <div style={{ color: '#64748B', fontSize: '12px', marginTop: '10px', fontWeight: 500 }}>{companiesFound} companies scanned</div>
              </div>
              <button onClick={handleStopScrape} style={{ width: '100%', padding: '16px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '12px', color: '#F87171', fontSize: '14px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', transition: 'all 0.2s ease' }}>{Icons.stop} Stop Scraping</button>
            </div>
          ) : (
            <button onClick={handleStartScrape} disabled={!canStartScraping} style={{ width: '100%', padding: '18px', background: !canStartScraping ? 'rgba(255, 255, 255, 0.05)' : 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)', border: 'none', borderRadius: '12px', color: !canStartScraping ? '#64748B' : 'white', fontSize: '15px', fontWeight: 700, cursor: !canStartScraping ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', boxShadow: canStartScraping ? '0 4px 20px rgba(59, 130, 246, 0.35), 0 0 40px rgba(139, 92, 246, 0.15)' : 'none', transition: 'all 0.3s ease', letterSpacing: '-0.3px' }}>
              {Icons.search} Find Companies {useN8n && <span style={{ opacity: 0.8, fontWeight: 500 }}>(Live)</span>}
            </button>
          )}
        </div>
      </div>

      {/* Right Panel */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'transparent', position: 'relative' }}>
        {/* Header */}
        <div style={{ padding: '24px 28px', borderBottom: '1px solid rgba(255, 255, 255, 0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255, 255, 255, 0.02)' }}>
          <div>
            <div style={{ color: '#F8FAFC', fontSize: '20px', fontWeight: 700, letterSpacing: '-0.4px' }}>Discovered Companies</div>
            <div style={{ color: '#64748B', fontSize: '13px', marginTop: '6px', fontWeight: 500 }}>
              {results.length > 0 ? (
                <><span style={{ color: '#E2E8F0' }}>{results.length}</span> companies found <span style={{ color: '#475569' }}>•</span> Avg score: <span style={{ color: '#60A5FA' }}>{Math.round(results.reduce((a, r) => a + r.score, 0) / results.length)}</span></>
              ) : 'Configure filters and start searching'}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={() => { setResults([]); setSelectedIds(new Set()); }} disabled={results.length === 0} style={{ padding: '10px 18px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '10px', color: results.length === 0 ? '#475569' : '#94A3B8', fontSize: '13px', fontWeight: 600, cursor: results.length === 0 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s ease' }}>{Icons.refresh} Clear</button>
            <button onClick={handleExport} disabled={results.length === 0} style={{ padding: '10px 20px', background: results.length > 0 ? 'rgba(59, 130, 246, 0.1)' : 'rgba(255, 255, 255, 0.03)', border: results.length > 0 ? '1px solid rgba(59, 130, 246, 0.2)' : '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '10px', color: results.length === 0 ? '#475569' : '#60A5FA', fontSize: '13px', fontWeight: 600, cursor: results.length === 0 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s ease' }}>{Icons.download} Export {selectedIds.size > 0 ? `(${selectedIds.size})` : ''}</button>
          </div>
        </div>

        {/* Results Table */}
        <div style={{ flex: 1, overflow: 'auto', padding: '24px 28px' }}>
          {results.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#64748B' }}>
              <div style={{ width: '80px', height: '80px', borderRadius: '20px', background: 'rgba(59, 130, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
                <span style={{ color: '#60A5FA', transform: 'scale(2)' }}>{Icons.database}</span>
              </div>
              <div style={{ fontSize: '18px', marginBottom: '10px', color: '#E2E8F0', fontWeight: 600, letterSpacing: '-0.3px' }}>No companies discovered yet</div>
              <div style={{ fontSize: '14px', textAlign: 'center', maxWidth: '380px', lineHeight: '1.6', color: '#64748B' }}>Configure your ICP filters and signal requirements, then click "Find Companies" to start discovering high-intent leads</div>
            </div>
          ) : (
            <div style={{ background: 'rgba(17, 24, 39, 0.6)', borderRadius: '14px', border: '1px solid rgba(255, 255, 255, 0.06)', overflow: 'hidden', boxShadow: '0 4px 24px rgba(0, 0, 0, 0.2)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.06)', background: 'rgba(255, 255, 255, 0.02)' }}>
                    <th style={{ padding: '16px 18px', textAlign: 'left', width: '50px' }}>
                      <Checkbox checked={allSelected} indeterminate={someSelected} onChange={toggleSelectAll} />
                    </th>
                    <th style={{ padding: '16px 18px', textAlign: 'left', color: '#64748B', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px' }}>Company</th>
                    <th style={{ padding: '16px 18px', textAlign: 'left', color: '#64748B', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px' }}>Score</th>
                    <th style={{ padding: '16px 18px', textAlign: 'left', color: '#64748B', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px' }}>Signals</th>
                    <th style={{ padding: '16px 18px', textAlign: 'left', color: '#64748B', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px' }}>Why Now</th>
                    <th style={{ padding: '16px 18px', textAlign: 'left', color: '#64748B', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px' }}>Industry</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((result, index) => (
                    <tr key={result.id} style={{ borderBottom: index < results.length - 1 ? '1px solid rgba(255, 255, 255, 0.04)' : 'none', cursor: 'pointer', background: selectedIds.has(result.id) ? 'rgba(59, 130, 246, 0.08)' : 'transparent', transition: 'background 0.15s ease' }}>
                      <td style={{ padding: '18px' }} onClick={(e) => e.stopPropagation()}>
                        <Checkbox checked={selectedIds.has(result.id)} onChange={() => toggleSelect(result.id)} />
                      </td>
                      <td style={{ padding: '18px' }} onClick={() => setSelectedCompany(result)}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                          <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: result.score >= 70 ? '#10B981' : result.score >= 50 ? '#F59E0B' : '#EF4444', boxShadow: result.score >= 70 ? '0 0 8px rgba(16, 185, 129, 0.5)' : result.score >= 50 ? '0 0 8px rgba(245, 158, 11, 0.5)' : 'none' }} />
                          <div>
                            <div style={{ color: '#F8FAFC', fontSize: '14px', fontWeight: 600, letterSpacing: '-0.2px' }}>{result.name}</div>
                            <div style={{ color: '#64748B', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '3px' }}>{result.domain} <span style={{ color: '#60A5FA', opacity: 0.7 }}>{Icons.externalLink}</span></div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '18px' }} onClick={() => setSelectedCompany(result)}>
                        <span style={{ background: result.score >= 70 ? 'rgba(16, 185, 129, 0.15)' : result.score >= 50 ? 'rgba(245, 158, 11, 0.15)' : 'rgba(239, 68, 68, 0.15)', color: result.score >= 70 ? '#34D399' : result.score >= 50 ? '#FBBF24' : '#F87171', padding: '6px 14px', borderRadius: '8px', fontSize: '13px', fontWeight: 700, border: result.score >= 70 ? '1px solid rgba(16, 185, 129, 0.2)' : result.score >= 50 ? '1px solid rgba(245, 158, 11, 0.2)' : '1px solid rgba(239, 68, 68, 0.2)' }}>{result.score}</span>
                      </td>
                      <td style={{ padding: '18px' }} onClick={() => setSelectedCompany(result)}>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          {result.signals.map((signal, i) => {
                            const config = SIGNAL_TYPES.find(s => s.id === signal);
                            return <span key={i} style={{ width: '32px', height: '32px', borderRadius: '8px', background: `${config?.color}20` || 'rgba(100, 116, 139, 0.2)', border: `1px solid ${config?.color}30` || 'rgba(100, 116, 139, 0.3)', color: config?.color || '#64748B', fontSize: config?.icon.length > 1 ? '13px' : '12px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'transform 0.15s ease' }} title={config?.label}>{config?.icon}</span>;
                          })}
                        </div>
                      </td>
                      <td style={{ padding: '18px', color: '#CBD5E1', fontSize: '13px', fontWeight: 500, maxWidth: '200px' }} onClick={() => setSelectedCompany(result)}>{result.whyNow}</td>
                      <td style={{ padding: '18px', color: '#94A3B8', fontSize: '13px', fontWeight: 500 }} onClick={() => setSelectedCompany(result)}>{result.industry}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Stats Bar */}
        {results.length > 0 && (
          <div style={{ padding: '20px 28px', borderTop: '1px solid rgba(255, 255, 255, 0.06)', display: 'flex', gap: '48px', background: 'rgba(255, 255, 255, 0.02)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: 'rgba(59, 130, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ color: '#60A5FA' }}>{Icons.users}</span>
              </div>
              <div>
                <div style={{ color: '#64748B', fontSize: '11px', marginBottom: '2px', textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: 600 }}>Total Found</div>
                <div style={{ color: '#F8FAFC', fontSize: '22px', fontWeight: 800, letterSpacing: '-0.5px' }}>{results.length}</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ color: '#34D399' }}>{Icons.zap}</span>
              </div>
              <div>
                <div style={{ color: '#64748B', fontSize: '11px', marginBottom: '2px', textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: 600 }}>High Intent (70+)</div>
                <div style={{ color: '#34D399', fontSize: '22px', fontWeight: 800, letterSpacing: '-0.5px' }}>{results.filter(r => r.score >= 70).length}</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: 'rgba(139, 92, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ color: '#A78BFA' }}>{Icons.target}</span>
              </div>
              <div>
                <div style={{ color: '#64748B', fontSize: '11px', marginBottom: '2px', textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: 600 }}>Avg. Score</div>
                <div style={{ color: '#A78BFA', fontSize: '22px', fontWeight: 800, letterSpacing: '-0.5px' }}>{Math.round(results.reduce((a, r) => a + r.score, 0) / results.length)}</div>
              </div>
            </div>
          </div>
        )}

        {/* Bulk Action Bar */}
        {selectedIds.size > 0 && (
          <div style={{ position: 'absolute', bottom: '100px', left: '50%', transform: 'translateX(-50%)', background: '#1E293B', border: '1px solid #334155', borderRadius: '12px', padding: '12px 20px', display: 'flex', alignItems: 'center', gap: '16px', boxShadow: '0 8px 32px rgba(0,0,0,0.4)', zIndex: 50 }}>
            <span style={{ color: '#F1F5F9', fontSize: '14px', fontWeight: 500 }}>{selectedIds.size} selected</span>
            <div style={{ width: '1px', height: '24px', background: '#334155' }} />
            <div style={{ position: 'relative' }}>
              <button onClick={() => setShowBulkListPicker(!showBulkListPicker)} style={{ background: '#3B82F6', border: 'none', borderRadius: '8px', padding: '10px 16px', color: 'white', fontSize: '13px', fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                {Icons.plus} Add to List {Icons.chevronDown}
              </button>
              {showBulkListPicker && (
                <>
                  <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 60 }} onClick={() => setShowBulkListPicker(false)} />
                  <div style={{ position: 'absolute', bottom: '100%', left: 0, marginBottom: '8px', background: '#0F172A', border: '1px solid #334155', borderRadius: '10px', overflow: 'hidden', minWidth: '200px', zIndex: 70 }}>
                    {lists.map(list => (
                      <button key={list.id} onClick={() => handleBulkAddToList(list.id)} style={{ width: '100%', padding: '12px 16px', background: 'transparent', border: 'none', borderBottom: '1px solid #1E293B', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px', textAlign: 'left' }}>
                        <div style={{ width: '10px', height: '10px', borderRadius: '3px', background: list.color }} />
                        <span style={{ color: '#E2E8F0', fontSize: '14px', flex: 1 }}>{list.name}</span>
                        <span style={{ color: '#64748B', fontSize: '12px' }}>{list.leads.length}</span>
                      </button>
                    ))}
                    <button onClick={() => { setShowBulkListPicker(false); setShowCreateList(true); }} style={{ width: '100%', padding: '12px 16px', background: '#1E293B', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', color: '#3B82F6', fontSize: '13px' }}>{Icons.plus} Create new list</button>
                  </div>
                </>
              )}
            </div>
            <button onClick={() => setSelectedIds(new Set())} style={{ background: 'transparent', border: '1px solid #334155', borderRadius: '8px', padding: '10px 16px', color: '#94A3B8', fontSize: '13px', cursor: 'pointer' }}>Clear selection</button>
          </div>
        )}
      </div>
    </div>
  );

  // ==================== RENDER LISTS ====================
  const renderListsPage = () => (
    <div style={{ flex: 1, overflow: 'auto', padding: '24px' }}>
      {selectedListId && selectedList ? (
        <div>
          <button onClick={() => setSelectedListId(null)} style={{ background: 'none', border: 'none', color: '#64748B', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '20px', padding: 0 }}>{Icons.arrowLeft} Back to all lists</button>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: selectedList.color }} />
              {editingListId === selectedList.id ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input type="text" value={editingListName} onChange={(e) => setEditingListName(e.target.value)} autoFocus style={{ padding: '8px 12px', background: '#0F172A', border: '1px solid #3B82F6', borderRadius: '6px', color: '#F1F5F9', fontSize: '18px', fontWeight: 600 }} />
                  <button onClick={() => handleRenameList(selectedList.id)} style={{ background: '#3B82F6', border: 'none', borderRadius: '6px', padding: '8px 12px', color: 'white', cursor: 'pointer' }}>{Icons.check}</button>
                  <button onClick={() => setEditingListId(null)} style={{ background: '#334155', border: 'none', borderRadius: '6px', padding: '8px 12px', color: '#94A3B8', cursor: 'pointer' }}>{Icons.x}</button>
                </div>
              ) : (
                <h2 style={{ color: '#F1F5F9', fontSize: '24px', fontWeight: 600, margin: 0 }}>{selectedList.name}</h2>
              )}
              <span style={{ color: '#64748B', fontSize: '14px' }}>{selectedList.leads.length} leads</span>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => { setEditingListId(selectedList.id); setEditingListName(selectedList.name); }} style={{ background: '#1E293B', border: '1px solid #334155', borderRadius: '6px', padding: '8px 12px', color: '#94A3B8', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>{Icons.edit} Rename</button>
              <button onClick={() => handleDeleteList(selectedList.id)} style={{ background: '#7F1D1D', border: 'none', borderRadius: '6px', padding: '8px 12px', color: '#FCA5A5', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>{Icons.trash} Delete List</button>
            </div>
          </div>
          {selectedList.leads.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px', color: '#64748B' }}>
              <div style={{ marginBottom: '12px', opacity: 0.5 }}>{Icons.users}</div>
              <div style={{ fontSize: '14px' }}>No leads in this list yet</div>
              <div style={{ fontSize: '12px', marginTop: '8px' }}>Add leads from the scraper results</div>
            </div>
          ) : (
            <div style={{ background: '#1E293B', borderRadius: '10px', border: '1px solid #334155', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #334155' }}>
                    <th style={{ padding: '14px 16px', textAlign: 'left', color: '#64748B', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' }}>Company</th>
                    <th style={{ padding: '14px 16px', textAlign: 'left', color: '#64748B', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' }}>Score</th>
                    <th style={{ padding: '14px 16px', textAlign: 'left', color: '#64748B', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' }}>Industry</th>
                    <th style={{ padding: '14px 16px', textAlign: 'left', color: '#64748B', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedList.leads.map((lead, index) => (
                    <tr key={lead.id} style={{ borderBottom: index < selectedList.leads.length - 1 ? '1px solid #334155' : 'none' }}>
                      <td style={{ padding: '16px' }}>
                        <div style={{ color: '#F1F5F9', fontSize: '14px', fontWeight: 500 }}>{lead.name}</div>
                        <div style={{ color: '#64748B', fontSize: '12px' }}>{lead.domain}</div>
                      </td>
                      <td style={{ padding: '16px' }}>
                        <span style={{ background: lead.score >= 70 ? '#065F46' : lead.score >= 50 ? '#78350F' : '#7F1D1D', color: lead.score >= 70 ? '#34D399' : lead.score >= 50 ? '#FCD34D' : '#FCA5A5', padding: '4px 10px', borderRadius: '6px', fontSize: '13px', fontWeight: 600 }}>{lead.score}</span>
                      </td>
                      <td style={{ padding: '16px', color: '#94A3B8', fontSize: '13px' }}>{lead.industry}</td>
                      <td style={{ padding: '16px' }}>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <div style={{ position: 'relative' }}>
                            <button onClick={() => { setLeadToMove(lead); setShowMoveToList(true); }} style={{ background: 'transparent', border: '1px solid #334155', borderRadius: '4px', padding: '6px 10px', color: '#94A3B8', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>{Icons.move} Move</button>
                          </div>
                          <button onClick={() => handleRemoveFromList(selectedList.id, lead.id)} style={{ background: 'transparent', border: '1px solid #7F1D1D', borderRadius: '4px', padding: '6px 10px', color: '#FCA5A5', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>{Icons.trash} Remove</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {/* Move to list modal */}
          {showMoveToList && leadToMove && (
            <>
              <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100 }} onClick={() => { setShowMoveToList(false); setLeadToMove(null); }} />
              <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: '#1E293B', border: '1px solid #334155', borderRadius: '12px', padding: '24px', minWidth: '300px', zIndex: 101 }}>
                <h3 style={{ color: '#F1F5F9', fontSize: '16px', fontWeight: 600, marginBottom: '16px', margin: '0 0 16px 0' }}>Move to list</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {lists.filter(l => l.id !== selectedListId).map(list => (
                    <button key={list.id} onClick={() => handleMoveToList(selectedListId, list.id, leadToMove)} style={{ width: '100%', padding: '12px 16px', background: '#0F172A', border: '1px solid #334155', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px', textAlign: 'left' }}>
                      <div style={{ width: '10px', height: '10px', borderRadius: '3px', background: list.color }} />
                      <span style={{ color: '#E2E8F0', fontSize: '14px' }}>{list.name}</span>
                    </button>
                  ))}
                </div>
                <button onClick={() => { setShowMoveToList(false); setLeadToMove(null); }} style={{ width: '100%', marginTop: '16px', padding: '10px', background: '#334155', border: 'none', borderRadius: '8px', color: '#94A3B8', fontSize: '13px', cursor: 'pointer' }}>Cancel</button>
              </div>
            </>
          )}
        </div>
      ) : (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
            <h2 style={{ color: '#F1F5F9', fontSize: '24px', fontWeight: 600, margin: 0 }}>Lead Lists</h2>
            <button onClick={() => setShowCreateList(true)} style={{ background: '#3B82F6', border: 'none', borderRadius: '8px', padding: '10px 16px', color: 'white', fontSize: '13px', fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>{Icons.plus} New List</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
            {lists.map(list => (
              <div key={list.id} onClick={() => setSelectedListId(list.id)} style={{ background: '#1E293B', border: '1px solid #334155', borderRadius: '10px', padding: '20px', cursor: 'pointer', transition: 'border-color 0.2s' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                  <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: list.color }} />
                  <span style={{ color: '#F1F5F9', fontSize: '16px', fontWeight: 600 }}>{list.name}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748B', fontSize: '13px' }}>{list.leads.length} leads</span>
                  <span style={{ color: '#475569', fontSize: '12px' }}>Created {list.createdAt}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {/* Create list modal */}
      {showCreateList && (
        <>
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100 }} onClick={() => setShowCreateList(false)} />
          <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: '#1E293B', border: '1px solid #334155', borderRadius: '12px', padding: '24px', minWidth: '320px', zIndex: 101 }}>
            <h3 style={{ color: '#F1F5F9', fontSize: '16px', fontWeight: 600, marginBottom: '16px', margin: '0 0 16px 0' }}>Create new list</h3>
            <input type="text" value={newListName} onChange={(e) => setNewListName(e.target.value)} placeholder="List name" autoFocus style={{ width: '100%', padding: '12px', background: '#0F172A', border: '1px solid #334155', borderRadius: '8px', color: '#F1F5F9', fontSize: '14px', marginBottom: '16px', boxSizing: 'border-box' }} />
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => setShowCreateList(false)} style={{ flex: 1, padding: '10px', background: '#334155', border: 'none', borderRadius: '8px', color: '#94A3B8', fontSize: '13px', cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleCreateList} disabled={!newListName.trim()} style={{ flex: 1, padding: '10px', background: newListName.trim() ? '#3B82F6' : '#334155', border: 'none', borderRadius: '8px', color: newListName.trim() ? 'white' : '#64748B', fontSize: '13px', cursor: newListName.trim() ? 'pointer' : 'not-allowed' }}>Create</button>
            </div>
          </div>
        </>
      )}
    </div>
  );

  // ==================== RENDER COMPANY DETAIL ====================
  const renderCompanyDetail = () => {
    if (!selectedCompany) return null;
    return (
      <>
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100 }} onClick={() => setSelectedCompany(null)} />
        <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: '480px', background: '#0F172A', borderLeft: '1px solid #1E293B', zIndex: 101, display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '20px', borderBottom: '1px solid #1E293B', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h2 style={{ color: '#F1F5F9', fontSize: '20px', fontWeight: 600, margin: '0 0 4px 0' }}>{selectedCompany.name}</h2>
              <a href={`https://${selectedCompany.domain}`} target="_blank" rel="noopener noreferrer" style={{ color: '#3B82F6', fontSize: '13px', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>{selectedCompany.domain} {Icons.externalLink}</a>
            </div>
            <button onClick={() => setSelectedCompany(null)} style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', padding: '4px' }}>{Icons.x}</button>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
            {/* Score */}
            <div style={{ background: '#1E293B', borderRadius: '10px', padding: '16px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ color: '#94A3B8', fontSize: '13px' }}>Intent Score</span>
                <span style={{ background: selectedCompany.score >= 70 ? '#065F46' : selectedCompany.score >= 50 ? '#78350F' : '#7F1D1D', color: selectedCompany.score >= 70 ? '#34D399' : selectedCompany.score >= 50 ? '#FCD34D' : '#FCA5A5', padding: '8px 16px', borderRadius: '8px', fontSize: '18px', fontWeight: 700 }}>{selectedCompany.score}</span>
              </div>
              <div style={{ marginTop: '12px', padding: '12px', background: '#0F172A', borderRadius: '6px' }}>
                <div style={{ color: '#F1F5F9', fontSize: '14px', fontWeight: 500, marginBottom: '4px' }}>Why Now</div>
                <div style={{ color: '#94A3B8', fontSize: '13px' }}>{selectedCompany.whyNow}</div>
              </div>
            </div>
            {/* Signals */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ color: '#94A3B8', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px' }}>Detected Signals</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {selectedCompany.signalDetails.map((signal, i) => (
                  <div key={i} style={{ background: '#1E293B', borderRadius: '8px', padding: '14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                      <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: SIGNAL_TYPES.find(s => s.label === signal.type)?.color || '#64748B', color: 'white', fontSize: '12px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{SIGNAL_TYPES.find(s => s.label === signal.type)?.icon || '?'}</div>
                      <span style={{ color: '#F1F5F9', fontSize: '14px', fontWeight: 500 }}>{signal.type}</span>
                    </div>
                    <div style={{ color: '#94A3B8', fontSize: '13px', marginLeft: '38px' }}>{signal.value}</div>
                  </div>
                ))}
              </div>
            </div>
            {/* Company Info */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ color: '#94A3B8', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px' }}>Company Info</div>
              <div style={{ background: '#1E293B', borderRadius: '8px', padding: '14px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div><div style={{ color: '#64748B', fontSize: '11px', marginBottom: '4px' }}>Industry</div><div style={{ color: '#E2E8F0', fontSize: '13px' }}>{selectedCompany.industry}</div></div>
                  <div><div style={{ color: '#64748B', fontSize: '11px', marginBottom: '4px' }}>Employees</div><div style={{ color: '#E2E8F0', fontSize: '13px' }}>{selectedCompany.employees}</div></div>
                  <div><div style={{ color: '#64748B', fontSize: '11px', marginBottom: '4px' }}>Location</div><div style={{ color: '#E2E8F0', fontSize: '13px' }}>{selectedCompany.location}</div></div>
                  <div><div style={{ color: '#64748B', fontSize: '11px', marginBottom: '4px' }}>Revenue</div><div style={{ color: '#E2E8F0', fontSize: '13px' }}>{selectedCompany.revenue}</div></div>
                </div>
              </div>
            </div>
          </div>
          {/* Actions */}
          <div style={{ padding: '20px', borderTop: '1px solid #1E293B' }}>
            <div style={{ position: 'relative' }}>
              <button onClick={() => setShowListPicker(!showListPicker)} style={{ width: '100%', padding: '14px', background: '#3B82F6', border: 'none', borderRadius: '8px', color: 'white', fontSize: '14px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>{Icons.plus} Add to List</button>
              {showListPicker && (
                <>
                  <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 110 }} onClick={() => setShowListPicker(false)} />
                  <div style={{ position: 'absolute', bottom: '100%', left: 0, right: 0, marginBottom: '8px', background: '#1E293B', border: '1px solid #334155', borderRadius: '10px', overflow: 'hidden', zIndex: 120 }}>
                    {lists.map(list => (
                      <button key={list.id} onClick={() => handleAddToList(list.id)} style={{ width: '100%', padding: '12px 16px', background: 'transparent', border: 'none', borderBottom: '1px solid #0F172A', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px', textAlign: 'left' }}>
                        <div style={{ width: '10px', height: '10px', borderRadius: '3px', background: list.color }} />
                        <span style={{ color: '#E2E8F0', fontSize: '14px', flex: 1 }}>{list.name}</span>
                        <span style={{ color: '#64748B', fontSize: '12px' }}>{list.leads.length}</span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </>
    );
  };

  // ==================== MAIN RENDER ====================
  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #0a0f1a 0%, #111827 100%)', color: '#E2E8F0', fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <header style={{ padding: '12px 24px', background: 'rgba(10, 15, 26, 0.8)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(255, 255, 255, 0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '38px', height: '38px', background: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)' }}>
            <span style={{ color: 'white', fontWeight: 800, fontSize: '16px', letterSpacing: '-0.5px' }}>S</span>
          </div>
          <div>
            <span style={{ color: '#F8FAFC', fontSize: '17px', fontWeight: 700, letterSpacing: '-0.3px' }}>SAI Scraper</span>
            <span style={{ color: '#64748B', fontSize: '11px', marginLeft: '10px', fontWeight: 500 }}>Lead Intelligence</span>
          </div>
        </div>
        <nav style={{ display: 'flex', gap: '6px', background: 'rgba(255, 255, 255, 0.03)', padding: '4px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
          <button onClick={() => setCurrentPage('scraper')} style={{ padding: '10px 20px', background: currentPage === 'scraper' ? 'rgba(59, 130, 246, 0.15)' : 'transparent', border: 'none', borderRadius: '8px', color: currentPage === 'scraper' ? '#60A5FA' : '#64748B', fontSize: '13px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s ease' }}>{Icons.search} Scraper</button>
          <button onClick={() => setCurrentPage('lists')} style={{ padding: '10px 20px', background: currentPage === 'lists' ? 'rgba(59, 130, 246, 0.15)' : 'transparent', border: 'none', borderRadius: '8px', color: currentPage === 'lists' ? '#60A5FA' : '#64748B', fontSize: '13px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s ease' }}>{Icons.folder} Lists {lists.reduce((a, l) => a + l.leads.length, 0) > 0 && <span style={{ background: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)', color: 'white', padding: '2px 10px', borderRadius: '100px', fontSize: '11px', fontWeight: 600 }}>{lists.reduce((a, l) => a + l.leads.length, 0)}</span>}</button>
        </nav>
      </header>

      {/* Main Content */}
      {currentPage === 'scraper' ? renderScraperPage() : renderListsPage()}

      {/* Company Detail Sidebar */}
      {renderCompanyDetail()}
    </div>
  );
};

export default SAIScraper;
