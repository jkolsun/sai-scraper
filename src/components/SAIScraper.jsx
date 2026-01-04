import React, { useState } from 'react';
import { discoverCompanies, enrichCompanies } from '../services/n8nService';

// ==================== COMPREHENSIVE ICP FILTER OPTIONS ====================

// FIRMOGRAPHIC FILTERS
const INDUSTRIES = [
  // Technology
  'SaaS', 'Software Development', 'IT Services', 'Cybersecurity', 'Cloud Computing', 'AI/ML',
  // Finance
  'FinTech', 'Banking', 'Insurance', 'Investment', 'Accounting',
  // Healthcare
  'Healthcare', 'Biotech', 'Pharmaceuticals', 'Medical Devices', 'Telehealth',
  // Commerce
  'E-commerce', 'Retail', 'Wholesale', 'Consumer Goods',
  // Services
  'Professional Services', 'Consulting', 'Marketing Agency', 'Legal', 'Recruiting',
  // Industrial
  'Manufacturing', 'Construction', 'Logistics', 'Transportation', 'Energy',
  // Other
  'Real Estate', 'EdTech', 'Media/Entertainment', 'Hospitality', 'Non-Profit'
];

const SUB_INDUSTRIES = {
  'SaaS': ['CRM', 'Marketing Automation', 'HR Tech', 'Sales Tech', 'Project Management', 'Analytics', 'Security', 'DevOps'],
  'Healthcare': ['Hospitals', 'Clinics', 'Dental', 'Mental Health', 'Home Care', 'Medical Equipment', 'Health Insurance'],
  'FinTech': ['Payments', 'Lending', 'Wealth Management', 'InsurTech', 'RegTech', 'Crypto/Blockchain'],
  'E-commerce': ['D2C Brands', 'Marketplaces', 'Dropshipping', 'Subscription Commerce', 'B2B E-commerce'],
  'Marketing Agency': ['Digital Marketing', 'SEO/SEM', 'Social Media', 'Content Marketing', 'PR', 'Branding', 'Performance Marketing'],
  'Legal': ['Corporate Law', 'Personal Injury', 'Immigration', 'Real Estate Law', 'IP Law', 'Criminal Defense'],
  'Real Estate': ['Residential', 'Commercial', 'Property Management', 'Real Estate Tech', 'Mortgage'],
  'Manufacturing': ['Automotive', 'Electronics', 'Food & Beverage', 'Textiles', 'Aerospace', 'Industrial Equipment']
};

const EMPLOYEE_RANGES = [
  { label: '1-10 (Startup)', min: 1, max: 10 },
  { label: '11-50 (Small)', min: 11, max: 50 },
  { label: '51-200 (Mid-Market)', min: 51, max: 200 },
  { label: '201-500 (Growth)', min: 201, max: 500 },
  { label: '501-1000 (Scale-up)', min: 501, max: 1000 },
  { label: '1001-5000 (Enterprise)', min: 1001, max: 5000 },
  { label: '5000+ (Large Enterprise)', min: 5001, max: 1000000 }
];

const REVENUE_RANGES = [
  { label: '$0 - $1M (Pre-Revenue/Seed)', min: 0, max: 1000000 },
  { label: '$1M - $5M (Early Stage)', min: 1000000, max: 5000000 },
  { label: '$5M - $10M (Growth)', min: 5000000, max: 10000000 },
  { label: '$10M - $50M (Scaling)', min: 10000000, max: 50000000 },
  { label: '$50M - $100M (Mid-Market)', min: 50000000, max: 100000000 },
  { label: '$100M - $500M (Upper Mid-Market)', min: 100000000, max: 500000000 },
  { label: '$500M+ (Enterprise)', min: 500000000, max: 100000000000 }
];

const COMPANY_TYPES = [
  'Public Company', 'Private Company', 'Startup', 'Non-Profit', 'Government', 'Partnership', 'Sole Proprietorship'
];

const BUSINESS_MODELS = [
  'B2B', 'B2C', 'B2B2C', 'D2C', 'Marketplace', 'SaaS', 'Service-based', 'Product-based', 'Subscription', 'Freemium'
];

// GEOGRAPHIC FILTERS
const COUNTRIES = [
  'United States', 'Canada', 'United Kingdom', 'Germany', 'France', 'Australia',
  'Netherlands', 'Spain', 'Italy', 'Brazil', 'Mexico', 'India', 'Singapore',
  'Japan', 'South Korea', 'Ireland', 'Sweden', 'Switzerland', 'Israel', 'UAE'
];

const US_STATES = [
  'California', 'New York', 'Texas', 'Florida', 'Illinois', 'Pennsylvania',
  'Ohio', 'Georgia', 'North Carolina', 'Michigan', 'New Jersey', 'Virginia',
  'Washington', 'Arizona', 'Massachusetts', 'Tennessee', 'Indiana', 'Missouri',
  'Maryland', 'Wisconsin', 'Colorado', 'Minnesota', 'South Carolina', 'Alabama',
  'Louisiana', 'Kentucky', 'Oregon', 'Oklahoma', 'Connecticut', 'Utah', 'Nevada',
  'Iowa', 'Arkansas', 'Mississippi', 'Kansas', 'New Mexico', 'Nebraska', 'Idaho',
  'West Virginia', 'Hawaii', 'New Hampshire', 'Maine', 'Montana', 'Rhode Island',
  'Delaware', 'South Dakota', 'North Dakota', 'Alaska', 'Vermont', 'Wyoming', 'DC'
];

const US_METRO_AREAS = [
  'San Francisco Bay Area', 'New York City', 'Los Angeles', 'Chicago', 'Boston',
  'Seattle', 'Austin', 'Denver', 'Atlanta', 'Dallas-Fort Worth', 'Miami',
  'Washington DC', 'Philadelphia', 'Phoenix', 'San Diego', 'Portland',
  'Minneapolis', 'Detroit', 'Houston', 'Nashville', 'Charlotte', 'Salt Lake City'
];

// CONTACT/DEMOGRAPHIC FILTERS
const JOB_TITLES = [
  // C-Suite
  'CEO', 'CTO', 'CFO', 'CMO', 'COO', 'CRO', 'CISO', 'CIO', 'CPO',
  // VP Level
  'VP Sales', 'VP Marketing', 'VP Engineering', 'VP Operations', 'VP Product', 'VP Customer Success', 'VP Finance', 'VP HR',
  // Director Level
  'Director of Sales', 'Director of Marketing', 'Director of Engineering', 'Director of Operations', 'Director of Product', 'Director of IT',
  // Manager Level
  'Sales Manager', 'Marketing Manager', 'Engineering Manager', 'Product Manager', 'Operations Manager', 'HR Manager',
  // Individual Contributors
  'Account Executive', 'SDR', 'BDR', 'Software Engineer', 'Marketing Specialist', 'Customer Success Manager'
];

const SENIORITY_LEVELS = [
  'C-Suite/Executive', 'VP/SVP', 'Director', 'Manager', 'Senior Individual Contributor', 'Individual Contributor', 'Entry Level'
];

const DEPARTMENTS = [
  'Sales', 'Marketing', 'Engineering', 'Product', 'Operations', 'Finance', 'HR/People',
  'Customer Success', 'IT', 'Legal', 'Executive', 'Business Development', 'Data/Analytics', 'Design'
];

// TECHNOGRAPHIC FILTERS
const TECH_CATEGORIES = {
  'CRM': ['Salesforce', 'HubSpot', 'Pipedrive', 'Zoho CRM', 'Monday Sales CRM', 'Freshsales', 'Close', 'Copper'],
  'Marketing Automation': ['HubSpot', 'Marketo', 'Pardot', 'Mailchimp', 'ActiveCampaign', 'Klaviyo', 'Braze', 'Iterable'],
  'Analytics': ['Google Analytics', 'Mixpanel', 'Amplitude', 'Heap', 'Segment', 'Hotjar', 'FullStory', 'Pendo'],
  'Live Chat/Support': ['Intercom', 'Drift', 'Zendesk', 'Freshdesk', 'Crisp', 'LiveChat', 'Tawk.to', 'Help Scout'],
  'E-commerce Platform': ['Shopify', 'WooCommerce', 'Magento', 'BigCommerce', 'Squarespace', 'Wix', 'PrestaShop'],
  'Payment Processing': ['Stripe', 'PayPal', 'Square', 'Braintree', 'Adyen', 'Authorize.net'],
  'Cloud/Hosting': ['AWS', 'Google Cloud', 'Azure', 'Cloudflare', 'Vercel', 'Heroku', 'DigitalOcean'],
  'Development': ['React', 'Angular', 'Vue.js', 'Node.js', 'Python', 'Ruby on Rails', 'PHP', 'WordPress'],
  'Scheduling': ['Calendly', 'Chili Piper', 'SavvyCal', 'Acuity', 'YouCanBook.me', 'Cal.com'],
  'Project Management': ['Asana', 'Monday.com', 'Jira', 'Trello', 'ClickUp', 'Notion', 'Linear', 'Basecamp'],
  'Communication': ['Slack', 'Microsoft Teams', 'Zoom', 'Google Meet', 'Discord'],
  'HR/Recruiting': ['Workday', 'BambooHR', 'Gusto', 'Greenhouse', 'Lever', 'ADP', 'Rippling']
};

const ALL_TECHNOLOGIES = Object.values(TECH_CATEGORIES).flat();

// FUNDING & GROWTH FILTERS
const FUNDING_STAGES = [
  'Pre-Seed', 'Seed', 'Series A', 'Series B', 'Series C', 'Series D+', 'Private Equity', 'IPO', 'Bootstrapped'
];

const FUNDING_RECENCY = [
  'Last 30 days', 'Last 90 days', 'Last 6 months', 'Last 12 months', 'Last 2 years', 'Any time'
];

const FUNDING_AMOUNTS = [
  { label: '$0 - $1M', min: 0, max: 1000000 },
  { label: '$1M - $5M', min: 1000000, max: 5000000 },
  { label: '$5M - $20M', min: 5000000, max: 20000000 },
  { label: '$20M - $50M', min: 20000000, max: 50000000 },
  { label: '$50M - $100M', min: 50000000, max: 100000000 },
  { label: '$100M+', min: 100000000, max: 100000000000 }
];

// HIRING SIGNALS
const HIRING_DEPARTMENTS = [
  'Sales', 'Marketing', 'Engineering', 'Product', 'Customer Success', 'Operations',
  'Finance', 'HR', 'Legal', 'Design', 'Data Science', 'DevOps', 'Security'
];

const HIRING_INTENSITY = [
  { label: 'Aggressive (20+ open roles)', min: 20 },
  { label: 'Active (10-19 open roles)', min: 10, max: 19 },
  { label: 'Moderate (5-9 open roles)', min: 5, max: 9 },
  { label: 'Light (1-4 open roles)', min: 1, max: 4 },
  { label: 'Not hiring', min: 0, max: 0 }
];

// INTENT & BEHAVIORAL SIGNALS
const INTENT_SIGNALS = [
  { id: 'recentFunding', label: 'Recent Funding', description: 'Raised funding in the last 12 months' },
  { id: 'leadershipChange', label: 'Leadership Change', description: 'New C-level or VP hire in last 6 months' },
  { id: 'techAdoption', label: 'New Tech Adoption', description: 'Recently adopted new technology' },
  { id: 'expansionNews', label: 'Expansion News', description: 'Announced expansion or new office' },
  { id: 'productLaunch', label: 'Product Launch', description: 'Launched new product or feature' },
  { id: 'acquisitionNews', label: 'M&A Activity', description: 'Acquired company or was acquired' },
  { id: 'jobPostingSpike', label: 'Job Posting Spike', description: 'Significant increase in job postings' },
  { id: 'websiteTrafficGrowth', label: 'Traffic Growth', description: 'Website traffic growing 20%+ MoM' },
  { id: 'adSpendIncrease', label: 'Ad Spend Increase', description: 'Increased advertising activity' },
  { id: 'competitorMention', label: 'Competitor Mentions', description: 'Mentions competitor products' }
];

// COMPANY ATTRIBUTES
const COMPANY_KEYWORDS = [
  'AI-powered', 'Machine Learning', 'Automation', 'Cloud-native', 'Enterprise',
  'SMB-focused', 'Startup', 'Remote-first', 'Global', 'Fast-growing',
  'Venture-backed', 'Profitable', 'B Corp', 'Award-winning'
];

const COMPLIANCE_CERTIFICATIONS = [
  'SOC 2', 'ISO 27001', 'HIPAA', 'GDPR Compliant', 'PCI DSS', 'FedRAMP', 'CCPA Compliant'
];

// LOOKALIKE & EXCLUSION FILTERS
const EXCLUDE_TYPES = [
  'Competitors', 'Existing Customers', 'Recently Contacted', 'Unsubscribed', 'Bad Fit'
];

// Core 3 Buying Signals - Primary focus for scraping
const SIGNAL_TYPES = [
  { id: 'afterHoursCoverage', label: 'After Hours Coverage Gap', description: 'No live chat or response capability after business hours - missing leads from evening/weekend visitors.', icon: '*' },
  { id: 'googlePaidTraffic', label: 'Google Paid Traffic Active', description: 'Currently paying for Google Ads - spending money to drive traffic to their website.', icon: 'G' },
  { id: 'inboundResponseRisk', label: 'Inbound Response Risk', description: 'Slow response times or no immediate engagement - losing leads they paid to acquire.', icon: '!' }
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

// ==================== DESIGN TOKENS (Beige/Grey Theme) ====================
const theme = {
  // Backgrounds
  bgPrimary: '#F5F5F0',      // Light beige/cream
  bgSecondary: '#FFFFFF',     // White
  bgTertiary: '#EEEEE8',      // Slightly darker beige
  bgDark: '#1A1A1A',          // Near black
  // Text
  textPrimary: '#1A1A1A',     // Near black
  textSecondary: '#6B6B6B',   // Grey
  textMuted: '#9A9A9A',       // Light grey
  textLight: '#FFFFFF',       // White
  // Accent (Golden/Olive like Bright SAI)
  accent: '#B8960C',          // Golden olive
  accentLight: '#D4AF37',     // Lighter gold
  accentMuted: 'rgba(184, 150, 12, 0.1)',
  // Borders
  border: '#E5E5E0',          // Light border
  borderDark: '#D0D0C8',      // Darker border
  // Shadows
  shadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
  shadowMd: '0 4px 16px rgba(0, 0, 0, 0.08)',
  shadowLg: '0 8px 32px rgba(0, 0, 0, 0.12)'
};

// ==================== CHECKBOX COMPONENT ====================
const Checkbox = ({ checked, indeterminate, onChange, disabled }) => (
  <div
    onClick={(e) => { e.stopPropagation(); if (!disabled) onChange(!checked); }}
    style={{
      width: '18px', height: '18px', borderRadius: '4px',
      border: checked || indeterminate ? 'none' : `1.5px solid ${theme.borderDark}`,
      background: checked || indeterminate ? theme.accent : 'transparent',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      cursor: disabled ? 'not-allowed' : 'pointer', flexShrink: 0,
      opacity: disabled ? 0.5 : 1,
      transition: 'all 0.15s ease'
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
      {label && <label style={{ display: 'block', color: theme.textSecondary, fontSize: '12px', marginBottom: '8px', fontWeight: 500 }}>{label}</label>}
      <button onClick={() => setIsOpen(!isOpen)}
        style={{ width: '100%', padding: '12px 16px', background: theme.bgSecondary, border: `1px solid ${isOpen ? theme.accent : theme.border}`, borderRadius: '8px', color: selected.length > 0 ? theme.textPrimary : theme.textMuted, fontSize: '14px', fontWeight: 400, textAlign: 'left', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'all 0.2s ease', boxShadow: isOpen ? theme.shadowMd : theme.shadow }}>
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selected.length > 0 ? `${selected.length} selected` : placeholder}</span>
        <span style={{ color: theme.textMuted, transition: 'transform 0.2s ease', transform: isOpen ? 'rotate(180deg)' : 'rotate(0)' }}>{Icons.chevronDown}</span>
      </button>
      {isOpen && (
        <>
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 40 }} onClick={() => setIsOpen(false)} />
          <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: '4px', background: theme.bgSecondary, border: `1px solid ${theme.border}`, borderRadius: '8px', maxHeight: '240px', overflowY: 'auto', zIndex: 50, boxShadow: theme.shadowLg }}>
            {options.map((option, i) => (
              <div key={option} onClick={() => toggleOption(option)}
                style={{ padding: '10px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px', background: selected.includes(option) ? theme.accentMuted : 'transparent', color: theme.textPrimary, fontSize: '14px', fontWeight: 400, borderBottom: i < options.length - 1 ? `1px solid ${theme.border}` : 'none', transition: 'background 0.15s ease' }}
                onMouseEnter={(e) => { if (!selected.includes(option)) e.target.style.background = theme.bgTertiary; }}
                onMouseLeave={(e) => { if (!selected.includes(option)) e.target.style.background = 'transparent'; }}>
                <span style={{ width: '18px', height: '18px', border: selected.includes(option) ? 'none' : `1.5px solid ${theme.borderDark}`, borderRadius: '4px', background: selected.includes(option) ? theme.accent : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s ease', flexShrink: 0 }}>
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
      {label && <label style={{ display: 'block', color: theme.textSecondary, fontSize: '12px', marginBottom: '8px', fontWeight: 500 }}>{label}</label>}
      <button onClick={() => setIsOpen(!isOpen)}
        style={{ width: '100%', padding: '12px 16px', background: theme.bgSecondary, border: `1px solid ${isOpen ? theme.accent : theme.border}`, borderRadius: '8px', color: value ? theme.textPrimary : theme.textMuted, fontSize: '14px', fontWeight: 400, textAlign: 'left', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'all 0.2s ease', boxShadow: isOpen ? theme.shadowMd : theme.shadow }}>
        {value || placeholder}
        <span style={{ color: theme.textMuted, transition: 'transform 0.2s ease', transform: isOpen ? 'rotate(180deg)' : 'rotate(0)' }}>{Icons.chevronDown}</span>
      </button>
      {isOpen && (
        <>
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 40 }} onClick={() => setIsOpen(false)} />
          <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: '4px', background: theme.bgSecondary, border: `1px solid ${theme.border}`, borderRadius: '8px', maxHeight: '240px', overflowY: 'auto', zIndex: 50, boxShadow: theme.shadowLg }}>
            <div onClick={() => { onChange(null); setIsOpen(false); }}
              style={{ padding: '10px 16px', cursor: 'pointer', background: !value ? theme.accentMuted : 'transparent', color: theme.textMuted, fontSize: '14px', fontWeight: 400, borderBottom: `1px solid ${theme.border}` }}>{placeholder}</div>
            {options.map((option, i) => (
              <div key={typeof option === 'object' ? option.label : option} onClick={() => { onChange(typeof option === 'object' ? option.label : option); setIsOpen(false); }}
                style={{ padding: '10px 16px', cursor: 'pointer', background: (typeof option === 'object' ? option.label : option) === value ? theme.accentMuted : 'transparent', color: theme.textPrimary, fontSize: '14px', fontWeight: 400, borderBottom: i < options.length - 1 ? `1px solid ${theme.border}` : 'none', transition: 'background 0.15s ease' }}>
                {typeof option === 'object' ? option.label : option}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};


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
    { id: 1, name: 'Hot Leads', color: '#F97316', leads: [], createdAt: '2024-01-15' },
    { id: 2, name: 'To Follow Up', color: '#FB923C', leads: [], createdAt: '2024-01-14' },
    { id: 3, name: 'Qualified', color: '#FDBA74', leads: [], createdAt: '2024-01-12' }
  ]);
  const [editingListId, setEditingListId] = useState(null);
  const [editingListName, setEditingListName] = useState('');
  const [showCreateList, setShowCreateList] = useState(false);
  const [newListName, setNewListName] = useState('');

  // ICP Filters - Comprehensive
  const [icpFilters, setIcpFilters] = useState({
    // Firmographic
    industries: [],
    subIndustries: [],
    employeeRanges: [],
    revenueRanges: [],
    companyTypes: [],
    businessModels: [],
    // Geographic
    countries: [],
    states: [],
    metroAreas: [],
    // Contact/Demographic
    jobTitles: [],
    seniorityLevels: [],
    departments: [],
    // Technographic
    technologies: [],
    techCategories: [],
    // Funding
    fundingStages: [],
    fundingRecency: null,
    // Hiring
    hiringDepartments: [],
    hiringIntensity: null,
    // Intent Signals
    intentSignals: [],
    // Keywords & Exclusions
    keywords: [],
    excludeDomains: [],
    lookalikeDomains: []
  });

  // Active filter tab
  const [activeFilterTab, setActiveFilterTab] = useState('firmographic');

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
  const activeIcpCount = [
    icpFilters.industries.length > 0,
    icpFilters.subIndustries.length > 0,
    icpFilters.employeeRanges.length > 0,
    icpFilters.revenueRanges.length > 0,
    icpFilters.companyTypes.length > 0,
    icpFilters.businessModels.length > 0,
    icpFilters.countries.length > 0,
    icpFilters.states.length > 0,
    icpFilters.metroAreas.length > 0,
    icpFilters.jobTitles.length > 0,
    icpFilters.seniorityLevels.length > 0,
    icpFilters.departments.length > 0,
    icpFilters.technologies.length > 0,
    icpFilters.fundingStages.length > 0,
    icpFilters.fundingRecency,
    icpFilters.hiringDepartments.length > 0,
    icpFilters.hiringIntensity,
    icpFilters.intentSignals.length > 0,
    icpFilters.keywords.length > 0,
    icpFilters.lookalikeDomains.length > 0
  ].filter(Boolean).length;
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
      afterHoursCoverage: ['No chat after 6pm', 'No weekend coverage', 'Form-only after hours', 'Voicemail after 5pm'],
      googlePaidTraffic: ['$15K/mo spend', '$25K/mo spend', '$50K/mo spend', '$80K/mo spend'],
      inboundResponseRisk: ['Avg 4hr response time', 'No live chat', 'Form response >24hrs', 'High bounce rate'],
      activelyHiring: ['5+ open roles', '10+ open roles', 'Sales team expanding', 'Engineering growth'],
      hasCRM: ['Uses HubSpot', 'Uses Salesforce', 'CRM detected', 'Enterprise CRM'],
      recentFunding: ['Series A raised', 'Series B raised', 'Seed funding', 'Growth capital'],
      activeNews: ['3+ recent mentions', 'Product launch', 'Expansion news', 'Partnership announced'],
      b2bPresence: ['G2 listed', 'Capterra profile', '4.5+ rating', 'Top rated'],
      socialActive: ['3+ platforms', 'LinkedIn active', 'Multi-channel presence', 'Marketing investment'],
      // New advanced signals
      decisionMakersFound: ['CEO identified', 'VP contacts found', '3+ executives', 'C-Suite access'],
      highIntent: ['Multiple signals', 'In-market buyer', 'Active evaluation', 'High priority'],
      leadershipChange: ['New CEO', 'New VP Sales', 'Leadership transition', 'Executive hire'],
      competitorUser: ['Uses Salesforce', 'HubSpot customer', 'Competitor detected', 'Switch opportunity'],
      trafficGrowth: ['Traffic +25%', 'Traffic +50%', 'Growth trending', 'Momentum detected']
    };
    return values[signal]?.[Math.floor(Math.random() * (values[signal]?.length || 1))] || 'Detected';
  };

  const getWhyNow = (signals) => {
    // Highest priority signals first
    if (signals.includes('highIntent')) return 'HIGH INTENT - Multiple buying signals detected';
    if (signals.includes('recentFunding')) return 'Recently funded - flush with growth capital';
    if (signals.includes('leadershipChange')) return 'New leadership - likely evaluating vendors';
    if (signals.includes('competitorUser')) return 'Using competitor - potential switch opportunity';
    if (signals.includes('googlePaidTraffic') && signals.includes('afterHoursCoverage')) return 'Paying for ads but missing after-hours leads';
    if (signals.includes('googlePaidTraffic') && signals.includes('inboundResponseRisk')) return 'Ad spend at risk due to slow response';
    if (signals.includes('afterHoursCoverage') && signals.includes('inboundResponseRisk')) return 'Coverage gaps losing inbound opportunities';
    if (signals.includes('activelyHiring') && signals.includes('activeNews')) return 'Growth phase - hiring and in the news';
    if (signals.includes('trafficGrowth')) return 'Traffic growing - business momentum';
    if (signals.includes('decisionMakersFound')) return 'Decision makers identified - direct access';
    if (signals.includes('activelyHiring')) return 'Actively hiring - company in growth mode';
    if (signals.includes('googlePaidTraffic')) return 'Active ad spend detected';
    if (signals.includes('afterHoursCoverage')) return 'After-hours coverage gap identified';
    if (signals.includes('inboundResponseRisk')) return 'Inbound response at risk';
    if (signals.includes('activeNews')) return 'Recent news activity - company momentum';
    if (signals.includes('b2bPresence')) return 'Established B2B presence - mature buyer';
    return 'Signal activity detected';
  };

  // Generate personalized icebreaker based on signals (for cold email first line)
  const generatePersonalization = (lead) => {
    const { name, signals, industry, enrichment } = lead;
    const companyName = name || 'your company';

    // Prioritize by signal effectiveness for cold outreach (highest converting first)

    // TIER 1: Highest intent signals
    if (signals.includes('highIntent')) {
      return `Noticed several growth signals at ${companyName} - looks like you're in an exciting phase.`;
    }

    if (signals.includes('leadershipChange')) {
      const contacts = enrichment?.contacts?.decisionMakers;
      if (contacts?.length > 0) {
        return `Saw there's been some leadership changes at ${companyName} - congrats to the new team.`;
      }
      return `Noticed some leadership changes at ${companyName} - always an exciting time for new initiatives.`;
    }

    if (signals.includes('recentFunding')) {
      const amount = enrichment?.funding?.totalRaised;
      const round = enrichment?.funding?.fundingRound;
      if (amount) return `Congrats on the ${amount} ${round || 'raise'} - exciting times ahead for ${companyName}.`;
      return `Saw ${companyName} recently closed a funding round - congrats on the momentum.`;
    }

    if (signals.includes('competitorUser')) {
      const competitors = enrichment?.competitors?.competitorsFound;
      if (competitors?.length > 0) {
        return `Noticed ${companyName} is using ${competitors[0]} - curious if it's meeting all your needs.`;
      }
      return `Saw ${companyName} is using some interesting tools - always looking to optimize the stack?`;
    }

    // TIER 2: Strong growth signals
    if (signals.includes('decisionMakersFound')) {
      const contacts = enrichment?.contacts?.decisionMakers;
      const cSuite = contacts?.filter(c => c.level === 'C-Suite').length || 0;
      if (cSuite > 0) return `Been researching ${companyName}'s leadership team - impressive backgrounds.`;
      return `Came across ${companyName} while researching ${industry || 'your space'} leaders.`;
    }

    if (signals.includes('trafficGrowth')) {
      const trend = enrichment?.webTraffic?.trafficTrend;
      if (trend === 'growing') return `Noticed ${companyName}'s web presence is really taking off - momentum looks strong.`;
      return `Saw ${companyName} is building solid traction online - impressive growth.`;
    }

    if (signals.includes('activelyHiring')) {
      const roles = enrichment?.jobs?.rolesHiring;
      if (roles?.includes('Sales / Account Executive')) return `Noticed ${companyName} is scaling the sales team - growth mode looks strong.`;
      if (roles?.includes('Engineering')) return `Saw you're building out the engineering team at ${companyName} - exciting product roadmap ahead.`;
      if (roles?.includes('Marketing')) return `Noticed ${companyName} is investing in marketing - smart move for this stage.`;
      return `Saw ${companyName} is actively hiring - always a great sign of momentum.`;
    }

    // TIER 3: Opportunity signals
    if (signals.includes('googlePaidTraffic') && signals.includes('afterHoursCoverage')) {
      return `Noticed ${companyName} is investing in Google Ads but may be missing leads after hours.`;
    }

    if (signals.includes('googlePaidTraffic')) {
      return `Saw ${companyName} is actively investing in paid search - smart move for ${industry || 'your space'}.`;
    }

    if (signals.includes('afterHoursCoverage')) {
      return `Noticed ${companyName} might be missing inbound opportunities outside business hours.`;
    }

    if (signals.includes('activeNews')) {
      if (enrichment?.news?.hasProductLaunch) return `Congrats on the recent product launch at ${companyName} - looks like big things ahead.`;
      if (enrichment?.news?.hasExpansionNews) return `Saw the expansion news for ${companyName} - exciting growth trajectory.`;
      if (enrichment?.news?.hasPartnership) return `Noticed the recent partnership announcement from ${companyName} - great momentum.`;
      return `Been seeing ${companyName} in the news lately - impressive traction.`;
    }

    if (signals.includes('b2bPresence')) {
      const rating = enrichment?.reviews?.avgRating;
      if (rating && rating >= 4.5) return `Saw ${companyName} has stellar reviews on G2 - clearly doing something right.`;
      if (rating && rating >= 4) return `Noticed the strong presence ${companyName} has built on review sites.`;
      return `Saw ${companyName} is well-established in the B2B space.`;
    }

    if (signals.includes('hasCRM')) {
      return `Noticed ${companyName} is using enterprise sales tools - sounds like you take growth seriously.`;
    }

    if (signals.includes('socialActive')) {
      return `Been following ${companyName}'s social presence - great brand building.`;
    }

    if (signals.includes('inboundResponseRisk')) {
      return `Noticed ${companyName} may be leaving some inbound leads on the table.`;
    }

    // Fallback based on industry
    if (industry) {
      return `Came across ${companyName} while researching ${industry} companies - impressive what you're building.`;
    }

    return `Came across ${companyName} and was impressed by what you're building.`;
  };

  // Extract email domain/provider from email address
  const getEmailProvider = (email) => {
    if (!email) return '';
    const domain = email.split('@')[1] || '';
    if (domain.includes('gmail')) return 'Gmail';
    if (domain.includes('outlook') || domain.includes('hotmail')) return 'Outlook';
    if (domain.includes('yahoo')) return 'Yahoo';
    return domain; // Return company domain for business emails
  };

  // Handlers
  const handleClearFilters = () => setIcpFilters({
    industries: [], subIndustries: [], employeeRanges: [], revenueRanges: [],
    companyTypes: [], businessModels: [], countries: [], states: [], metroAreas: [],
    jobTitles: [], seniorityLevels: [], departments: [], technologies: [], techCategories: [],
    fundingStages: [], fundingRecency: null, hiringDepartments: [], hiringIntensity: null,
    intentSignals: [], keywords: [], excludeDomains: [], lookalikeDomains: []
  });

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
        if (icpFilters.countries.length > 0) eligibleCompanies = eligibleCompanies.filter(c => icpFilters.countries.includes(c.location));
        if (icpFilters.employeeRanges.length > 0) eligibleCompanies = eligibleCompanies.filter(c => icpFilters.employeeRanges.includes(c.employees));
        if (icpFilters.revenueRanges.length > 0) eligibleCompanies = eligibleCompanies.filter(c => icpFilters.revenueRanges.includes(c.revenue));
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
      setCurrentStatus('Enriching companies with multi-signal analysis...');
      setProgress(50);

      // Use new enrichment API instead of n8n
      const enrichmentResults = await enrichCompanies(eligibleCompanies, (progress) => {
        setProgress(50 + Math.round(progress.percent * 0.4)); // Progress from 50% to 90%
        setCurrentStatus(`Enriching ${progress.completed}/${progress.total} companies...`);
      });

      setCurrentStatus('Processing enrichment results...');
      setProgress(90);

      console.log('Enrichment results:', enrichmentResults);

      // Map enrichment results to our display format
      const processedResults = enrichmentResults.map((result, index) => {
        const company = eligibleCompanies.find(c => c.domain === result.domain) || eligibleCompanies[index];

        // Extract buying signals
        const signalsList = (result.buyingSignals || [])
          .filter(s => s.detected)
          .map(s => s.id);

        const signalDetails = (result.buyingSignals || [])
          .filter(s => s.detected)
          .map(s => ({
            type: s.label,
            value: s.id,
            detected: result.metadata?.enrichedAt
          }));

        // Add signals from enrichment data
        if (result.signals) {
          result.signals.forEach(s => {
            signalDetails.push({
              type: s.type,
              value: s.message,
              source: s.source
            });
          });
        }

        const processedResult = {
          id: Date.now() + index,
          name: result.companyName || company?.name || result.domain,
          domain: result.domain || company?.domain,
          industry: company?.industry || 'Unknown',
          employees: result.enrichment?.linkedin?.employeeCount || company?.employees || 'Unknown',
          location: result.enrichment?.linkedin?.location || company?.location || 'Unknown',
          revenue: company?.revenue || 'Unknown',
          score: result.score || 0,
          signals: signalsList,
          signalDetails: signalDetails,
          whyNow: result.whyNow || 'Company shows growth indicators',
          scrapedAt: result.metadata?.enrichedAt,
          enrichment: result.enrichment,
          disqualified: !result.success,
          // MANDATORY OUTPUT FIELDS - Critical for client delivery
          email: result.email || null,
          hasVerifiedEmail: result.hasVerifiedEmail || false,
          emailVerification: result.emailVerification || null,
          verifiedEmails: result.emailVerification?.verifiedEmails || [],
          website: `https://${result.domain || company?.domain}`,
          personalization: null // Will be set after object creation
        };
        // Generate personalization using the complete result object
        processedResult.personalization = generatePersonalization(processedResult);
        return processedResult;
      });

      console.log('Processed results:', processedResults);

      // Get the active signals that user selected
      const activeSignals = Object.entries(enabledSignals).filter(([_, e]) => e).map(([k]) => k);
      console.log('Filtering for signals:', activeSignals);

      // Filter results: must have verified email AND at least one selected signal
      const filteredResults = processedResults
        .filter(r => {
          if (!r.domain || r.score < minScore) return false;
          // CRITICAL: Company must have a verified email
          if (!r.hasVerifiedEmail || !r.email) {
            console.log(`Skipping ${r.domain} - no verified email`);
            return false;
          }
          // Company must have at least one of the selected signals
          const hasSelectedSignal = r.signals.some(s => activeSignals.includes(s));
          return hasSelectedSignal;
        })
        .sort((a, b) => b.score - a.score);

      console.log('Filtered to', filteredResults.length, 'companies with verified emails and selected signals');

      setResults(filteredResults);
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
    if (icpFilters.countries.length > 0) eligibleCompanies = eligibleCompanies.filter(c => icpFilters.countries.includes(c.location));
    if (icpFilters.employeeRanges.length > 0) eligibleCompanies = eligibleCompanies.filter(c => icpFilters.employeeRanges.includes(c.employees));
    if (icpFilters.revenueRanges.length > 0) eligibleCompanies = eligibleCompanies.filter(c => icpFilters.revenueRanges.includes(c.revenue));
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

          // Only detect signals that were selected - each signal has ~60% chance of being detected
          const detectedSignals = activeSignals.filter(() => Math.random() > 0.4);

          // Must have at least one selected signal to be included
          if (detectedSignals.length === 0) continue;

          // Score based on how many of the SELECTED signals were detected
          const score = Math.min(100, Math.round((detectedSignals.length / activeSignals.length) * 70) + Math.floor(Math.random() * 20) + 15);

          if (score >= minScore) {
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

    // Helper to escape CSV values (handle commas, quotes, newlines)
    const escapeCSV = (value) => {
      if (value === null || value === undefined) return '';
      const str = String(value);
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    // CSV Headers matching requested columns
    const headers = [
      'Campaign Name',
      'Email',
      'Email Provider',
      'Lead Status',
      'First Name',
      'Last Name',
      'Interest Status',
      'phone',
      'website',
      'lastName',
      'firstName',
      'companyName',
      'personalization',
      'email',
      'summary',
      'Industry',
      'Employees',
      'Location',
      'Score',
      'Signals'
    ];

    // Generate rows
    const rows = data.map(lead => {
      // MANDATORY OUTPUT FIELDS - Use pre-computed values for consistency
      const email = lead.email || lead.enrichment?.website?.contact?.emails?.[0] || '';
      const phone = lead.enrichment?.website?.contact?.phones?.[0] || '';
      const website = lead.website || `https://${lead.domain}`;
      const personalization = lead.personalization || generatePersonalization(lead);

      // Create summary from whyNow and signals
      const signalLabels = lead.signals.map(s => SIGNAL_TYPES.find(st => st.id === s)?.label || s).join('; ');
      const summary = `${lead.whyNow} Signals: ${signalLabels}`;

      // Campaign name based on industry/signal
      const primarySignal = lead.signals[0] ? SIGNAL_TYPES.find(st => st.id === lead.signals[0])?.label : 'General';
      const campaignName = `${lead.industry || 'General'} - ${primarySignal || 'Outreach'}`;

      return [
        escapeCSV(campaignName),           // Campaign Name
        escapeCSV(email),                   // Email
        escapeCSV(getEmailProvider(email)), // Email Provider
        escapeCSV('New'),                   // Lead Status
        escapeCSV(''),                      // First Name (to be filled)
        escapeCSV(''),                      // Last Name (to be filled)
        escapeCSV('Not Contacted'),         // Interest Status
        escapeCSV(phone),                   // phone
        escapeCSV(website),                 // website
        escapeCSV(''),                      // lastName (duplicate for compatibility)
        escapeCSV(''),                      // firstName (duplicate for compatibility)
        escapeCSV(lead.name),               // companyName
        escapeCSV(personalization),         // personalization
        escapeCSV(email),                   // email (duplicate for compatibility)
        escapeCSV(summary),                 // summary
        escapeCSV(lead.industry),           // Industry
        escapeCSV(lead.employees),          // Employees
        escapeCSV(lead.location),           // Location
        escapeCSV(lead.score),              // Score
        escapeCSV(signalLabels)             // Signals
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sai-leads-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
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
    const colors = ['#EF4444', '#FB923C', '#F97316', '#F97316', '#F97316', '#F97316'];
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
      <div style={{ width: '420px', borderRight: `1px solid ${theme.border}`, display: 'flex', flexDirection: 'column', background: theme.bgSecondary }}>
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 0 20px 0' }}>
          {/* n8n Toggle */}
          <div style={{ padding: '20px 24px', borderBottom: `1px solid ${theme.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: theme.bgTertiary }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: useN8n ? theme.accent : theme.textMuted, boxShadow: useN8n ? `0 0 12px ${theme.accentMuted}` : 'none', transition: 'all 0.3s ease' }} />
              <span style={{ color: useN8n ? theme.textPrimary : theme.textSecondary, fontSize: '13px', fontWeight: 600, letterSpacing: '-0.2px' }}>Live Scraping</span>
              {useN8n && <span style={{ background: theme.accentMuted, color: theme.accent, padding: '3px 10px', borderRadius: '100px', fontSize: '10px', fontWeight: 700, border: `1px solid ${theme.accent}`, letterSpacing: '0.5px' }}>ACTIVE</span>}
            </div>
            <button
              onClick={() => setUseN8n(!useN8n)}
              style={{
                width: '48px', height: '26px', borderRadius: '13px', border: 'none',
                background: useN8n ? `linear-gradient(135deg, ${theme.accent} 0%, ${theme.accentLight} 100%)` : theme.borderDark,
                cursor: 'pointer', position: 'relative', transition: 'all 0.3s ease',
                boxShadow: useN8n ? `0 2px 8px ${theme.accentMuted}` : 'inset 0 1px 3px rgba(0, 0, 0, 0.1)'
              }}
            >
              <div style={{
                width: '20px', height: '20px', borderRadius: '50%', background: 'white',
                position: 'absolute', top: '3px', left: useN8n ? '25px' : '3px', transition: 'left 0.2s ease',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.15)'
              }} />
            </button>
          </div>

          {/* ICP Filters - Tabbed Interface */}
          <div style={{ borderBottom: `1px solid ${theme.border}` }}>
            {/* Header */}
            <div style={{ padding: '20px 24px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: theme.accentMuted, display: 'flex', alignItems: 'center', justifyContent: 'center', color: theme.accent }}>{Icons.target}</div>
                <span style={{ color: theme.textPrimary, fontSize: '14px', fontWeight: 700, letterSpacing: '-0.3px' }}>ICP Filters</span>
                {activeIcpCount > 0 && <span style={{ background: theme.accent, color: 'white', padding: '3px 10px', borderRadius: '100px', fontSize: '11px', fontWeight: 700 }}>{activeIcpCount}</span>}
              </div>
              {activeIcpCount > 0 && <button onClick={handleClearFilters} style={{ background: theme.bgTertiary, border: `1px solid ${theme.border}`, borderRadius: '6px', padding: '6px 12px', color: theme.textSecondary, fontSize: '11px', cursor: 'pointer', fontWeight: 500 }}>Clear all</button>}
            </div>

            {/* Filter Tabs */}
            <div style={{ display: 'flex', gap: '4px', padding: '0 24px 16px', overflowX: 'auto' }}>
              {[
                { id: 'firmographic', label: 'Company', icon: '#' },
                { id: 'geographic', label: 'Location', icon: '@' },
                { id: 'contact', label: 'Contact', icon: '>' },
                { id: 'technographic', label: 'Tech', icon: '*' },
                { id: 'funding', label: 'Funding', icon: '$' },
                { id: 'hiring', label: 'Hiring', icon: '+' },
                { id: 'intent', label: 'Intent', icon: '^' },
                { id: 'advanced', label: 'Advanced', icon: '~' }
              ].map(tab => (
                <button key={tab.id} onClick={() => setActiveFilterTab(tab.id)}
                  style={{ padding: '8px 12px', background: activeFilterTab === tab.id ? theme.accent : theme.bgTertiary, border: activeFilterTab === tab.id ? 'none' : `1px solid ${theme.border}`, borderRadius: '8px', color: activeFilterTab === tab.id ? 'white' : theme.textSecondary, fontSize: '11px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap', transition: 'all 0.2s ease' }}>
                  <span style={{ fontWeight: 700 }}>{tab.icon}</span> {tab.label}
                </button>
              ))}
            </div>

            {/* Filter Content */}
            <div style={{ padding: '0 24px 24px' }}>
              {/* FIRMOGRAPHIC */}
              {activeFilterTab === 'firmographic' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <MultiSelect label="Industry" options={INDUSTRIES} selected={icpFilters.industries} onChange={(v) => setIcpFilters({ ...icpFilters, industries: v })} placeholder="Select industries" />
                  {icpFilters.industries.length > 0 && icpFilters.industries.some(i => SUB_INDUSTRIES[i]) && (
                    <MultiSelect label="Sub-Industry" options={icpFilters.industries.flatMap(i => SUB_INDUSTRIES[i] || [])} selected={icpFilters.subIndustries} onChange={(v) => setIcpFilters({ ...icpFilters, subIndustries: v })} placeholder="Narrow by sub-industry" />
                  )}
                  <MultiSelect label="Company Size (Employees)" options={EMPLOYEE_RANGES.map(r => r.label)} selected={icpFilters.employeeRanges} onChange={(v) => setIcpFilters({ ...icpFilters, employeeRanges: v })} placeholder="Any size" />
                  <MultiSelect label="Revenue Range" options={REVENUE_RANGES.map(r => r.label)} selected={icpFilters.revenueRanges} onChange={(v) => setIcpFilters({ ...icpFilters, revenueRanges: v })} placeholder="Any revenue" />
                  <MultiSelect label="Company Type" options={COMPANY_TYPES} selected={icpFilters.companyTypes} onChange={(v) => setIcpFilters({ ...icpFilters, companyTypes: v })} placeholder="Any type" />
                  <MultiSelect label="Business Model" options={BUSINESS_MODELS} selected={icpFilters.businessModels} onChange={(v) => setIcpFilters({ ...icpFilters, businessModels: v })} placeholder="Any model" />
                </div>
              )}

              {/* GEOGRAPHIC */}
              {activeFilterTab === 'geographic' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <MultiSelect label="Country" options={COUNTRIES} selected={icpFilters.countries} onChange={(v) => setIcpFilters({ ...icpFilters, countries: v })} placeholder="Select countries" />
                  {icpFilters.countries.includes('United States') && (
                    <>
                      <MultiSelect label="US State" options={US_STATES} selected={icpFilters.states} onChange={(v) => setIcpFilters({ ...icpFilters, states: v })} placeholder="All states" />
                      <MultiSelect label="Metro Area" options={US_METRO_AREAS} selected={icpFilters.metroAreas} onChange={(v) => setIcpFilters({ ...icpFilters, metroAreas: v })} placeholder="All metro areas" />
                    </>
                  )}
                </div>
              )}

              {/* CONTACT/DEMOGRAPHIC */}
              {activeFilterTab === 'contact' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <p style={{ color: '#737373', fontSize: '12px', marginBottom: '4px' }}>Filter by decision makers you want to reach</p>
                  <MultiSelect label="Job Titles" options={JOB_TITLES} selected={icpFilters.jobTitles} onChange={(v) => setIcpFilters({ ...icpFilters, jobTitles: v })} placeholder="Any title" />
                  <MultiSelect label="Seniority Level" options={SENIORITY_LEVELS} selected={icpFilters.seniorityLevels} onChange={(v) => setIcpFilters({ ...icpFilters, seniorityLevels: v })} placeholder="Any level" />
                  <MultiSelect label="Department" options={DEPARTMENTS} selected={icpFilters.departments} onChange={(v) => setIcpFilters({ ...icpFilters, departments: v })} placeholder="Any department" />
                </div>
              )}

              {/* TECHNOGRAPHIC */}
              {activeFilterTab === 'technographic' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <p style={{ color: '#737373', fontSize: '12px', marginBottom: '4px' }}>Find companies using specific technologies</p>
                  <MultiSelect label="Tech Category" options={Object.keys(TECH_CATEGORIES)} selected={icpFilters.techCategories} onChange={(v) => setIcpFilters({ ...icpFilters, techCategories: v })} placeholder="All categories" />
                  <MultiSelect label="Specific Technologies" options={icpFilters.techCategories.length > 0 ? icpFilters.techCategories.flatMap(c => TECH_CATEGORIES[c] || []) : ALL_TECHNOLOGIES} selected={icpFilters.technologies} onChange={(v) => setIcpFilters({ ...icpFilters, technologies: v })} placeholder="Any technology" />
                </div>
              )}

              {/* FUNDING */}
              {activeFilterTab === 'funding' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <p style={{ color: '#737373', fontSize: '12px', marginBottom: '4px' }}>Target companies by funding stage and activity</p>
                  <MultiSelect label="Funding Stage" options={FUNDING_STAGES} selected={icpFilters.fundingStages} onChange={(v) => setIcpFilters({ ...icpFilters, fundingStages: v })} placeholder="Any stage" />
                  <Select label="Funding Recency" options={FUNDING_RECENCY} value={icpFilters.fundingRecency} onChange={(v) => setIcpFilters({ ...icpFilters, fundingRecency: v })} placeholder="Any time" />
                </div>
              )}

              {/* HIRING */}
              {activeFilterTab === 'hiring' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <p style={{ color: '#737373', fontSize: '12px', marginBottom: '4px' }}>Find growing companies actively hiring</p>
                  <MultiSelect label="Hiring in Departments" options={HIRING_DEPARTMENTS} selected={icpFilters.hiringDepartments} onChange={(v) => setIcpFilters({ ...icpFilters, hiringDepartments: v })} placeholder="Any department" />
                  <Select label="Hiring Intensity" options={HIRING_INTENSITY.map(h => h.label)} value={icpFilters.hiringIntensity} onChange={(v) => setIcpFilters({ ...icpFilters, hiringIntensity: v })} placeholder="Any intensity" />
                </div>
              )}

              {/* INTENT SIGNALS */}
              {activeFilterTab === 'intent' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <p style={{ color: theme.textMuted, fontSize: '12px', marginBottom: '4px' }}>Target companies showing buying intent</p>
                  <MultiSelect label="Intent Signals" options={INTENT_SIGNALS.map(s => s.label)} selected={icpFilters.intentSignals} onChange={(v) => setIcpFilters({ ...icpFilters, intentSignals: v })} placeholder="Any signal" />
                  <div style={{ marginTop: '8px' }}>
                    {INTENT_SIGNALS.filter(s => icpFilters.intentSignals.includes(s.label)).map(signal => (
                      <div key={signal.id} style={{ padding: '10px 12px', background: theme.accentMuted, border: `1px solid ${theme.accent}`, borderRadius: '8px', marginBottom: '8px' }}>
                        <div style={{ color: theme.textPrimary, fontSize: '12px', fontWeight: 600 }}>{signal.label}</div>
                        <div style={{ color: theme.textSecondary, fontSize: '11px', marginTop: '4px' }}>{signal.description}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ADVANCED */}
              {activeFilterTab === 'advanced' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <p style={{ color: theme.textMuted, fontSize: '12px', marginBottom: '4px' }}>Keywords, lookalikes, and exclusions</p>
                  <div>
                    <label style={{ display: 'block', color: theme.textSecondary, fontSize: '11px', marginBottom: '8px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.8px' }}>Keywords (comma separated)</label>
                    <input type="text" placeholder="e.g., AI-powered, cloud-native, fast-growing"
                      style={{ width: '100%', padding: '12px 14px', background: theme.bgSecondary, border: `1px solid ${theme.border}`, borderRadius: '10px', color: theme.textPrimary, fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
                      value={icpFilters.keywords.join(', ')}
                      onChange={(e) => setIcpFilters({ ...icpFilters, keywords: e.target.value.split(',').map(k => k.trim()).filter(k => k) })}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', color: theme.textSecondary, fontSize: '11px', marginBottom: '8px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.8px' }}>Lookalike Domains</label>
                    <input type="text" placeholder="e.g., stripe.com, hubspot.com"
                      style={{ width: '100%', padding: '12px 14px', background: theme.bgSecondary, border: `1px solid ${theme.border}`, borderRadius: '10px', color: theme.textPrimary, fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
                      value={icpFilters.lookalikeDomains.join(', ')}
                      onChange={(e) => setIcpFilters({ ...icpFilters, lookalikeDomains: e.target.value.split(',').map(k => k.trim()).filter(k => k) })}
                    />
                    <p style={{ color: theme.textMuted, fontSize: '11px', marginTop: '6px' }}>Find companies similar to these domains</p>
                  </div>
                  <div>
                    <label style={{ display: 'block', color: theme.textSecondary, fontSize: '11px', marginBottom: '8px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.8px' }}>Exclude Domains</label>
                    <input type="text" placeholder="e.g., competitor.com, existing-customer.com"
                      style={{ width: '100%', padding: '12px 14px', background: theme.bgSecondary, border: `1px solid ${theme.border}`, borderRadius: '10px', color: theme.textPrimary, fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
                      value={icpFilters.excludeDomains.join(', ')}
                      onChange={(e) => setIcpFilters({ ...icpFilters, excludeDomains: e.target.value.split(',').map(k => k.trim()).filter(k => k) })}
                    />
                  </div>
                  <MultiSelect label="Compliance/Certifications" options={COMPLIANCE_CERTIFICATIONS} selected={icpFilters.keywords.filter(k => COMPLIANCE_CERTIFICATIONS.includes(k))} onChange={(v) => setIcpFilters({ ...icpFilters, keywords: [...icpFilters.keywords.filter(k => !COMPLIANCE_CERTIFICATIONS.includes(k)), ...v] })} placeholder="Any certification" />
                </div>
              )}
            </div>
          </div>

          {/* Signal Filters - Compact Dropdown */}
          <div style={{ padding: '24px', borderBottom: `1px solid ${theme.border}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: theme.accentMuted, display: 'flex', alignItems: 'center', justifyContent: 'center', color: theme.accent }}>{Icons.zap}</div>
              <span style={{ color: theme.textPrimary, fontSize: '14px', fontWeight: 700, letterSpacing: '-0.3px' }}>Buying Signals</span>
              {activeSignalCount > 0 && <span style={{ background: theme.accentMuted, color: theme.accent, padding: '3px 10px', borderRadius: '100px', fontSize: '11px', fontWeight: 700, border: `1px solid ${theme.accent}` }}>{activeSignalCount} active</span>}
            </div>
            <MultiSelect
              label=""
              options={SIGNAL_TYPES.map(s => s.label)}
              selected={Object.entries(enabledSignals).filter(([_, v]) => v).map(([k]) => SIGNAL_TYPES.find(s => s.id === k)?.label).filter(Boolean)}
              onChange={(labels) => {
                const newSignals = {};
                SIGNAL_TYPES.forEach(s => {
                  newSignals[s.id] = labels.includes(s.label);
                });
                setEnabledSignals(newSignals);
              }}
              placeholder="Select signals to search for"
            />
            {activeSignalCount > 0 && (
              <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {SIGNAL_TYPES.filter(s => enabledSignals[s.id]).map(signal => (
                  <div key={signal.id} style={{ padding: '10px 12px', background: theme.accentMuted, border: `1px solid ${theme.accent}`, borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '24px', height: '24px', borderRadius: '6px', background: theme.accent, color: 'white', fontSize: '11px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{signal.icon}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ color: theme.textPrimary, fontSize: '13px', fontWeight: 600 }}>{signal.label}</div>
                      <div style={{ color: theme.textSecondary, fontSize: '11px' }}>{signal.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Search Settings */}
          <div style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: theme.accentMuted, display: 'flex', alignItems: 'center', justifyContent: 'center', color: theme.accent }}>{Icons.sliders}</div>
              <span style={{ color: theme.textPrimary, fontSize: '14px', fontWeight: 700, letterSpacing: '-0.3px' }}>Search Settings</span>
            </div>
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', color: theme.textSecondary, fontSize: '11px', marginBottom: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Max Results</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                {[10, 25, 50, 100].map(num => (
                  <button key={num} onClick={() => setMaxResults(num)} style={{ flex: 1, padding: '12px', background: maxResults === num ? theme.accent : theme.bgTertiary, border: maxResults === num ? 'none' : `1px solid ${theme.border}`, borderRadius: '8px', color: maxResults === num ? 'white' : theme.textSecondary, fontSize: '13px', fontWeight: maxResults === num ? 700 : 500, cursor: 'pointer', transition: 'all 0.2s ease', boxShadow: maxResults === num ? theme.shadowMd : 'none' }}>{num}</button>
                ))}
              </div>
            </div>
            <div>
              <label style={{ display: 'block', color: theme.textSecondary, fontSize: '11px', marginBottom: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Minimum Score: <span style={{ color: theme.accent, fontWeight: 700 }}>{minScore}</span></label>
              <input type="range" min="0" max="80" value={minScore} onChange={(e) => setMinScore(Number(e.target.value))} style={{ width: '100%', accentColor: theme.accent }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', color: theme.textMuted, fontSize: '10px', marginTop: '8px', fontWeight: 500 }}><span>All results</span><span>High intent only</span></div>
            </div>
          </div>
        </div>

        {/* Run Button */}
        <div style={{ padding: '24px', borderTop: `1px solid ${theme.border}`, background: theme.bgTertiary }}>
          {!canStartScraping && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '14px 16px', background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.15)', borderRadius: '10px', marginBottom: '14px' }}>
              <span style={{ color: '#DC2626' }}>{Icons.alertCircle}</span>
              <span style={{ color: '#DC2626', fontSize: '13px', fontWeight: 500 }}>Select at least one signal to search</span>
            </div>
          )}
          {n8nError && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '14px 16px', background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.15)', borderRadius: '10px', marginBottom: '14px' }}>
              <span style={{ color: '#DC2626' }}>{Icons.alertCircle}</span>
              <span style={{ color: '#DC2626', fontSize: '13px', fontWeight: 500 }}>{n8nError}</span>
            </div>
          )}
          {isRunning ? (
            <div>
              <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <span style={{ color: theme.textPrimary, fontSize: '13px', fontWeight: 500 }}>{currentStatus}</span>
                  <span style={{ color: theme.accent, fontSize: '13px', fontWeight: 700 }}>{Math.round(progress)}%</span>
                </div>
                <div style={{ background: theme.border, borderRadius: '100px', height: '8px', overflow: 'hidden' }}>
                  <div style={{ width: `${progress}%`, height: '100%', background: `linear-gradient(90deg, ${theme.accent} 0%, ${theme.accentLight} 100%)`, borderRadius: '100px', transition: 'width 0.3s ease' }} />
                </div>
                <div style={{ color: theme.textMuted, fontSize: '12px', marginTop: '10px', fontWeight: 500 }}>{companiesFound} companies scanned</div>
              </div>
              <button onClick={handleStopScrape} style={{ width: '100%', padding: '16px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '12px', color: '#DC2626', fontSize: '14px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', transition: 'all 0.2s ease' }}>{Icons.stop} Stop Scraping</button>
            </div>
          ) : (
            <button onClick={handleStartScrape} disabled={!canStartScraping} style={{ width: '100%', padding: '18px', background: !canStartScraping ? theme.borderDark : `linear-gradient(135deg, ${theme.accent} 0%, ${theme.accentLight} 100%)`, border: 'none', borderRadius: '12px', color: !canStartScraping ? theme.textMuted : 'white', fontSize: '15px', fontWeight: 700, cursor: !canStartScraping ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', boxShadow: canStartScraping ? theme.shadowLg : 'none', transition: 'all 0.3s ease', letterSpacing: '-0.3px' }}>
              {Icons.search} Find Companies {useN8n && <span style={{ opacity: 0.8, fontWeight: 500 }}>(Live)</span>}
            </button>
          )}
        </div>
      </div>

      {/* Right Panel */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: theme.bgPrimary, position: 'relative' }}>
        {/* Header */}
        <div style={{ padding: '24px 28px', borderBottom: `1px solid ${theme.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: theme.bgSecondary }}>
          <div>
            <div style={{ color: theme.textPrimary, fontSize: '20px', fontWeight: 700, letterSpacing: '-0.4px' }}>Discovered Companies</div>
            <div style={{ color: theme.textMuted, fontSize: '13px', marginTop: '6px', fontWeight: 500 }}>
              {results.length > 0 ? (
                <><span style={{ color: theme.textPrimary }}>{results.length}</span> companies found <span style={{ color: theme.textMuted }}>•</span> Avg score: <span style={{ color: theme.accent }}>{Math.round(results.reduce((a, r) => a + r.score, 0) / results.length)}</span></>
              ) : 'Configure filters and start searching'}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={() => { setResults([]); setSelectedIds(new Set()); }} disabled={results.length === 0} style={{ padding: '10px 18px', background: theme.bgTertiary, border: `1px solid ${theme.border}`, borderRadius: '10px', color: results.length === 0 ? theme.textMuted : theme.textSecondary, fontSize: '13px', fontWeight: 600, cursor: results.length === 0 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s ease' }}>{Icons.refresh} Clear</button>
            <button onClick={handleExport} disabled={results.length === 0} style={{ padding: '10px 20px', background: results.length > 0 ? theme.accentMuted : theme.bgTertiary, border: results.length > 0 ? `1px solid ${theme.accent}` : `1px solid ${theme.border}`, borderRadius: '10px', color: results.length === 0 ? theme.textMuted : theme.accent, fontSize: '13px', fontWeight: 600, cursor: results.length === 0 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s ease' }}>{Icons.download} Export {selectedIds.size > 0 ? `(${selectedIds.size})` : ''}</button>
          </div>
        </div>

        {/* Results Table */}
        <div style={{ flex: 1, overflow: 'auto', padding: '24px 28px' }}>
          {results.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: theme.textMuted }}>
              <div style={{ width: '80px', height: '80px', borderRadius: '20px', background: theme.accentMuted, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
                <span style={{ color: theme.accent, transform: 'scale(2)' }}>{Icons.database}</span>
              </div>
              <div style={{ fontSize: '18px', marginBottom: '10px', color: theme.textPrimary, fontWeight: 600, letterSpacing: '-0.3px' }}>No companies discovered yet</div>
              <div style={{ fontSize: '14px', textAlign: 'center', maxWidth: '380px', lineHeight: '1.6', color: theme.textMuted }}>Configure your ICP filters and signal requirements, then click "Find Companies" to start discovering high-intent leads</div>
            </div>
          ) : (
            <div style={{ background: theme.bgSecondary, borderRadius: '14px', border: `1px solid ${theme.border}`, overflow: 'hidden', boxShadow: theme.shadowMd }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${theme.border}`, background: theme.bgTertiary }}>
                    <th style={{ padding: '16px 18px', textAlign: 'left', width: '50px' }}>
                      <Checkbox checked={allSelected} indeterminate={someSelected} onChange={toggleSelectAll} />
                    </th>
                    <th style={{ padding: '16px 18px', textAlign: 'left', color: theme.textSecondary, fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px' }}>Company</th>
                    <th style={{ padding: '16px 18px', textAlign: 'left', color: theme.textSecondary, fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px' }}>Email</th>
                    <th style={{ padding: '16px 18px', textAlign: 'left', color: theme.textSecondary, fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px' }}>Website</th>
                    <th style={{ padding: '16px 18px', textAlign: 'left', color: theme.textSecondary, fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', minWidth: '200px' }}>Personalization</th>
                    <th style={{ padding: '16px 18px', textAlign: 'left', color: theme.textSecondary, fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px' }}>Score</th>
                    <th style={{ padding: '16px 18px', textAlign: 'left', color: theme.textSecondary, fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px' }}>Signals</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((result, index) => (
                    <tr key={result.id} style={{ borderBottom: index < results.length - 1 ? `1px solid ${theme.border}` : 'none', cursor: 'pointer', background: selectedIds.has(result.id) ? theme.accentMuted : 'transparent', transition: 'background 0.15s ease' }}>
                      <td style={{ padding: '18px' }} onClick={(e) => e.stopPropagation()}>
                        <Checkbox checked={selectedIds.has(result.id)} onChange={() => toggleSelect(result.id)} />
                      </td>
                      <td style={{ padding: '18px' }} onClick={() => setSelectedCompany(result)}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                          <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: result.score >= 70 ? theme.accent : result.score >= 50 ? theme.accentLight : '#DC2626' }} />
                          <div>
                            <div style={{ color: theme.textPrimary, fontSize: '14px', fontWeight: 600, letterSpacing: '-0.2px' }}>{result.name}</div>
                            <div style={{ color: theme.textMuted, fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '3px' }}>{result.domain} <span style={{ color: theme.accent, opacity: 0.7 }}>{Icons.externalLink}</span></div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '18px' }} onClick={() => setSelectedCompany(result)}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ background: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.3)', borderRadius: '4px', padding: '2px 6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <span style={{ color: '#22C55E', fontSize: '10px' }}>{Icons.check}</span>
                          </span>
                          <span style={{ color: theme.textPrimary, fontSize: '13px', fontWeight: 500 }}>{result.email}</span>
                        </div>
                      </td>
                      <td style={{ padding: '18px' }} onClick={() => setSelectedCompany(result)}>
                        <a href={`https://${result.domain}`} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} style={{ color: theme.accent, fontSize: '13px', fontWeight: 500, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          {result.domain} <span style={{ opacity: 0.7 }}>{Icons.externalLink}</span>
                        </a>
                      </td>
                      <td style={{ padding: '18px', maxWidth: '280px' }} onClick={() => setSelectedCompany(result)}>
                        <div style={{ color: theme.textSecondary, fontSize: '12px', lineHeight: '1.4', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }} title={result.personalization || generatePersonalization(result)}>
                          {result.personalization || generatePersonalization(result)}
                        </div>
                      </td>
                      <td style={{ padding: '18px' }} onClick={() => setSelectedCompany(result)}>
                        <span style={{ background: result.score >= 70 ? theme.accentMuted : result.score >= 50 ? 'rgba(212, 175, 55, 0.15)' : 'rgba(220, 38, 38, 0.1)', color: result.score >= 70 ? theme.accent : result.score >= 50 ? theme.accentLight : '#DC2626', padding: '6px 14px', borderRadius: '8px', fontSize: '13px', fontWeight: 700, border: result.score >= 70 ? `1px solid ${theme.accent}` : result.score >= 50 ? `1px solid ${theme.accentLight}` : '1px solid #DC2626' }}>{result.score}</span>
                      </td>
                      <td style={{ padding: '18px' }} onClick={() => setSelectedCompany(result)}>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          {result.signals.map((signal, i) => {
                            return <span key={i} style={{ width: '32px', height: '32px', borderRadius: '8px', background: theme.accentMuted, border: `1px solid ${theme.accent}`, color: theme.accent, fontSize: '12px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'transform 0.15s ease' }} title={SIGNAL_TYPES.find(s => s.id === signal)?.label}>{SIGNAL_TYPES.find(s => s.id === signal)?.icon}</span>;
                          })}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Stats Bar */}
        {results.length > 0 && (
          <div style={{ padding: '20px 28px', borderTop: `1px solid ${theme.border}`, display: 'flex', gap: '48px', background: theme.bgSecondary }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: theme.accentMuted, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ color: theme.accent }}>{Icons.users}</span>
              </div>
              <div>
                <div style={{ color: theme.textMuted, fontSize: '11px', marginBottom: '2px', textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: 600 }}>Total Found</div>
                <div style={{ color: theme.textPrimary, fontSize: '22px', fontWeight: 800, letterSpacing: '-0.5px' }}>{results.length}</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: theme.accentMuted, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ color: theme.accent }}>{Icons.zap}</span>
              </div>
              <div>
                <div style={{ color: theme.textMuted, fontSize: '11px', marginBottom: '2px', textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: 600 }}>High Intent (70+)</div>
                <div style={{ color: theme.accent, fontSize: '22px', fontWeight: 800, letterSpacing: '-0.5px' }}>{results.filter(r => r.score >= 70).length}</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: theme.accentMuted, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ color: theme.accent }}>{Icons.target}</span>
              </div>
              <div>
                <div style={{ color: theme.textMuted, fontSize: '11px', marginBottom: '2px', textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: 600 }}>Avg. Score</div>
                <div style={{ color: theme.accent, fontSize: '22px', fontWeight: 800, letterSpacing: '-0.5px' }}>{Math.round(results.reduce((a, r) => a + r.score, 0) / results.length)}</div>
              </div>
            </div>
          </div>
        )}

        {/* Bulk Action Bar */}
        {selectedIds.size > 0 && (
          <div style={{ position: 'absolute', bottom: '100px', left: '50%', transform: 'translateX(-50%)', background: theme.bgSecondary, border: `1px solid ${theme.border}`, borderRadius: '12px', padding: '12px 20px', display: 'flex', alignItems: 'center', gap: '16px', boxShadow: theme.shadowLg, zIndex: 50 }}>
            <span style={{ color: theme.textPrimary, fontSize: '14px', fontWeight: 500 }}>{selectedIds.size} selected</span>
            <div style={{ width: '1px', height: '24px', background: theme.border }} />
            <div style={{ position: 'relative' }}>
              <button onClick={() => setShowBulkListPicker(!showBulkListPicker)} style={{ background: theme.accent, border: 'none', borderRadius: '8px', padding: '10px 16px', color: 'white', fontSize: '13px', fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                {Icons.plus} Add to List {Icons.chevronDown}
              </button>
              {showBulkListPicker && (
                <>
                  <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 60 }} onClick={() => setShowBulkListPicker(false)} />
                  <div style={{ position: 'absolute', bottom: '100%', left: 0, marginBottom: '8px', background: theme.bgSecondary, border: `1px solid ${theme.border}`, borderRadius: '10px', overflow: 'hidden', minWidth: '200px', zIndex: 70, boxShadow: theme.shadowLg }}>
                    {lists.map(list => (
                      <button key={list.id} onClick={() => handleBulkAddToList(list.id)} style={{ width: '100%', padding: '12px 16px', background: 'transparent', border: 'none', borderBottom: `1px solid ${theme.border}`, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px', textAlign: 'left' }}>
                        <div style={{ width: '10px', height: '10px', borderRadius: '3px', background: list.color }} />
                        <span style={{ color: theme.textPrimary, fontSize: '14px', flex: 1 }}>{list.name}</span>
                        <span style={{ color: theme.textMuted, fontSize: '12px' }}>{list.leads.length}</span>
                      </button>
                    ))}
                    <button onClick={() => { setShowBulkListPicker(false); setShowCreateList(true); }} style={{ width: '100%', padding: '12px 16px', background: theme.bgTertiary, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', color: theme.accent, fontSize: '13px' }}>{Icons.plus} Create new list</button>
                  </div>
                </>
              )}
            </div>
            <button onClick={() => setSelectedIds(new Set())} style={{ background: 'transparent', border: `1px solid ${theme.border}`, borderRadius: '8px', padding: '10px 16px', color: theme.textSecondary, fontSize: '13px', cursor: 'pointer' }}>Clear selection</button>
          </div>
        )}
      </div>
    </div>
  );

  // ==================== RENDER LISTS ====================
  const renderListsPage = () => (
    <div style={{ flex: 1, overflow: 'auto', padding: '24px', background: theme.bgPrimary }}>
      {selectedListId && selectedList ? (
        <div>
          <button onClick={() => setSelectedListId(null)} style={{ background: 'none', border: 'none', color: theme.textSecondary, fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '20px', padding: 0 }}>{Icons.arrowLeft} Back to all lists</button>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: selectedList.color }} />
              {editingListId === selectedList.id ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input type="text" value={editingListName} onChange={(e) => setEditingListName(e.target.value)} autoFocus style={{ padding: '8px 12px', background: theme.bgSecondary, border: `1px solid ${theme.accent}`, borderRadius: '6px', color: theme.textPrimary, fontSize: '18px', fontWeight: 600 }} />
                  <button onClick={() => handleRenameList(selectedList.id)} style={{ background: theme.accent, border: 'none', borderRadius: '6px', padding: '8px 12px', color: 'white', cursor: 'pointer' }}>{Icons.check}</button>
                  <button onClick={() => setEditingListId(null)} style={{ background: theme.bgTertiary, border: 'none', borderRadius: '6px', padding: '8px 12px', color: theme.textSecondary, cursor: 'pointer' }}>{Icons.x}</button>
                </div>
              ) : (
                <h2 style={{ color: theme.textPrimary, fontSize: '24px', fontWeight: 600, margin: 0 }}>{selectedList.name}</h2>
              )}
              <span style={{ color: theme.textMuted, fontSize: '14px' }}>{selectedList.leads.length} leads</span>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => { setEditingListId(selectedList.id); setEditingListName(selectedList.name); }} style={{ background: theme.bgSecondary, border: `1px solid ${theme.border}`, borderRadius: '6px', padding: '8px 12px', color: theme.textSecondary, fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>{Icons.edit} Rename</button>
              <button onClick={() => handleDeleteList(selectedList.id)} style={{ background: 'rgba(220, 38, 38, 0.1)', border: '1px solid rgba(220, 38, 38, 0.3)', borderRadius: '6px', padding: '8px 12px', color: '#DC2626', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>{Icons.trash} Delete List</button>
            </div>
          </div>
          {selectedList.leads.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px', color: theme.textMuted }}>
              <div style={{ marginBottom: '12px', opacity: 0.5 }}>{Icons.users}</div>
              <div style={{ fontSize: '14px' }}>No leads in this list yet</div>
              <div style={{ fontSize: '12px', marginTop: '8px' }}>Add leads from the scraper results</div>
            </div>
          ) : (
            <div style={{ background: theme.bgSecondary, borderRadius: '10px', border: `1px solid ${theme.border}`, overflow: 'hidden', boxShadow: theme.shadow }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${theme.border}`, background: theme.bgTertiary }}>
                    <th style={{ padding: '14px 16px', textAlign: 'left', color: theme.textSecondary, fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' }}>Company</th>
                    <th style={{ padding: '14px 16px', textAlign: 'left', color: theme.textSecondary, fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' }}>Score</th>
                    <th style={{ padding: '14px 16px', textAlign: 'left', color: theme.textSecondary, fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' }}>Industry</th>
                    <th style={{ padding: '14px 16px', textAlign: 'left', color: theme.textSecondary, fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedList.leads.map((lead, index) => (
                    <tr key={lead.id} style={{ borderBottom: index < selectedList.leads.length - 1 ? `1px solid ${theme.border}` : 'none' }}>
                      <td style={{ padding: '16px' }}>
                        <div style={{ color: theme.textPrimary, fontSize: '14px', fontWeight: 500 }}>{lead.name}</div>
                        <div style={{ color: theme.textMuted, fontSize: '12px' }}>{lead.domain}</div>
                      </td>
                      <td style={{ padding: '16px' }}>
                        <span style={{ background: lead.score >= 70 ? theme.accentMuted : lead.score >= 50 ? 'rgba(212, 175, 55, 0.15)' : 'rgba(220, 38, 38, 0.1)', color: lead.score >= 70 ? theme.accent : lead.score >= 50 ? theme.accentLight : '#DC2626', padding: '4px 10px', borderRadius: '6px', fontSize: '13px', fontWeight: 600 }}>{lead.score}</span>
                      </td>
                      <td style={{ padding: '16px', color: theme.textSecondary, fontSize: '13px' }}>{lead.industry}</td>
                      <td style={{ padding: '16px' }}>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <div style={{ position: 'relative' }}>
                            <button onClick={() => { setLeadToMove(lead); setShowMoveToList(true); }} style={{ background: 'transparent', border: `1px solid ${theme.border}`, borderRadius: '4px', padding: '6px 10px', color: theme.textSecondary, fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>{Icons.move} Move</button>
                          </div>
                          <button onClick={() => handleRemoveFromList(selectedList.id, lead.id)} style={{ background: 'transparent', border: '1px solid rgba(220, 38, 38, 0.3)', borderRadius: '4px', padding: '6px 10px', color: '#DC2626', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>{Icons.trash} Remove</button>
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
              <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.3)', zIndex: 100 }} onClick={() => { setShowMoveToList(false); setLeadToMove(null); }} />
              <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: theme.bgSecondary, border: `1px solid ${theme.border}`, borderRadius: '12px', padding: '24px', minWidth: '300px', zIndex: 101, boxShadow: theme.shadowLg }}>
                <h3 style={{ color: theme.textPrimary, fontSize: '16px', fontWeight: 600, marginBottom: '16px', margin: '0 0 16px 0' }}>Move to list</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {lists.filter(l => l.id !== selectedListId).map(list => (
                    <button key={list.id} onClick={() => handleMoveToList(selectedListId, list.id, leadToMove)} style={{ width: '100%', padding: '12px 16px', background: theme.bgTertiary, border: `1px solid ${theme.border}`, borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px', textAlign: 'left' }}>
                      <div style={{ width: '10px', height: '10px', borderRadius: '3px', background: list.color }} />
                      <span style={{ color: theme.textPrimary, fontSize: '14px' }}>{list.name}</span>
                    </button>
                  ))}
                </div>
                <button onClick={() => { setShowMoveToList(false); setLeadToMove(null); }} style={{ width: '100%', marginTop: '16px', padding: '10px', background: theme.bgTertiary, border: 'none', borderRadius: '8px', color: theme.textSecondary, fontSize: '13px', cursor: 'pointer' }}>Cancel</button>
              </div>
            </>
          )}
        </div>
      ) : (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
            <h2 style={{ color: theme.textPrimary, fontSize: '24px', fontWeight: 600, margin: 0 }}>Lead Lists</h2>
            <button onClick={() => setShowCreateList(true)} style={{ background: theme.accent, border: 'none', borderRadius: '8px', padding: '10px 16px', color: 'white', fontSize: '13px', fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>{Icons.plus} New List</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
            {lists.map(list => (
              <div key={list.id} onClick={() => setSelectedListId(list.id)} style={{ background: theme.bgSecondary, border: `1px solid ${theme.border}`, borderRadius: '10px', padding: '20px', cursor: 'pointer', transition: 'all 0.2s', boxShadow: theme.shadow }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                  <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: list.color }} />
                  <span style={{ color: theme.textPrimary, fontSize: '16px', fontWeight: 600 }}>{list.name}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ color: theme.textSecondary, fontSize: '13px' }}>{list.leads.length} leads</span>
                  <span style={{ color: theme.textMuted, fontSize: '12px' }}>Created {list.createdAt}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {/* Create list modal */}
      {showCreateList && (
        <>
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.3)', zIndex: 100 }} onClick={() => setShowCreateList(false)} />
          <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: theme.bgSecondary, border: `1px solid ${theme.border}`, borderRadius: '12px', padding: '24px', minWidth: '320px', zIndex: 101, boxShadow: theme.shadowLg }}>
            <h3 style={{ color: theme.textPrimary, fontSize: '16px', fontWeight: 600, marginBottom: '16px', margin: '0 0 16px 0' }}>Create new list</h3>
            <input type="text" value={newListName} onChange={(e) => setNewListName(e.target.value)} placeholder="List name" autoFocus style={{ width: '100%', padding: '12px', background: theme.bgTertiary, border: `1px solid ${theme.border}`, borderRadius: '8px', color: theme.textPrimary, fontSize: '14px', marginBottom: '16px', boxSizing: 'border-box' }} />
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => setShowCreateList(false)} style={{ flex: 1, padding: '10px', background: theme.bgTertiary, border: 'none', borderRadius: '8px', color: theme.textSecondary, fontSize: '13px', cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleCreateList} disabled={!newListName.trim()} style={{ flex: 1, padding: '10px', background: newListName.trim() ? theme.accent : theme.bgTertiary, border: 'none', borderRadius: '8px', color: newListName.trim() ? 'white' : theme.textMuted, fontSize: '13px', cursor: newListName.trim() ? 'pointer' : 'not-allowed' }}>Create</button>
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
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.3)', zIndex: 100 }} onClick={() => setSelectedCompany(null)} />
        <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: '480px', background: theme.bgSecondary, borderLeft: `1px solid ${theme.border}`, zIndex: 101, display: 'flex', flexDirection: 'column', boxShadow: theme.shadowLg }}>
          <div style={{ padding: '20px', borderBottom: `1px solid ${theme.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h2 style={{ color: theme.textPrimary, fontSize: '20px', fontWeight: 600, margin: '0 0 4px 0' }}>{selectedCompany.name}</h2>
              <a href={`https://${selectedCompany.domain}`} target="_blank" rel="noopener noreferrer" style={{ color: theme.accent, fontSize: '13px', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>{selectedCompany.domain} {Icons.externalLink}</a>
            </div>
            <button onClick={() => setSelectedCompany(null)} style={{ background: 'none', border: 'none', color: theme.textMuted, cursor: 'pointer', padding: '4px' }}>{Icons.x}</button>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
            {/* Score */}
            <div style={{ background: theme.bgTertiary, borderRadius: '10px', padding: '16px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ color: theme.textSecondary, fontSize: '13px' }}>Intent Score</span>
                <span style={{ background: selectedCompany.score >= 70 ? theme.accentMuted : selectedCompany.score >= 50 ? 'rgba(212, 175, 55, 0.15)' : 'rgba(220, 38, 38, 0.1)', color: selectedCompany.score >= 70 ? theme.accent : selectedCompany.score >= 50 ? theme.accentLight : '#DC2626', padding: '8px 16px', borderRadius: '8px', fontSize: '18px', fontWeight: 700 }}>{selectedCompany.score}</span>
              </div>
              <div style={{ marginTop: '12px', padding: '12px', background: theme.bgSecondary, borderRadius: '6px', border: `1px solid ${theme.border}` }}>
                <div style={{ color: theme.textPrimary, fontSize: '14px', fontWeight: 500, marginBottom: '4px' }}>Why Now</div>
                <div style={{ color: theme.textSecondary, fontSize: '13px' }}>{selectedCompany.whyNow}</div>
              </div>
            </div>
            {/* Signals */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ color: theme.textSecondary, fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px' }}>Detected Signals</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {selectedCompany.signalDetails.map((signal, i) => (
                  <div key={i} style={{ background: theme.bgTertiary, borderRadius: '8px', padding: '14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                      <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: theme.accent, color: 'white', fontSize: '12px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{SIGNAL_TYPES.find(s => s.label === signal.type)?.icon || '?'}</div>
                      <span style={{ color: theme.textPrimary, fontSize: '14px', fontWeight: 500 }}>{signal.type}</span>
                    </div>
                    <div style={{ color: theme.textSecondary, fontSize: '13px', marginLeft: '38px' }}>{signal.value}</div>
                  </div>
                ))}
              </div>
            </div>
            {/* Company Info */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ color: theme.textSecondary, fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px' }}>Company Info</div>
              <div style={{ background: theme.bgTertiary, borderRadius: '8px', padding: '14px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div><div style={{ color: theme.textMuted, fontSize: '11px', marginBottom: '4px' }}>Industry</div><div style={{ color: theme.textPrimary, fontSize: '13px' }}>{selectedCompany.industry}</div></div>
                  <div><div style={{ color: theme.textMuted, fontSize: '11px', marginBottom: '4px' }}>Employees</div><div style={{ color: theme.textPrimary, fontSize: '13px' }}>{selectedCompany.employees}</div></div>
                  <div><div style={{ color: theme.textMuted, fontSize: '11px', marginBottom: '4px' }}>Location</div><div style={{ color: theme.textPrimary, fontSize: '13px' }}>{selectedCompany.location}</div></div>
                  <div><div style={{ color: theme.textMuted, fontSize: '11px', marginBottom: '4px' }}>Revenue</div><div style={{ color: theme.textPrimary, fontSize: '13px' }}>{selectedCompany.revenue}</div></div>
                </div>
              </div>
            </div>
          </div>
          {/* Actions */}
          <div style={{ padding: '20px', borderTop: `1px solid ${theme.border}` }}>
            <div style={{ position: 'relative' }}>
              <button onClick={() => setShowListPicker(!showListPicker)} style={{ width: '100%', padding: '14px', background: theme.accent, border: 'none', borderRadius: '8px', color: 'white', fontSize: '14px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>{Icons.plus} Add to List</button>
              {showListPicker && (
                <>
                  <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 110 }} onClick={() => setShowListPicker(false)} />
                  <div style={{ position: 'absolute', bottom: '100%', left: 0, right: 0, marginBottom: '8px', background: theme.bgSecondary, border: `1px solid ${theme.border}`, borderRadius: '10px', overflow: 'hidden', zIndex: 120, boxShadow: theme.shadowLg }}>
                    {lists.map(list => (
                      <button key={list.id} onClick={() => handleAddToList(list.id)} style={{ width: '100%', padding: '12px 16px', background: 'transparent', border: 'none', borderBottom: `1px solid ${theme.border}`, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px', textAlign: 'left' }}>
                        <div style={{ width: '10px', height: '10px', borderRadius: '3px', background: list.color }} />
                        <span style={{ color: theme.textPrimary, fontSize: '14px', flex: 1 }}>{list.name}</span>
                        <span style={{ color: theme.textMuted, fontSize: '12px' }}>{list.leads.length}</span>
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
    <div style={{ minHeight: '100vh', background: theme.bgPrimary, color: theme.textPrimary, fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <header style={{ padding: '12px 24px', background: theme.bgSecondary, borderBottom: `1px solid ${theme.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 50, boxShadow: theme.shadow }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '38px', height: '38px', background: `linear-gradient(135deg, ${theme.accent} 0%, ${theme.accentLight} 100%)`, borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: theme.shadowMd }}>
            <span style={{ color: 'white', fontWeight: 800, fontSize: '16px', letterSpacing: '-0.5px' }}>S</span>
          </div>
          <div>
            <span style={{ color: theme.textPrimary, fontSize: '17px', fontWeight: 700, letterSpacing: '-0.3px' }}>SAI Scraper</span>
            <span style={{ color: theme.textMuted, fontSize: '11px', marginLeft: '10px', fontWeight: 500 }}>Lead Intelligence</span>
          </div>
        </div>
        <nav style={{ display: 'flex', gap: '6px', background: theme.bgTertiary, padding: '4px', borderRadius: '12px', border: `1px solid ${theme.border}` }}>
          <button onClick={() => setCurrentPage('scraper')} style={{ padding: '10px 20px', background: currentPage === 'scraper' ? theme.accentMuted : 'transparent', border: 'none', borderRadius: '8px', color: currentPage === 'scraper' ? theme.accent : theme.textSecondary, fontSize: '13px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s ease' }}>{Icons.search} Scraper</button>
          <button onClick={() => setCurrentPage('lists')} style={{ padding: '10px 20px', background: currentPage === 'lists' ? theme.accentMuted : 'transparent', border: 'none', borderRadius: '8px', color: currentPage === 'lists' ? theme.accent : theme.textSecondary, fontSize: '13px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s ease' }}>{Icons.folder} Lists {lists.reduce((a, l) => a + l.leads.length, 0) > 0 && <span style={{ background: `linear-gradient(135deg, ${theme.accent} 0%, ${theme.accentLight} 100%)`, color: 'white', padding: '2px 10px', borderRadius: '100px', fontSize: '11px', fontWeight: 600 }}>{lists.reduce((a, l) => a + l.leads.length, 0)}</span>}</button>
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
